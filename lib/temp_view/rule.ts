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
import { type VertDirection, type HorizDirection } from '../store/settings_types';

import { svg } from 'lit';

/**
 * An axis rule line.
 */
export abstract class AxisRule extends View {

  declare protected _parent: TickStrip;

  constructor(protected _major = true) {
    super();
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: TickStrip) {
    super.parent = parent;
  }

  protected abstract get _class(): string;

  protected abstract get _length(): number;

  protected abstract get _shouldNegateLength(): boolean;

  protected _addedToParent() {
    // we can't set the actual size until we have a parent
    //this._updateSize();
  }

}

/**
 * A tick mark for a horizontal axis (tick itself is vertical).
 */
export abstract class HorizRule extends AxisRule {

  /**
   * @param _orientation - The tick starts on the axis and points in this direction.
   * @param major 
   */
  constructor(protected _orientation: VertDirection, major = true) {
    super(major);
  }

  protected get _length() {
    return this._height;
  }

  computeSize() {
    return [
      0,
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.settings.tick.length ?? 0
    ] as [number, number];
  }

  render() {
    const length = this._shouldNegateLength ? -this._length : this._length;
    return super.render(svg`
      <path
        class=${this._class}
        d=${fixed`
          M${this._x},${this._y} 
          v${length}`}
      ></path>
    `);
  }

}

/**
 * A tick mark for a vertical axis (tick itself is horizontal).
 */
export abstract class VertRule extends AxisRule {

  /**
   * @param _orientation - The tick starts on the axis and points in this direction.
   * @param major 
   */
  constructor(protected _orientation: HorizDirection, major = true) {
    super(major);
  }

  protected get _length() {
    return this._width;
  }

  computeSize() {
    return [
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.settings.tick.length ?? 0,
      0
    ] as [number, number];
  }

  render() {
    const length = this._shouldNegateLength ? -this._length : this._length;
    return super.render(svg`
      <path
        class=${this._class}
        d=${fixed`
          M${this._x},${this._y}
          h${length}`}
      ></path>
    `);
  }

}

/**
 * A tick mark for a horizontal axis (tick itself is vertical).
 */
export class HorizTick extends HorizRule {

  computeSize() {
    return [
      0,
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.settings.tick.length ?? 0
    ] as [number, number];
  }

  protected get _class(): string {
    return 'tick-horiz';
  }

  protected get _length() {
    return this._major ? super._length : super._length/2;
  }

  protected get _shouldNegateLength(): boolean {
    return this._orientation === 'north';
  }

}

/**
 * A tick mark for a vertical axis (tick itself is horizontal).
 */
export class VertTick extends VertRule {

  computeSize() {
    return [
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.settings.tick.length ?? 0,
      0
    ] as [number, number];
  }

  protected get _class(): string {
    return 'tick-vert';
  }

  protected get _length() {
    return this._major ? super._length : super._length/2;
  }

  protected get _shouldNegateLength(): boolean {
    return this._orientation === 'west';
  }

}

/**
 * A grid line for a horizontal axis (line itself is vertical)
 */
export class HorizGridLine extends HorizRule {

  computeSize() {
    return [
      0,
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.chartLayers.physHeight ?? 0
    ] as [number, number];
  }

  protected get _class(): string {
    return 'grid-horiz';
  }

  protected get _shouldNegateLength(): boolean {
    return this._orientation === 'south';
  }

}

/**
 * A grid line for a vertical axis (line itself is horizontal)
 */
export class VertGridLine extends VertRule {

  computeSize() {
    return [
      // computeSize() initially gets called before the parent is set
      this._parent?.axis.chartLayers.contentWidth ?? 0,
      0
    ] as [number, number];
  }

  protected get _class(): string {
    return 'grid-vert';
  }

  protected get _shouldNegateLength(): boolean {
    return this._orientation === 'east';
  }

}
