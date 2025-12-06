/* ParaCharts: Line Charts
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

import { PlaneSeriesView, PointPlotView, PointDatapointView } from '.';
import { type LineSettings, type DeepReadonly, type Setting } from '../../../../store/settings_types';
import { PathShape } from '../../../shape/path';
import { Vec2 } from '../../../../common/vector';
import { bboxOfBboxes, isPointerInbounds } from '../../../../common/utils';

import { type StyleInfo } from 'lit/directives/style-map.js';
import { RectShape } from '../../../shape';
import { Popup } from '../../../popup';
import { DataSymbol } from '../../../symbol';

/**
 * Class for drawing line charts.
 * @public
 */
export class LinePlotView extends PointPlotView {

  get datapointViews() {
    return super.datapointViews as LineSection[];
  }

  get settings() {
    return super.settings as DeepReadonly<LineSettings>;
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['chart.hasDirectLabels'].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  updateSeriesStyle(styleInfo: StyleInfo) {
    super.updateSeriesStyle(styleInfo);
    styleInfo.strokeWidth = this.effectiveLineWidth;
  }

  get effectiveLineWidth() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? this.paraview.store.settings.type.line.lowVisionLineWidth
      : this.paraview.store.settings.type.line.lineWidth;
  }

  get effectiveVisitedScale() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? 1
      : this.paraview.store.settings.type.line.lineHighlightScale;
  }

  get visitedStrokeWidth(): number {
    return this.effectiveLineWidth * this.effectiveVisitedScale;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new LineSection(seriesView);
  }

  pointerMove(): void {
    if (this.paraview.store.settings.chart.isShowPopups
      && this.paraview.store.settings.popup.activation === "onHover"
      && !this.paraview.store.settings.ui.isNarrativeHighlightEnabled
    ) {
      let coords = this.paraview.store.pointerCoords
      if (coords.x > 0 && coords.x < this.width && coords.y > 0 && coords.y < this.height) {
        let points = this.datapointViews
        let distances = points.map((dp, i) => [Number(Math.abs((dp.x - coords.x) ** 2)), i]).sort((a, b) => a[0] - b[0])
        let nearestPoint = points[distances[0][1]]
        if (nearestPoint.cousins.length > 0) {
          nearestPoint = nearestPoint.withCousins.sort((a, b) => Math.abs(a.y - coords.y) - Math.abs(b.y - coords.y))[0]
        }
        this.paraview.store.clearPopups()
        nearestPoint.addDatapointPopup()
      }

    }
    super.pointerMove()
  }
}

/**
 * A visual indicator of a line chart datapoint, plus line segments
 * drawn halfway to its neighbors.
 */
export class LineSection extends PointDatapointView {

  declare readonly chart: LinePlotView;

  protected _prevMidX?: number;
  protected _prevMidY?: number;
  protected _nextMidX?: number;
  protected _nextMidY?: number;

  // get height() {
  //   // apparently this can get called before the shape is created
  //   return bboxOfBboxes(...this._shapes.map(shape => shape.bbox)).height ?? 0;
  // }

  // get left() {
  //   return this._shape!.left;
  // }

  // get right() {
  //   return this._shape!.right;
  // }

  // get top() {
  //   return this._shape!.top;
  // }

  // get bottom() {
  //   return this._shape!.bottom;
  // }

  get outerBbox() {
    const shapeOuters = this._shapes.map(shape => shape.outerBbox);
    return this._symbol
      ? bboxOfBboxes(...shapeOuters, this._symbol!.outerBbox)
      : bboxOfBboxes(...shapeOuters);
  }

  completeLayout() {
    // find midpoint between values for next and previous, draw line as 2 segments

    // find midpoint between values for this and previous
    if (this.index) {
      this._computePrev();
    }

    // find midpoint between values for this and next
    if (this.index < this.chart.paraview.store.model!.series[0].length - 1) {
      this._computeNext();
    }

    // calculate centroid for scale transforms
    this._computeCentroid();

    // create shape and symbol
    super.completeLayout();
  }

  protected _createSymbol() {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    // If datapoints are laid out again after the initial layout,
    // we need to replace the original shape and symbol
    this._symbol?.remove();
    this._symbol = DataSymbol.fromType(this.paraview, symbolType);
    this.append(this._symbol);
  }

  protected _computePrev() {
    this._prevMidX = -this.width / 2; // - 0.1;
    this._prevMidY = (this._prev!.y - this.y) / 2;
  }

  protected _computeNext() {
    this._nextMidX = this.width / 2; // + 0.1;
    this._nextMidY = (this._next!.y - this.y) / 2;
  }

