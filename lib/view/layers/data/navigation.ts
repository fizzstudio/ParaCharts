
import { DatapointView } from '../../data';
import { type ParaStore } from '../../../store';
import { type Direction } from '../../../store';
import { DataLayer } from './data_layer';
import { clusterObject } from '@fizz/clustering';

const oppositeDirs: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  in: 'out',
  out: 'in'
};

export type NavNodeType = 'top' | 'series' | 'datapoint' | 'chord' | 'sequence' | 'cluster';

export type NavNodeOptionsType<T extends NavNodeType> =
  T extends 'top' ? TopNavNodeOptions :
  T extends 'series' ? SeriesNavNodeOptions :
  T extends 'datapoint' ? DatapointNavNodeOptions :
  T extends 'chord' ? ChordNavNodeOptions :
  T extends 'sequence' ? SequenceNavNodeOptions :
  T extends 'cluster' ? ClusterNavNodeOptions :
  never;

export interface TopNavNodeOptions {}
export interface SeriesNavNodeOptions {
  seriesKey: string;
}
export interface DatapointNavNodeOptions {
  seriesKey: string;
  index: number;
}
export interface ChordNavNodeOptions {
  index: number;
}
export interface SequenceNavNodeOptions {
  seriesKey: string;
  // start and end as in series analysis fields
  start: number;
  end: number;
}

export interface ClusterNavNodeOptions {
  seriesKey: string;
  start: number;
  end: number;
  datapoints: number[];
  clustering: clusterObject
}

function nodeOptionsEq<T extends NavNodeType>(
  options1: NavNodeOptionsType<T>,
  options2: NavNodeOptionsType<T>) {
  for (const key in options1) {
    if (options1[key] !== options2[key]) {
      return false;
    }
  }
  return true;
}

function nodeOptionsMatch<T extends NavNodeType>(
  options1: Partial<NavNodeOptionsType<T>>,
  options2: Readonly<NavNodeOptionsType<T>>) {
  if (!Object.keys(options1).length) {
    return true;
  }
  for (const key in options1) {
    if (options1[key] === options2[key]) {
      return true;
    }
  }
  return false;
}

/**
 * Manages the graph that controls datapoint focus and visitation during
 * keyboard navigation.
 */
export class NavMap {
  protected _layers: Map<string, NavLayer> = new Map();
  protected _currentLayer: NavLayer;
  protected _runTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(protected _store: ParaStore, protected _chart: DataLayer) {
    this._currentLayer = new NavLayer(this, 'root');
    this._layers.set(this._currentLayer.name, this._currentLayer);
  }

  get currentLayer() {
    return this._currentLayer;
  }

  set currentLayer(layer: NavLayer) {
    this._currentLayer = layer;
  }

  get cursor() {
    return this._currentLayer.cursor;
  }

  get root() {
    return this._layers.get('root')!;
  }

  layer(layer: string) {
    return this._layers.get(layer);
  }

  registerLayer(layer: NavLayer) {
    if (this._layers.has(layer.name)) {
      return;
    }
    this._layers.set(layer.name, layer);
  }

  async visitDatapoints() {
    // NB: cursor may have no datapoints
    // await this.cursor!.at(0)?.focus();
    this._store.visit(this.cursor!.datapointViews.map(view => ({
      seriesKey: view.seriesKey,
      index: view.index
    })));
    if (this._runTimer) {
      clearTimeout(this._runTimer);
    } else {
      await this._chart.navRunDidStart(this.cursor);
    }
    this._runTimer = setTimeout(() => {
      this._runTimer = null;
      this._chart.navRunDidEnd(this.cursor);
    }, 250);
    //this._chart.navCursorDidChange(this.cursor);
  }

  node<T extends NavNodeType>(
    type: T,
    options: Readonly<NavNodeOptionsType<T>>) {
    for (const layer of this._layers.values()) {
      const node = layer.get(type, options);
      if (node) {
        return node;
      }
    }
    return undefined;
  }

  goTo<T extends NavNodeType>(type: T, options: Readonly<NavNodeOptionsType<T>>) {
    const node = this.node(type, options);
    if (node) {
      node.layer.cursor = node;
      this._currentLayer = node.layer;
      this.visitDatapoints();
    } else {
      throw new Error('nav node not found');
    }
  }

}

export class NavLayer {
  protected _nodes: Map<NavNodeType, NavNode[]> = new Map();
  // A NavLayer is basically only valid/useful if it has nodes, and
  // if it has nodes, the cursor will be set.
  protected _cursor!: NavNode;

  constructor(protected _map: NavMap, protected _name: string) {
    _map.registerLayer(this);
  }

  get map() {
    return this._map;
  }

  get name() {
    return this._name;
  }

  get cursor() {
    return this._cursor;
  }

