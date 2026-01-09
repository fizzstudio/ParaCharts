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

import { Logger, getLogger } from '@fizz/logger';
import { View, Container } from '../base_view';
import { type Layout } from '../layout';
import { type Axis, type AxisOrientation } from './axis';
import { Label, type LabelTextAnchor } from '../label';
import { ParaView } from '../../paraview';

import { type TemplateResult } from 'lit';
import { Vec2 } from '../../common/vector';
import { PlaneModel } from '@fizz/paramodel';
import { Popup } from '../popup';

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
    protected _tickStep: number,
    paraview: ParaView
  ) {
    super(paraview);
    this._updateSizeFromLength(length);
    this.createTickLabels();
  }

  protected abstract _updateSizeFromLength(length: number): void;

  resize(width: number, height: number) {
    super.resize(width, height);
    this.createTickLabels();
  }

  protected abstract get _length(): number;

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
    const n = this.axis.isInterval
      ? this.tickLabels.length
      : this.tickLabels.length - 1;
    this._labelDistance = this._length/(n/this._tickStep);
    this.clearChildren();
    for (const [i, labelText] of this.tickLabels.entries()) {
      if (i % this._tickStep) {
        continue;
      }
      const label = new Label(this.paraview, {
        id: `tick-label-${this.axis.orientation}-${i}`,
        classList: [
          'tick-label', `tick-label-${this.axis.orientation}`,
          this.axis.orientationSettings.position as string],
        role: 'axislabel',
        text: labelText,
        textAnchor: this._labelTextAnchor,
        wrapWidth: this._labelWrapWidth,
        x: 0,
        y: 0,
        pointerEnter: (e) => {
          this.paraview.store.settings.chart.isShowPopups
            && this.paraview.store.settings.popup.activation === "onHover"
            && !this.paraview.store.settings.ui.isNarrativeHighlightEnabled ? this.addPopup(labelText, i) : undefined;
        },
        pointerLeave: (e) => {
          this.paraview.store.settings.chart.isShowPopups
            && this.paraview.store.settings.popup.activation === "onHover"
            && !this.paraview.store.settings.ui.isNarrativeHighlightEnabled ? this.paraview.store.removePopup(this.id) : undefined;
        }
      });
      this.append(label);
    }
  }

  addPopup(text: string, index: number): void{}

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
    this.log = getLogger("HorizTickLabelTier");
    this._canWidthFlex = true;
    this.padding = {top: this.axis.orientationSettings.ticks.labels.offsetGap};
  }

  protected _updateSizeFromLength(length: number) {
    this._width = length;
  }

  protected get _length(): number {
    return this._width;
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return this.axis.orientationSettings.ticks.labels.angle ? 'end' : 'middle';
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
      if (this.paraview.store.settings.axis.horiz.ticks.labels.angle) {
        kid.angle = this.axis.orientationSettings.ticks.labels.angle;
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
      this._tickStep = this._optimizeLabelSpacing();
      this.createTickLabels(false);
    }
  }

  protected _optimizeLabelSpacing(): number {
    const origBboxes = this._children.map(kid => kid.bbox);
    let bboxes = [...origBboxes];
    const anchorOffsets = this._children.map(kid => kid.locOffset.x);

    let tickStep = this._tickStep;
    let width = this._width;
    while (true) {
      const gaps = bboxes.slice(1).map((bbox, i) => bbox.left - bboxes[i].right);
      const minGap = Math.min(...gaps);
      // this.log.info('MINGAP', minGap, 'TICKSTEP', tickStep, 'WIDTH', width,
      //   `(WANTED: ${this.axis.orientationSettings.tick.tickLabel.gap})`
      // );
      if (Math.round(minGap) < this.axis.orientationSettings.ticks.labels.gap) {
        // if (width > 800 && this.axis.datatype !== 'string') {
        tickStep++;
        bboxes = origBboxes.filter((bbox, i) => i % tickStep === 0);
        const newLabelCount = Math.floor(this.tickLabels.length/tickStep) + this.tickLabels.length % tickStep;
        if (!newLabelCount) {
          throw new Error('tick labels will always overlap');
        }
        continue;
        // }
        // continue;
      }
      break;
    }
    return tickStep;
  }

  addPopup(text?: string, index?: number) {
    let datapointText = `no text detected`
    const regFactor = (this.tickLabels.length % this.children.length == 0)
      ? this.children.length / this.tickLabels.length
      : (this.children.length) / (this.tickLabels.length + 1)
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: this._tickLabelX(index ?? 0) * regFactor,
        y: this.paraview.documentView?.chartLayers.height!,
        id: this.id,
        type: "horizTick",
        fill: "hsl(0, 0%, 0%)",
        inbounds: false
      },
      {
        fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    this.paraview.store.popups.push(popup)
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
    this.padding = {right: this.axis.orientationSettings.ticks.labels.offsetGap};
  }

  protected _updateSizeFromLength(length: number) {
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

  addPopup(text?: string, index?: number) {
    let datapointText = `no text detected`
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: this._tickLabelX(index ?? 0) + 15,
        y: this._tickLabelY(index ?? 0) + this.paraview.store.settings.popup.margin - this.children[index ?? 0].height ,
        id: this.id,
        type: "vertTick",
        fill: "hsl(0, 0%, 0%)",
        inbounds: false
      },
      {
        fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    this.paraview.store.popups.push(popup)
  }


}
