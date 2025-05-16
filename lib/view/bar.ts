
import { XYChart, XYDatapointView, XYSeriesView } from './xychart';
import { AxisInfo } from '../common/axisinfo';
import { 
  type BarSettings, type StackContentOptions ,type DeepReadonly
} from '../store/settings_types';
import { fixed } from '../common/utils';
import { Rect } from './shape/rect';
import { Label, LabelTextAnchor } from './label';

import { svg } from 'lit';
import { StyleInfo } from 'lit/directives/style-map.js';
import { SeriesView } from './data';
import { Box, enumerate, strToId } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';

type BarData = {[key: string]: BarCluster};

/**
 * Container for a cluster of bar chart stacks.
 */
class BarCluster {
  static width: number;
  static padding: number;
  static numStacks: number;

  stacks: {[key: string]: BarStack} = {}
  readonly id: string;
  readonly labelId: string;
  
  protected _x!: number;

  static computeSize(chart: BarChart) {
    //BarCluster.width = chart.paraview.store.settings.chart.size.width!/Object.values(chart.bars).length;
    // n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
    // chartlayer.(width or height)/(n/tickstep)
    //BarCluster.width = axis.tickLabelTiers[0].tickInterval/axis.tickStep;
    BarCluster.width = chart.parent.logicalWidth/chart.axisInfo!.xLabelInfo.labelTiers[0].length;
    console.log('computed bar cluster width:', BarCluster.width);
    BarCluster.padding = chart.paraview.store.settings.type.bar.clusterGap;
    const numSeries = chart.paraview.store.model!.numSeries;
    if (chart.paraview.store.settings.type.bar.stackContent === 'all') {
      BarCluster.numStacks = 1;
    } else if (chart.paraview.store.settings.type.bar.stackContent === 'count') {
      const seriesPerStack = chart.paraview.store.settings.type.bar.stackCount;
      BarCluster.numStacks = Math.ceil(numSeries/seriesPerStack);
    } 
  }

  constructor(public readonly chart: BarChart, public readonly key: string) {
    this.id = `barcluster-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
  }

  get x() {
    return this._x;
  }

  get index() {
    return Object.keys(this.chart.bars).indexOf(this.key);
  }

  computeLayout() {
    this._x = this.index*BarCluster.width;
  }

  render() {
    return svg`
      <g
        id=${this.id}
      >
        ${ 
          Object.entries(this.stacks).map(([stackKey, stack]) => 
            stack.render()
          )
        }
      </g>
    `;
  }

}

/**
 * Visual stack containing one or more bar chart bars. 
 */
export class BarStack {

  static width: number;

  bars: {[key: string]: Bar} = {};
  readonly id: string;
  readonly labelId: string;

  protected _label: Label | null = null;
  protected _x!: number;

  static computeSize(chart: BarChart) {
    BarStack.width = (BarCluster.width - BarCluster.padding*2)/BarCluster.numStacks;
    console.log('computed bar stack width:', BarStack.width);
    // if (BarStack.width < chart.settings.barWidthMin /*&& todo().canvas.todo.isAutoresizeEnabled*/) {
    //   BarStack.width = chart.settings.barWidthMin;
    //   BarCluster.width = BarStack.width*BarCluster.numStacks + BarCluster.padding*2;
    // }
    chart.parent.logicalWidth = BarCluster.width*Object.keys(chart.bars).length;
    console.log('setting chart content width to', chart.parent.width);
  }

  constructor(public readonly cluster: BarCluster, public readonly key: string) { 
    this.id = `barstack-${strToId(this.cluster.key)}-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
  }

  get x() {
    return this._x;
  }

  get index() {
    return Object.keys(this.cluster.stacks).indexOf(this.key);
  }

  get label() {
    return this._label;
  }

  set label(label: Label | null) {
    this._label = label;
  }

  computeLayout() {
    this._x = BarCluster.padding + this.index*BarStack.width;
  }

  render() {
    return svg`
      <g
        id=${this.id}
        class="stack"
        role="datapoint_group"
      >
        ${Object.entries(this.bars).map(([orderKey, bar]) => 
          bar.render()
        )}
      </g>
    `;
  }

}

