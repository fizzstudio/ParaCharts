/* ParaCharts: Tick Label Tier
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
import { OrientedAxisSettings } from '../../state';
import { Datatype } from '@fizz/paramanifest';

export interface TickLabelTierOptions {
  orientation: AxisOrientation;
  labels: readonly string[];
  index: number;
  length: number;
  step: number;
  // mainStep: number;
  numTicks: number;
  isChartIntertick: boolean;
  datatype: Datatype;
  isFacetIndep: boolean;
}

/**
 * A single tier of tick labels.
 */
export abstract class TickLabelTier extends Container(View) {
  declare protected _parent: Layout;
  declare protected _children: Label[];

  /** Distance between label centers (or starts or ends) */
  protected _labelDistance!: number;

  constructor(
    paraview: ParaView,
    protected _axisSettings: OrientedAxisSettings<AxisOrientation>,
    protected _options: TickLabelTierOptions
  ) {
    super(paraview);
    this._updateSizeFromLength(this._options.length);
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
    return `tick-label-tier-${this._options.orientation}-${this._options.index}`;
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
    const n = (this._options.isChartIntertick && this._options.isFacetIndep)
      ? this._options.labels.length
      : this._options.labels.length - 1;
    this._labelDistance = this._length/(n/this._options.step);
    this.clearChildren();
    for (const [i, labelText] of this._options.labels.entries()) {
      if (i % this._options.step) {
        continue;
      }
      const label = new Label(this.paraview, {
        id: `tick-label-${this._options.orientation}-${i}`,
        classList: [
          'tick-label', `tick-label-${this._options.orientation}`,
          this._axisSettings.position as string],
        role: 'axislabel',
        text: labelText,
        textAnchor: this._labelTextAnchor,
        wrapWidth: this._labelWrapWidth,
        x: 0,
        y: 0,
        pointerEnter: (e) => {
          if (!labelText) return;
          this.paraview.paraState.settings.chart.isShowPopups
            && this.paraview.paraState.settings.popup.activation === "onHover"
            && !this.paraview.paraState.settings.ui.isNarrativeHighlightEnabled ? this.addPopup(labelText, i) : undefined;
        },
        pointerLeave: (e) => {
          if (!labelText) return;
          this.paraview.paraState.settings.chart.isShowPopups
            && this.paraview.paraState.settings.popup.activation === "onHover"
            && !this.paraview.paraState.settings.ui.isNarrativeHighlightEnabled ? this.paraview.paraState.removePopup(this.id) : undefined;
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
export class HorizTickLabelTier extends TickLabelTier {
  constructor(
    paraview: ParaView,
    axisSettings: OrientedAxisSettings<AxisOrientation>,
    options: TickLabelTierOptions,
  ) {
    super(paraview, axisSettings, options);
    this.log = getLogger('HorizTickLabelTier');
    this._canWidthFlex = true;
    this.padding = {top: this._axisSettings.ticks.labels.offsetGap};
  }

  protected _updateSizeFromLength(length: number) {
    this._width = length;
  }

  protected get _length(): number {
    return this._width;
  }

  protected get _labelTextAnchor(): LabelTextAnchor {
    return this._axisSettings.ticks.labels.angle ? 'end' : 'middle';
  }

  protected get _labelWrapWidth() {
    return this._axisSettings.isWrapLabels ? this._labelDistance : undefined;
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
    const isXIntertick = this._options.isChartIntertick && this._options.isFacetIndep;
    const tickDelta = this._length/(this._options.numTicks - (isXIntertick ? 0 : 1));
    const offset = isXIntertick ? 2 : 1.5;
    let pos = (this._options.index && this._options.datatype === 'date')
      ? 4*tickDelta*index + offset*tickDelta
      : this._labelDistance*index; // + this._labelDistance/2;
    if (isXIntertick && (!this._options.index || this._options.datatype !== 'date')) {
      pos += (this._labelDistance/this._options.step)/2;
    }
    return (this._axisSettings.labelOrder === 'westToEast'
      ? pos
      : this._width - pos
    );
  }

  protected _tickLabelY(index: number) {
    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    const facet = (this.paraview.paraState.model as PlaneModel).getAxisFacet(this._options.orientation)
       ?? this.paraview.paraState.model!.getFacet(this._options.orientation === 'horiz' ? 'x' : 'y')!;
    // const tickLen = facet!.variableType === 'independent'
    //   ? this.paraview.paraState.settings.axis.x.tick.length
    //   : this.paraview.paraState.settings.axis.y.tick.length;
    // Right-justify if west, left-justify if east;
    return this._axisSettings.position === 'north'
    ? this.height // - this._children[index].height
    : 0; //tickLen;
  }

  createTickLabels(checkLabels = true) {
    super.createTickLabels();
    this._children.forEach((kid, i) => {
      if (this.paraview.paraState.settings.axis.horiz.ticks.labels.angle) {
        kid.angle = this._axisSettings.ticks.labels.angle;
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
    if (checkLabels && this._options.datatype !== 'string') {
      this._options.step = this._optimizeLabelSpacing();
      this.createTickLabels(false);
    }
  }

  protected _optimizeLabelSpacing(): number {
    const origBboxes = this._children.map(kid => kid.bbox);
    let bboxes = [...origBboxes];
    const anchorOffsets = this._children.map(kid => kid.locOffset.x);

    let tickStep = this._options.step;
    let width = this._width;
    while (true) {
      const gaps = bboxes.slice(1).map((bbox, i) => bbox.left - bboxes[i].right);
      const minGap = Math.min(...gaps);
      // this.log.info('MINGAP', minGap, 'TICKSTEP', tickStep, 'WIDTH', width,
      //   `(WANTED: ${this.axis.orientationSettings.tick.tickLabel.gap})`
      // );
      if (Math.round(minGap) < this._axisSettings.ticks.labels.gap) {
        // if (width > 800 && this.axis.datatype !== 'string') {
        tickStep++;
        bboxes = origBboxes.filter((bbox, i) => i % tickStep === 0);
        const newLabelCount = Math.floor(this._options.labels.length/tickStep) + this._options.labels.length % tickStep;
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
    const regFactor = (this._options.labels.length % this.children.length == 0)
      ? this.children.length / this._options.labels.length
      : (this.children.length) / (this._options.labels.length + 1)
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
    this.paraview.paraState.popups.push(popup)
  }
}

/**
 * A vertical tier of tick labels.
 */
export class VertTickLabelTier extends TickLabelTier {

  constructor(
    paraview: ParaView,
    axisSettings: OrientedAxisSettings<AxisOrientation>,
    options: TickLabelTierOptions
  ) {
    super(paraview, axisSettings, options);
    this._canHeightFlex = true;
    this.padding = {right: this._axisSettings.ticks.labels.offsetGap};
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
    return this._axisSettings.position === 'west'
      ? this.width //- this._children[index].width
      : 0;
  }

  protected _tickLabelY(index: number) {
    const tickDelta = this._length/(this._options.numTicks - (this._options.isChartIntertick ? 0 : 1));
    const offset = this._options.isChartIntertick ? 2 : 1.5;
    let pos = /*this.tierIndex
      ? 4*tickDelta*index + offset*tickDelta
      :*/ this._labelDistance*index; // + this._labelDistance/2;
    const y = (this._axisSettings.labelOrder === 'northToSouth'
        ? pos + this._labelDistance/2 + this._children[index].height/3
        : this.height - pos + this._children[index].height/3);
    return y;
  }

  // protected _tickLabelX(index: number) {
  //   const tickDelta = this._length/(this._numTicks - (this.axis.isInterval ? 0 : 1));
  //   const offset = this.axis.isInterval ? 2 : 1.5;
  //   let pos = this.tierIndex
  //     ? 4*tickDelta*index + offset*tickDelta
  //     : this._labelDistance*index; // + this._labelDistance/2;
  //   if (this.axis.isInterval && !this.tierIndex) {
  //     pos += (this._labelDistance/this._tickStep)/2;
  //   }
  //   return (this.axis.orientationSettings.labelOrder === 'westToEast'
  //     ? pos
  //     : this._width - pos
  //   );
  // }


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
        y: this._tickLabelY(index ?? 0) + this.paraview.paraState.settings.popup.margin - this.children[index ?? 0].height ,
        id: this.id,
        type: "vertTick",
        fill: "hsl(0, 0%, 0%)",
        inbounds: false
      },
      {
        fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    this.paraview.paraState.popups.push(popup)
  }


}
