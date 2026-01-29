/* ParaCharts: Ticks Strips
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

import { View, Container } from '../base_view';
import { type Layout } from '../layout';
import {
  type Axis, type AxisOrientation,
} from './axis';

import { mapn } from '@fizz/chart-classifier-utils';

import { svg, type TemplateResult } from 'lit';
import { HorizGridLine, HorizTick, VertGridLine, VertTick } from './rule';
import { ParaView } from '../../paraview';
import { HorizCardinalDirection, OrientedAxisSettings, VertCardinalDirection } from '../../state';

export interface TickStripOptions {
  orientation: AxisOrientation;
  length: number;
  tickCount: number;
  // isInterval: boolean;
  isDrawOverhang: boolean; // the axis line draws the overhang, not us
  tickStep: number;
  orthoAxisPosition: VertCardinalDirection | HorizCardinalDirection;
  zeroIndex: number;
  isChartIntertick: boolean;
  isFacetIndep: boolean;
}

/**
 * A strip of tick marks.
 */
export abstract class TickStrip extends Container(View) {

  declare protected _parent: Layout;

  protected _interval!: number;
  protected _indices: number[] = [];

  constructor(paraview: ParaView,
    protected _axisSettings: OrientedAxisSettings<AxisOrientation>,
    protected _majorModulus: number,
    protected _options: TickStripOptions
  ) {
    super(paraview);
    // XXX this results in creating the rules twice, which is harmless, but stupid
    this._updateSizeFromLength(this._options.length);
    this._computeInterval();
  }

  resize(width: number, height: number) {
    super.resize(width, height);
    this._computeInterval();
    this.clearChildren();
    this._createTicks();
  }

  protected _computeInterval() {
    const n = this._options.tickCount - 1;
    this._interval = this._length/(n/this._options.tickStep);
  }

  protected _addedToParent(): void {
    this._createTicks();
  }

  /**
   * Overridden by subclasses to set the appropriate size dimension from `length`.
   */
  protected _updateSizeFromLength(length: number) {
    this.updateSize();
  }

  protected abstract get _length(): number;

  protected _createId(..._args: any[]): string {
    return `${this._options.orientation}-axis-tick-strip`;
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

  protected abstract _createTicks(): void;
  abstract addRules(length: number): void;

}

/**
 * A horizontal strip of tick marks.
 */
export class HorizTickStrip extends TickStrip {

  protected _ruleXs: number[] = [];
  protected _ruleY = 0;

  constructor(paraview: ParaView,
    _axisSettings: OrientedAxisSettings<AxisOrientation>,
    _majorModulus: number,
    _options: TickStripOptions,
  ) {
    super(paraview, _axisSettings, _majorModulus, _options);
    this._canWidthFlex = true;
  }

  protected _computeInterval() {
    const n = (this._options.isChartIntertick && this._options.isFacetIndep)
      ? this._options.tickCount
      : this._options.tickCount - 1;
    this._interval = this._length/(n/this._options.tickStep);
  }

  computeSize() {
    return [
      this._options.length,
      // NB! The grid lines DON'T COUNT toward the height!
      (this._axisSettings.ticks.isDrawTicks || this._options.isDrawOverhang)
        ? this._axisSettings.ticks.length
        : 0
    ] as [number, number];
  }

  protected get _length(): number {
    return this._width;
  }

  protected _updateSizeFromLength(length: number) {
    this._width = length;
    super._updateSizeFromLength(length);
  }

  // resize(width: number, height: number, interval: number) {
  //   this.width = width;
  //   this._gridLineLength = height;
  //   super.resize(width, height, interval);
  // }

  protected _createTicks() {
    const isOrthoEast = this._options.orthoAxisPosition === 'east';
    let tickLength = this._axisSettings.ticks.length;
    this._ruleY = 0;
    if (this._axisSettings.position === 'north') {
      this._ruleY = (this._axisSettings.ticks.isDrawTicks || this._options.isDrawOverhang)
        ? tickLength + this._axisSettings.ticks.padding
        : 0;
    }
    const isXIntertick = this._options.isChartIntertick && this._options.isFacetIndep;
    this._indices = mapn(this._options.tickCount + (isXIntertick ? 1 : 0), i => i)
      .filter(i => i % this._options.tickStep === 0);
    if (!this.paraview.paraState.settings.grid.isDrawVertAxisOppositeLine) {
      this._indices = isOrthoEast
        ? this._indices.slice(0, -1)
        : this._indices.slice(1);
    }
    // skip axis line tick
    this._indices = this._indices.slice(1);
    const xOffset = (this._axisSettings.ticks.isOnDatapoint && isXIntertick)
      ? this._interval/2
      : 0;
    this._ruleXs = this._indices.map(i => isOrthoEast
      ? this.width - i*this._interval
      : i*this._interval - xOffset);
    this._indices.forEach((idx, i) => {
      this.append(new HorizTick(
        this._axisSettings.position as VertCardinalDirection,
        this.paraview, idx % this._majorModulus === 0, tickLength));
      this._children.at(-1)!.x = this._ruleXs[i];
      this._children.at(-1)!.y = this._ruleY;
      //this._children.at(-1)!.hidden = !this._axisSettings.ticks.isDrawTicks;
    });
  }