  protected _computeCentroid() {
    const symWidth = this._symbol?.width ?? 0;
    const symHeight = this._symbol?.height ?? 0;
    let centroidX = '50%';
    if (!this._prevMidX) {
      centroidX = `${symWidth / 2}px`;
    } else if (!this._nextMidX) {
      centroidX = `calc(100% - ${symWidth / 2}px)`;
    }

    let centroidY = '50%';
    if (!this._prevMidY && this._nextMidY) {
      centroidY = (this._y > this._nextMidY)
        ? `calc(100% - ${symHeight / 2}px)`
        : `${symHeight / 2}px`;
    } else if (!this._nextMidY && this._prevMidY) {
      centroidY = (this._y > this._prevMidY)
        ? `calc(100% - ${symHeight / 2}px)`
        : `${symHeight / 2}px`;
    } else if (this._nextMidY && this._prevMidY) {
      // NB: layoutSymbol() hasn't been called yet, so we can't refer,
      // directly or indirectly, to the symbol's location
      const symTop = this._y - symHeight / 2;
      const symBot = this._y + symHeight / 2;
      // NB: Strokes aren't taken into account here when computing the
      // element size, I think because we're using box-sizing: content-box.
      if (symBot > this._nextMidY && symBot > this._prevMidY) {
        centroidY = `calc(100% - ${symHeight / 2}px)`;
      } else if (symTop < this._nextMidY && symTop < this._prevMidY) {
        centroidY = `${symHeight / 2}px`;
      } else {
        centroidY = `${this._y - Math.min(this._prevMidY, this._nextMidY)}px`;
      }
    }
    this.centroid = `${centroidX} ${centroidY}`;
  }

  protected get _points(): Vec2[] {
    if (this._prevMidY !== undefined && this._nextMidY !== undefined) {
      return [
        new Vec2(this._prevMidX!, this._prevMidY),
        new Vec2(),
        new Vec2(this._nextMidX!, this._nextMidY)
      ];
    } else if (this._prevMidY === undefined && this._nextMidY !== undefined) {
      return [
        new Vec2(),
        new Vec2(this._nextMidX!, this._nextMidY)
      ];
    } else if (this._prevMidY !== undefined && this._nextMidY === undefined) {
      return [
        new Vec2(this._prevMidX!, this._prevMidY),
        new Vec2()
      ];
    } else {
      // default case assumes there's only 1 datapoint (no lines on either side)
      return [
        new Vec2()
      ];
    }
  }

  get classInfo() {
    return {
      'data-line': true,
      ...super.classInfo
    };
  }

  protected _shapeStyleInfo(shapeIndex: number): StyleInfo {
    if (this.paraview.documentView!.chartInfo.navMap!.cursor.isNodeType('sequence')) {
      const node = this.paraview.documentView!.chartInfo.navMap!.cursor;
      if ((this.index === node.options.start && this.index && !shapeIndex)
        || (this.index === node.options.end - 1 && shapeIndex)) {
        return {
          fill: this._parent.styleInfo.fill,
          stroke: this._parent.styleInfo.stroke,
          strokeWidth: this._parent.styleInfo.strokeWidth
        };
      }
    }
    return super._shapeStyleInfo(shapeIndex);
  }

  protected _createShapes() {
    // If datapoints are laid out again after the initial layout,
    // we need to replace the original shape and symbol
    this._shapes.forEach(shape => {
      shape.remove();
    });
    this._shapes = [];
    const points = this._points;
    if (points.length === 3) {
      const slices = [points.slice(0, -1), points.slice(1)];
      // XXX We can't do this until the series analysis completes!
      // const seq = this.paraview.store.seriesAnalyses[this.seriesKey]?.sequences?.find(seqInfo =>
      //   seqInfo.start <= this.index && this.index < seqInfo.end);
      // if (seq) {
      //   if (this.index === seq.start) {
      //     slices.reverse();
      //   }
      // }
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: slices[0],
          isClip: true
        }),
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: slices[1],
          isClip: true
        })
      );
      this._shapes[0].classInfo = { 'leg-left': true };
      this._shapes[1].classInfo = { 'leg-right': true };
    } else if (points.length === 2) {
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: points,
          isClip: true
        })
      );
      this._shapes[0].classInfo = this._prevMidY !== undefined
        ? { 'leg-left': true }
        : { 'leg-right': true };
    }
    this._shapes.forEach(shape => {
      (shape as PathShape).isClip = this.shouldClip;
    })
    super._createShapes();
  }
}

