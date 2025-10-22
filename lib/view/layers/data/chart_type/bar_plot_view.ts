
import { PlanePlotView, PlaneDatapointView, PlaneSeriesView } from '.';
import {
  Setting, DeepReadonly, BarSettings
} from '../../../../store/settings_types';
import { RectShape } from '../../../shape/rect';
import { Label, LabelTextAnchor } from '../../../label';
import { BarStack } from '../../../../chart_types/bar_chart';

import { formatBox, formatXYDatapoint } from '@fizz/parasummary';

import { StyleInfo } from 'lit/directives/style-map.js';
import { BarChartInfo } from '../../../../chart_types/bar_chart';
import { Popup } from '../../../popup';

const MIN_STACK_WIDTH_FOR_GAPS = 8;
const STACK_GAP_PERCENTAGE = 0.125;

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
  declare protected _chartInfo: BarChartInfo;

  protected _abbrevs?: {[series: string]: string};
  protected _totalLabels: Label[] = [];
  protected _numStacks!: number;
  protected _stackWidth!: number;
  protected _clusterWidth!: number;
  protected _availSpace!: number;

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

    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'chart.showPopups',
      label: 'Show popups',
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['color.colorPalette', 'color.colorVisionMode', 'chart.showPopups'].includes(path)) {
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

  get numStacks() {
    return this._numStacks;
  }

  get stackWidth() {
    return this._stackWidth;
  }

  get clusterWidth() {
    return this._clusterWidth;
  }

  get availSpace() {
    return this._availSpace;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView, stack: BarStack) {
    return new Bar(seriesView, stack);
  }

  protected _beginDatapointLayout() {
    // Datapoint layout depends on this happening first
    const numClusters = Object.values(this._chartInfo.clusteredData).length;
    // Assume all clusters have same number of stacks
    //const stacksPerCluster = Object.values(Object.values(this._clusteredData)[0].stacks).length;
    // Each cluster is surrounded by 1/2 `clusterGap` on each side; so the first
    // cluster will have 1/2 `clusterGap` on its left, ditto for the last cluster
    // on its right, and each cluster is separated by `clusterGap`

    this._numStacks = numClusters*this._chartInfo.stacksPerCluster;
    let maxStackWidth = (this._width - numClusters*this._chartInfo.settings.clusterGap)/this._numStacks;
    let gapWidth = 0;
    if (maxStackWidth >= MIN_STACK_WIDTH_FOR_GAPS) {
      this._stackWidth = (1 - STACK_GAP_PERCENTAGE)*maxStackWidth;
      gapWidth = STACK_GAP_PERCENTAGE*maxStackWidth;
    } else {
      this._stackWidth = maxStackWidth;
    }
    // this._clusterWidth = this._stackWidth*this._chartInfo.stacksPerCluster
    //   + (this._chartInfo.stacksPerCluster - 1)*gapWidth;
    this._availSpace = gapWidth*this._numStacks;

    // const totalClusterGapSpace = numClusters*this._chartInfo.settings.clusterGap;
    // const totalBarGapSpace = (this._chartInfo.stacksPerCluster - 1)*this._chartInfo.settings.barGap*numClusters;
    // // Initial stack width based on current chart width
    // this._stackWidth = Math.max(0, //chartInfo.settings.minBarWidth,
    //   (this._width - totalClusterGapSpace - totalBarGapSpace)/(numClusters*this._chartInfo.stacksPerCluster));
    // console.log('computed bar stack width:', this._stackWidth, 'plot width:', this._width, totalClusterGapSpace, totalBarGapSpace);

    // this._clusterWidth = this._stackWidth*this._chartInfo.stacksPerCluster
    //   + (this._chartInfo.stacksPerCluster - 1)*this._chartInfo.settings.barGap;

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
    if (this._chartInfo.settings.stacking === 'standard' && this._chartInfo.settings.isDrawTotalLabels) {
      this._totalLabels.forEach(label => {
        label.remove();
      });
      this._totalLabels = [];
      const seriesViews = this._chartLandingView.children;

      let angle = 0;
      if (this.parent.orientation === 'east') {
        //textAnchor = 'start';
        angle = -90;
      }

      let i = 0;
      for (const [clusterKey, cluster] of Object.entries(this._chartInfo.clusteredData)) {
        for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
          const bar0 = Object.values(stack.bars).at(-1)!;
          const seriesView = seriesViews.find(sv => sv.seriesKey === bar0.series)!;
          const barView = seriesView.children[i++];
          const sum = Object.values(stack.bars).map(barStackItem => {
            const seriesView = seriesViews.find(sv => sv.seriesKey === barStackItem.series)!;
            return seriesView.children[i - 1].datapoint;
          }).reduce((a, b) => a + b.facetValueAsNumber('y')!, 0);

          this._totalLabels.push(new Label(this.paraview, {
            // XXX hack
            text: sum.toFixed(2),
            id: this._id + '-slb',
            classList: [`${this.paraview.store.type}-total-label`],
            role: 'datapoint',
            // textAnchor,
            angle
          }));
          this.append(this._totalLabels.at(-1)!);
          this._totalLabels.at(-1)!.centerX = barView.centerX;
          this._totalLabels.at(-1)!.bottom = barView.top;
        }
      }
      // this._resizeToFitLabels();
    }
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
  protected _dataLabel: Label | null = null;

  constructor(
    seriesView: PlaneSeriesView,
    protected _stack: BarStack
  ) {
    super(seriesView);
    //this._width = 45; //BarStack.width; // this.paraview.store.settings.type.bar.barWidth;
    this._isStyleEnabled = this.paraview.store.settings.type.bar.colorByDatapoint;
  }

  get classInfo() {
    return { 'bar': true, ...super.classInfo };
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    if (this._dataLabel) {
      this._dataLabel.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._dataLabel) {
      this._dataLabel.y += y - this._y;
    }
    super.y = y;
  }

  get recordLabel() {
    return this._recordLabel;
  }

  set recordLabel(label: Label | null) {
    this._recordLabel = label;
  }

  get dataLabel() {
    return this._dataLabel;
  }

  set dataLabel(label: Label | null) {
    this._dataLabel = label;
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
    const chartInfo = this.chart.chartInfo as BarChartInfo;
    const orderIdx = Object.keys(this._stack.bars).indexOf(this.series.key);
    const pxPerYUnit = this.chart.parent.logicalHeight/chartInfo.axisInfo!.yLabelInfo.range!;
    const distFromXAxis = Object.values(this._stack.bars).slice(0, orderIdx)
      // .map(bar => bar.value.value*pxPerYUnit + chartInfo.settings.stackInsideGap)
      .map(bar => bar.value.value*pxPerYUnit)
      .reduce((a, b) => a + b, 0);
    const zeroHeight = this.chart.parent.logicalHeight
      - (chartInfo.axisInfo!.yLabelInfo.max! * this.chart.parent.logicalHeight / chartInfo.axisInfo!.yLabelInfo.range!);

    const idealWidth = this.chart.stackWidth;
    this._width = this.chart.stackWidth;
    // @ts-ignore
    this._height = Math.abs((this.datapoint.data.y.value as number)*pxPerYUnit);
    //this._x = this._stack.x + this._stack.cluster.x; // - this.width/2; // + BarCluster.width/2 - this.width/2;

    // const clusterGap = Math.min(chartInfo.settings.clusterGap, this.chart.stackGap);
    // const barGap = Math.min(chartInfo.settings.barGap, this.chart.availSpace/this.chart.numStacks);
    const barGap = this.chart.availSpace/this.chart.numStacks;
    const clusterGap = chartInfo.settings.clusterGap;
    // XXX this seems slightly off
    this._x = clusterGap/2 + barGap/2
      + idealWidth*(chartInfo.stacksPerCluster*this._stack.cluster.index + this._stack.index)
      + clusterGap*this._stack.cluster.index
      + barGap*(chartInfo.stacksPerCluster*this._stack.cluster.index + this._stack.index);
    // @ts-ignore
    this._y = this.datapoint.data.y.value as number < 0
      ? this.chart.height - distFromXAxis - zeroHeight
      : this.chart.height - this.height - distFromXAxis - zeroHeight;
  }

  completeLayout() {
    super.completeLayout();
    const chartInfo = this.chart.chartInfo as BarChartInfo;
    let textAnchor: LabelTextAnchor = 'middle';
    let angle = 0;
    if (this.chart.parent.orientation === 'east') {
      textAnchor = 'start';
      angle = -90;
    }
    if (chartInfo.settings.isDrawRecordLabels) {
      this._recordLabel = new Label(this.paraview, {
        // @ts-ignore
        text: formatBox(this.datapoint.data.x, this.paraview.store.getFormatType('pieSliceValue')),
        id: this._id + '-rlb',
        classList: [`${this.paraview.store.type}-label`],
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
      this._recordLabel.y = this.chart.height - this._recordLabel.height - chartInfo.settings.stackLabelGap;
    }
    if (chartInfo.settings.isDrawDataLabels) {
      this._dataLabel = new Label(this.paraview, {
        // @ts-ignore
        text: formatBox(this.datapoint.data.y, this.paraview.store.getFormatType('pieSliceValue')),
        id: this._id + '-blb',
        classList: [`${this.paraview.store.type}-label`],
        role: 'datapoint',
        textAnchor,
        angle
      });
      this.append(this._dataLabel);
      this._dataLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.store.colors.contrastValueAt(this._isStyleEnabled
          ? this.index
          : this.parent.index)
      };
      this._dataLabel.centerX = this.centerX;
      if (chartInfo.settings.dataLabelPosition === 'center') {
        this._dataLabel.centerY = this.centerY;
      } else if (chartInfo.settings.dataLabelPosition === 'end') {
        this._dataLabel.top = this.top;
      } else if (chartInfo.settings.dataLabelPosition === 'base') {
        this._dataLabel.bottom = this.bottom;
      } else {
        this._dataLabel.bottom = this.top;
      }
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
      isPattern: isPattern ? true : false,
      pointerEnter: (e) => {
        this.paraview.store.settings.chart.showPopups ? this.addPopup() : undefined
      },
      pointerLeave: (e) => {
        this.paraview.store.settings.chart.showPopups ? this.removePopup(this.id) : undefined
      },
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


  addPopup(text?: string) {
    let datapointText = `${this.seriesKey} ${this.index + 1}/${this.series.datapoints.length}: ${this.chart.chartInfo.summarizer.getDatapointSummary(this.datapoint, 'statusBar')}`
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: this.x + this.width / 2,
        y: this.y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: this.id,
        color: this.color
      },
      {})
    this.paraview.store.popups.push(popup)
  }

  removePopup(id: string) {
   this.paraview.store.popups.splice(this.paraview.store.popups.findIndex(p => p.id === id), 1)
   this.paraview.requestUpdate()
  }

}