  set cursor(cursor: NavNode) {
    this._cursor = cursor;
  }

  registerNode<T extends NavNodeType>(node: NavNode<T>) {
    if (node.index !== -1) {
      return;
    }
    let list = this._nodes.get(node.type);
    if (!list) {
      list = [];
      this._nodes.set(node.type, list);
    }
    list.push(node);
    node.index = list.length - 1;
    if (!this._cursor) {
      this._cursor = node;
    }
  }

  get<T extends NavNodeType>(
    type: T,
    optionsOrIndex: Readonly<NavNodeOptionsType<T>> | number = 0) {
    const list = this._nodes.get(type);
    if (list) {
      return typeof optionsOrIndex === 'number'
        ? list[optionsOrIndex]
        : list.find((node: NavNode<T>) => nodeOptionsEq(node.options, optionsOrIndex));
    }
    return undefined;
  }

  query<T extends NavNodeType>(type: T, options: Partial<NavNodeOptionsType<T>> = {}) {
    const list = this._nodes.get(type) as NavNode<T>[];
    if (list) {
      return list.filter(node => nodeOptionsMatch(options, node.options));
    }
    return [];
  }

  goToNode(node: NavNode) {
    this._cursor = node;
    this.map.visitDatapoints();
  }

  goTo<T extends NavNodeType>(
    type: T,
    optionsOrIndex: Readonly<NavNodeOptionsType<T>> | number) {
    const node = this.get(type, optionsOrIndex);
    if (node) {
      this.goToNode(node);
    } else {
      throw new Error(`nav node not found (type='${type}')`);
    }
  }

}

export class NavNode<T extends NavNodeType = NavNodeType> {
  protected _links: Map<Direction, NavLayer | NavNode> = new Map();
  protected _datapointViews: DatapointView[] = [];
  // NB: This is the index of the nav node in the layer's list of nodes
  // of this type, NOT, e.g., the index of a datapoint in a series
  protected _index = -1;

  constructor(
    protected _layer: NavLayer,
    protected _type: T,
    protected _options: NavNodeOptionsType<T>
  ) {
    _layer.registerNode(this);
  }

  get datapointViews(): readonly DatapointView[] {
    return this._datapointViews;
  }

  get type() {
    return this._type;
  }

  get options() {
    return this._options as Readonly<NavNodeOptionsType<T>>;
  }

  get layer() {
    return this._layer;
  }

  get index() {
    return this._index;
  }

  set index(index: number) {
    this._index = index;
  }

  getLink(dir: Direction) {
    return this._links.get(dir);
  }

  setLink(dir: Direction, node: NavLayer | NavNode) {
    this._links.set(dir, node);
  }

  removeLink(dir: Direction) {
    this._links.delete(dir);
  }

  connect(dir: Direction, to: NavLayer | NavNode, isReciprocal = true) {
    this.setLink(dir, to);
    if (to instanceof NavNode && isReciprocal) {
      to.setLink(oppositeDirs[dir], this);
    }
  }

  disconnect(dir: Direction, isReciprocal = true) {
    const linked = this._links.get(dir);
    if (linked) {
      this.removeLink(dir);
      if (linked instanceof NavNode && isReciprocal) {
        linked.removeLink(oppositeDirs[dir]);
      }
    }
  }

  peekNode(dir: Direction, count: number) {
    let cursor: NavNode | undefined = this;
    while (cursor && count--) {
      const peeked = cursor.getLink(dir);
      cursor = peeked instanceof NavLayer ? undefined : peeked;
    }
    return cursor;
  }

  allNodes(dir: Direction, type?: NavNodeType) {
    let count = 1;
    let cursor: NavNode | undefined = undefined;
    const all: NavNode[] = [];
    while (true) {
      cursor = this.peekNode(dir, count++);
      if (cursor && (!type || type === cursor.type)) {
        if (all.includes(cursor)) {
          // there's a loop in the graph
          break;
        }
        all.push(cursor);
      } else {
        break;
      }
    }
    return all;
  }

  addDatapointView(datapointView: DatapointView) {
    this._datapointViews.push(datapointView);
  }

  at(index: number): DatapointView | undefined {
    return this._datapointViews.at(index);
  }

  async move(dir: Direction) {
    const link = this._links.get(dir);
    if (!link) {
      return;
    }
    if (link instanceof NavLayer) {
      this._layer.map.currentLayer = link;
    } else if (link instanceof NavNode) {
      this._layer.cursor = link;
    } else {
      throw new Error('unknown nav link type');
    }
    this._layer.map.visitDatapoints();
  }

  go() {
    this._layer.goToNode(this);
  }

  isNodeType<N extends T>(nodeType: N): this is NavNode<N> {
    return this.type === nodeType;
  }

}