function abbreviateSeries(keys: readonly string[]) {
  let len = 1;
  let abbrevs: string[] = [];
  // If there are key(s) with multiple words, for a first attempt,
  // try using only the first letter of the first word
  let firstWordOnly = true;
  outer: while (!abbrevs.length) {
    for (let i = 0; i < keys.length; i++) {
      let cand: string;
      if (keys[i].match(/\s/) && !firstWordOnly) {
        cand = keys[i].split(/\s+/).map(w => w.slice(0, len)).join('');
      } else {
        cand = keys[i].slice(0, len);
      }
      if (abbrevs.includes(cand)) {
        abbrevs = [];
        len++;
        firstWordOnly = false;
        break;
      }
      abbrevs[i] = cand;
    }
  }
  const abbrevMap: {[key: string]: string} = {};
  keys.forEach((k, i) => abbrevMap![k] = abbrevs[i]);
  return abbrevMap;
}

interface StackItem {
  series: string;
  value: Box<'number'>;
}
type Stack = {[colName: string]: StackItem};
type Cluster = {[stackKey: string]: Stack};
type ClusterMap = {[key: string]: Cluster};

/**
 * Class for drawing bar charts.
 */
export class BarChart extends XYChart {

  protected _clusteredData!: ClusterMap;
  private _abbrevs?: {[series: string]: string};
  private _bars!: BarData;
  protected _stackLabels: Label[] = [];

