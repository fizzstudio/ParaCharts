/* ParaCharts: Waterfall Chart Plot Views
Copyright (C) 2025 Fizz Studios

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

import { type ParaView } from '../../../../paraview';
import { type BaseChartInfo } from '../../../../chart_types';
import { Label } from '../../../label';

import { WaterfallChartInfo } from '../../../../chart_types/waterfall_chart';
import { PlanePlotView, PlaneSeriesView, PlaneDatapointView } from './plane_plot_view';
import { RectShape, PathShape } from '../../../shape';

import { StyleInfo } from 'lit/directives/style-map.js';
import { formatXYDatapointY } from '@fizz/parasummary';
import { Vec2 } from '../../../../common';

const MIN_BAR_WIDTH_FOR_GAPS = 8;
const BAR_GAP_PERCENTAGE = 0.25;

export class WaterfallPlotView extends PlanePlotView {
  declare protected _chartInfo: WaterfallChartInfo;

  protected _numBars!: number;
  protected _barWidth!: number;
  protected _availSpace!: number;

  constructor(
    paraview: ParaView,
    width: number, height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  get numBars() {
    return this._numBars;
  }

  get barWidth() {
    return this._barWidth;
  }

  get availSpace() {
    return this._availSpace;
  }

  protected _beginDatapointLayout() {
    // Each bar is surrounded by 1/2 `barGap` on each side; so the first
    // bar will have 1/2 `barGap` on its left, ditto for the last bar
    // on its right, and each bar is separated by `barGap`
    this._numBars = this.paraview.store.model!.series[0].length;
    let maxBarWidth = this._width / this._numBars;
    let gapWidth = 0;
    if (maxBarWidth >= MIN_BAR_WIDTH_FOR_GAPS) {
      this._barWidth = (1 - BAR_GAP_PERCENTAGE) * maxBarWidth;
      gapWidth = BAR_GAP_PERCENTAGE * maxBarWidth;
    } else {
      this._barWidth = maxBarWidth;
    }
    this._availSpace = gapWidth * this._numBars;

    super._beginDatapointLayout();
  }

  protected _createDatapoints() {
    const seriesView: PlaneSeriesView = new PlaneSeriesView(this, this.paraview.store.model!.seriesKeys[0]);
    this._chartLandingView.append(seriesView);
    this.paraview.store.model!.series[0].datapoints.forEach((_dp, i) => {
      seriesView.append(new WaterfallBarView(seriesView, i));
    });
  }
}

/**
 *
 */
export class WaterfallBarView extends PlaneDatapointView {
  declare readonly chart: WaterfallPlotView;
  declare protected _parent: PlaneSeriesView;

  protected _label: Label | null = null;

  constructor(seriesView: PlaneSeriesView, protected _index: number) {
    super(seriesView);
    this._isStyleEnabled = true;
  }

  get classInfo() {
    return { 'bar': true, ...super.classInfo };
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    if (this._label) {
      this._label.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._label) {
      this._label.y += y - this._y;
    }
    super.y = y;
  }

  get label() {
    return this._label;
  }

  set label(label: Label | null) {
    this._label = label;
  }

  get _selectedMarkerX() {
    return this._x;
  }

  get _selectedMarkerY() {
    return this._y;
  }

  protected _updateStyleInfo(styleInfo: StyleInfo) {
    let colorValue: string;
    const palIdx = this.paraview.store.colors.indexOfPalette('semantic');
    const pal = this.paraview.store.colors.palettes[palIdx];
    if (this.index && !this.isLast) {
      colorValue = this.datapoint.facetValueAsNumber('y')! >= 0
        ? pal.colors[0].value
        : pal.colors[1].value
    } else {
      colorValue = pal.colors[2].value;
    }
    // let colorValue = this.chart.paraview.store.colors.colorValueAt(this.color);
    styleInfo.fill = colorValue;
    //styleInfo.stroke = colorValue;
    //styleInfo.strokeWidth = this.paraview.store.settings.chart.strokeWidth;
  }

  computeLocation() {
    const idealWidth = this.chart.barWidth;
    this._width = this.chart.barWidth;
    if (this.paraview.store.settings.animation.isAnimationEnabled) {
      this._height = 0;
      this._y = 0;
    } else {
      this.beginAnimStep(1, 1);
    }
    const barGap = this.chart.availSpace / this.chart.numBars;
    this._x = barGap / 2 + idealWidth * this._index + barGap * this._index;
  }

