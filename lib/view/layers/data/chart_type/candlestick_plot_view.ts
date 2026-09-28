/* ParaCharts: Candlestick Charts
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

import { type StyleInfo } from 'lit/directives/style-map.js';
import { PathShape } from '../../../shape/path';
import { Vec2 } from '../../../../common/vector';
import { bboxOfBboxes } from '../../../../common/utils';
import { type ConfigSetting } from '../../../../config/config_types';
import { PointDatapointView, PointPlotView, type PointSeriesView } from './point_plot_view';
import { Datapoint } from '@fizz/chartsignal-internal';
import { SeriesView } from '../../../data';
import { RectShape } from '../../../shape';

/**
 * Class for drawing candlestick charts.
 * @public
 */
export class CandlestickPlotView extends PointPlotView {

  get datapointViews() {
    return super.datapointViews as CandlestickPart[];
  }

  updateSeriesStyle(styleInfo: StyleInfo) {
    super.updateSeriesStyle(styleInfo);
    styleInfo.strokeWidth = this.effectiveLineWidth;
  }

  get effectiveLineWidth() {
    return this.paraview.paraState.config.ui.isLowVisionModeEnabled
      ? this.paraview.paraState.config.type.line.lowVisionLineWidth
      : this.paraview.paraState.config.type.line.lineWidth;
  }

  get effectiveVisitedScale() {
    return this.paraview.paraState.config.ui.isLowVisionModeEnabled
      ? 1
      : this.paraview.paraState.config.type.line.lineHighlightScale;
  }

  get visitedStrokeWidth(): number {
    return this.effectiveLineWidth * this.effectiveVisitedScale;
  }

  protected _newDatapointView(seriesView: PointSeriesView, datapoints: Datapoint[]) {
    return new CandlestickPart(seriesView, datapoints);
  }

  pointerMove(): void {
    const coords = this.paraview.paraState.pointerCoords;
    if (this.paraview.paraState.config.chart.isShowPopups
      && this.paraview.paraState.config.popup.activation === "onHover"
      && !this.paraview.paraState.config.ui.isTourGuideEnabled
    ) {
      if (coords.x > 0 && coords.x < this.width && coords.y > 0 && coords.y < this.height) {
        let points = this.datapointViews
        let distances = points.map((dp, i) => [Number(Math.abs((dp.x - coords.x) ** 2)), i]).sort((a, b) => a[0] - b[0])
        let nearestPoint = points[distances[0][1]]
        if (nearestPoint.cousins.length > 0) {
          nearestPoint = nearestPoint.withCousins.sort((a, b) => Math.abs(a.y - coords.y) - Math.abs(b.y - coords.y))[0]
        }
        this.paraview.paraState.clearPopups()
        nearestPoint.addDatapointPopup()
      }
    }
    super.pointerMove()
  }
}

/**
 * A visual representation of a portion of a candlestick chart "candle".
 */
export class CandlestickPart extends PointDatapointView {
  declare readonly chart: CandlestickPlotView;

  protected _datapointValues: Record<string, number>;

  constructor(seriesView: SeriesView, protected _datapoints: Datapoint[]) {
    super(seriesView);
    this._datapointValues = {};
    _datapoints.forEach(dp => {
      this._datapointValues[dp.seriesKey] = this._computeDatapointY(dp);
    });
  }

  get width() {
    const axisDivisions = this.paraview.paraState.model!.series[0].length;
    return this.chart.width / axisDivisions;
  }

  get height() {
    if (this._series.key === 'open' || this._series.key === 'close') {
      return (this.bottom - this.top)/2;
    } else if (this._series.key === 'high') {
      return this.top - this._y;
    } else if (this._series.key === 'low') {
      return this._y - this.bottom;
    } else {
      throw new Error(`invalid candlestick series key '${this._series.key}'`);
    }
  }

  get outerBbox() {
    const shapeOuters = this._shapes.map(shape => shape.outerBbox);
    return this._symbol
      ? bboxOfBboxes(...shapeOuters, this._symbol!.outerBbox)
      : bboxOfBboxes(...shapeOuters);
  }

