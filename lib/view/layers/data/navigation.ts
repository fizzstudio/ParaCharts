import { type clusterObject } from '@fizz/clustering';
import { type Datapoint } from '@fizz/paramodel';
import { type ParaState } from '../../../state';
import { HorizDirection, type Direction, type PlaneDirection } from '../../../config/config_types';
import { type BaseChartInfo } from '../../../chart_types';
import { NavOrientation } from '../../../navigation';


const oppositeDirs: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  in: 'out',
  out: 'in'
};

export type NavNodeType =
| 'top'
| 'collective'
| 'series'
| 'datapoint'
| 'chord'
| 'sequence'
| 'cluster'
| 'scatterpoint'
| 'venn-part'
| 'candlestick'
| 'stack';
export type DatapointNavNodeType = 'datapoint' | 'scatterpoint';


export type NavNodeOptionsType<T extends NavNodeType> =
  T extends 'top' ? TopNavNodeOptions :
  T extends 'collective' ? CollectiveNodeOptions :
  T extends 'series' ? SeriesNavNodeOptions :
  T extends 'datapoint' ? DatapointNavNodeOptions :
  T extends 'chord' ? ChordNavNodeOptions :
  T extends 'sequence' ? SequenceNavNodeOptions :
  T extends 'cluster' ? ClusterNavNodeOptions :
  T extends 'scatterpoint' ? ScatterPointNavNodeOptions :
  T extends 'venn-part' ? VennPartNavNodeOptions :
  T extends 'candlestick' ? CandlestickNavNodeOptions :
  T extends 'stack' ? StackNavNodeOptions :
  never;

export interface DatapointCursor {
  seriesKey: string;
  index: number;
}

export interface TopNavNodeOptions { }
export interface SeriesNavNodeOptions {
  seriesKey: string;
}
export interface CollectiveNodeOptions { }
export interface DatapointNavNodeOptions {
  seriesKey: string;
  index: number;
}
export interface ScatterPointNavNodeOptions extends DatapointNavNodeOptions {
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
  datapoints: Datapoint[];
  clustering: clusterObject;
  index: number;
}
export interface VennPartNavNodeOptions {
  seriesKey: string;
  part: 'only' | 'pair' | 'triple';
  otherSeriesKey?: string;
}
export interface CandlestickNavNodeOptions {
  index: number;
}
export interface StackNavNodeOptions {
  index: number;
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

export interface NavMapOptions {
  shouldWrapMove: boolean;
}

/**
 * Navigation map
 * Manages the graph that controls datapoint focus and visitation during
 * keyboard navigation.
 */
export class NavMap {
  /** Map of nav layer type to array of nav layers */
  protected _layers: Map<string, NavLayer[]> = new Map();
  protected _currentLayerType: string;
  protected _currentLayerIdx: number;
  protected _runTimer: ReturnType<typeof setTimeout> | null = null;
  protected _options: NavMapOptions;

  constructor(
    protected _paraState: ParaState,
    protected _chart: BaseChartInfo,
    options: Partial<NavMapOptions> = {}
  ) {
    this._options = {
      shouldWrapMove: false
    };
    Object.assign(this._options, options);
    this._currentLayerType = 'top';
    this._currentLayerIdx = 0;
    const root0 = new NavLayer(this, this._currentLayerType, this._paraState);
    this.registerLayer(root0);
  }

  get options(): Readonly<NavMapOptions> {
    return this._options;
  }

  setOptions(options: Partial<NavMapOptions>) {
    Object.assign(this._options, options);
  }

  get currentLayer(): NavLayer {
    return this._layers.get(this._currentLayerType)![this._currentLayerIdx];
  }

  set currentLayer(layer: NavLayer) {
    if (!this._layers.has(layer.type)) {
      throw new Error(`no layers of type '${layer.type}'`);
    }
    if (this._layers.get(layer.type)![layer.index] !== layer) {
      throw new Error(`layer not found at index ${layer.index}`);
    }
    this._currentLayerType = layer.type;
    this._currentLayerIdx = layer.index;
  }

  get cursor(): NavNode | null {
    return this.currentLayer.cursor;
  }

  get top(): NavLayer {
    return this._layers.get('top')![0];
  }

  get chartInfo() {
    return this._chart;
  }

  clone(): NavMap {
    const c = new NavMap(this._paraState, this._chart);
    c._layers = new Map();
    for (const entry of this._layers.entries()) {
      c._layers.set(entry[0], entry[1].map(layer => layer.clone(c)));
    }
    c.currentLayer = this.currentLayer;
    return c;
  }

  layer(type: string, index: number): NavLayer | null {
    return this._layers.get(type)?.at(index) ?? null;
  }

