/* ParaCharts: Bar Chart Plot Views
Copyright (C) 2025 Fizz Studio

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { formatBox } from '@fizz/chartsignal-internal';
import { getLogger } from '@fizz/logger';
import { type DataLayerContext } from '../../../view_context';
import { RectShape } from '../../../shape/rect';
import { Label } from '../../../label';
import { BarStack, BarChartInfo } from '../../../../chart_types/bar_chart';
import { formatDatapointValue, preciseAdd } from '../../../../common';
import { ConfigSetting } from '../../../../config/config_types';
import { PlanePlotView, PlaneSeriesView, PlaneDatapointView } from './plane_plot_view';
import { type BaseChartInfo } from '../../../../chart_types/base_chart';

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
  const abbrevMap: { [key: string]: string } = {};
  keys.forEach((k, i) => abbrevMap![k] = abbrevs[i]);
  return abbrevMap;
}

/**
 * Class for drawing bar charts.
 */
export class BarPlotView extends PlanePlotView {
  declare protected _chartInfo: BarChartInfo;
  protected _abbrevs?: { [series: string]: string };
  protected _totalLabels: Label[] = [];
  protected _numStacks!: number;
  protected _stackWidth!: number;
  protected _clusterWidth!: number;
  protected _availSpace!: number;

  protected _addedToParent() {
    super._addedToParent();
    if (this.paraview.paraState.config.type.bar.isAbbrevSeries) {
      this._abbrevs = abbreviateSeries(this.paraview.paraState.model!.seriesKeys);
    }
  }

  constructor(paraview: DataLayerContext,
    width: number,
    height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this.log = getLogger('BarPlotView');
  }

  // settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
  //   if (['legend.isAlwaysDrawLegend'].includes(path)) {
  //     this.paraview.createDocumentView();
  //     this.paraview.requestUpdate();
  //   }
  //   super.settingDidChange(path, oldValue, newValue);
  // }

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

  get isHorizontal() {
    return this.paraview.paraState.type === 'bar';
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

    this._numStacks = numClusters * this._chartInfo.stacksPerCluster;
    const stackAxisLength = this.isHorizontal ? this._height : this._width;
    const maxStackWidth = (stackAxisLength - numClusters * this._chartInfo.config.clusterGap) / this._numStacks;
    let gapWidth = 0;
    let stackWidth = Math.min(this._chartInfo.config.barWidth, maxStackWidth);
    stackWidth ||= maxStackWidth;
    if (this._chartInfo.config.barWidth) {
      gapWidth = maxStackWidth - stackWidth;
      this._stackWidth = stackWidth;
    } else if (stackWidth >= MIN_STACK_WIDTH_FOR_GAPS) {
      this._stackWidth = (1 - STACK_GAP_PERCENTAGE) * stackWidth;
      gapWidth = STACK_GAP_PERCENTAGE * stackWidth;
    } else {
      this._stackWidth = stackWidth;
    }

    // this._clusterWidth = this._stackWidth*this._chartInfo.stacksPerCluster
    //   + (this._chartInfo.stacksPerCluster - 1)*gapWidth;
    this._availSpace = gapWidth * this._numStacks;

    // const totalClusterGapSpace = numClusters*this._chartInfo.settings.clusterGap;
    // const totalBarGapSpace = (this._chartInfo.stacksPerCluster - 1)*this._chartInfo.settings.barGap*numClusters;
    // // Initial stack width based on current chart width
    // this._stackWidth = Math.max(0, //chartInfo.settings.minBarWidth,
    //   (this._width - totalClusterGapSpace - totalBarGapSpace)/(numClusters*this._chartInfo.stacksPerCluster));
    // this.log.info('computed bar stack width:', this._stackWidth, 'plot width:', this._width, totalClusterGapSpace, totalBarGapSpace);

    // this._clusterWidth = this._stackWidth*this._chartInfo.stacksPerCluster
    //   + (this._chartInfo.stacksPerCluster - 1)*this._chartInfo.settings.barGap;

    super._beginDatapointLayout();
  }