  beginAnimStep(bezT: number, linearT: number): void {
    const yRange = this.chart.chartInfo.yInterval!.end - this.chart.chartInfo.yInterval!.start;
    const pxPerYUnit = this.chart.parent.logicalHeight / yRange;
    const zeroHeight = this.chart.parent.logicalHeight
      - (this.chart.chartInfo.yInterval!.end * pxPerYUnit);
    this._height = Math.abs(this.datapoint.facetValueAsNumber('y')! * pxPerYUnit * bezT);

    if (this.index) {
      if (this.isLast) {
        const total = this._parent.children.slice(0, -1)
          .map(view => view.datapoint.facetValueAsNumber('y')!)
          .reduce((a, b) => a + b);
        this._height = Math.abs(total * bezT * pxPerYUnit);
        this._y = total >= 0
          ? this.chart.height - this._height - zeroHeight
          : this.chart.height - zeroHeight;
      } else {
        const prev = this._prev! as WaterfallBarView;
        if (prev.datapoint.facetValueAsNumber('y')! >= 0) {
          if (this.datapoint.facetValueAsNumber('y')! >= 0) {
            this._y = prev.y - this._height;
          } else {
            this._y = prev.y;
          }
        } else {
          if (this.datapoint.facetValueAsNumber('y')! >= 0) {
            this._y = prev.y + prev.height - this._height;
          } else {
            this._y = prev.y + prev.height;
          }
        }
      }
    } else {
      if (this.datapoint.facetValueAsNumber('y')! < 0) {
        this._y = this.chart.height - zeroHeight;
      } else {
        this._y = this.chart.height - this.height - zeroHeight;
      }
    }

    super.beginAnimStep(bezT, linearT);
  }

  completeLayout() {
    super.completeLayout();
    const total = this._parent.children.slice(0, -1)
      .map(view => view.datapoint.facetValueAsNumber('y')!)
      .reduce((a, b) => a + b);
    const text = this.isLast
      // XXX needs formatting
      ? total.toString()
      : formatXYDatapointY(this.datapoint, 'raw');
    if (this.chart.chartInfo.settings.isDrawLabels) {
      this._label?.remove();
      this._label = new Label(this.paraview, {
        text,
        id: this._id + '-blb',
        classList: [`${this.paraview.store.type}-label`],
        role: 'datapoint',
      });
      this.append(this._label);
      this._label.centerX = this.centerX;
      if (this.chart.chartInfo.settings.labelPosition === 'center') {
        this._label.centerY = this.centerY;
      } else if (this.chart.chartInfo.settings.labelPosition === 'end') {
        this._label.top = this.top;
      } else if (this.chart.chartInfo.settings.labelPosition === 'base') {
        this._label.bottom = this.bottom;
      } else if (this.isLast) {
        if (total >= 0) {
          this._label.bottom = this.top - this.chart.chartInfo.settings.barLabelGap;
        } else {
          this._label.top = this.bottom + this.chart.chartInfo.settings.barLabelGap;
        }
      } else if (this.datapoint.facetValueAsNumber('y')! >= 0) {
        // outside top
        this._label.bottom = this.top - this.chart.chartInfo.settings.barLabelGap;
      } else {
        // outside bottom
        this._label.top = this.bottom + this.chart.chartInfo.settings.barLabelGap;
      }
      if (this.chart.chartInfo.settings.labelPosition !== 'outside') {
        const palIdx = this.paraview.store.colors.indexOfPalette('semantic');
        const pal = this.paraview.store.colors.palettes[palIdx];

        this._label.styleInfo = {
          stroke: 'none',
          // XXX hack bc all semantic colors have same contrast value
          fill: pal.colors[0].contrastValue
        };
      }
    }
  }

  protected _createSymbol() {
  }

  protected _createShapes() {
    const isPattern = this.paraview.store.colors.palette.isPattern;
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
        this.paraview.store.settings.chart.isShowPopups ? this.addDatapointPopup() : undefined
      },
      pointerMove: (e) => {
        this.movePopupAction()
      },
      pointerLeave: (e) => {
        this.paraview.store.settings.chart.isShowPopups ? this.paraview.store.removePopup(this.id) : undefined
      },
    }));
    if (this.index) {
      const barGap = this.chart.availSpace / this.chart.numBars;
      const tailY = this.datapoint.facetValueAsNumber('y')! >= 0 && !this.isLast
        ? this._height
        : 0;
      this._shapes.push(new PathShape(this.paraview, {
        x: this._x,
        y: this._y,
        points: [new Vec2(0, tailY), new Vec2(-barGap, tailY)],
      }));
    }
    super._createShapes();
  }

  protected _shapeStyleInfo(shapeIndex: number) {
    if (shapeIndex === 1) {
      return {
        stroke: 'black',
        strokeWidth: 2,
        strokeDasharray: '2'
      }
    } else {
      return super._shapeStyleInfo(shapeIndex);
    }
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
