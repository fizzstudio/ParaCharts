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

import { View, Container } from '../base_view';
import { type Layout } from '../layout';
import { type Axis, type AxisOrientation, ChartTooDenseError, ChartTooWideError } from './axis';
import { Label, type LabelTextAnchor } from '../label';
import { ParaView } from '../../paraview';

import { type TemplateResult } from 'lit';
import { Vec2 } from '../../common/vector';
import { PlaneModel } from '@fizz/paramodel';

/**
 * A single tier of tick labels.
 */
export abstract class TickLabelTier<T extends AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;
  declare protected _children: Label[];

  /** Distance between label centers (or starts or ends) */
  protected _labelDistance!: number;

  constructor(
    public readonly axis: Axis<T>,
    public readonly tickLabels: string[],
    public readonly tierIndex: number,
    length: number,
    paraview: ParaView
  ) {
    super(paraview);
    this.setLength(length);
    this._hidden = !this.axis.settings.tick.tickLabel.isDrawEnabled;
    // XXX temp hack
    //this._padding = {top: 0, bottom: 0, left: 0, right: 0};
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
    return `tick-label-tier-${this.axis.orientation}-${this.tierIndex}`;
  }

  protected _maxLabelWidth() {
    return Math.max(...this._children.map(kid => kid.width ?? 0));
  }

  protected _maxLabelHeight() {
    return Math.max(...this._children.map(kid => kid.height ?? 0));
  }

  protected abstract get _labelTextAnchor(): LabelTextAnchor;

  protected abstract get _labelWrapWidth(): number | undefined;

  createTickLabels() {
    for (const [i, labelText] of this.tickLabels.entries()) {
      if (i % this.axis.tickStep) {
        continue;
      }
      const label = new Label(this.paraview, {
        id: `tick-label-${this.axis.orientation}-${i}`,
        classList: [
          'tick-label', this.axis.orientation,
          this.axis.orientationSettings.position as string],
        role: 'axislabel',
        text: labelText,
        textAnchor: this._labelTextAnchor,
        wrapWidth: this._labelWrapWidth,
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

  constructor(
    readonly axis: Axis<'horiz'>,
    readonly tickLabels: string[],
    tierIndex: number,
    length: number,
    paraview: ParaView
  ) {
    super(axis, tickLabels, tierIndex, length, paraview);
    this.padding = {top: this.axis.settings.tick.tickLabel.offsetGap};
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return this.axis.settings.tick.tickLabel.angle ? 'end' : 'middle';
  }

  protected get _labelWrapWidth() {
    return this._labelDistance;
  }

  computeSize(): [number, number] {
    return [this.length, this._maxLabelHeight()];
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
    return (this.axis.orientationSettings.labelOrder === 'westToEast'
      ? pos
      : this.length - pos
    );
  }

  protected _tickLabelY(index: number) {
    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    const facet = (this.paraview.store.model as PlaneModel).getAxisFacet(this.axis.orientation)
       ?? this.paraview.store.model!.getFacet(this.axis.orientation === 'horiz' ? 'x' : 'y')!;
    const tickLen = facet!.variableType === 'independent'
      ? this.paraview.store.settings.axis.x.tick.length
      : this.paraview.store.settings.axis.y.tick.length;
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'north'
    ? this.height // - this._children[index].height
    : 0; //tickLen;
  }

  createTickLabels() {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
      kid.angle = this.axis.settings.tick.tickLabel.angle;
      if (kid.angle === 0) {
        kid.top = this._tickLabelY(i);
        kid.centerX = this._tickLabelX(i);
      } else if (kid.angle > 0) {
        kid.topLeft = new Vec2(this._tickLabelX(i), this._tickLabelY(i));
      } else {
        kid.topRight = new Vec2(this._tickLabelX(i), this._tickLabelY(i));
      }
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
        // NB: Even if the anchor is set to middle, the labels may be rotated, so
        // the anchor will no longer be in the middle of the bbox
        label.left = this._children[i].right + this.axis.settings.tick.tickLabel.gap;
        anchorGaps.push(label.x - this._children[i].x);
      });
      const largestAnchorGap = Math.max(...anchorGaps);

      // The labels may actually extend a bit past the start and end points of
      // the x-axis, so we take that into account when computing the preferred width
      // of the chart content
      const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
      const preferredWidth = largestAnchorGap*(n/this.axis.tickStep);
      if (preferredWidth > 800 && this.axis.datatype !== 'string') {
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

  constructor(
    readonly axis: Axis<'vert'>,
    readonly tickLabels: string[],
    tierIndex: number,
    length: number,
    paraview: ParaView
  ) {
    super(axis, tickLabels, tierIndex, length, paraview);
    this.padding = {right: this.axis.settings.tick.tickLabel.offsetGap};
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return 'end';
  }

  protected get _labelWrapWidth() {
    return undefined;
  }

  setLength(length: number) {
    this.height = length;
    super.setLength(length);
  }

  computeSize(): [number, number] {
    return [this._maxLabelWidth(), this.height];
  }

  protected _tickLabelX(index: number) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'west'
      ? this.width //- this._children[index].width
      : 0;
  }

  protected _tickLabelY(index: number) {
    const pos = this._labelDistance*index;
    return (this.axis.orientationSettings.labelOrder === 'northToSouth'
        ? pos + this._labelDistance/2 + this._children[index].height/3
        : this.height - pos + this._children[index].height/3)
  }

  createTickLabels() {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
        kid.x = this._tickLabelX(i);
        kid.y = this._tickLabelY(i);
    });
  }

}