  protected _createDatapoints() {
    const chartInfo = this.paraview.paraState.chartInfo as BarChartInfo;
    const seriesViews: { [key: string]: PlaneSeriesView } = {};
    Object.entries(chartInfo.clusteredData).forEach(([clusterKey, cluster], i) => {
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
    if (this.paraview.paraState.type === 'column') {
      // First child of chart landing is bottom-most series, so we reverse them
      // so that navigation starts at the top
      this._chartLandingView.reverseChildren();
    }
  }

  protected _completeDatapointLayout() {
    super._completeDatapointLayout();
    if (this._chartInfo.config.stacking === 'standard' && this._chartInfo.config.isDrawTotalLabels) {
      this._totalLabels.forEach(label => {
        label.remove();
      });
      this._totalLabels = [];
      const seriesViews = this._chartLandingView.children;

      const angle = this.isHorizontal ? 0 : this.parent.orientation === 'east' ? -90 : 0;

      let i = 0;
      for (const [clusterKey, cluster] of Object.entries(this._chartInfo.clusteredData)) {
        for (const [stackKey, stack] of Object.entries(cluster.stacks)) {
          const bar0 = Object.values(stack.bars).at(-1)!;
          const seriesView = seriesViews.find(sv => sv.seriesKey === bar0.series)!;
          const barView = seriesView.children[i++];
          const sum = Object.values(stack.bars).map(barStackItem => {
            const seriesView = seriesViews.find(sv => sv.seriesKey === barStackItem.series)!;
            return seriesView.children[i - 1].datapoint;
          }).reduce((a, b) => preciseAdd(a, b.facetValueAsNumber("y")!), 0);
          this._totalLabels.push(new Label(this.paraview, {
            text: String(sum),
            classList: [`${this.paraview.paraState.type}-total-label`],
            // textAnchor,
            angle
          }));
          this.append(this._totalLabels.at(-1)!);
          const label = this._totalLabels.at(-1)!;
          if (this.isHorizontal) {
            if (sum < 0) {
              label.right = barView.left - this._chartInfo.config.totalLabelGap;
            } else {
              label.left = barView.right + this._chartInfo.config.totalLabelGap;
            }
            label.centerY = barView.centerY;
          } else {
            label.centerX = barView.centerX;
            label.bottom = barView.top - this._chartInfo.config.totalLabelGap;
          }
        }
      }
      // this._resizeToFitLabels();
    }
  }

  noticePosted(key: string, value: any): void {
    if (['animRevealStep', 'animRevealEnd'].includes(key)) {
      this._completeDatapointLayout();
    }
  }

  // protected _resizeToFitLabels() {
  //   const labels = Object.values(this.bars).flatMap(cluster =>
  //     Object.values(cluster.stacks)).map(stack => stack.label!);
  //   const minX = Math.min(...labels.map(label => label.left));
  //   if (minX < 0) {
  //     this._parent.logicalWidth += -minX;
  //     this.log.info('NEW WIDTH', this._width);
  //     this.datapointViews.forEach(dp => {
  //       dp.x += -minX;
  //     });
  //   }
  //   const maxX = Math.max(...labels.map(label => label.right));
  //   if (maxX > this._width) {
  //     const diff = maxX - this._width;
  //     this._parent.logicalWidth += diff;
  //     this.log.info('NEW WIDTH', this._width);
  //   }
  //   const minY = Math.min(...labels.map(label => label.top));
  //   if (minY < 0) {
  //     this._parent.logicalHeight += -minY;
  //     this.log.info('NEW HEIGHT', this._height);
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
  //     this.log.info('NEW HEIGHT', this._height);
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
    //this._width = 45; //BarStack.width; // this.paraview.paraState.settings.type.bar.barWidth;
    this._isStyleEnabled = this.paraview.paraState.config.type.bar.colorByDatapoint;
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

  // get styleInfo(): StyleInfo {
  //   const style = super.styleInfo;
  //   if (!this.paraview.paraState.isVisited(this.seriesKey, this.index)) {
  //     style.strokeWidth = 0;
  //   }
  //   return style;
  // }

  computeLocation() {
    const chartInfo = this.chart.chartInfo as BarChartInfo;
    const idealWidth = this.chart.stackWidth;
    const horizontal = this.chart.isHorizontal;
    this._width = horizontal ? 0 : idealWidth;
    this._height = horizontal ? idealWidth : 0;
    const barGap = this.chart.availSpace / this.chart.numStacks;
    const clusterGap = chartInfo.config.clusterGap;
    const stackPosition = clusterGap / 2 + barGap / 2
      + idealWidth * (chartInfo.stacksPerCluster * this._stack.cluster.index + this._stack.index)
      + clusterGap * this._stack.cluster.index
      + barGap * (chartInfo.stacksPerCluster * this._stack.cluster.index + this._stack.index);
    if (horizontal) {
      this._y = stackPosition;
    } else {
      this._x = stackPosition;
    }
    this._setValueGeometry(this.paraview.paraState.config.animation.isAnimationEnabled ? 0 : 1);
  }

  protected _setValueGeometry(progress: number) {
    const chartInfo = this.chart.chartInfo as BarChartInfo;
    const horizontal = this.chart.isHorizontal;
    const valueAxisLength = horizontal ? this.chart.width : this.chart.height;
    const orderIdx = Object.keys(this._stack.bars).indexOf(this.series.key);
    const numBars = Object.keys(this._stack.bars).length;
    const extra = (numBars - 1) * chartInfo.config.stackInsideGap;
    const delta = extra/numBars;
    const yRange = chartInfo.yRangeInfo!.interval.end - chartInfo.yRangeInfo!.interval.start;
    const pxPerYUnit = valueAxisLength / yRange;
    const distFromXAxis = Object.values(this._stack.bars).slice(0, orderIdx)
      .map(bar => bar.value.value * pxPerYUnit - delta)
      .reduce((a, b) => a + b, 0);
    const zeroOffset = valueAxisLength - (chartInfo.yRangeInfo!.interval.end * valueAxisLength / yRange);
    const value = this.datapoint.facetValueAsNumber('y')!;
    const barLength = progress === 0
      ? 0
      : Math.max(1, Math.abs(value * pxPerYUnit * progress) - delta);
    if (horizontal) {
      this._width = barLength;
      this._x = value < 0
        ? distFromXAxis * progress + zeroOffset - barLength
        : distFromXAxis * progress + zeroOffset + orderIdx * delta;
    } else {
      this._height = barLength;
      if (value < 0) {
        this._y = this.chart.height - distFromXAxis * progress - zeroOffset;
      } else {
        this._y = this.chart.height
          - this.height
          - distFromXAxis * progress
          - zeroOffset
          - orderIdx * chartInfo.config.stackInsideGap;
      }
    }
  }

  beginAnimStep(bezT: number, linearT: number): void {
    this._setValueGeometry(bezT);
    super.beginAnimStep(bezT, linearT);
  }

  completeLayout() {
    super.completeLayout();
    const chartInfo = this.chart.chartInfo as BarChartInfo;
//    let textAnchor: LabelTextAnchor = 'middle';
    const angle = this.chart.isHorizontal ? 0 : this.chart.parent.orientation === 'east' ? -90 : 0;
    if (chartInfo.config.isDrawRecordLabels) {
      this._recordLabel?.remove();
      this._recordLabel = new Label(this.paraview, {
        text: formatBox(this.datapoint.facetBox('x')!, this.paraview.paraState.getFormatType('pieSliceValue')),
        classList: [`${this.paraview.paraState.type}-label`],
//        textAnchor,
        angle
      });
      this.append(this._recordLabel);
      this._recordLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.paraState.colors.contrastValueAt(this._isStyleEnabled ? this.index : this.parent.index)
      };
      if (this.chart.isHorizontal) {
        this._recordLabel.left = this.chart.width - this._recordLabel.width - chartInfo.config.stackLabelGap;
        this._recordLabel.centerY = this.centerY;
      } else {
        this._recordLabel.centerX = this.centerX;
        this._recordLabel.y = this.chart.height - this._recordLabel.height - chartInfo.config.stackLabelGap;
      }
    }
    if (chartInfo.config.isDrawDataLabels) {
      this._dataLabel?.remove();
      this._dataLabel = new Label(this.paraview, {
        text: formatDatapointValue(this.datapoint, chartInfo.yRangeInfo!.interval.end - chartInfo.yRangeInfo!.interval.start, this.paraview.paraState.model!),
        //text: formatDataValue(this.datapoint.facetValueAsNumber('y')!, chartInfo.yInterval!.end - chartInfo.yInterval!.start),
        classList: [`${this.paraview.paraState.type}-label`],
     //   textAnchor,
        angle
      });
      this.append(this._dataLabel);
      this._dataLabel.styleInfo = {
        stroke: 'none',
        fill: this.paraview.paraState.colors.contrastValueAt(this._isStyleEnabled
          ? this.index
          : this.parent.index)
      };
      if (this.chart.isHorizontal) {
        this._dataLabel.centerY = this.centerY;
        if (chartInfo.config.dataLabelPosition === 'center') {
          this._dataLabel.centerX = this.centerX;
        } else if (chartInfo.config.dataLabelPosition === 'end') {
          this.datapoint.facetValueAsNumber('y')! < 0
            ? this._dataLabel.left = this.left
            : this._dataLabel.right = this.right;
        } else if (chartInfo.config.dataLabelPosition === 'base') {
          this.datapoint.facetValueAsNumber('y')! < 0
            ? this._dataLabel.left = this.right
            : this._dataLabel.right = this.left;
        } else {
          this.datapoint.facetValueAsNumber('y')! < 0
            ? this._dataLabel.right = this.left
            : this._dataLabel.left = this.right;
        }
      } else {
        this._dataLabel.centerX = this.centerX;
        if (chartInfo.config.dataLabelPosition === 'center') {
          this._dataLabel.centerY = this.centerY;
        } else if (chartInfo.config.dataLabelPosition === 'end') {
          this._dataLabel.top = this.top;
        } else if (chartInfo.config.dataLabelPosition === 'base') {
          this._dataLabel.bottom = this.bottom;
        } else {
          this._dataLabel.bottom = this.top;
        }
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
    const isPattern = this.paraview.paraState.colors.palette.isPattern;
    this._shapes.forEach(shape => {
      shape.remove();
    });
    this._shapes = [];
    this._shapes.push(new RectShape(this.paraview, {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
      isPattern: isPattern ? true : false,
      pointerEnter: (e) => {
        this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined;
      },
      pointerMove: (e) => {
        this.shouldAddHoverPopup() ? this.movePopupAction() : undefined;
      },
      pointerLeave: (e) => {
        this.chart.removeDatapointPopup(this);
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
}
