
import { PlanePlotView, PlaneDatapointView, PlaneSeriesView } from '.';
import {
  Setting
} from '../../../../store/settings_types';
import { RectShape } from '../../../shape/rect';
import { Label, LabelTextAnchor } from '../../../label';
import { BarStack } from '../../../../chart_types/bar_chart';

import { formatBox, formatXYDatapoint } from '@fizz/parasummary';

import { StyleInfo } from 'lit/directives/style-map.js';
import { BarChartInfo } from '../../../../chart_types/bar_chart';


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
export class BarPlotView extends PlanePlotView {

  protected _abbrevs?: {[series: string]: string};
  protected _stackLabels: Label[] = [];
  protected _stackWidth!: number;
  protected _clusterWidth!: number;

  protected _addedToParent() {
    super._addedToParent();

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

  get abbrevs() {
    return this._abbrevs;
  }

  get stackWidth() {
    return this._stackWidth;
  }

  get clusterWidth() {
    return this._clusterWidth;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView, stack: BarStack) {
    return new Bar(seriesView, stack);
  }

  protected _beginDatapointLayout() {
    const chartInfo = this._parent.docView.chartInfo as BarChartInfo;
    // Datapoint layout depends on this happening first
    const numClusters = Object.values(chartInfo.clusteredData).length;
    // Assume all clusters have same number of stacks
    //const stacksPerCluster = Object.values(Object.values(this._clusteredData)[0].stacks).length;
    // Each cluster is surrounded by 1/2 `clusterGap` on each side; so the first
    // cluster will have 1/2 `clusterGap` on its left, ditto for the last cluster
    // on its right, and each cluster is separated by `clusterGap`
    const totalClusterGapSpace = numClusters*chartInfo.settings.clusterGap;
    const totalBarGapSpace = (chartInfo.stacksPerCluster - 1)*chartInfo.settings.barGap*numClusters;
    // Initial stack width based on current chart width
    this._stackWidth = Math.max(0, //chartInfo.settings.minBarWidth,
      (this._width - totalClusterGapSpace - totalBarGapSpace)/(numClusters*chartInfo.stacksPerCluster));
    console.log('computed bar stack width:', this._stackWidth, 'plot width:', this._width, totalClusterGapSpace, totalBarGapSpace);
    //BarCluster.computeSize(this);
    //BarStack.computeSize(this);

    this._clusterWidth = this._stackWidth*chartInfo.stacksPerCluster
      + (chartInfo.stacksPerCluster - 1)*chartInfo.settings.barGap;

    //this._parent.logicalWidth = this._stackWidth*this._stacksPerCluster*numClusters + clusterGapSpace + barGapSpace;
    // Each cluster gets 1/2 a cluster gap on each side
//    this._parent.logicalWidth = this._clusterWidth*numClusters + chartInfo.settings.clusterGap*numClusters;
//    console.log('setting chart content width to', this._parent.logicalWidth);


    // for (const [clusterKey, cluster] of Object.entries(this._clusteredData)) {
    //   cluster.computeLayout();
    //   for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
    //     stack.computeLayout();
    //   }
    // }
    super._beginDatapointLayout();
  }

  protected _createDatapoints() {
    const chartInfo = this._parent.docView.chartInfo as BarChartInfo;
    const seriesViews: {[key: string]: PlaneSeriesView} = {};
    Object.entries(chartInfo.clusteredData).forEach( ([clusterKey, cluster], i) => {
      for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
        for (const [colName, item] of Object.entries(stack.bars)) {
          if (!seriesViews[colName]) {
            seriesViews[colName] = new PlaneSeriesView(this, colName);
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

}

/**
 * Visual representation of a bar chart bar.
 */
export class Bar extends PlaneDatapointView {

  declare readonly chart: BarPlotView;
  declare protected _parent: PlaneSeriesView;

  protected _recordLabel: Label | null = null;
  protected _valueLabel: Label | null = null;

  constructor(
    seriesView: PlaneSeriesView,
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
    const chartInfo = this.chart.parent.docView.chartInfo as BarChartInfo;
    const orderIdx = Object.keys(this._stack.bars).indexOf(this.series.key);
    const pxPerYUnit = this.chart.parent.logicalHeight/chartInfo.axisInfo!.yLabelInfo.range!;
    const distFromXAxis = Object.values(this._stack.bars).slice(0, orderIdx)
      .map(bar => bar.value.value*pxPerYUnit)
      .reduce((a, b) => a + b, 0);
    const zeroHeight = this.chart.parent.logicalHeight
      - (chartInfo.axisInfo!.yLabelInfo.max! * this.chart.parent.logicalHeight / chartInfo.axisInfo!.yLabelInfo.range!);
    this._width = this.chart.stackWidth;
    // @ts-ignore
    this._height = Math.abs((this.datapoint.data.y.value as number)*pxPerYUnit);
    //this._x = this._stack.x + this._stack.cluster.x; // - this.width/2; // + BarCluster.width/2 - this.width/2;
    this._x = chartInfo.settings.clusterGap/2
      + this.chart.clusterWidth*this._stack.cluster.index
      + chartInfo.settings.clusterGap*this._stack.cluster.index
      + this.chart.stackWidth*this._stack.index
      + chartInfo.settings.barGap*this._stack.index;
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
