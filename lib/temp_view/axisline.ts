/* ParaCharts: Axis Lines
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

import { View } from './base_view';
import { type Axis, type AxisOrientation } from './axis';
import { fixed } from '../common/utils';

import { svg } from 'lit';

/**
 * An axis line.
 */
export abstract class AxisLine<T extends AxisOrientation> extends View {

  constructor(public readonly axis: Axis<T>) {
    super();
  }

  protected abstract getLineD(): string;
  
  render() {
    if (!this.axis.settings.line.isDrawEnabled) {
      return svg``;
    }
    const transform = fixed`translate(${this._x},${this._y})`;
    return svg`
      <g
        transform="${transform}"
      >
        <path 
          id="${this.axis.coord}-axis-line" 
          d=${this.getLineD()}
        ></path>
      </g>
    `;
  }

}

/**
 * A horizontal axis line.
 */
export class HorizAxisLine extends AxisLine<'horiz'> {

  get width() {
    // NB: The overhang doesn't count toward the width
    return this.axis.chartLayers.orientation === 'north' || this.axis.chartLayers.orientation === 'south' ? 
      this.axis.chartLayers.contentWidth : this.axis.chartLayers.physWidth;
  }

  get height() {
    return 0;   
  }
  
  protected getLineD() {
    if (this.axis.settings.line.isDrawOverhangEnabled) {
      const tickLength = this.axis.orthoAxis.settings.tick.length;
      const x = this.axis.orthoAxis.orientationSettings.position === 'west' ?
        -tickLength : 0;
      return fixed`M${x},0 h${this.width + tickLength}`;
    } else {
      return fixed`M0,0 h${this.width}`;
    }
  }

}

/**
 * A vertical axis line.
 */
export class VertAxisLine extends AxisLine<'vert'> {

  get width() {
    return 0;
  }

  get height() {
    // NB: The overhang doesn't count toward the height
    return this.axis.chartLayers.orientation === 'east' || this.axis.chartLayers.orientation === 'west' ? 
      this.axis.chartLayers.contentWidth : this.axis.chartLayers.physHeight;
  }

  protected getLineD() {
    if (this.axis.settings.line.isDrawOverhangEnabled) {
      const tickLength = this.axis.orthoAxis.settings.tick.length;
      const y = this.axis.orthoAxis.orientationSettings.position === 'north' ?
        -tickLength : 0;
      return fixed`M0,${y} v${this.height + tickLength}`;
    } else {
      return fixed`M0,0 v${this.height}`;
    }
  }

}
