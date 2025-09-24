
import { XYChart, XYDatapointView, XYSeriesView } from '.';
import { AxisInfo } from '../../../../common/axisinfo';
import {
  type BarSettings, type StackContentOptions ,type DeepReadonly,
  Setting
} from '../../../../store/settings_types';
import { datapointMatchKeyAndIndex, fixed } from '../../../../common/utils';
import { RectShape } from '../../../shape/rect';
import { Label, LabelTextAnchor } from '../../../label';
import { ChartLandingView, DatapointView, SeriesView } from '../../../data';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../../../../store/query_utils';

import { Box, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { interpolate } from '@fizz/templum';

import { StyleInfo } from 'lit/directives/style-map.js';
import { strToId } from '@fizz/paramanifest';

type BarClusterMap = {[key: string]: BarCluster};

interface BarStackItem {
  series: string;
  value: Box<'number'>;
}

/**
 * Contains clustered bar stack data.
 */
class BarCluster {
  stacks: {[key: string]: BarStack} = {}
  readonly id: string;
  readonly labelId: string;

  static computeSize(chart: BarChart) {
    // BarCluster.width = chart.paraview.store.settings.chart.size.width!/Object.values(chart.bars).length;
    // n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
    // chartlayer.(width or height)/(n/tickstep)
    // BarCluster.width = axis.tickLabelTiers[0].tickInterval/axis.tickStep;

    // BarCluster.width = chart.parent.logicalWidth/chart.axisInfo!.xLabelInfo.labelTiers[0].length;
    // console.log('computed bar cluster width:', BarCluster.width);
    // BarCluster.padding = chart.paraview.store.settings.type.bar.clusterGap;
    // const numSeries = chart.paraview.store.model!.numSeries;
    // if (chart.paraview.store.settings.type.bar.stackContent === 'all') {
    //   BarCluster.numStacks = 1;
    // } else if (chart.paraview.store.settings.type.bar.stackContent === 'count') {
    //   const seriesPerStack = chart.paraview.store.settings.type.bar.stackCount;
    //   BarCluster.numStacks = Math.ceil(numSeries/seriesPerStack);
    // }
    //BarCluster.width = chart.stackWidth*chart.stacksPerCluster + (chart.stacksPerCluster - 1)*chart.settings.barGap;
  }

  constructor(public readonly chart: BarChart, public readonly key: string) {
    this.id = `barcluster-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
  }

  get index() {
    return Object.keys(this.chart.clusteredData).indexOf(this.key);
  }

}

/**
 * Contains data for bars contained in a stack.
 */
export class BarStack {

  bars: {[key: string]: BarStackItem} = {};

  readonly id: string;
  readonly labelId: string;

  protected _label: Label | null = null;

  // static computeSize(chart: BarChart) {
  //   BarStack.width = (BarCluster.width - BarCluster.padding*2)/BarCluster.numStacks;
  //   console.log('computed bar stack width:', BarStack.width);
  //   // if (BarStack.width < chart.settings.barWidthMin /*&& todo().canvas.todo.isAutoresizeEnabled*/) {
  //   //   BarStack.width = chart.settings.barWidthMin;
  //   //   BarCluster.width = BarStack.width*BarCluster.numStacks + BarCluster.padding*2;
  //   // }
  //   chart.parent.logicalWidth = BarCluster.width*Object.keys(chart.clusteredData).length;
  //   console.log('setting chart content width to', chart.parent.width);
  // }

  constructor(public readonly cluster: BarCluster, public readonly key: string) {
    this.id = `barstack-${strToId(this.cluster.key)}-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
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
  protected _stackWidth!: number;
  protected _stacksPerCluster!: number;
  protected _clusterWidth!: number;

  protected _addedToParent() {
    super._addedToParent();

    this._clusteredData = this._clusterData();
    const yValues = Object.values(this._clusteredData).flatMap(c =>
        Object.values(c.stacks).map(s => Object.values(s.bars)
            .map(item => item.value.value)
            .reduce((a, b) => a + b, 0)))
    this._axisInfo = new AxisInfo(this.paraview.store, {
      // xTiers: [this.paraview.store.model!.allFacetValues('x')!.map(x =>
      //   formatBox(x, 'barCluster', this.paraview.store))],
      xTiers: [Object.keys(this._clusteredData)],
      yValues: yValues,
      yMin: Math.min(0, Math.min(...yValues)),
      isXInterval: true,
      // manifest can override this
      isXVertical: this.paraview.store.type === 'bar'
    });

    const numSeries = this.paraview.store.model!.numSeries;
    if (this.settings.stackContent === 'all') {
      this._stacksPerCluster = 1;
    } else if (this.settings.stackContent === 'count') {
      const seriesPerStack = this.settings.stackCount;
      this._stacksPerCluster = Math.ceil(numSeries/seriesPerStack);
    }

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
      this._abbrevs = abbreviateSeries(this.paraview.store.model!.seriesKeys);
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['color.colorPalette', 'color.colorVisionMode'].includes(path)) {
      if (newValue === 'pattern' || (newValue !== 'pattern' && oldValue === 'pattern')
         || this.paraview.store.settings.color.colorPalette === 'pattern'){
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
      }
      // if (!super.settingDidChange(key, value)) {
      //   if (key === 'type.bar.stackContent') {
      //     //todo().controller.settingViews.setVisible('type.bar.stackCount', value === 'count');
      //   }
      //   //todo().controller.clearSettingManagers();
      //   this.paraview.createDocumentView();
      //   this.paraview.requestUpdate();
      //   return true;
      // }
    }

    super.settingDidChange(path, oldValue, newValue);
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

  get stackWidth() {
    return this._stackWidth;
  }

  get stacksPerCluster() {
    return this._stacksPerCluster;
  }

  get clusterWidth() {
    return this._clusterWidth;
  }

  protected _newDatapointView(seriesView: XYSeriesView, stack: BarStack) {
    return new Bar(seriesView, stack);
  }

  protected _clusterData() {
    const clusterMap: BarClusterMap = {};
    const xs = this.paraview.store.model!.series[0].datapoints.map(dp => dp.facetBox('x')!);

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

    const allSeries = [...this.paraview.store.model!.series];
    if (this.paraview.store.type === 'column') {
      // Place the series into stacks in the reverse order to how they appear in the
      // model (i.e., first series will be topmost onscreen in 'all' mode)
      allSeries.reverse();
    }
    for (const [series, i] of enumerate(allSeries)) {
      for (const [value, j] of enumerate(series.datapoints.map(dp => dp.facetBox('y')))) {
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
        stack!.bars[series.key] = {series: series.key, value: series.datapoints[j].facetBox('y') as Box<'number'>};
      }
    }
    return clusterMap;
  }

  protected _beginDatapointLayout() {
    // Datapoint layout depends on this happening first
    const numClusters = Object.values(this._clusteredData).length;
    // Assume all clusters have same number of stacks
    //const stacksPerCluster = Object.values(Object.values(this._clusteredData)[0].stacks).length;
    const clusterGapSpace = (numClusters - 1)*this.settings.clusterGap;
    const barGapSpace = (this._stacksPerCluster - 1)*this.settings.barGap*numClusters;
    // Initial stack width based on current chart width
    this._stackWidth = Math.max(this.settings.minBarWidth,
      (this._parent.logicalWidth - clusterGapSpace - barGapSpace)/(numClusters*this._stacksPerCluster));
    console.log('computed bar stack width:', this._stackWidth);
    //BarCluster.computeSize(this);
    //BarStack.computeSize(this);

    this._clusterWidth = this._stackWidth*this._stacksPerCluster + (this._stacksPerCluster - 1)*this.settings.barGap;

    //this._parent.logicalWidth = this._stackWidth*this._stacksPerCluster*numClusters + clusterGapSpace + barGapSpace;
    // Each cluster gets 1/2 a cluster gap on each side
    this._parent.logicalWidth = this._clusterWidth*numClusters + this.settings.clusterGap*numClusters;
    console.log('setting chart content width to', this._parent.logicalWidth);


    // for (const [clusterKey, cluster] of Object.entries(this._clusteredData)) {
    //   cluster.computeLayout();
    //   for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
    //     stack.computeLayout();
    //   }
    // }
    super._beginDatapointLayout();
  }

  protected _createDatapoints() {
    const seriesViews: {[key: string]: XYSeriesView} = {};
    Object.entries(this._clusteredData).forEach( ([clusterKey, cluster], i) => {
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        for (const [colName, item] of Object.entries(stack.bars)) {
          if (!seriesViews[colName]) {
            seriesViews[colName] = new XYSeriesView(this, colName);
            this._chartLandingView.append(seriesViews[colName]);
          }
          seriesViews[colName].append(this._newDatapointView(seriesViews[colName], stack));
        }
      }
    });
    if (this.paraview.store.type === 'column') {
      // First child of chart landing is bottom-most series, so we reverse them
      // so that navigation starts at the top
      this._chartLandingView.reverseChildren();
    }
  }

  protected _completeDatapointLayout() {
    super._completeDatapointLayout();
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
      return this.paraview.store.model!.seriesKeys.toSorted().map(key => ({
        label: key,
        color: this.paraview.store.seriesProperties!.properties(key).color
      }));
    }
  }

  // TODO: localize this text output
  // focused view: e.options!.focus
  // all visited datapoint views: e.options!.visited
  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor;

    if (queriedNode.isNodeType('top')) {
      msgArray.push(`Displaying Chart: ${this.paraview.store.title}`);
    } else if (queriedNode.isNodeType('series')) {
      /*
      if (e.options!.isChordMode) {
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      const seriesKey = queriedNode.options.seriesKey;
      const datapointCount = this.paraview.store.model!.atKey(seriesKey)!.length;
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {
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
      const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      msgArray.push(interpolate(
        queryMessages.datapointKeyLength,
        {
          seriesKey,
          datapointXY: formatXYDatapoint(visitedDatapoint.datapoint, 'raw'),
          datapointIndex: queriedNode.options.index + 1,
          datapointCount: this.paraview.store.model!.atKey(seriesKey)!.length
        }
      ));

      if (selectedDatapoints.length > 0) {
        // if there are selected datapoints, compare the current datapoint against each of those
        const selectedDatapointViews = selectedDatapoints.map((cursor) => cursor.datapointView);
        const selectionMsgArray = describeSelections(
          visitedDatapoint,
          selectedDatapointViews
        );
        msgArray.push(...selectionMsgArray);
      } else {
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        const datapointMsg = describeAdjacentDatapoints(this.paraview, visitedDatapoint);
        msgArray.push(datapointMsg);
      }

      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(
        this.paraview,
        visitedDatapoint.datapoint.facetValueAsNumber('y')!,
        seriesKey
      );
      msgArray.push(...minMaxMsgArray);
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
    const zeroHeight = this.chart.parent.logicalHeight - (this.chart.axisInfo!.yLabelInfo.max! * this.chart.parent.logicalHeight / this.chart.axisInfo!.yLabelInfo.range!);
    this._width = this.chart.stackWidth;
    // @ts-ignore
    this._height = Math.abs((this.datapoint.data.y.value as number)*pxPerYUnit);
    //this._x = this._stack.x + this._stack.cluster.x; // - this.width/2; // + BarCluster.width/2 - this.width/2;
    this._x = this.chart.settings.clusterGap/2
      + this.chart.clusterWidth*this._stack.cluster.index
      + this.chart.settings.clusterGap*this._stack.cluster.index
      + this.chart.stackWidth*this._stack.index
      + this.chart.settings.barGap*this._stack.index;
    // @ts-ignore
    this.datapoint.data.y.value as number < 0 ? this._y = this.chart.height - distFromXAxis - zeroHeight
      : this._y = this.chart.height - this.height - distFromXAxis - zeroHeight
  }

  completeLayout() {
    super.completeLayout();
    let textAnchor: LabelTextAnchor = 'middle';
    let angle = 0;
    if (this.chart.parent.orientation === 'east') {
      textAnchor = 'start';
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
        angle
      });
      this.append(this._recordLabel);
      this._recordLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.store.colors.contrastValueAt(this._isStyleEnabled ? this.index : this.parent.index)
      };
      this._recordLabel.centerX = this.centerX;
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
        angle
      });
      this.append(this._valueLabel);
      this._valueLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.store.colors.contrastValueAt(this._isStyleEnabled ? this.index : this.parent.index)
      };
      this._valueLabel.centerX = this.centerX;
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

  protected _createShapes() {
    const isPattern = this.paraview.store.colors.palette.isPattern;
    this._shapes.push(new RectShape(this.paraview, {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
      isPattern: isPattern ? true : false
    }));
    super._createShapes();
  }

  get selectedMarker() {
    return new RectShape(this.paraview, {
      width: this._width + 4,
      height: this._height + 4,
      x: this._x - 2,
      y: this._y - 2,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2,
      isClip: this.shouldClip
    });
  }

}
