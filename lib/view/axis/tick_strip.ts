/* ParaCharts: Ticks Strips
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

import { View, Container } from '../base_view';
import { type Layout } from '../layout';
import {
  type Axis, type AxisOrientation,
} from './axis';

import { mapn } from '@fizz/chart-classifier-utils';

import { svg, type TemplateResult } from 'lit';
import { HorizGridLine, HorizTick, VertGridLine, VertTick } from './rule';
import { Label } from '../label';

/**
 * A strip of tick marks.
 */
export abstract class TickStrip<T extends AxisOrientation = AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;

  protected _count!: number;
  protected _gridLineLength!: number;

  constructor(
    public readonly axis: Axis<T>,
    protected _interval: number,
    protected _majorModulus: number,
    contentWidth: number,
    contentHeight: number
  ) {
    super(axis.paraview);
    // XXX this results in creating the rules twice, which is harmless, but stupid
    this.resize(contentWidth, contentHeight, this._interval);
  }

  resize(_width: number, _height: number, interval: number) {
    this._interval = interval;
    this.clearChildren();
    this._createRules();
  }

  protected _addedToParent(): void {
    this._count = this._computeCount();
    if (this.axis.isInterval) {
      this._count++;
    }
    this._createRules();
  }

  protected _createId(..._args: any[]): string {
    return `${this.axis.coord}-axis-tick-strip`;
  }

  get parent() {
    return this._parent;
  }

  get class() {
    return 'tick-strip';
  }

  set parent(parent: Layout) {
    super.parent = parent;
  }

  protected abstract get _length(): number;

  protected _computeCount() {
    const intervalCount = this._length / this._interval;
    return Math.round(intervalCount);
  }

  protected abstract _createRules(): void;

}

/**
 * A horizontal strip of tick marks.
 */
export class HorizTickStrip extends TickStrip<'horiz'> {

  computeSize() {
    return [
      this.width,
      // NB! The grid lines DON'T COUNT toward the height!
      (this.axis.settings.tick.isDrawEnabled || this.axis.orthoAxis.settings.line.isDrawOverhangEnabled)
        ? this.axis.settings.tick.length
        : 0
    ] as [number, number];
  }

  get _length() {
    return this.width;
  }

  resize(width: number, height: number, interval: number) {
    this.width = width;
    this._gridLineLength = height;
    super.resize(width, height, interval);
  }

  protected _createRules() {
    const isOrthoEast = this.axis.orthoAxis.orientationSettings.position === 'east';
    let tickLength = this.axis.settings.tick.length;
    let y = 0;
    if (this.axis.orientationSettings.position === 'north') {
      y = (this.axis.settings.tick.isDrawEnabled || this.axis.orthoAxis.settings.line.isDrawOverhangEnabled)
        ? tickLength + this.axis.settings.tick.padding
        : 0;
    }
    let indices = mapn(this._count + (this.axis.isInterval ? 0 : 1), i => i)
      .filter(i => i % this.axis.tickStep === 0);
    if (!this.paraview.store.settings.grid.isDrawVertAxisOppositeLine) {
      indices = isOrthoEast ? indices.slice(0, -1) : indices.slice(1);
    }
    // skip axis line tick
    indices = indices.slice(1);
    const xs = indices.map(i => isOrthoEast
      ? this.width - i*this._interval
      : i*this._interval);
    const zeroIndex = this.axis.tickLabelTiers[0].children.findIndex((c: Label) => c.text == "0") - 1
    indices.forEach((idx, i) => {
      this.append(new HorizTick(
        this.axis.orientationSettings.position, this.paraview, idx % this._majorModulus === 0, tickLength));
      this._children.at(-1)!.x = xs[i];
      this._children.at(-1)!.y = y;
      this._children.at(-1)!.hidden = !this.axis.settings.tick.isDrawEnabled;
      this.append(new HorizGridLine(
        this.axis.orientationSettings.position, this.paraview, undefined, this._gridLineLength, i == zeroIndex ? true : false));
      this._children.at(-1)!.x = xs[i];
      this._children.at(-1)!.y = y;
      this._children.at(-1)!.hidden = !this.paraview.store.settings.grid.isDrawVertLines;
    });
  }

}

/**
 * A vertical strip of tick marks.
 */
export class VertTickStrip extends TickStrip<'vert'> {

  computeSize() {
    return [
      // NB! The grid lines DON'T COUNT toward the width!
      (this.axis.settings.tick.isDrawEnabled || this.axis.orthoAxis.settings.line.isDrawOverhangEnabled)
        ? this.axis.settings.tick.length
        : 0,
      this.height
    ] as [number, number];
  }

  get _length() {
    return this.height;
  }

  resize(width: number, height: number, interval: number) {
    this._gridLineLength = width;
    this.height = height;
    super.resize(width, height, interval);
  }

  protected _createRules() {
    const isNorth = this.axis.orthoAxis.orientationSettings.position === 'north';
    const tickLength = this.axis.settings.tick.length;
    let x = tickLength;
    let indices = mapn(this._count, i => i);
    if (!this.axis.docView.paraview.store.settings.grid.isDrawHorizAxisOppositeLine) {
      indices = isNorth ? indices.slice(1) : indices.slice(0, -1);
    }
    if (this.axis.orientationSettings.position === 'east') {
      x = 0;
    }
    const ys = indices.map(i => isNorth ?
      this.height - i*this._interval : i*this._interval);
    const zeroIndex = indices.length - this.axis.tickLabelTiers[0].children.findIndex((c: Label) => c.text == "0")
    indices.forEach(i => {
      this.append(new VertTick(
        this.axis.orientationSettings.position, this.paraview, i % this._majorModulus === 0, tickLength));
      this._children.at(-1)!.x = x;
      this._children.at(-1)!.y = ys[i];
      this._children.at(-1)!.hidden = !this.axis.settings.tick.isDrawEnabled;
      this.append(new VertGridLine(
        this.axis.orientationSettings.position, this.paraview, undefined, this._gridLineLength, i == zeroIndex ? true : false));
      this._children.at(-1)!.x = x;
      this._children.at(-1)!.y = ys[i];
      this._children.at(-1)!.hidden = !this.paraview.store.settings.grid.isDrawHorizLines;
    });
  }

}
