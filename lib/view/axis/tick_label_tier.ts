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
import { type Axis, type AxisOrientation } from './axis';
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
  protected _childResizeCount = 0;
  protected _ignoreChildResize = false;

  constructor(
    public readonly axis: Axis<T>,
    public readonly tickLabels: string[],
    public readonly tierIndex: number,
    length: number,
    protected _tickStep: number,
    paraview: ParaView
  ) {
    super(paraview);
    // this.setLength(length);
    this._hidden = !this.axis.orientationSettings.tick.tickLabel.isDrawEnabled;
    this._updateSizeFromLength(length);
    this._reset();
  }

  protected abstract _updateSizeFromLength(length: number): void;

  resize(width: number, height: number) {
    super.resize(width, height);
    this._reset();
  }

  protected _reset() {
    console.log('TIER RESET', this.axis.coord, this._length, this.axis.isInterval);
    const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
    this._labelDistance = this._length/(n/this._tickStep);
    this.clearChildren();
    this.createTickLabels(false);
  }

  // protected _adjustToSizeConstraint() {
  //   console.log('TIER ADJUSTING', this.axis.coord, this._length, this.axis.isInterval);
  //   const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
  //   this._labelDistance = this._length/(n/this._tickStep);
  //   this.clearChildren();
  //   this.createTickLabels(false);
  // }

  // setLength(length: number, checkLabels = true) {
  //   const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
  //   this._labelDistance = length/(n/this._tickStep);
  //   this.clearChildren();
  //   this.createTickLabels(checkLabels);
  // }

  protected abstract get _length(): number;

  // get length() {
  //   const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
  //   return this._labelDistance*(n/this._tickStep);
  // }

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
    return `tick-label-tier-${this.axis.orientation}-${this.tierIndex}`;
  }

  protected _maxLabelWidth() {
    if (!this._children.length) {
      return 0;
    }
    return Math.max(...this._children.map(kid => kid.paddedWidth ?? 0));
  }

  protected _maxLabelHeight() {
    if (!this._children.length) {
      return 0;
    }
    return Math.max(...this._children.map(kid => kid.paddedHeight ?? 0));
  }

  protected abstract get _labelTextAnchor(): LabelTextAnchor;

  protected abstract get _labelWrapWidth(): number | undefined;

  createTickLabels(_checkLabels = true) {
    console.log('CREATING TICK LABELS');
    for (const [i, labelText] of this.tickLabels.entries()) {
      if (i % this._tickStep) {
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
    tickStep: number,
    paraview: ParaView
  ) {
    super(axis, tickLabels, tierIndex, length, tickStep, paraview);
    this._canWidthFlex = true;
    this.padding = {top: this.axis.orientationSettings.tick.tickLabel.offsetGap};
  }

  protected _updateSizeFromLength(length: number) {
    this._width = length;
  }

  protected get _length(): number {
    return this._width;
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return this.axis.orientationSettings.tick.tickLabel.angle ? 'end' : 'middle';
  }

  protected get _labelWrapWidth() {
    return this._labelDistance;
  }

  computeSize(): [number, number] {
    return [this._width, this._maxLabelHeight()];
  }

  protected _tickLabelX(index: number) {
    // Labels are positioned with respect to their anchors. So if
    // labels are center-anchored, the first and last labels will
    // hang off the start and end boundaries of the tier.
    // These "hanging off" bits won't contribute to the size of
    // the tier, to make it easier to align.
    let pos = this._labelDistance*index;
    if (this.axis.isInterval) {
      pos += (this._labelDistance/this._tickStep)/2;
    }
    return (this.axis.orientationSettings.labelOrder === 'westToEast'
      ? pos
      : this._width - pos
    );
  }

  protected _tickLabelY(index: number) {
    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    const facet = (this.paraview.store.model as PlaneModel).getAxisFacet(this.axis.orientation)
       ?? this.paraview.store.model!.getFacet(this.axis.orientation === 'horiz' ? 'x' : 'y')!;
    // const tickLen = facet!.variableType === 'independent'
    //   ? this.paraview.store.settings.axis.x.tick.length
    //   : this.paraview.store.settings.axis.y.tick.length;
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'north'
    ? this.height // - this._children[index].height
    : 0; //tickLen;
  }

  createTickLabels(checkLabels = true) {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
      // XXX this causes the label size to change, which causes
      // _childDidResize() to get called, which recreates the labels ...
      if (this.paraview.store.settings.axis.horiz.tick.tickLabel.angle) {
        this._ignoreChildResize = true;
        kid.angle = this.axis.orientationSettings.tick.tickLabel.angle;
        this._ignoreChildResize = false;
      }
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
    if (checkLabels) {
      const { width, tickStep } = this._optimizeLabelSpacing();
      this._tickStep = tickStep;
      console.log('SET TIER LENGTH', width);
      this._width = width;
      //this._adjustToSizeConstraint();
      // this.setLength(width, false);
    }
    //this._checkLabelSpacing();
  }

  // protected _checkLabelSpacing() {
  //   const gaps = this._children.slice(1).map((label, i) => label.left - this._children[i].right);
  //   const minGap = Math.min(...gaps);
  //   if (Math.round(minGap) < this.axis.orientationSettings.tick.tickLabel.gap) {
  //     // The actual labels won't have equal gaps between them, since the
  //     // labels themselves won't all be the same size. But if I space them
  //     // out so that they are equally spaced, the largest anchor gap between
  //     // any adjacent pair of labels can be used as the x tick
  //     // interval required for all labels to have a gap of at least the
  //     // desired size.
  //     const anchorGaps: number[] = [];
  //     this._children.slice(1).forEach((label, i) => {
  //       // NB: Even if the anchor is set to middle, the labels may be rotated, so
  //       // the anchor will no longer be in the middle of the bbox
  //       label.left = this._children[i].right + this.axis.orientationSettings.tick.tickLabel.gap;
  //       anchorGaps.push(label.x - this._children[i].x);
  //     });
  //     const largestAnchorGap = Math.max(...anchorGaps);

  //     // The labels may actually extend a bit past the start and end points of
  //     // the x-axis, so we take that into account when computing the preferred width
  //     // of the chart content
  //     const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
  //     const preferredWidth = largestAnchorGap*(n/this._tickStep);
  //     if (preferredWidth > 800 && this.axis.datatype !== 'string') {
  //       const newTickStep = this._tickStep + 1;
  //       const newNumLabels = Math.floor(this.tickLabels.length/newTickStep) + this.tickLabels.length % newTickStep;
  //       if (!newNumLabels) {
  //         throw new Error('chart always too dense or too wide');
  //       }
  //       throw new ChartTooWideError(newTickStep);
  //     }
  //     throw new ChartTooDenseError(preferredWidth);
  //   }
  // }

  protected _packLabelBboxes(bboxes: DOMRect[], anchorOffsets: number[], tickStep: number) {
    // The actual labels won't have equal gaps between their bboxes, since the
    // labels themselves won't all be the same size. But if we space them
    // out with equal gaps, the largest anchor gap between
    // any adjacent pair of labels can be used as the x tick
    // interval required for all labels to have a gap of at least the
    // desired size.
    const anchorGaps: number[] = [];
    bboxes.slice(1).forEach((bbox, i) => {
      const newLeft = bboxes[i].right + this.axis.orientationSettings.tick.tickLabel.gap;
      anchorGaps.push(newLeft + anchorOffsets[i + 1] - bboxes[i].left - anchorOffsets[i]);
      bboxes[i + 1] = new DOMRect(newLeft, bbox.y, bbox.width, bbox.height);
    });
    const n = this.axis.isInterval ? this.tickLabels.length : this.tickLabels.length - 1;
    return Math.max(...anchorGaps)*(n/tickStep);
  }

  protected _optimizeLabelSpacing(): {width: number, tickStep: number} {
    console.log('OPTIMIZE');
    const origBboxes = this._children.map(kid => kid.bbox);
    let bboxes = [...origBboxes];
    console.log('BBOXES', bboxes);
    const anchorOffsets = this._children.map(kid => kid.locOffset.x);

    let tickStep = this._tickStep;
    let width = this._width;
    while (true) {
      const gaps = bboxes.slice(1).map((bbox, i) => bbox.left - bboxes[i].right);
      const minGap = Math.min(...gaps);
      console.log('MINGAP', minGap, 'TICKSTEP', tickStep, 'WIDTH', width,
        `(WANTED: ${this.axis.orientationSettings.tick.tickLabel.gap})`
      );
      width = this._packLabelBboxes(bboxes, anchorOffsets, tickStep);
      if (Math.round(minGap) < this.axis.orientationSettings.tick.tickLabel.gap) {
        if (width > 800 && this.axis.datatype !== 'string') {
          tickStep++;
          bboxes = origBboxes.filter((bbox, i) => i % tickStep === 0);
          const newNumLabels = Math.floor(this.tickLabels.length/tickStep) + this.tickLabels.length % tickStep;
          if (!newNumLabels) {
            throw new Error('chart always too dense or too wide');
          }
          continue;
        }
        continue;
      }
      break;
    }
    return { width, tickStep };
  }

  protected _getTickStepForWidth(width: number): number {
    const origBboxes = this._children.map(kid => kid.bbox);
    const anchorOffsets = this._children.map(kid => kid.locOffset.x);
    let tickStep = 1;
    while (true) {
      const bboxes = origBboxes.filter((bbox, i) => i % tickStep === 0);
      const packedWidth = this._packLabelBboxes(bboxes, anchorOffsets, tickStep);
      if (packedWidth > width && bboxes.length > 1) {
        tickStep++;
      } else {
        break;
      }
    }
    return tickStep;
  }

  protected _childDidResize(_kid: View) {
    if (this._ignoreChildResize) {
      return;
    }
    if (++this._childResizeCount === this._children.length) {
      this._childResizeCount = 0;
      this._tickStep = this._getTickStepForWidth(this._width);
      console.log('TICK STEP', this._tickStep);
      // Recreate the labels with the new tick step without changing the width
      // this.setLength(this._width, false);
      //this._adjustToSizeConstraint();
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
    tickStep: number,
    paraview: ParaView
  ) {
    super(axis, tickLabels, tierIndex, length, tickStep, paraview);
    this._canHeightFlex = true;
    this.padding = {right: this.axis.orientationSettings.tick.tickLabel.offsetGap};
  }

  protected _updateSizeFromLength(length: number) {
    console.log('SET SIZE TO', length);
    this._height = length;
  }

  protected get _length() {
    return this._height;
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return 'end';
  }

  protected get _labelWrapWidth() {
    return undefined;
  }

  // setLength(length: number) {
  //   this.height = length;
  //   super.setLength(length);
  // }

  computeSize(): [number, number] {
    return [this._maxLabelWidth(), this._height];
  }

  protected _tickLabelX(index: number) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'west'
      ? this.width //- this._children[index].width
      : 0;
  }

  protected _tickLabelY(index: number) {
    const pos = this._labelDistance*index;
    const y = (this.axis.orientationSettings.labelOrder === 'northToSouth'
        ? pos + this._labelDistance/2 + this._children[index].height/3
        : this.height - pos + this._children[index].height/3);
    return y;
  }

  createTickLabels() {
    super.createTickLabels();
    // We need to compute the width before setting the label xs,
    // and we don't need the xs to compute the width
    this.updateSize(false);
    this._children.forEach((kid, i) => {
        kid.x = this._tickLabelX(i);
        kid.y = this._tickLabelY(i);
    });
  }

}
