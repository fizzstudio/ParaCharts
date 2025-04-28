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

import { PointChart, ChartPoint } from './pointchart';
import { type LineSettings, type DeepReadonly } from '../store/settings_types';
import { fixed } from '../common/utils';
import { type XYSeriesView } from './xychart';

import { svg } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * Class for drawing line charts.
 * @public
 */
export class LineChart extends PointChart {

  declare protected _settings: DeepReadonly<LineSettings>;

  protected _lowVisLineWidth: number | null = null;

  protected _addedToParent() {
    super._addedToParent();
    //todo().controller.registerSettingManager(this);
    /*todo().controller.settingViews.add(this, {
      type: 'textfield',
      key: 'type.line.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number', 
        min: 1, 
        max: this._settings.lineWidthMax
      },
      parentView: 'chartDetails.tabs.chart.chart',
    });
    todo().controller.settingViews.add(this, {
      type: 'checkbox',
      key: 'type.line.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'chartDetails.tabs.chart.chart',
    });
    todo().deets!.chartPanel.requestUpdate();*/
  }

  get datapointViews() {
    return super.datapointViews as LineSection[];
  }

  get settings() {
    return this._settings;
  }

  settingDidChange(key: string, value: any) {
    if (!super.settingDidChange(key, value)) {
      this.paraview.requestUpdate();
      return true;
    }
    return false;
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new LineSection(seriesView);
  }

  setLowVisionMode(lvm: boolean) {
    if (!lvm) {
      // restore saved line width
      //todo().controller.setSetting('type.line.lineWidth', this._lowVisLineWidth!);
      this._lowVisLineWidth = null;
    } else {
      // save current line width
      this._lowVisLineWidth = this.paraview.store.settings.type.line.lineWidth;
      //todo().controller.setSetting('type.line.lineWidth', 15);
    }
  }

}

/**
 * A visual indicator of a line chart datapoint, plus line segments
 * drawn halfway to its neighbors. 
 */
export class LineSection extends ChartPoint {

  declare readonly chart: LineChart;

  protected _prevMidX?: number;
  protected _prevMidY?: number;
  protected _nextMidX?: number;
  protected _nextMidY?: number;

  get width() {
    return this.chart.settings.selectedPointMarkerSize.width;
  }

  get height() {
    return this.chart.settings.selectedPointMarkerSize.height;
  }

  computeLayout() {
    super.computeLayout();
    // find midpoint between values for next and previous, draw line as 2 segments

    // find midpoint between values for this and previous
    if (this.index) {
      this._computePrev();
    }

    // find midpoint between values for this and next
    if (this.index < this.chart.paraview.store.model!.allFacetValues('x')!.length - 1) {
      this._computeNext();
    }

    // calculate centroid for scale transforms
    this._computeCentroid();
  }

  protected _computePrev() {
      // find midpoint x position
      this._prevMidX = this._x - LineSection.width/2; // - 0.1;
      // pixel height/y-value range
      const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
      // find midpoint y position
      const prevValue = this._prev!.datapoint.y.value as number;
      const thisValue = this.datapoint.y.value as number;
      const prevMidDiff = Math.min(thisValue, prevValue) + 
        (Math.max(thisValue, prevValue) - Math.min(thisValue, prevValue))/2;
      const prevMidHeight = (prevMidDiff - this.chart.axisInfo!.yLabelInfo.min!)*pxPerYUnit;
      this._prevMidY = this.chart.height - prevMidHeight;
  }

  protected _computeNext() {
      // find midpoint x position
      this._nextMidX = this._x + LineSection.width/2; // + 0.1;
      // pixel height/y-value range
      const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
      // find midpoint y position
      const nextValue = this._next!.datapoint.y.value as number;
      const thisValue = this.datapoint.y.value as number;
      const nextMidDiff = Math.min(thisValue, nextValue) + 
        (Math.max(thisValue, nextValue) - Math.min(thisValue, nextValue))/2;
      const nextMidHeight = (nextMidDiff - this.chart.axisInfo!.yLabelInfo.min!)*pxPerYUnit;

      this._nextMidY = this.chart.height - nextMidHeight;
  }

  protected _computeCentroid() {
    const symWidth = this.symbol?.width ?? 0;
    const symHeight = this.symbol?.height ?? 0;
    let centroidX = '50%';
    if (!this._prevMidX) {
      centroidX = `${symWidth/2}px`;
    } else if (!this._nextMidX) {
      centroidX = `calc(100% - ${symWidth/2}px)`;
    }

    let centroidY = '50%';
    if (!this._prevMidY && this._nextMidY) {
      centroidY = (this._y > this._nextMidY) 
        ? `calc(100% - ${symHeight/2}px)` 
        : `${symHeight/2}px`;
    } else if (!this._nextMidY && this._prevMidY) {
      centroidY = (this._y > this._prevMidY) 
        ? `calc(100% - ${symHeight/2}px)`
        : `${symHeight/2}px`;
    } else if (this._nextMidY && this._prevMidY) {
      // NB: layoutSymbol() hasn't been called yet, so we can't refer,
      // directly or indirectly, to the symbol's location
      const symTop = this._y - symHeight/2;
      const symBot = this._y + symHeight/2;
      // NB: Strokes aren't taken into account here when computing the
      // element size, I think because we're using box-sizing: content-box. 
      if (symBot > this._nextMidY && symBot > this._prevMidY) {
        centroidY = `calc(100% - ${symHeight/2}px)`;
      } else if (symTop < this._nextMidY && symTop < this._prevMidY) {
        centroidY = `${symHeight/2}px`;
      } else {
        centroidY = `${this._y - Math.min(this._prevMidY, this._nextMidY)}px`;
      }
    }
    this.centroid = `${centroidX} ${centroidY}`;
  }

  protected get _lineD() {
    // default case assumes there's only 1 datapoint (no lines on either side)
    let lineD = fixed`M${this._x},${this._y}`;
    if (this._prevMidY !== undefined && this._nextMidY !== undefined) {
      lineD = fixed`
        M${this._prevMidX!},${this._prevMidY}
        L${this._x},${this._y} 
        L${this._nextMidX!},${this._nextMidY}`;
    } else if (this._prevMidY === undefined && this._nextMidY !== undefined) {
      lineD = fixed`M${this._x},${this._y} L${this._nextMidX!},${this._nextMidY}`;
    } else if (this._prevMidY !== undefined && this._nextMidY === undefined) {
      lineD = fixed`M${this._prevMidX!},${this._prevMidY} L${this._x},${this._y}`;
    }
    return lineD;
  }

  content() {
    // add setting for visited stroke-width multiplier
    const visitedScale = this.paraview.store.visitedDatapoints.includes(this._id)
      ? this.chart.settings.highlightScale : 1;
    const styles = {
      strokeWidth: this.chart.settings.lineWidth*visitedScale
    };
    return svg`
      <path
        class="data-line"
        d=${this._lineD}
        style=${styleMap(styles)}
      >
      </path>
    `;
  }
}

