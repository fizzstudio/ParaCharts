/* ParaCharts: Tick Label Tier
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

import { View, Container } from './base_view';
import { type Layout } from './layout';
import { type Axis, type AxisOrientation, ChartTooDenseError, ChartTooWideError } from './axis';
import { Label } from './label';
import { ParaView } from '../paraview';

import { type TemplateResult } from 'lit';

/**
 * A single tier of tick labels.
 */
export abstract class TickLabelTier<T extends AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;
  declare protected _children: Label[];

  textHoriz?: boolean;

  /** Distance between label centers (or starts or ends) */
  protected _labelDistance!: number;

  constructor(
    public readonly axis: Axis<T>,
    public readonly tickLabels: string[],
    length: number,
    paraview: ParaView
  ) {
    super(paraview);
    this.setLength(length);
  }

  setLength(length: number) {
    const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
    this._labelDistance = length/(n/this.axis.tickStep);
    this.clearChildren();
    this.createTickLabels();
  }

  get length() {
    return this._labelDistance*((this.tickLabels.length - 1)/this.axis.tickStep);
  }

  get class() {
    return 'tick-label-tier';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: Layout) {
    super.parent = parent;
  }

  get tickInterval() {
    return this._labelDistance;
  }

  protected _createId(..._args: any[]): string {
    // XXX needs index
    return `tick-label-tier-${this.axis.orientation}`;
  }

  protected _maxWidth() {
    return Math.max(...this._children.map(kid => kid.width ?? 0));
  }

  protected _maxHeight() {
    return Math.max(...this._children.map(kid => kid.height ?? 0));
  }

  computeLayout() {
    this.textHoriz = !this._children[0].angle;
  }

  createTickLabels() {
    for (const [i, labelText] of this.tickLabels.entries()) {
      if (i % this.axis.tickStep) {
        continue;
      }
      const label = new Label(this.paraview, {
        classList: [
          'tick-label', this.axis.orientation, 
          this.axis.orientationSettings.position as string],
        role: 'axislabel',
        text: labelText,
        x: 0,
        y: 0,
      });
      this.append(label);
    }
  }

  updateTickLabelIds() {
    // const xSeries = todo().controller.model!.indepVar;
    // for (const [i, label] of this._children.entries()) {
    //   const id = this.axis.coord === 'x'
    //     ? todo().canvas.jimerator.modelSelectors[xSeries][i*this.axis.tickStep][0]
    //     : `tick-y-${utils.strToId(label.text)}`;
    //   this._children[i].id = id;
    // }
  }

  protected abstract _tickLabelX(index: number): number;

  protected abstract _tickLabelY(index: number): number;

}

/**
 * A horizontal tier of tick labels.
 */
export class HorizTickLabelTier extends TickLabelTier<'horiz'> {

  computeSize(): [number, number] {
    return [this._computeWidth(), this.textHoriz ? this._maxHeight() : this._maxWidth()];
  }

  protected _tickLabelX(index: number) {
    // Labels are positioned with respect to their anchors. So if
    // labels are center-anchored, the first and last labels will
    // hang off the start and end boundaries of the tier.
    // These "hanging off" bits won't contribute to the size of
    // the tier, to make it easier to align.
    let pos = this._labelDistance*index;
    // if (this.axis.isInterval) {
    //   pos += this._labelDistance/2;
    // }
    return (this.axis.orientationSettings.labelOrder === 'westToEast' ? 
      pos : this.length - pos) - this._children[index].anchorXOffset;
  }

  protected _tickLabelY(index: number) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'north'
    ? this.height - this._children[index].height 
    : 0;  
  }

  protected _computeWidth() {
    return this._children.length 
      ? this._children.at(-1)!.anchorX - this._children[0].anchorX
      : 0; //this.width;
  }

  createTickLabels() {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
      kid.angle = this.axis.settings.tick.tickLabel.angle;
      kid.x = this._tickLabelX(i);
      kid.y = this._tickLabelY(i);
    });
    this.updateSize();
    this._checkLabelSpacing();
  }

  protected _checkLabelSpacing() {
    const gaps = this._children.slice(1).map((label, i) => label.left - this._children[i].right);
    const minGap = Math.min(...gaps);
    if (Math.round(minGap) < this.axis.settings.tick.tickLabel.gap) {
      // The actual labels won't have equal gaps between them, since the
      // labels themselves won't all be the same size. But if I space them
      // out so that they are equally spaced, the largest anchor gap between
      // any adjacent pair of labels can be used as the x tick
      // interval required for all labels to have a gap of at least the
      // desired size.
      const anchorGaps: number[] = [];
      this._children.slice(1).forEach((label, i) => {
        label.x = this._children[i].right + this.axis.settings.tick.tickLabel.gap;
        anchorGaps.push(label.anchorX - this._children[i].anchorX);
      });
      const largestAnchorGap = Math.max(...anchorGaps);
      // The labels may actually extend a bit past the start and end points of
      // the x-axis, so we take that into account when computing the preferred width
      // of the chart content
      const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
      const preferredWidth = largestAnchorGap*(n/this.axis.tickStep);
      if (preferredWidth > 600) {
        const newTickStep = this.axis.tickStep + 1;
        const newNumLabels = Math.floor(this.tickLabels.length/newTickStep) + this.tickLabels.length % newTickStep;
        if (!newNumLabels) {
          throw new Error('chart always too dense or too wide');
        }
        throw new ChartTooWideError(newTickStep);
      }
      throw new ChartTooDenseError(preferredWidth);
    }
  }

}

/**
 * A vertical tier of tick labels.
 */
export class VertTickLabelTier extends TickLabelTier<'vert'> {

  setLength(length: number) {
    this.height = length;
    super.setLength(length);
  }

  computeSize(): [number, number] {
    return [this._maxWidth(), this.height];
  }

  protected _tickLabelX(index: number) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'west'
      ? this.width - this._children[index].width 
      : 0;
  }

  protected _tickLabelY(index: number) {
    const pos = this._labelDistance*index;
    return (this.axis.orientationSettings.labelOrder === 'northToSouth'
        ? pos 
        : this.height - pos)
      - this._children[index].anchorYOffset*2/3;
  }

  createTickLabels() {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
        kid.x = this._tickLabelX(i);
        kid.y = this._tickLabelY(i);
    });
  }

}
