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

import { View } from '../base_view';
import { type Axis, type AxisOrientation } from './axis';
import { fixed } from '../../common/utils';

import { svg, nothing } from 'lit';

/**
 * An axis line.
 */
export abstract class AxisLine<T extends AxisOrientation> extends View {

  constructor(public readonly axis: Axis<T>, length: number) {
    super(axis.paraview);
    this.length = length;
  }

  get length() {
    return 0;
  }

  set length(length: number) {

  }

  protected _createId(..._args: any[]): string {
    return `${this.axis.coord}-axis-line`;
  }

  protected abstract getLineD(): string;

  render() {
    if (!this.axis.settings.line.isDrawEnabled) {
      return svg``;
    }
    const transform = fixed`translate(${this._x},${this._y})`;
    return svg`
      <path
        transform=${this._x !== 0 || this._y !== 0 ? transform : nothing}
        id=${this._id}
        d=${this.getLineD()}
      ></path>
    `;
  }

}

/**
 * A horizontal axis line.
 */
export class HorizAxisLine extends AxisLine<'horiz'> {

  get length() {
    return this.width;
  }

  set length(length: number) {
    this.width = length;
    super.length = length;
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

  get length() {
    return this.height;
  }

  set length(length: number) {
    this.height = length;
    super.length = length;
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