  protected _addedToParent() {
    super._addedToParent();

    this._clusteredData = this._clusterData();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      // xTiers: [this.paraview.store.model!.allFacetValues('x')!.map(x =>
      //   formatBox(x, 'barCluster', this.paraview.store))],
      xTiers: [Object.keys(this._clusteredData)],
      yValues: Object.values(this._clusteredData).flatMap(c =>
        Object.values(c).map(s => Object.values(s)
            .map(item => item.value.value)
            .reduce((a, b) => a + b, 0))),
      yMin: 0,
      isXInterval: true
    });

    /*todo().controller.settingViews.add(this, {
      type: 'dropdown',
      key: 'type.bar.stackContent',
      label: 'Stack content',
      options: {options: ['All', 'Count'], values: ['all', 'count']},
      parentView: 'chartDetails.tabs.chart.chart',
      //dontSaveValue: true
    }); 
    todo().controller.settingViews.add(this, {
      type: 'textfield',
      key: 'type.bar.stackCount',
      label: 'Count',
      options: {inputType: 'number', min: 1, max: this._model.depVars.length},
      hidden: true,
      parentView: 'chartDetails.tabs.chart.chart',
    });
    todo().deets!.chartPanel.requestUpdate();*/
    if (this.paraview.store.settings.type.bar.isAbbrevSeries) {
      this._abbrevs = abbreviateSeries(this.paraview.store.model!.keys);
    }
  }

  settingDidChange(key: string, value: any) {
    if (!super.settingDidChange(key, value)) {
      if (key === 'type.bar.stackContent') {
        //todo().controller.settingViews.setVisible('type.bar.stackCount', value === 'count');
      }
      //todo().controller.clearSettingManagers();
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
      return true;
    }
    return false;
  }

  get settings() {
    return super.settings as DeepReadonly<BarSettings>;
  }

  get bars(): Readonly<BarData> {
    return this._bars;
  }

  get abbrevs() {
    return this._abbrevs;
  }

  protected _newDatapointView(seriesView: XYSeriesView, stack: BarStack) {
    return new Bar(seriesView, stack);
  }

  protected _clusterData() {
    const clusterMap: ClusterMap = {};
    const xs = this.paraview.store.model!.series[0].facet('x')!;

    const clusters: Cluster[] = [];

    // if (this.paraview.store.settings.type.bar.clusterBy === 'facet') {
    //   for (const facet of this.paraview.store.model!.facets) {
    //     const cluster: Cluster = {};
    //     clusterMap[facet.key] = cluster;
    //     for (const series of this.paraview.store.model!.series) {
    //       const item: StackItem = {
    //         series: series.key,
    //         value: series.facet(facet.key)![0] as Box<'number'>
    //       };
    //       const stack: Stack = {[series.key]: item};
    //       cluster[series.key] = stack;
    //     }
    //   }
    //   return clusterMap;
    // }

    for (const [x, i] of enumerate(xs)) {
      //const clusterKey = this._model.format(xSeries.atBoxed(i), 'barCluster');  
      const clusterKey = formatBox(x, this.paraview.store.getFormatType('barCluster'));  
      let cluster = clusterMap[clusterKey];
      if (!cluster) {
        cluster = {};
        clusterMap[clusterKey] = cluster;
        clusters.push(cluster);
      }
    }

    // Place the series into stacks in the order they appear in the 
    // model (i.e., first column will be bottommost in 'all' mode)
    for (const [series, i] of enumerate(this.paraview.store.model!.series)) {
      for (const [value, j] of enumerate(series.facet('y')!)) {
        let stack: Stack;
        let stackKey: string;
        if (this.paraview.store.settings.type.bar.stackContent === 'all') {
          stackKey = 'stack';
          stack = clusters[j][stackKey];
          if (!stack) {
            stack = {};
            clusters[j][stackKey] = stack;
          }
        } else if (this.paraview.store.settings.type.bar.stackContent === 'count') {
          const seriesPerStack = this.paraview.store.settings.type.bar.stackCount;
          stackKey = seriesPerStack === 1 ? series.key : `stack${Math.floor(i/seriesPerStack)}`;
          stack = clusters[j][stackKey];
          if (!stack) {
            stack = {};
            clusters[j][stackKey] = stack;
          }
        } 
        stack![series.key] = {series: series.key, value: series.facet('y')![j] as Box<'number'>};
      }
    }
    return clusterMap;
  }

  protected _createComponents() {
    const barData: BarData = {};

    const seriesViews: {[key: string]: XYSeriesView} = {};
    Object.entries(this._clusteredData).forEach( ([clusterKey, dataCluster], i) => {
      const cluster = new BarCluster(this, clusterKey)
      barData[clusterKey] = cluster;
      //todo().canvas.jimerator.addSelector(this._model.indepVar, i, cluster.labelId);
      for (const [stackKey, dataStack] of Object.entries(dataCluster)) {
        const stack = new BarStack(cluster, stackKey);
        cluster.stacks[stackKey] = stack;
        for (const [colName, item] of Object.entries(dataStack)) {
          if (!seriesViews[colName]) {
            seriesViews[colName] = new XYSeriesView(this, colName);
            this._chartLandingView.append(seriesViews[colName]);
          }
          stack.bars[colName] = this._newDatapointView(seriesViews[colName], stack);
          seriesViews[colName].append(stack.bars[colName]);
          //todo().canvas.jimerator.addSelector(colName, i, this.datapointViews.at(-1)!.id);
        }
        let textAnchor: LabelTextAnchor = 'middle';
        let isPositionAtAnchor = false;
        let angle = 0;
        if (this._parent.orientation === 'east') {
          textAnchor = 'start';
          isPositionAtAnchor = false;
          angle = -90;
        }
        if (this.paraview.store.settings.type.bar.isDrawStackLabels) {
          this._stackLabels.push(new Label(this.paraview, {
            text: fixed`${Object.values(dataStack).map(item => item.value.value).reduce((a, b) => a + b)}`,
            classList: ['bar-stack-label'],
            x: 0,
            y: 0,
            textAnchor,
            isPositionAtAnchor,
            angle
          }));
          stack.label = this._stackLabels.at(-1)!;
          this.append(this._stackLabels.at(-1)!);
        }
      }
    });
    this._bars = barData;
    this._chartLandingView.reverseChildren();
  }

  protected _layoutComponents() {
    BarCluster.computeSize(this);
    BarStack.computeSize(this);
    for (const [clusterKey, cluster] of Object.entries(this._bars)) {
      cluster.computeLayout();
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        stack.computeLayout();
      }
    }
    super._layoutComponents();

    if (this.paraview.store.settings.type.bar.isDrawStackLabels) {
      for (const [clusterKey, cluster] of Object.entries(this._bars)) {
        for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
          const bar0 = Object.values(stack.bars)[0];
          stack.label!.snapXTo(bar0, 'center');
          stack.label!.y = bar0.y + (this.paraview.store.settings.type.bar.isStackLabelInsideBar
            ? this.paraview.store.settings.type.bar.stackLabelGap
            : - stack.label!.height - this.paraview.store.settings.type.bar.stackLabelGap);
        }
      }
      this._resizeToFitLabels();
    }
  }

  protected _resizeToFitLabels() {
    const labels = Object.values(this.bars).flatMap(cluster =>
      Object.values(cluster.stacks)).map(stack => stack.label!);
    const minX = Math.min(...labels.map(label => label.left));
    if (minX < 0) {
      this._parent.logicalWidth += -minX;
      console.log('NEW WIDTH', this._width);
      this.datapointViews.forEach(dp => {
        dp.x += -minX; 
      });
    }
    const maxX = Math.max(...labels.map(label => label.right));
    if (maxX > this._width) {
      const diff = maxX - this._width;
      this._parent.logicalWidth += diff;
      console.log('NEW WIDTH', this._width);
    }
    const minY = Math.min(...labels.map(label => label.top));
    if (minY < 0) {
      this._parent.logicalHeight += -minY;
      console.log('NEW HEIGHT', this._height);
      this.datapointViews.forEach(dp => {
        dp.y += -minY; 
      });
      labels.forEach(label => {
        label.y += -minY;
      });
    }
    const maxY = Math.max(...labels.map(label => label.bottom));
    if (maxY > this._height) {
      const diff = maxY - this._height;
      this._parent.logicalHeight += diff;
      console.log('NEW HEIGHT', this._height);
    }
    //this._checkLabelSpacing();
  }

  protected _checkLabelSpacing() {
    const labels = Object.values(this.bars).flatMap(cluster =>
      Object.values(cluster.stacks)).map(stack => stack.label!);
    const gaps = labels.slice(1).map((label, i) => label.left - labels[i].right);
    const minGap = Math.min(...gaps);
    if (Math.round(minGap) < 0) {
      const diffBefore = labels.at(-1)!.x - labels[0].x;
      labels.slice(1).forEach((label, i) => {
        // NB: Even if the anchor is set to middle, the labels may be rotated, so 
        // the anchor will no longer be in the middle of the bbox
        label.x = labels[i].right + 0 + label.anchorXOffset;
      });
      const diffAfter = labels.at(-1)!.x - labels[0].x;
      this._parent.logicalWidth += diffAfter - diffBefore;
    }
  }

  legend() {
    if (this.paraview.store.settings.legend.itemOrder === 'chart') {
      return this._chartLandingView.children.map(view => ({
        label: (view as SeriesView).seriesKey,
        color: (view as SeriesView).color  // series color
      }));
    } else {
      return this.paraview.store.model!.keys.toSorted().map(key => ({
        label: key,
        color: this.paraview.store.seriesProperties!.properties(key).color
      }));
    }
  }

}