  registerLayer(layer: NavLayer) {
    if (!this._layers.has(layer.type)) {
      this._layers.set(layer.type, []);
    }
    this._layers.get(layer.type)!.push(layer);
    layer.index = this._layers.get(layer.type)!.length - 1;
  }

  newLayer(type: string, orientation: NavOrientation = 'horiz'): NavLayer {
    const layer = new NavLayer(this, type, this._paraState, orientation);
    this.registerLayer(layer);
    return layer;
  }

  async visitDatapoints(quiet = false) {
    this._paraState.visit(this.cursor!.datapoints);
    if (this._runTimer) {
      clearTimeout(this._runTimer);
    } else {
      await this._chart.navRunDidStart(this.cursor!);
    }
    this._chart.didNavToNode(this.cursor!);
    this._runTimer = setTimeout(() => {
      this._runTimer = null;
      this._chart.navRunDidEnd(this.cursor!, quiet);
    }, this._paraState.config.ui.navRunTimeoutMs);
    //this._chart.navCursorDidChange(this.cursor);
  }

  node<T extends NavNodeType>(
    type: T,
    options: Readonly<NavNodeOptionsType<T>>) {
    for (const layer of this._layers.values().toArray().flat()) {
      const node = layer.get(type, options);
      if (node) {
        return node;
      }
    }
    return undefined;
  }

  goTo<T extends NavNodeType>(type: T, options: Readonly<NavNodeOptionsType<T>>, quiet = false) {
    const node = this.node(type, options);
    if (node) {
      node.layer.cursor = node;
      this.currentLayer = node.layer;
      this.visitDatapoints(quiet);
    } else {
      throw new Error('nav node not found');
    }
  }

  // datapointsForSelector(layerName: string, selector: string): readonly Datapoint[] {
  //   const layer = this._layers.get(layerName);
  //   if (!layer) {
  //     throw new Error(`no such layer '${layerName}'`);
  //   }
  //   const fields = selector.split(/-/);
  //   const nodeType = fields[0] as NavNodeType;
  //   let node: NavNode<NavNodeType> | undefined = undefined;
  //   if (nodeType === 'datapoint') {
  //     // XXX need to allow multiple indices
  //     node = layer.get('datapoint', {
  //       seriesKey: fields[1],
  //       index: parseInt(fields[2])
  //     });
  //   } else if (nodeType === 'sequence') {
  //     node = layer.get('sequence', {
  //       seriesKey: fields[1],
  //       start: parseInt(fields[2]),
  //       end: parseInt(fields[3])
  //     });
  //   } else if (nodeType === 'series') {
  //     node = layer.get('series', { seriesKey: fields[1] });
  //   } else {
  //     //throw new Error(`selectors are undefined for type '${nodeType}'`);
  //     return [];
  //   }
  //   if (!node) {
  //     return [];
  //   }
  //   return node.datapoints;
  // }
}

/**
 * Navigation layer
 */
export class NavLayer {
  protected _nodes: NavNode[] = [];
  protected _cursor: NavNode | null = null;
  /** Index within peer layers of the same type */
  protected _index = -1;

  constructor(
    protected _map: NavMap,
    protected _type: string,
    protected _paraState: ParaState,
    protected _orientation: 'horiz' | 'vert' | 'both' = 'horiz'
  ) {
  }

  get nodes(): readonly NavNode[] {
    return this._nodes;
  }

  get map(): NavMap {
    return this._map;
  }

  get type(): string {
    return this._type;
  }

  get index(): number {
    return this._index;
  }

  set index(index: number) {
    this._index = index;
  }

  get orientation() {
    return this._orientation;
  }

  get cursor(): NavNode | null {
    return this._cursor;
  }

  set cursor(cursor: NavNode | null) {
    this._cursor = cursor;
  }

  cursorForward(): boolean {
    if (this._cursor) {
      if (this._cursor.index < this._nodes.length - 1) {
        this._cursor = this._nodes[this._cursor.index + 1];
        this._map.visitDatapoints();
        return true;
      }
      return false;
    }
    return false;
  }

  cursorBack(): boolean {
    if (this._cursor) {
      if (this._cursor.index) {
        this._cursor = this._nodes[this._cursor.index - 1];
        this._map.visitDatapoints();
        return true;
      }
      return false;
    }
    return false;
  }

  setCursorIndex(index: number) {
    if (this._cursor) {
      if (index >= 0 && index < this._nodes.length) {
        this._cursor = this._nodes[index];
      } else {
        throw new Error(`cursor index ${index} out of range`);
      }
    }
  }

  cursorCanGoForward(): boolean {
    return !!this._cursor && this._cursor.index < this._nodes.length - 1;
  }

