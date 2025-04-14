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
import { type Axis, type VertAxis, type AxisOrientation } from './axis';
import { Label } from './label';
import { type TickStrip, HorizTickStrip, VertTickStrip } from './tickstrip';

import { svg, type TemplateResult } from 'lit';

export interface TickLabelTierSlot {
  pos: number;
  text: string;
  id: string;
  label?: Label;
}

/**
 * A single tier of tick labels.
 */
export abstract class TickLabelTier<T extends AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;

  textHoriz?: boolean;

  constructor(public readonly axis: Axis<T>,
    public readonly slots: TickLabelTierSlot[],
    protected _maxSlotSize: number
  ) {
    super();
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

  addSlot(slot: TickLabelTierSlot) {
    this.slots.push(slot);
  }

  maxWidth() {
    return Math.max(...this.slots.map(slot => slot.label?.width ?? 0));
  }

  maxHeight() {
    return Math.max(...this.slots.map(slot => slot.label?.height ?? 0));
  }

  computeLayout() {
    console.log('compute layout', this.slots)
    // FIXME: slots should always have members, label should never be undefined
    this.textHoriz = this.slots.length > 1 && this.slots[0].label !== undefined ? !this.slots[0].label!.angle : false;
  }

  createTickLabels() {
    for (const [i, slot] of this.slots.entries()) {
      if (i % this.axis.settings.tick.step) {
        continue;
      }
      slot.label = new Label({
        id: slot.id,
        classList: [
          'tick-label', this.axis.orientation, 
          this.axis.orientationSettings.position as string],
        role: 'axislabel',
        text: slot.text,
        //axis: this._axis!.orientation,
        x: 0,
        y: 0,
        // textAnchor: this.slotLabelTextAnchor(slot)
      }, this.axis.docView.paraview);
      this.append(slot.label);
    }
  }

  protected abstract _slotLabelX(slot: TickLabelTierSlot): number;

  protected abstract _slotLabelY(slot: TickLabelTierSlot): number;

  // protected abstract slotLabelTextAnchor(slot: TickLabelTierSlot): LabelTextAnchor;

  // setLabelYs(y: number) {
  //   for (const slot of this.slots) {
  //     if (slot.label) {
  //       slot.label.y = y;
  //     }
  //   }
  // }

  abstract tickStrip(): TickStrip<T>;

}

/**
 * A horizontal tier of tick labels.
 */
export class HorizTickLabelTier extends TickLabelTier<'horiz'> {

  computeSize(): [number, number] {
    return [this.axis.width, this.textHoriz ? this.maxHeight() : this.maxWidth()];
  }

  protected _slotLabelX(slot: TickLabelTierSlot) {
    return (this.axis.orientationSettings.labelOrder === 'westToEast' ? 
      slot.pos : this.width - slot.pos) - slot.label!.anchorXOffset;
  }

  protected _slotLabelY(slot: TickLabelTierSlot) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'north'
    ? this.height - slot.label!.height 
    : 0;  
  }

  // protected slotLabelTextAnchor(slot: TickLabelTierSlot): LabelTextAnchor {
  //   return 'start';
  // }

  createTickLabels() {
    super.createTickLabels();
    // const tooWide = this.slots.some(slot => slot.label && slot.label.width > this.maxSlotSize);
    this.slots.forEach(slot => {
      if (slot.label) {
        slot.label.angle = this.axis.settings.tick.tickLabel.angle;
        //slot.label.x += slot.label.height / 3;
        slot.label.x = this._slotLabelX(slot);
        slot.label.y = this._slotLabelY(slot);
        //slot.label.y += this.axis.settings.tick.tickLabel.offsetPadding;
        // slot.label.classList.push('rotated');
      }
    });
  }

  tickStrip() {
    return new HorizTickStrip(this.axis, this._maxSlotSize, 1);
  }

}

/**
 * A vertical tier of tick labels.
 */
export class VertTickLabelTier extends TickLabelTier<'vert'> {

  declare public readonly axis: VertAxis;

  computeSize(): [number, number] {
    return [this.maxWidth(), this.axis.height];
  }

  protected _slotLabelX(slot: TickLabelTierSlot) {
    // Right-justify if west, left-justify if east;
    return this.axis.orientationSettings.position === 'west'
      ? this.width - slot.label!.width 
      : 0;
  }

  protected _slotLabelY(slot: TickLabelTierSlot) {
    return (this.axis.orientationSettings.labelOrder === 'northToSouth'
        ? slot.pos 
        : this.height - slot.pos)
      - slot.label!.anchorYOffset*2/3;
  }

  // protected slotLabelTextAnchor(slot: TickLabelTierSlot): LabelTextAnchor {
  //   return this.axis.orientationSettings.position === 'east' ? 'start' : 'end';
  // }

  createTickLabels() {
    super.createTickLabels();
    this.slots.forEach(slot => {
      if (slot.label) {
        //slot.label.y += slot.label.height/3;
        slot.label.x = this._slotLabelX(slot);
        slot.label.y = this._slotLabelY(slot);
      }
    });
  }

  tickStrip() {
    return new VertTickStrip(this.axis, this._maxSlotSize, 1);
  }

}
