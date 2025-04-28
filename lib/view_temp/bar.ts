
import { XYChart, XYDatapointView, XYSeriesView, type DatapointViewType } from './xychart';
import { AxisInfo } from '../common/axisinfo';
import { 
  type BarSettings, type StackContentOptions ,type DeepReadonly
} from '../store/settings_types';
import { enumerate, fixed, strToId } from '../common/utils';
import { formatBox } from './formatter';
import { Box } from '../store/model2D';

import { svg } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

type BarData = {[key: string]: BarCluster};

/**
 * Container for a cluster of bar chart stacks.
 */
class BarCluster {
  static width: number;
  static padding: number;
  static numStacks: number;

  public stacks: {[key: string]: BarStack} = {}
  public readonly id: string;
  public readonly labelId: string;
  
  private _x!: number;

  static computeSize(chart: BarChart) {
    //BarCluster.width = chart.paraview.store.settings.chart.size.width!/Object.values(chart.bars).length;
    const axis = chart.parent.docView.horizAxis!;
    BarCluster.width = axis.tickLabelTiers[0].tickInterval/axis.tickStep;
    console.log('computed bar cluster width:', BarCluster.width);
    BarCluster.padding = chart.settings.clusterPaddingPx;
    const numSeries = chart.paraview.store.model!.numSeries;
    if (chart.settings.stackContent === 'all') {
      BarCluster.numStacks = 1;
    } else if (chart.settings.stackContent === 'count') {
      const seriesPerStack = chart.settings.stackCount;
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

  public bars: {[key: string]: Bar} = {};
  public readonly id: string;
  public readonly labelId: string;

  private _x!: number;

  static computeSize(chart: BarChart) {
    BarStack.width = (BarCluster.width - BarCluster.padding*2)/BarCluster.numStacks;
    console.log('computed bar stack width:', BarStack.width);
    if (BarStack.width < chart.settings.barWidthMin /*&& todo().canvas.todo.isAutoresizeEnabled*/) {
      BarStack.width = chart.settings.barWidthMin;
      BarCluster.width = BarStack.width*BarCluster.numStacks + BarCluster.padding*2;
    }
    chart.parent.contentWidth = BarCluster.width*Object.keys(chart.bars).length;
    console.log('setting chart content width to', chart.parent.contentWidth);
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

  declare protected _settings: DeepReadonly<BarSettings>;

  protected _clusteredData!: ClusterMap;
  private _abbrevs?: {[series: string]: string};
  private _bars!: BarData;

  protected _addedToParent() {
    super._addedToParent();

    this._clusteredData = this._clusterData();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xTiers: [this.paraview.store.model!.allFacetValues('x')!.map(x =>
        formatBox(x, 'barCluster', this.paraview.store))],
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
    if (this._settings.isAbbrevSeries) {
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
    return this._settings;
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
    const xs = this.paraview.store.model!.allFacetValues('x')!;

    const clusters: Cluster[] = [];
    for (const [x, i] of enumerate(xs)) {
      //const clusterKey = this._model.format(xSeries.atBoxed(i), 'barCluster');  
      const clusterKey = formatBox(x, 'barCluster', this.paraview.store);  
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
      for (const [value, j] of enumerate(series.allFacetValues('y')!)) {
        let stack: Stack;
        let stackKey: string;
        if (this._settings.stackContent === 'all') {
          stackKey = 'stack';
          stack = clusters[j][stackKey];
          if (!stack) {
            stack = {};
            clusters[j][stackKey] = stack;
          }
        } else if (this._settings.stackContent === 'count') {
          const seriesPerStack = this._settings.stackCount;
          stackKey = seriesPerStack === 1 ? series.key : `stack${Math.floor(i/seriesPerStack)}`;
          stack = clusters[j][stackKey];
          if (!stack) {
            stack = {};
            clusters[j][stackKey] = stack;
          }
        } 
        stack![series.key] = {series: series.key, value: series.allFacetValues('y')![j] as Box<'number'>};
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
      }
    });
    this._bars = barData;
    this._chartLandingView.reverseChildren();
  }

  protected _layoutDatapoints() {
    BarCluster.computeSize(this);
    BarStack.computeSize(this);
    for (const [clusterKey, cluster] of Object.entries(this._bars)) {
      cluster.computeLayout();
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        stack.computeLayout();
        for (const [orderKey, bar] of Object.entries(stack.bars)) {
          bar.computeLayout();
        }
      }
    }
  }

  content() {
    return svg`
      ${Object.entries(this._bars).map(([clusterKey, cluster]) => 
        cluster.render()
      )}
    `;
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
  }

  get width() {
    return BarStack.width;
  }

  get height() {
    return this._height;
  }

  get _selectedMarkerX() {
    return this._x;
  }

  get _selectedMarkerY() {
    return this._y;
  }

  computeLayout() {
    const orderIdx = Object.keys(this.stack.bars).indexOf(this.series.key);
    const distFromXAxis = Object.values(this.stack.bars).slice(0, orderIdx)
      .map(bar => bar._height)
      .reduce((a, b) => a + b, 0);
    const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
    this._height = (this.datapoint.y.value as number)*pxPerYUnit;
    this._x = this.stack.x + this.stack.cluster.x;
    this._y = this.chart.height - this._height - distFromXAxis;
  }

  protected get _d() {
    return fixed`
      M${this._x},${this._y + this.chart.settings.barGap}
      v${this._height - this.chart.settings.barGap*2}
      h${BarStack.width}
      v${-(this._height - this.chart.settings.barGap*2)}
      Z`;
  }

  content() {
    const visitedScale = this.paraview.store.visitedDatapoints.includes(this._id)
      ? this.chart.settings.highlightScale : 1;
    const styles = {
      strokeWidth: this.chart.settings.lineWidth*visitedScale
    };
    return svg`
      <path
        d="${this._d}"
        style=${styleMap(styles)}
      ></path>
    `;
  }

}
