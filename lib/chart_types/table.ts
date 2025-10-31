import { Datapoint } from '@fizz/paramodel';
import { BaseChartInfo, RiffOrder } from './base_chart';
import {
  DeepReadonly, HorizDirection, SparkBrailleInfo, TableSettings, type ParaStore
} from '../store';
import { type DocumentView } from '../view/document_view';
import { NavNode } from '../view/layers';

import { ChartType } from '@fizz/paramanifest';

export class TableInfo extends BaseChartInfo {
  protected _numRows!: number;
  protected _numCols!: number;
  protected _contents!: string[][];

  constructor(type: ChartType, store: ParaStore, docView: DocumentView) {
    super(type, store, docView);
    this._initContents();
  }

  get settings() {
    return super.settings as DeepReadonly<TableSettings>;
  }

  get numRows(): number {
    return this._numRows;
  }

  get numCols(): number {
    return this._numCols;
  }

  get contents(): readonly (readonly string[])[] {
    return this._contents;
  }

  protected _init(): void {
    this._numRows = this._store.model!.series[0].datapoints.length + 1;
    this._numCols = this._store.model!.dependentFacetKeys.length + 1;
    super._init();
  }

  protected _initContents(): void {
    this._contents = [];
    for (let i = 0; i < this._numRows; i++) {
      this._contents.push(new Array(this._numCols).fill(''));
    }
    const model = this._store.model!;
    // TODO: Assumes exactly 1 indep facet
    const xHeading = model.getFacet(model.independentFacetKeys[0])!.label;
    this._contents[0][0] = xHeading;
    model.dependentFacetKeys.forEach((depKey, i) => {
      const yHeading = model.getFacet(depKey)!.label;
      this._contents[0][i + 1] = yHeading;
    });
    model.series[0].datapoints.forEach((dp, i) => {
      const xValue = dp.facetValue(model.independentFacetKeys[0])!.toLocaleString();
      this._contents[i + 1][0] = xValue;
      model.series.forEach((s, j) => {
        const yValue = s[i].facetValue(model.dependentFacetKeys[j])!.toLocaleString();
        this._contents[i + 1][j + 1] = yValue;
      });
    });
  }

  protected _createNavMap() {
    super._createNavMap();
    const top = this._navMap!.root.get('top')!;

    const nodes: NavNode[][] = [];
    for (let i = 1; i < this._numRows; i++) {
      nodes.push([]);
      for (let j = 0; j < this._numCols; j++) {
        nodes[i - 1].push(new NavNode(this._navMap!.root, 'tableCell', {
          row: i,
          column: j
        }, this._store));
      }
    }
    for (let i = 1; i < this._numRows; i++) {
      for (let j = 0; j < this._numCols - 1; j++) {
        nodes[i - 1][j].connect('right', nodes[i - 1][j + 1]);
      }
    }
    for (let i = 1; i < this._numRows - 1; i++) {
      for (let j = 0; j < this._numCols; j++) {
        nodes[i - 1][j].connect('down', nodes[i][j]);
      }
    }
    top.connect('right', nodes[0][0]);
  }

  pageUp() {
    if (this._navMap!.cursor.isNodeType('tableCell')) {
      this._navMap!.cursor.allNodes('up', 'tableCell').at(-1)?.go();
      this._docView.postNotice('goColumnTop', {options: this._navMap!.cursor.options});
    }
  }

  pageDown() {
    if (this._navMap!.cursor.isNodeType('tableCell')) {
      this._navMap!.cursor.allNodes('down', 'tableCell').at(-1)?.go();
      this._docView.postNotice('goColumnBottom', {options: this._navMap!.cursor.options});
    }
  }

  navFirst() {
    if (this._navMap!.cursor.isNodeType('tableCell')) {
      this._navMap!.cursor.allNodes('left', 'tableCell').at(-1)?.go();
      this._docView.postNotice('goRowLeftmost', {options: this._navMap!.cursor.options});
    }
  }

  navLast() {
    if (this._navMap!.cursor.isNodeType('tableCell')) {
      this._navMap!.cursor.allNodes('right', 'tableCell').at(-1)?.go();
      this._docView.postNotice('goRowRightmost', {options: this._navMap!.cursor.options});
    }
  }

  navCursorDidChange(cursor: NavNode): void {
  }

  async navRunDidEnd(cursor: NavNode) {
    super.navRunDidEnd(cursor);
    if (cursor.isNodeType('tableCell')) {
      this._store.announce(this._contents[cursor.options.row][cursor.options.column]);
    }
  }

  protected _playRiff(order?: RiffOrder): void {

  }

  protected _playDatapoints(datapoints: Datapoint[]): void {

  }

  playDir(dir: HorizDirection): void {

  }

  protected _sparkBrailleInfo(): SparkBrailleInfo | null {
    return null;
  }
}