/**
 * Visual representation of a bar chart bar.
 */
export class Bar extends XYDatapointView {

  declare readonly chart: BarChart;
  declare protected _parent: XYSeriesView; 

  protected _height!: number;

  constructor(
    seriesView: XYSeriesView,
    private stack: BarStack
  ) { 
    super(seriesView);
    //this._width = 45; //BarStack.width; // this.paraview.store.settings.type.bar.barWidth;
    this._isStyleEnabled = this.paraview.store.settings.type.bar.colorByDatapoint;
  }

  get _selectedMarkerX() {
    return this._x;
  }

  get _selectedMarkerY() {
    return this._y;
  }

  get styleInfo(): StyleInfo {
    const style = super.styleInfo;
    if (!this.paraview.store.isVisited(this.seriesKey, this.index)) {
      style.strokeWidth = 0;
    }
    return style;
  }

  computeLocation() {
    const orderIdx = Object.keys(this.stack.bars).indexOf(this.series.key);
    const pxPerYUnit = this.chart.parent.logicalHeight/this.chart.axisInfo!.yLabelInfo.range!;
    const distFromXAxis = Object.values(this.stack.bars).slice(0, orderIdx)
      .map(bar => (bar.datapoint.y.value as number)*pxPerYUnit)
      .reduce((a, b) => a + b, 0);
    this._width = BarStack.width;
    this._height = (this.datapoint.data.y.value as number)*pxPerYUnit;
    this._x = this.stack.x + this.stack.cluster.x; // - this.width/2; // + BarCluster.width/2 - this.width/2;
    this._y = this.chart.height - this.height - distFromXAxis;
  }

  protected _createSymbol() {
  }

  // protected get _d() {
  //   return fixed`
  //     M${this._x},${this._y + this.chart.settings.barGap}
  //     v${this._height - this.chart.settings.barGap*2}
  //     h${BarStack.width}
  //     v${-(this._height - this.chart.settings.barGap*2)}
  //     Z`;
  // }

  protected _createShape() {
    this._shape = new Rect(this.paraview, {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height
    });
    super._createShape();
  }

}