  addRules(length: number) {
    this._indices.forEach((idx, i) => {
      this.append(new HorizGridLine(
        this._axisSettings.position as VertCardinalDirection,
        this.paraview, undefined, length, i === this._options.zeroIndex));
      this._children.at(-1)!.x = this._ruleXs[i];
      this._children.at(-1)!.y = this._ruleY;
      this._children.at(-1)!.hidden = !this.paraview.paraState.settings.grid.isDrawVertLines;
    });
  }
}

/**
 * A vertical strip of tick marks.
 */
export class VertTickStrip extends TickStrip {

  protected _ruleX = 0;
  protected _ruleYs: number[] = [];

  constructor(paraview: ParaView,
    _axisSettings: OrientedAxisSettings<AxisOrientation>,
    _majorModulus: number,
    _options: TickStripOptions
  ) {
    super(paraview, _axisSettings, _majorModulus, _options);
    this._canHeightFlex = true;
  }

  protected _computeInterval() {
    const n = (this._options.isChartIntertick && this._options.isFacetIndep)
      ? this._options.tickCount
      : this._options.tickCount - 1;
    this._interval = this._length/(n/this._options.tickStep);
  }

  computeSize() {
    return [
      // NB! The grid lines DON'T COUNT toward the width!
      (this._axisSettings.ticks.isDrawTicks || this._options.isDrawOverhang)
        ? this._axisSettings.ticks.length
        : 0,
      this._options.length
    ] as [number, number];
  }

  protected get _length(): number {
    return this._height;
  }

  protected _updateSizeFromLength(length: number) {
    this._height = length;
    super._updateSizeFromLength(length);
  }

  // protected _adjustToSizeConstraint() {
  //   this._gridLineLength = width;
  //   this.height = height;
  //   super.resize(width, height, interval);
  // }

  protected _createTicks() {
    const isNorth = this._options.orthoAxisPosition === 'north';
    const tickLength = this._axisSettings.ticks.length;
    this._ruleX = tickLength;
    const isXIntertick = this._options.isChartIntertick && this._options.isFacetIndep;
    this._indices = mapn(this._options.tickCount, i => i);
    if (!this.paraview.paraState.settings.grid.isDrawHorizAxisOppositeLine) {
      this._indices = isNorth
        ? this._indices.slice(1)
        : this._indices.slice(0, -1);
    }
    if (this._axisSettings.position === 'east') {
      this._ruleX = 0;
    }
    const yOffset = (this._axisSettings.ticks.isOnDatapoint && isXIntertick)
      ? this._interval/2
      : 0;
    this._ruleYs = this._indices.map(i => isNorth
      ? this.height - i*this._interval
      : i*this._interval + yOffset);
    this._indices.forEach(i => {
      this.append(new VertTick(
        this._axisSettings.position as HorizCardinalDirection,
        this.paraview, i % this._majorModulus === 0, tickLength));
      this._children.at(-1)!.x = this._ruleX;
      this._children.at(-1)!.y = this._ruleYs[i];
      //this._children.at(-1)!.hidden = !this._axisSettings.ticks.isDrawTicks;
    });
  }

  addRules(length: number) {
    this._indices.forEach(i => {
      this.append(new VertGridLine(
        this._axisSettings.position as HorizCardinalDirection,
        // XXX don't use `plotWidth` here
        this.paraview, undefined, length,
        this._indices.length - i - 1 === this._options.zeroIndex));
      this._children.at(-1)!.x = this._ruleX;
      this._children.at(-1)!.y = this._ruleYs[i];
      this._children.at(-1)!.hidden = !this.paraview.paraState.settings.grid.isDrawHorizLines;
    });
  }
}
