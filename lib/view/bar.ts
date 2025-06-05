
import { XYChart, XYDatapointView, XYSeriesView } from './xychart';
import { AxisInfo } from '../common/axisinfo';
import { 
  type BarSettings, type StackContentOptions ,type DeepReadonly
} from '../store/settings_types';
import { fixed } from '../common/utils';
import { Rect } from './shape/rect';
import { Label, LabelTextAnchor } from './label';

import { StyleInfo } from 'lit/directives/style-map.js';
import { ChartLandingView, DatapointView, SeriesView } from './data';
import { Box, enumerate, strToId } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../store/query_utils';
import { interpolate } from '@fizz/templum';

type BarClusterMap = {[key: string]: BarCluster};

interface BarStackItem {
  series: string;
  value: Box<'number'>;
}

/**
 * Contains clustered bar stack data.
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
    return Object.keys(this.chart.clusteredData).indexOf(this.key);
  }

  computeLayout() {
    this._x = this.index*BarCluster.width;
  }

}

/**
 * Contains data for bars contained in a stack.
 */
export class BarStack {

  static width: number;

  bars: {[key: string]: BarStackItem} = {};

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
    chart.parent.logicalWidth = BarCluster.width*Object.keys(chart.clusteredData).length;
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

/**
 * Class for drawing bar charts.
 */
export class BarChart extends XYChart {

  protected _clusteredData!: BarClusterMap;
  protected _abbrevs?: {[series: string]: string};
  protected _stackLabels: Label[] = [];

  protected _addedToParent() {
    super._addedToParent();

    this._clusteredData = this._clusterData();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      // xTiers: [this.paraview.store.model!.allFacetValues('x')!.map(x =>
      //   formatBox(x, 'barCluster', this.paraview.store))],
      xTiers: [Object.keys(this._clusteredData)],
      yValues: Object.values(this._clusteredData).flatMap(c =>
        Object.values(c.stacks).map(s => Object.values(s.bars)
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
    // if (!super.settingDidChange(key, value)) {
    //   if (key === 'type.bar.stackContent') {
    //     //todo().controller.settingViews.setVisible('type.bar.stackCount', value === 'count');
    //   }
    //   //todo().controller.clearSettingManagers();
    //   this.paraview.createDocumentView();
    //   this.paraview.requestUpdate();
    //   return true;
    // }
    return false;
  }

  get settings() {
    return super.settings as DeepReadonly<BarSettings>;
  }

  get abbrevs() {
    return this._abbrevs;
  }

  get clusteredData() {
    return this._clusteredData;
  }

  protected _newDatapointView(seriesView: XYSeriesView, stack: BarStack) {
    return new Bar(seriesView, stack);
  }

  protected _clusterData() {
    const clusterMap: BarClusterMap = {};
    const xs = this.paraview.store.model!.series[0].facet('x')!;

    const clusters: BarCluster[] = [];

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
        cluster = new BarCluster(this, clusterKey);
        clusterMap[clusterKey] = cluster;
        clusters.push(cluster);
      }
    }

    // Place the series into stacks in the reverse order to how they appear in the 
    // model (i.e., first series will be topmost onscreen in 'all' mode)
    for (const [series, i] of enumerate(this.paraview.store.model!.series).toReversed()) {
      for (const [value, j] of enumerate(series.facet('y')!)) {
        let stack: BarStack;
        let stackKey: string;
        if (this.paraview.store.settings.type.bar.stackContent === 'all') {
          stackKey = 'stack';
          stack = clusters[j].stacks[stackKey];
          if (!stack) {
            stack = new BarStack(clusters[j], stackKey);
            clusters[j].stacks[stackKey] = stack;
          }
        } else if (this.paraview.store.settings.type.bar.stackContent === 'count') {
          const seriesPerStack = this.paraview.store.settings.type.bar.stackCount;
          stackKey = seriesPerStack === 1 ? series.key : `stack${Math.floor(i/seriesPerStack)}`;
          stack = clusters[j].stacks[stackKey];
          if (!stack) {
            stack = new BarStack(clusters[j], stackKey);
            clusters[j].stacks[stackKey] = stack;
          }
        } 
        stack!.bars[series.key] = {series: series.key, value: series.facet('y')![j] as Box<'number'>};
      }
    }
    return clusterMap;
  }