  cursorCanGoBack(): boolean {
    return !!this._cursor && !!this._cursor.index;
  }

  next(): NavLayer | null {
    return this._map.layer(this._type, this._index + 1);
  }

  prev(): NavLayer | null {
    if (this._index === 0) return null;
    return this._map.layer(this._type, this._index - 1);
  }

  first(): NavLayer {
    return this._map.layer(this._type, 0)!;
  }

  last(): NavLayer {
    return this._map.layer(this._type, -1)!;
  }

  clone(map: NavMap): NavLayer {
    const c = new NavLayer(map, this._type, this._paraState);
    c._nodes = [...this._nodes];
    c._cursor = this._cursor;
    return c;
  }

  registerNode(node: NavNode) {
    if (node.index !== -1) {
      return;
    }
    this._nodes.push(node);
    node.index = this._nodes.length - 1;
    if (!this._cursor) {
      this._cursor = node;
    }
  }

  /** Get a node from its ID. */
  // node(id: string): NavNode<any> | undefined {
  //   return this._nodesById.get(id);
  // }

  /** Get a node from its options or index. */
  get<T extends NavNodeType>(
    type: T,
    options: Readonly<NavNodeOptionsType<T>>
  ): NavNode<T> | undefined {
    const list = this._nodes.filter(node => node.type === type) as NavNode<T>[];
    if (list.length) {
      // Every item in `options` must have a corresponding item with
      // the same value in `node.options`, but the converse is not true;
      // i.e., node.options may have items lacking in `options`
      return list.find((node: NavNode) => nodeOptionsEq(options, node.options))!;
    }
    return undefined;
  }

  /** Get all nodes matching partial options. */
  query<T extends NavNodeType>(type: T, options: Partial<NavNodeOptionsType<T>> = {}): NavNode<T>[] {
    const list = this._nodes.filter(node => node.type === type) as NavNode<T>[];
    if (list.length) {
      return list
        .filter(node => nodeOptionsMatch(options, node.options));
    }
    return [];
  }

  goToNode(node: NavNode, quiet = false) {
    this._cursor = node;
    this._map.currentLayer = this;
    this._map.visitDatapoints(quiet);
  }

  goTo<T extends NavNodeType>(
    type: T,
    options: Readonly<NavNodeOptionsType<T>>,
    quiet = false
  ) {
    const node = this.get(type, options);
    if (node) {
      this.goToNode(node, quiet);
    } else {
      throw new Error('nav node not found');
    }
  }

  /** Set the cursor from a set of visited datapoints. */
  updateCursor(datapoints: Datapoint[]) {
    for (const node of this._nodes) {
      const nodeDatapoints = node.datapoints;
      if (nodeDatapoints.length === datapoints.length
        && datapoints.every(dp => nodeDatapoints.includes(dp))) {
        this._cursor = node;
        break;
      }
    }
    this.map.visitDatapoints();
  }

  newNode<T extends NavNodeType>(
    type: T,
    options: NavNodeOptionsType<T>,
    invisible = false
  ): NavNode<T> {
    const node = new NavNode(this, type, options, this._paraState, invisible);
    this.registerNode(node);
    return node;
  }
}

/**
 * Navigation node
 */
export class NavNode<T extends NavNodeType = NavNodeType> {
  // direction -> node
  protected _links: Map<Direction, NavNode> = new Map();
  /** Index of the nav node in the layer's list of nodes */
  protected _index = -1;

  constructor(
    protected _layer: NavLayer,
    protected _type: T,
    protected _options: NavNodeOptionsType<T>,
    protected _paraState: ParaState,
    protected _invisible = false
  ) {
  }

  get type(): T {
    return this._type;
  }

  get options(): Readonly<NavNodeOptionsType<T>> {
    return this._options as Readonly<NavNodeOptionsType<T>>;
  }

  get layer(): NavLayer {
    return this._layer;
  }

  get index(): number {
    return this._index;
  }

  set index(index: number) {
    this._index = index;
  }

  get invisible(): boolean {
    return this._invisible;
  }

