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
import { classMap } from 'lit/directives/class-map.js';

/**
 * An axis line.
 */
export abstract class AxisLine<T extends AxisOrientation> extends View {

  constructor(public readonly axis: Axis<T>, length: number) {
    super(axis.paraview);
    this.length = length;
    this._classInfo = {'axis-line': true, [`axis-line-${axis.orientation}`]: true};
  }

  get length() {
    return 0;
  }

  set length(length: number) {

  }

  protected _createId(..._args: any[]): string {
    return `${this.axis.orientation}-axis-line`;
  }

  protected abstract getLineD(): string;

  render() {
    if (!this.axis.settings.line.isDrawAxisLine) {
      return svg``;
    }
    const transform = fixed`translate(${this._x},${this._y})`;
    return svg`
      <path
        transform=${this._x !== 0 || this._y !== 0 ? transform : nothing}
        id=${this._id}
        class=${classMap(this._classInfo)}
        d=${this.getLineD()}
      ></path>
    `;
  }

}

/**
 * A horizontal axis line.
 */
export class HorizAxisLine extends AxisLine<'horiz'> {

  constructor(axis: Axis<'horiz'>, length: number) {
    super(axis, length);
    this._height = 0;
    this._canWidthFlex = true;
  }

  get length() {
    return this.width;
  }

  set length(length: number) {
    this.width = length;
    super.length = length;
  }

  protected getLineD() {
    if (this.axis.settings.line.isDrawOverhang) {
      const tickLength = this.paraview.store.settings.axis.vert.tick.length;
      const x = this.paraview.store.settings.axis.vert.position === 'west' ?
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

  constructor(axis: Axis<'vert'>, length: number) {
    super(axis, length);
    this._width = 0;
    this._canHeightFlex = true;
  }

  get length() {
    return this.height;
  }

  set length(length: number) {
    this.height = length;
    super.length = length;
  }

  protected getLineD() {
    if (this.axis.settings.line.isDrawOverhang) {
      const tickLength = this.paraview.store.settings.axis.horiz.tick.length;
      const y = this.paraview.store.settings.axis.horiz.position === 'north' ?
        -tickLength : 0;
      return fixed`M0,${y} v${this.height + tickLength}`;
    } else {
      return fixed`M0,0 v${this.height}`;
    }
  }

}
