/* ParaCharts: Rules Lines
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
import { type TickStrip } from './tickstrip';
import { fixed } from '../common/utils';
import { type VertCardinalDirection, type HorizCardinalDirection } from '../store/settings_types';

import { svg } from 'lit';
import { ParaView } from '../paraview';

type RuleOrientation = 'h' | 'v';

/**
 * An axis rule line.
 */
export abstract class AxisRule extends View {

  declare protected _parent: TickStrip;

  constructor(
    paraview: ParaView,
    protected _major = true,
    length: number,
    protected _orientation: RuleOrientation,
    private darken: boolean = false
  ) {
    super(paraview);
    this.length = length;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: TickStrip) {
    super.parent = parent;
  }

  protected abstract get _class(): string;

  get length() {
    return 0;
  }

  set length(length: number) {

  }

  protected abstract get _shouldNegateLength(): boolean;

  protected _addedToParent() {
    // we can't set the actual size until we have a parent
    this.updateSize();
  }

  content() {
    const length = this._shouldNegateLength ? -this.length : this.length;
    const move = fixed`M${this._x},${this._y}`;
    const line = this._orientation + fixed`${length}`;
    return svg`
      <path
        id=${this.darken ? 'grid-zero' : ''}
        class=${this._class}
        d=${move + ' ' + line}
      ></path>
    `;
  }

}

/**
 * A tick mark for a horizontal axis (tick itself is vertical).
 */
export abstract class HorizRule extends AxisRule {

  /**
   * @param _pointsTo - The tick starts on the axis and points in this direction.
   * @param major
   */
  constructor(protected _pointsTo: VertCardinalDirection, paraview: ParaView, major = true, length: number, darken: boolean = false) {
    super(paraview, major, length, 'v', darken);
  }

  get length() {
    return this.height;
  }

  set length(length: number) {
    this.height = length;
    super.length = length;
  }

  computeSize() {
    return [
      0,
      // computeSize() initially gets called before the parent is set
      this.height
    ] as [number, number];
  }

}

/**
 * A tick mark for a vertical axis (tick itself is horizontal).
 */
export abstract class VertRule extends AxisRule {

  /**
   * @param _pointsTo - The tick starts on the axis and points in this direction.
   * @param major
   */
  constructor(protected _pointsTo: HorizCardinalDirection, paraview: ParaView, major = true, length: number, darken: boolean = false) {
    super(paraview, major, length, 'h', darken);
  }

  get length() {
    return this.width;
  }

  set length(length: number) {
    this.width = length;
    super.length = length;
  }

  computeSize() {
    return [
      // computeSize() initially gets called before the parent is set
      this.width,
      0
    ] as [number, number];
  }

}

/**
 * A tick mark for a horizontal axis (tick itself is vertical).
 */
export class HorizTick extends HorizRule {

  protected get _class(): string {
    return 'tick-horiz';
  }

  get length() {
    return this._major ? super.length : super.length/2;
  }

  set length(length: number) {
    super.length = length;
  }

  protected get _shouldNegateLength(): boolean {
    return this._pointsTo === 'north';
  }

}

/**
 * A tick mark for a vertical axis (tick itself is horizontal).
 */
export class VertTick extends VertRule {

  protected get _class(): string {
    return 'tick-vert';
  }

  get length() {
    return this._major ? super.length : super.length/2;
  }

  set length(length: number) {
    super.length = length;
  }

  protected get _shouldNegateLength(): boolean {
    return this._pointsTo === 'west';
  }

}

/**
 * A grid line for a horizontal axis (line itself is vertical)
 */
export class HorizGridLine extends HorizRule {

  protected get _class(): string {
    return 'grid-horiz';
  }

  protected get _shouldNegateLength(): boolean {
    return this._pointsTo === 'south';
  }

}

/**
 * A grid line for a vertical axis (line itself is horizontal)
 */
export class VertGridLine extends VertRule {

  protected get _class(): string {
    return 'grid-vert';
  }

  protected get _shouldNegateLength(): boolean {
    return this._pointsTo === 'east';
  }

}