  get datapoints(): Datapoint[] {
    const model = this._layer.map.chartInfo.model!;
    const datapoints: Datapoint[] = [];
    if (this.isNodeType('datapoint') || this.isNodeType('scatterpoint')) {
      // @ts-ignore
      datapoints.push(model.atKeyAndIndex(this._options.seriesKey, this._options.index)!);
    } else if (this.isNodeType('series')) {
      const seriesLength = model.atKey(this._options.seriesKey)!.length;
      for (let i = 0; i < seriesLength; i++) {
        datapoints.push(model.atKeyAndIndex(this._options.seriesKey, i)!);
      }
    } else if (this.isNodeType('collective')) {
      datapoints.push(...this._layer.map.chartInfo.seriesInNavOrder().flatMap(series =>
        series.datapoints));
    } else if (this.isNodeType('chord')) {
      datapoints.push(...this._layer.map.chartInfo.seriesInNavOrder().map(series =>
        series.datapoints[this._options.index]));
    } else if (this.isNodeType('sequence')) {
      for (let i = this._options.start; i < this._options.end; i++) {
        datapoints.push(model.atKeyAndIndex(this._options.seriesKey, i)!);
      }
    } else if (this.isNodeType('cluster')) {
      datapoints.push(...model.atKey(this._options.seriesKey)!.datapoints.filter(dp =>
        this._options.datapoints.includes(dp)));
    } else if (this.isNodeType('candlestick')) {
      for (const seriesKey of ['open', 'high', 'low', 'close']) {
        datapoints.push(model.atKeyAndIndex(seriesKey, this._options.index)!);
      }
    } else if (this.isNodeType('stack')) {
      datapoints.push(...this._layer.map.chartInfo.seriesInNavOrder().map(series =>
        series.datapoints[this._options.index]));
    }
    return datapoints;
  }

  clone(layer: NavLayer): NavNode<T> {
    const c = new NavNode<T>(layer, this._type, this._options, this._paraState);
    c._links = new Map(this._links);
    c._index = this._index;
    return c;
  }

  getLink(dir: Direction): NavNode | undefined {
    return this._links.get(dir);
  }

  setLink(dir: Direction, node: NavNode) {
    this._links.set(dir, node);
  }

  removeLink(dir: Direction) {
    this._links.delete(dir);
  }

  connect(dir: Direction, to: NavNode, isReciprocal = true) {
    this.setLink(dir, to);
    if (isReciprocal) {
      to.setLink(oppositeDirs[dir], this);
    }
  }

  peekNode(dir: Direction, count: number): NavNode | undefined {
    let cursor: NavNode | undefined = this;
    while (cursor && count--) {
      const peeked = cursor.getLink(dir);
      cursor = (peeked && !(peeked instanceof NavNode)) ? undefined : peeked;
    }
    return cursor;
  }

  allNodes(dir: Direction, type?: NavNodeType): NavNode[] {
    let cursor: NavNode | undefined = this;
    const all: NavNode[] = [];
    while (true) {
      cursor = cursor.peekNode(dir, 1);
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

  async move(dir: Direction): Promise<boolean> {
    const link = this._links.get(dir);
    // console.log('MOVE', dir);
    if (link) {
      // console.log('LINK', link);
      if (dir !== 'out' && link.invisible) {
        // console.log('INVIS');
        return await link.move('in');
      }
      this._layer.map.currentLayer = link.layer;
      link.layer.cursor = link;
      await this._layer.map.visitDatapoints();
      return true;
    } else if ((this._layer.orientation === 'horiz' && (dir === 'up' || dir === 'down'))
      || (this._layer.orientation === 'vert' && (dir === 'left' || dir === 'right'))) {
      // console.log('JUMP', dir);
      return await this.jump(dir);
    } else {
      return false;
    }
  }

  async jump(dir: PlaneDirection): Promise<boolean> {
    const isNext = (dir === 'right' || dir === 'down');
    const target = isNext
      ? this._layer.next()
      : this._layer.prev();
    const cursorCanGoForwardOrBack = (isNext ? this._layer.cursorCanGoForward() : this._layer.cursorCanGoBack());
    if (target) {
      if (target === this._layer) return false;
      if (this._index >= target.nodes.length) return false;
      this._layer.map.currentLayer = target;

      const targetNodes = target.nodes;
      target.cursor = targetNodes[this.index];

      await this._layer.map.visitDatapoints();
      return true;
    } else if (this._layer.map.options.shouldWrapMove && cursorCanGoForwardOrBack) {
      if (isNext) {
        this._layer.map.currentLayer = this._layer.first();
        this._layer.map.currentLayer.setCursorIndex(this._index + 1);
      } else {
        this._layer.map.currentLayer = this._layer.last();
        this._layer.map.currentLayer.setCursorIndex(this._index - 1);
      }
      await this._layer.map.visitDatapoints();
      return true;
    } else {
      return false;
    }
  }

  go() {
    this.layer.goToNode(this);
  }

  isNodeType<N extends NavNodeType>(nodeType: N): this is NavNode<N> {
    // @ts-ignore
    return this.type === nodeType;
  }

  isDatapointNode(): this is NavNode<'datapoint'> {
    return this.type === 'datapoint';
  }
}