  get top(): number {
    return Math.min(this._datapointValues.open, this._datapointValues.close);
  }

  get bottom(): number {
    return Math.max(this._datapointValues.open, this._datapointValues.close);
  }

  get isGreen(): boolean {
      return this._datapointValues.open >= this._datapointValues.close;
  }

  get datapointValues(): Record<string, number> {
    return this._datapointValues;
  }

  computeX() {
    return this.width * this.index + this.width/2;
  }

  get classInfo() {
    const ret: Record<string, any> = {
      'candlestick': true,
      ...super.classInfo
    };
    // NB: _datapointValues contains screen y-values
    if (this._datapointValues.open > this._datapointValues.close) {
      ret['bullish'] = true;
    } else {
      ret['bearish'] = true;
    }
    if (this.paraview.paraState.config.type.candlestick.isHollow) {
      ret['hollow'] = true;
      if (!this._prev || this._datapointValues.close <= this._prev.datapointValues.close) {
        ret['rising'] = true;
      } else {
        ret['falling'] = true;
      }
    }
    return ret;
  }

  protected _createSymbol() {
  }

  protected _createShapes() {
    // If datapoints are laid out again after the initial layout,
    // we need to replace the original shape
    this._shapes.forEach(shape => {
      shape.remove();
    });
    this._shapes = [];

    if (this._series.key === 'open') {
      if (this.isGreen) {
        this._shapes.push(
          new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [
              new Vec2(-this._width/4, -this.height),
              new Vec2(-this._width/4, 0),
              new Vec2(this._width/4, 0),
              new Vec2(this._width/4, -this.height),
            ],
            isClip: true
          }),
        );
      } else {
        this._shapes.push(
          new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [
              new Vec2(-this._width/4, this.height),
              new Vec2(-this._width/4, 0),
              new Vec2(this._width/4, 0),
              new Vec2(this._width/4, this.height),
            ],
            isClip: true
          }),
        );
      }
    } else if (this._series.key === 'close') {
      if (this.isGreen) {
        this._shapes.push(
          new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [
              new Vec2(-this._width/4, this.height),
              new Vec2(-this._width/4, 0),
              new Vec2(this._width/4, 0),
              new Vec2(this._width/4, this.height),
            ],
            isClip: true
          }),
        );
      } else {
        this._shapes.push(
          new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [
              new Vec2(-this._width/4, -this.height),
              new Vec2(-this._width/4, 0),
              new Vec2(this._width/4, 0),
              new Vec2(this._width/4, -this.height),
            ],
            isClip: true
          }),
        );
      }
    } else if (this._series.key === 'high') {
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: [new Vec2(), new Vec2(0, this.height)],
          isClip: true
        }),
      );
    } else if (this._series.key === 'low') {
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: [new Vec2(), new Vec2(0, -this.height)],
          isClip: true
        }),
      );
    } else {
      throw new Error(`invalid candlestick series key '${this._series.key}'`);
    }

    this._shapes.forEach(shape => {
      (shape as PathShape).isClip = this.shouldClip;
    })
    super._createShapes();
  }

  get selectedMarker() {
    // let y = this._y;
    // if (this._series.key === 'open') {
    //   if (this.isGreen) {
    //     y -= this.height;
    //   } else {

    //   }
    // } else if (this._series.key === 'close') {
    //   if (this.isGreen) {

    //   } else {
    //     y -= this.height;
    //   }
    // } else if (this._series.key === 'high') {

    // } else if (this._series.key === 'low') {
    //   y -= this.height;
    // } else {
    //   throw new Error(`invalid candlestick series key '${this._series.key}'`);
    // }
    return new RectShape(this.paraview, {
      width: this._width,
      height: this._datapointValues.low - this._datapointValues.high, // this.height
      x: this._x - this._width/2,
      y: this._datapointValues.high, // y,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2,
      isClip: this.shouldClip
    });
  }
}

