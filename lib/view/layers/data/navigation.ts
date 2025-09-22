
import { DatapointView } from '../../data';
import { type ParaStore } from '../../../store';
import { type Direction } from '../../../store';
import { DataLayer } from './data_layer';
import { clusterObject } from '@fizz/clustering';
import { BaseChartInfo } from '../../../chart_types';
import { type Datapoint } from '@fizz/paramodel';

const oppositeDirs: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  in: 'out',
  out: 'in'
};

export type NavNodeType = 'top' | 'series' | 'datapoint' | 'chord' | 'sequence' | 'cluster' | 'scatterpoint';
export type DatapointNavNodeType = 'datapoint' | 'scatterpoint';


export type NavNodeOptionsType<T extends NavNodeType> =
  T extends 'top' ? TopNavNodeOptions :
  T extends 'series' ? SeriesNavNodeOptions :
  T extends 'datapoint' ? DatapointNavNodeOptions :
  T extends 'chord' ? ChordNavNodeOptions :
  T extends 'sequence' ? SequenceNavNodeOptions :
  T extends 'cluster' ? ClusterNavNodeOptions :
  T extends 'scatterpoint' ? ScatterPointNavNodeOptions :
  never;

export interface DatapointCursor {
  seriesKey: string;
  index: number;
}

export interface TopNavNodeOptions {}
export interface SeriesNavNodeOptions {
  seriesKey: string;
}
export interface DatapointNavNodeOptions {
  seriesKey: string;
  index: number;
}
export interface ScatterPointNavNodeOptions extends DatapointNavNodeOptions{
  cluster: number;
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

  constructor(protected _store: ParaStore, protected _chart: BaseChartInfo) {
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
    this._store.visit(this.cursor.datapoints);
    if (this._runTimer) {
      clearTimeout(this._runTimer);
    } else {
      await this._chart.navRunDidStart(this.cursor);
    }
    this._runTimer = setTimeout(() => {
      this._runTimer = null;
      this._chart.navRunDidEnd(this.cursor);
    }, this._store.settings.ui.navRunTimeoutMs);
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

  datapointsForSelector(layerName: string, selector: string): readonly Datapoint[] {
    const layer = this._layers.get(layerName);
    if (!layer) {
      throw new Error(`no such layer '${layerName}'`);
    }
    const fields = selector.split(/-/);
    const nodeType = fields[0] as NavNodeType;
    let node: NavNode<NavNodeType> | undefined = undefined;
    if (nodeType === 'datapoint') {
      // XXX need to allow multiple indices
      node = layer.get('datapoint', {
        seriesKey: fields[1],
        index: parseInt(fields[2])
      });
    } else if (nodeType === 'sequence') {
      node = layer.get('sequence', {
        seriesKey: fields[1],
        start: parseInt(fields[2]),
        end: parseInt(fields[3])
      });
    } else if (nodeType === 'series') {
      node = layer.get('series', {seriesKey: fields[1]});
    } else {
      throw new Error(`selectors are undefined for type '${nodeType}'`);
    }
    if (!node) {
      return [];
    }
    return node.datapoints;
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
    optionsOrIndex: Readonly<NavNodeOptionsType<T>> | number = 0
  ): NavNode<NavNodeType> | undefined {
    const list = this._nodes.get(type);
    if (list) {
      return typeof optionsOrIndex === 'number'
        ? list[optionsOrIndex]
        // Every item in `optionsOrIndex` must have a corresponding item with
        // the same value in `node.options`, but the converse is not true;
        // i.e., node.options may have items lacking in `optionsOrIndex`
        : list.find((node: NavNode<T>) => nodeOptionsEq(optionsOrIndex, node.options));
    }
    return undefined;
  }

  query<T extends NavNodeType>(type: T, options: Partial<NavNodeOptionsType<T>> = {}): NavNode<T>[] {
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
  // protected _datapoints: DatapointCursor[] = [];
  // NB: This is the index of the nav node in the layer's list of nodes
  // of this type, NOT, e.g., the index of a datapoint in a series
  protected _index = -1;

  constructor(
    protected _layer: NavLayer,
    protected _type: T,
    protected _options: NavNodeOptionsType<T>,
    protected _store: ParaStore
  ) {
    _layer.registerNode(this);
  }

  // get datapoints(): readonly DatapointCursor[] {
  //   return this._datapoints;
  // }

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

  get datapoints() {
    const datapoints: Datapoint[] = [];
    if (this.isNodeType('datapoint') || this.isNodeType('scatterpoint')) {
      // @ts-ignore
      datapoints.push(this._store.model!.atKeyAndIndex(this._options.seriesKey, this._options.index)!);
    } else if (this.isNodeType('series')) {
      const seriesLength = this._store.model!.atKey(this._options.seriesKey)!.length;
      for (let i = 0; i < seriesLength; i++) {
        datapoints.push(this._store.model!.atKeyAndIndex(this._options.seriesKey, i)!);
      }
    } else if (this.isNodeType('chord')) {
      datapoints.push(...this._store.model!.series.map(series =>
        series.datapoints[this._options.index]));
    } else if (this.isNodeType('sequence')) {
      for (let i = this._options.start; i < this._options.end; i++) {
        datapoints.push(this._store.model!.atKeyAndIndex(this._options.seriesKey, i)!);
      }
    } else if (this.isNodeType('cluster')) {
      datapoints.push(...this._store.model!.atKey(this._options.seriesKey)!.datapoints.filter(dp =>
        this._options.datapoints.includes(dp.datapointIndex)));
    }
    return datapoints;
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

  isNodeType<N extends NavNodeType>(nodeType: N): this is NavNode<N> {
    // @ts-ignore
    return this.type === nodeType;
  }

  isDatapointNode(): this is NavNode<'datapoint'> {
    return this.type === 'datapoint';
  }

}