  protected _beginLayout() {
    // Datapoint layout depends on this happening first
    BarCluster.computeSize(this);
    BarStack.computeSize(this);
    for (const [clusterKey, cluster] of Object.entries(this._clusteredData)) {
      cluster.computeLayout();
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        stack.computeLayout();
      }
    }
    super._beginLayout();
  }

  protected _createDatapoints() {
    const seriesViews: {[key: string]: XYSeriesView} = {};
    Object.entries(this._clusteredData).forEach( ([clusterKey, cluster], i) => {
      //todo().canvas.jimerator.addSelector(this._model.indepVar, i, cluster.labelId);
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        for (const [colName, item] of Object.entries(stack.bars)) {
          if (!seriesViews[colName]) {
            seriesViews[colName] = new XYSeriesView(this, colName);
            this._chartLandingView.append(seriesViews[colName]);
          }
          seriesViews[colName].append(this._newDatapointView(seriesViews[colName], stack));
          //todo().canvas.jimerator.addSelector(colName, i, this.datapointViews.at(-1)!.id);
        }
      }
    });
    // First child of chart landing is bottom-most series, so we reverse them
    // so that navigation starts at the top
    this._chartLandingView.reverseChildren();
  }

  // protected _createComponents() {
  //   const barData: BarData = {};

  //   const seriesViews: {[key: string]: XYSeriesView} = {};
  //   Object.entries(this._clusteredData).forEach( ([clusterKey, dataCluster], i) => {
  //     const cluster = new BarCluster(this, clusterKey)
  //     barData[clusterKey] = cluster;
  //     //todo().canvas.jimerator.addSelector(this._model.indepVar, i, cluster.labelId);
  //     for (const [stackKey, dataStack] of Object.entries(dataCluster)) {
  //       const stack = new BarStack(cluster, stackKey);
  //       cluster.stacks[stackKey] = stack;
  //       for (const [colName, item] of Object.entries(dataStack)) {
  //         if (!seriesViews[colName]) {
  //           seriesViews[colName] = new XYSeriesView(this, colName);
  //           this._chartLandingView.append(seriesViews[colName]);
  //         }
  //         stack.bars[colName] = this._newDatapointView(seriesViews[colName], stack);
  //         seriesViews[colName].append(stack.bars[colName]);
  //         //todo().canvas.jimerator.addSelector(colName, i, this.datapointViews.at(-1)!.id);
  //       }
  //       let textAnchor: LabelTextAnchor = 'middle';
  //       let isPositionAtAnchor = false;
  //       let angle = 0;
  //       if (this._parent.orientation === 'east') {
  //         textAnchor = 'start';
  //         isPositionAtAnchor = false;
  //         angle = -90;
  //       }
  //       if (this.paraview.store.settings.type.bar.isDrawStackLabels) {
  //         this._stackLabels.push(new Label(this.paraview, {
  //           text: fixed`${Object.values(dataStack).map(item => item.value.value).reduce((a, b) => a + b)}`,
  //           classList: ['bar-stack-label'],
  //           x: 0,
  //           y: 0,
  //           textAnchor,
  //           isPositionAtAnchor,
  //           angle
  //         }));
  //         stack.label = this._stackLabels.at(-1)!;
  //         this.append(this._stackLabels.at(-1)!);
  //       }
  //     }
  //   });
  //   this._bars = barData;
  //   this._chartLandingView.reverseChildren();
  // }

  protected _completeLayout() {
    super._completeLayout();

    // if (this.paraview.store.settings.type.bar.isDrawStackLabels) {
    //   for (const [clusterKey, cluster] of Object.entries(this._bars)) {
    //     for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
    //       const bar0 = Object.values(stack.bars)[0];
    //       stack.label!.snapXTo(bar0, 'center');
    //       stack.label!.y = bar0.y + (this.paraview.store.settings.type.bar.isStackLabelInsideBar
    //         ? this.paraview.store.settings.type.bar.stackLabelGap
    //         : - stack.label!.height - this.paraview.store.settings.type.bar.stackLabelGap);
    //     }
    //   }
    //   this._resizeToFitLabels();
    // }
  }

  // protected _resizeToFitLabels() {
  //   const labels = Object.values(this.bars).flatMap(cluster =>
  //     Object.values(cluster.stacks)).map(stack => stack.label!);
  //   const minX = Math.min(...labels.map(label => label.left));
  //   if (minX < 0) {
  //     this._parent.logicalWidth += -minX;
  //     console.log('NEW WIDTH', this._width);
  //     this.datapointViews.forEach(dp => {
  //       dp.x += -minX; 
  //     });
  //   }
  //   const maxX = Math.max(...labels.map(label => label.right));
  //   if (maxX > this._width) {
  //     const diff = maxX - this._width;
  //     this._parent.logicalWidth += diff;
  //     console.log('NEW WIDTH', this._width);
  //   }
  //   const minY = Math.min(...labels.map(label => label.top));
  //   if (minY < 0) {
  //     this._parent.logicalHeight += -minY;
  //     console.log('NEW HEIGHT', this._height);
  //     this.datapointViews.forEach(dp => {
  //       dp.y += -minY; 
  //     });
  //     labels.forEach(label => {
  //       label.y += -minY;
  //     });
  //   }
  //   const maxY = Math.max(...labels.map(label => label.bottom));
  //   if (maxY > this._height) {
  //     const diff = maxY - this._height;
  //     this._parent.logicalHeight += diff;
  //     console.log('NEW HEIGHT', this._height);
  //   }
  //   //this._checkLabelSpacing();
  // }

  // protected _checkLabelSpacing() {
  //   const labels = Object.values(this.bars).flatMap(cluster =>
  //     Object.values(cluster.stacks)).map(stack => stack.label!);
  //   const gaps = labels.slice(1).map((label, i) => label.left - labels[i].right);
  //   const minGap = Math.min(...gaps);
  //   if (Math.round(minGap) < 0) {
  //     const diffBefore = labels.at(-1)!.x - labels[0].x;
  //     labels.slice(1).forEach((label, i) => {
  //       // NB: Even if the anchor is set to middle, the labels may be rotated, so 
  //       // the anchor will no longer be in the middle of the bbox
  //       label.x = labels[i].right + 0 + label.anchorXOffset;
  //     });
  //     const diffAfter = labels.at(-1)!.x - labels[0].x;
  //     this._parent.logicalWidth += diffAfter - diffBefore;
  //   }
  // }

  legend() {
    if (this.paraview.store.settings.legend.itemOrder === 'series') {
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

  queryData(): void {
      const targetView = this.chartLandingView.focusLeaf
      // TODO: localize this text output
      // focused view: e.options!.focus
      // all visited datapoint views: e.options!.visited
      // const focusedDatapoint = e.targetView;
      let msgArray: string[] = [];
      let seriesLengths = [];
      for (let series of this.paraview.store.model!.series) {
        seriesLengths.push(series.rawData.length)
      }
      if (targetView instanceof ChartLandingView) {
        this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
        return
      }
      else if (targetView instanceof SeriesView) {
        /*
        if (e.options!.isChordMode) {
          // console.log('focusedDatapoint', focusedDatapoint)
          const visitedDatapoints = e.options!.visited as XYDatapointView[];
          // console.log('visitedDatapoints', visitedDatapoints)
          msgArray = this.describeChord(visitedDatapoints);
        } */
        msgArray.push(interpolate(
          queryMessages.seriesKeyLength,
          { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
        ));
        //console.log('queryData: SeriesView:', targetView);
      }
      else if (targetView instanceof DatapointView) {
        /*
        if (e.options!.isChordMode) {
          // focused view: e.options!.focus
          // all visited datapoint views: e.options!.visited
          // const focusedDatapoint = e.targetView;
          // console.log('focusedDatapoint', focusedDatapoint)
          const visitedDatapoints = e.options!.visited as XYDatapointView[];
          // console.log('visitedDatapoints', visitedDatapoints)
          msgArray = this.describeChord(visitedDatapoints);
        }
          */
        const selectedDatapoints = this.paraview.store.selectedDatapoints;
        const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
        msgArray.push(interpolate(
          queryMessages.datapointKeyLength,
          {
            seriesKey: targetView.seriesKey,
            datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
            datapointIndex: targetView.index + 1,
            datapointCount: targetView.series.length
          }
        ));
        //console.log(msgArray)
        if (selectedDatapoints.length) {
          const selectedDatapointViews = []

          for (let datapoint of selectedDatapoints) {
            const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
            selectedDatapointViews.push(selectedDatapointView)
          }
          // if there are selected datapoints, compare the current datapoint against each of those
          //console.log(targetView.series.rawData)
          const selectionMsgArray = describeSelections(this.paraview, targetView, selectedDatapointViews as DatapointView[]);
          msgArray = msgArray.concat(selectionMsgArray);
        } else {
          //console.log('tv', targetView)
          // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
          const datapointMsgArray = describeAdjacentDatapoints(this.paraview, targetView);
          msgArray = msgArray.concat(datapointMsgArray);
        }
        // also add the high or low indicators
        const minMaxMsgArray = getDatapointMinMax(this.paraview,
          targetView.series[visitedDatapoint.index].facetBox("y")!.raw as unknown as number, targetView.seriesKey);
        //console.log('minMaxMsgArray', minMaxMsgArray)z
        msgArray = msgArray.concat(minMaxMsgArray)
      }
      this.paraview.store.announce(msgArray);
    }


}

/**
 * Visual representation of a bar chart bar.
 */
export class Bar extends XYDatapointView {

  declare readonly chart: BarChart;
  declare protected _parent: XYSeriesView; 

  protected _recordLabel: Label | null = null;
  protected _valueLabel: Label | null = null;

  constructor(
    seriesView: XYSeriesView,
    protected _stack: BarStack
  ) { 
    super(seriesView);
    //this._width = 45; //BarStack.width; // this.paraview.store.settings.type.bar.barWidth;
    this._isStyleEnabled = this.paraview.store.settings.type.bar.colorByDatapoint;
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    if (this._valueLabel) {
      this._valueLabel.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._valueLabel) {
      this._valueLabel.y += y - this._y;
    }
    super.y = y;
  }

  get recordLabel() {
    return this._recordLabel;
  }

  set recordLabel(label: Label | null) {
    this._recordLabel = label;
  }

  get valueLabel() {
    return this._valueLabel;
  }

  set valueLabel(label: Label | null) {
    this._valueLabel = label;
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
    const orderIdx = Object.keys(this._stack.bars).indexOf(this.series.key);
    const pxPerYUnit = this.chart.parent.logicalHeight/this.chart.axisInfo!.yLabelInfo.range!;
    const distFromXAxis = Object.values(this._stack.bars).slice(0, orderIdx)
      .map(bar => bar.value.value*pxPerYUnit)
      .reduce((a, b) => a + b, 0);
    this._width = BarStack.width;
    // @ts-ignore
    this._height = (this.datapoint.data.y.value as number)*pxPerYUnit;
    this._x = this._stack.x + this._stack.cluster.x; // - this.width/2; // + BarCluster.width/2 - this.width/2;
    this._y = this.chart.height - this.height - distFromXAxis;
  }

  completeLayout() {
    super.completeLayout();
    let textAnchor: LabelTextAnchor = 'middle';
    let isPositionAtAnchor = false;
    let angle = 0;
    if (this.chart.parent.orientation === 'east') {
      textAnchor = 'start';
      isPositionAtAnchor = false;
      angle = -90;
    }
    if (this.paraview.store.settings.type.bar.isDrawRecordLabels) {
      this._recordLabel = new Label(this.paraview, {
        // @ts-ignore
        text: formatBox(this.datapoint.data.x, this.paraview.store.getFormatType('pieSliceValue')),
        id: this._id + '-rlb',
        classList: ['bar-label'],
        role: 'datapoint',
        textAnchor,
        isPositionAtAnchor,
        angle
      });
      this.append(this._recordLabel);
      this._recordLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.store.colors.contrastValueAt(this._isStyleEnabled ? this.index : this.parent.index)
      };
      this._recordLabel.snapXTo(this, 'center');
      this._recordLabel.y = this.chart.height - this._recordLabel.height - this.paraview.store.settings.type.bar.stackLabelGap;
    }
    if (this.paraview.store.settings.type.bar.isDrawValueLabels) {
      this._valueLabel = new Label(this.paraview, {
        // @ts-ignore
        text: formatBox(this.datapoint.data.y, this.paraview.store.getFormatType('pieSliceValue')),
        id: this._id + '-vlb',
        classList: ['bar-label'],
        role: 'datapoint',
        textAnchor,
        isPositionAtAnchor,
        angle
      });
      this.append(this._valueLabel);
      this._valueLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.store.colors.contrastValueAt(this._isStyleEnabled ? this.index : this.parent.index)
      };
      this._valueLabel.snapXTo(this, 'center');
      this._valueLabel.y = this._y + (this.paraview.store.settings.type.bar.stackLabelGap);
    }
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

  get selectedMarker() {
    return new Rect(this.paraview, {
      width: this._width + 4,
      height: this._height + 4,
      x: this._x - 2,
      y: this._y - 2,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }

}
