/* ParaCharts: Axes
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

import { Container, View } from './base_view';
import { ColumnLayout, RowLayout, type Layout, type Spacer, RowSpacer, ColumnSpacer } from './layout';
import { type DocumentView } from './document_view';
//import { SettingManager } from '../../settings/settingman';
import { type ChartLayerManager } from './chartlayermanager';
import {
  type Setting,
  type AxisSettings,
  type OrientedAxisSettings,
  type DeepReadonly
} from '../store/settings_types';
import { Label } from './label';
import { type AxisLine, HorizAxisLine, VertAxisLine } from './axisline';
import { type TickLabelTier } from './ticklabeltier';
import { type TickStrip } from './tickstrip';

import { mapn } from '@fizz/chart-classifier-utils';
import { type Datatype, type Scalar } from '@fizz/dataframe';

import { type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import Decimal from 'decimal.js';

export type AxisOrientation = 'horiz' | 'vert';
export type AxisCoord = 'x' | 'y';
export type OrthoAxis<T> = T extends 'horiz' ? 'vert' : 'horiz';

export interface AxisLabelInfo<T extends Scalar = Scalar> {
  min?: T;
  max?: T;
  range?: T;
  interval?: T;
  labels: string[];
  maxChars: number;
}

export abstract class Axis<T extends AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;

  //readonly settingGroup: string;
  readonly settings: DeepReadonly<AxisSettings>;
  readonly orientationSettings: DeepReadonly<OrientedAxisSettings<T>>;

  readonly datatype: Datatype;

  readonly chartLayers: ChartLayerManager;
  readonly coord: AxisCoord;

  protected _layout!: Layout;
  protected _titleText: string;
  protected _orthoAxis!: Axis<OrthoAxis<T>>;
  protected _axisTitle?: Label;
  protected _spacer!: Spacer;
  protected _tickLabelTiers: TickLabelTier<T>[] = [];
  protected _tickStrip!: TickStrip;
  protected _axisLine!: AxisLine<T>;
  //protected _range?: Interval;

  static computeNumericLabels(
    start: number, end: number, isPercent: boolean, isGrouping = true
  ): AxisLabelInfo<number> {
    const minDec = new Decimal(start);
    const maxDec = new Decimal(end);
    const diff = maxDec.sub(minDec);
    const interval = diff.div(10);
    let quantizedInterval: Decimal, quantizedMin: Decimal, quantizedMax: Decimal;
    //if (interval.lt(1)) {
    //  quantizedInterval = new Decimal(2).pow(interval.log(2).ceil());
    //  quantizedMin = minDec.div(quantizedInterval).floor().mul(quantizedInterval);
    //  quantizedMax = maxDec.div(quantizedInterval).ceil().mul(quantizedInterval);
    //} else {
    quantizedInterval = new Decimal(10).pow(interval.log(10).ceil());
    // while (quantizedInterval.div(diff).gte(0.25) && +quantizedInterval.mod(10) === 0) {
    //   quantizedInterval = quantizedInterval.div(2);
    // }
    if (quantizedInterval.div(diff).gte(0.8)) {
      quantizedInterval = quantizedInterval.div(10);
    } else if (quantizedInterval.div(diff).gte(0.5)) {
      quantizedInterval = quantizedInterval.div(4);
    } else if (quantizedInterval.div(diff).gte(0.2)) {
      quantizedInterval = quantizedInterval.div(2);
    }
    quantizedMin = minDec.div(quantizedInterval).floor().mul(quantizedInterval);
    quantizedMax = maxDec.div(quantizedInterval).ceil().mul(quantizedInterval);
    //}
    const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5, useGrouping: isGrouping });
    const labels = mapn(quantizedMax.sub(quantizedMin).div(quantizedInterval).toNumber() + 1,
      i => fmt.format(+quantizedMin.add(quantizedInterval.mul(i))) + (isPercent ? '%' : ''));
    return {
      min: quantizedMin.toNumber(),
      max: quantizedMax.toNumber(),
      range: quantizedMax.sub(quantizedMin).toNumber(),
      interval: quantizedInterval.toNumber(),
      labels,
      maxChars: Math.max(...labels.map(l => l.length))
    };
  }

  constructor(
    public readonly docView: DocumentView, 
    public readonly orientation: T, 
    vars: readonly string[], 
    title?: string
  ) {
    super();
    this.chartLayers = docView.chartLayers;
    this.coord = vars[0] === docView.
    todo().controller.model!.indepVar ? 'x' : 'y';
    //this.settingGroup = `axis.${this.coord}`;
    this.settings = todo().controller.settingStore.getGroupLink<AxisSettings>(this.managedSettingKeys[0]);
    this.orientationSettings = todo().controller.settingStore.getGroupLink<OrientedAxisSettings<T>>(`axis.${orientation}`);
    todo().controller.registerSettingManager(this);
    this.datatype = todo().controller.model!.data.col(vars[0]).dtype;

    this._titleText = title ?? this.settings.title.text ?? '';
  }

  protected _createId() { 
    return `${this.coord}-axis`;
  }

  isHoriz(): this is Axis<'horiz'> {
    return this.orientation === 'horiz';
  }

  isVert(): this is Axis<'vert'> {
    return this.orientation === 'vert';
  }

  get asHoriz(): Axis<'horiz'> {
    if (this.isHoriz()) {
      return this;
    }
    throw new Error('axis is not horizontal');
  }

  get asVert(): Axis<'vert'> {
    if (this.isVert()) {
      return this;
    }
    throw new Error('axis is not vertical');
  }

  get managedSettingKeys() {
    return [`axis.${this.coord}`];
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: Layout) {
    super.parent = parent;
  }

  get role() {
    return 'graphics-object';
  }

  get roleDescription() {
    return `${this.coord}-axis`;
  }

  get extraAttrs() {
    return [
      {
        attr: literal`data-axistype`,
        value: this.datatype
      }
    ];
  }

  get viewGroup() {
    return this._layout;
  }

  get titleText() {
    return this._titleText;
  }

  get range() {
    return this.chartLayers.getAxisInterval(this.coord);
  }

  get orthoAxis() {
    return this._orthoAxis;
  }

  set orthoAxis(orthoAxis: Axis<OrthoAxis<T>>) {
    this._orthoAxis = orthoAxis;
  }

  abstract settingDidChange(key: string, value: Setting | undefined): boolean;

  abstract setPosition(): void;

  createComponents() {
    if (this.settings.title.isDrawTitle && this._titleText) {
      this._createAxisTitle();
      this._createSpacer();
    }
    this._tickLabelTiers = this.chartLayers.getTickLabelTiers(this);
    this._tickLabelTiers.forEach(tier => this._layout.append(tier));
    this._tickStrip = this._tickLabelTiers[0].tickStrip();
    this._layout.append(this._tickStrip);
    this._createTickLabels();
    this._createAxisLine();
    // XXX is this necessary?
    this._updateSize();
  }

  layoutComponents() {
    this._layout.layoutViews();
  }

  protected abstract _createAxisLine(): void;

  protected _createTickLabels() {
    for (const tier of this._tickLabelTiers) {
      tier.createTickLabels();
    }
  }

  setAxisLabelText(text?: string) {
    this._titleText = text ?? this.settings.title.text ?? '';
    if (this._axisTitle) {
      this._axisTitle.text = this._titleText;
    }
  }

  protected abstract _createSpacer(): void;

  protected _createAxisTitle() {
    this._axisTitle = new Label({
      text: this.titleText,
      classList: ['axis-title'],
      role: 'heading',
      x: 0,
      y: 0,
      angle: this._getAxisTitleAngle()
    });
    this._layout.append(this._axisTitle);
  }

  protected _getAxisTitleAngle() {
    return 0;
  }

  cleanup() {

  }

}

/**
 * A horizontal axis.
 * @internal
 */
export class HorizAxis extends Axis<'horiz'> {

  constructor(docView: DocumentView, title?: string) {
    const orientation = todo().controller.settingStore.settings.chart.orientation;
    super(docView, 'horiz',
      orientation === 'north' || orientation === 'south' ?
      [todo().controller.model!.indepVar] : todo().controller.model!.depVars,
      title);
    this._layout = new ColumnLayout(0, 'center', 'horiz-axis-group');
    this.append(this._layout);
  }

  computeSize(): [number, number] {
    return [
      this.chartLayers.orientation === 'north' || this.chartLayers.orientation === 'south' ? 
        this.chartLayers.contentWidth : this.chartLayers.physWidth,
      this._layout.height
    ];
  }

  settingDidChange(key: string, value: any) {
    todo().controller.clearSettingManagers();
    todo().canvas.createDocumentView();
    todo().canvas.requestUpdate();
    return true;
  }

  protected _createAxisLine() {
    this._axisLine = new HorizAxisLine(this);
    this._layout.append(this._axisLine);
  }

  protected _createSpacer() {
    this._spacer = new ColumnSpacer(this.settings.title.gap);
    this._layout.append(this._spacer);
  }

  layoutComponents() {
    this._tickLabelTiers.forEach(tier => tier.computeLayout());

    //this.axisLabel!.x =  this.width/2; 
    if (this.orientationSettings.position === 'south') {
      this._layout.reverseChildren();
      //this.axisLine.y = 0;
      //this.tickStrip.y = 0;
      // let y = this.tickStrip.height;
      // if (this._tickLabelTiers[0].textHoriz) {
      //   y += this._tickLabelTiers[0].height;
      // }
      // let prevTier: TickLabelTier<'horiz'> | null = null;
      // this._tickLabelTiers.forEach(tier => {
      //   y += prevTier?.height ?? 0;
      //   if (tier.textHoriz && prevTier && !prevTier.textHoriz) {
      //     // Translation center is on baseline, so add our height to avoid overlap
      //     y += tier.height;
      //   }
      //   prevTier = tier;
      //   tier.y = y;
      // });
      // this.axisLabel!.y = this._tickLabelTiers.at(-1)!.bottom + 
      //   this.axisLabel!.height + this.settings.label.marginTop;
    } else {
      // this.axisLabel!.y = this.axisLabel!.height + this.settings.label.marginTop; // y = baseline
      // let y = this.axisLabel!.y + this.settings.label.marginBottom + this._tickLabelTiers.at(-1)!.height;
      // let prevTier: TickLabelTier<'horiz'> | null = null;
      // this._tickLabelTiers.toReversed().forEach(tier => {
      //   y += prevTier?.height ?? 0;
      //   if (tier.textHoriz && prevTier && !prevTier.textHoriz) {
      //     // Translation center is on baseline, so add our height to avoid overlap
      //     y += tier.height;
      //   }
      //   prevTier = tier;
      //   tier.y = y;
      // });
      // let tickLabelsBottom = this._tickLabelTiers[0].y;
      // if (!this._tickLabelTiers.at(-1)!.textHoriz) {
      //   // text anchor is `start`
      //   tickLabelsBottom = this._tickLabelTiers[0].y;
      // }
      // this.tickStrip.y = tickLabelsBottom; // + this.settings.tick.padding;
      // this.axisLine.y = this.tickStrip.bottom;
    }
    super.layoutComponents();
  }

  setPosition() {
    // this.x = this.docView.controller.settingStore.settings.chart.padding;
    // this.y = this.orientationSettings.position === 'north' ? 
    //   this.docView.controller.settingStore.settings.chart.padding :
    //   this.chartLayers.physHeight + this.docView.controller.settingStore.settings.chart.padding;
    // if (this.orthoAxis.orientationSettings.position === 'west') {
    //   this.x += this.docView.vertAxis!.width;
    // }
  }

}

/**
 * A vertical axis.
 * @internal
 */
export class VertAxis extends Axis<'vert'> {

  constructor(docView: DocumentView, title?: string) {
    const orientation = todo().controller.settingStore.settings.chart.orientation;
    super(docView, 'vert',
      orientation === 'east' || orientation === 'west' ?
      [todo().controller.model!.indepVar] : todo().controller.model!.depVars, 
      title);
    this._layout = new RowLayout(0, 'center', 'vert-axis-group');
    this.append(this._layout);
  }

  protected _addedToParent() {
    super._addedToParent();
    const range = this.chartLayers.getYAxisInterval();
    todo().controller.settingViews.add(this, {
      type: 'textfield',
      key: 'axis.y.minValue',
      label: 'Min y-value',
      options: { inputType: 'number' },
      value: this.settings.minValue ?? range?.start,
      validator: value => {
        const max = todo().controller.settingViews.value<number>('axis.y.maxValue');
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values. 
        return value as number >= max ?
          { err: `Min y-value (${value}) must be less than max (${max})` } : {};
      },
      parentView: 'chartDetails.tabs.chart.general',
    });
    todo().controller.settingViews.add(this, {
      type: 'textfield',
      key: 'axis.y.maxValue',
      label: 'Max y-value',
      options: { inputType: 'number' },
      value: this.settings.maxValue ?? range?.end,
      validator: value => {
        const min = todo().controller.settingViews.value<number>('axis.y.minValue');
        return value as number <= min ?
          { err: `Max y-value (${value}) must be greater than min (${min})` } : {};
      },
      parentView: 'chartDetails.tabs.chart.general',
    });  
  }

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this.chartLayers.orientation === 'east' || this.chartLayers.orientation === 'west' ? 
        this.chartLayers.contentWidth : this.chartLayers.physHeight
    ];
  }

  settingDidChange(key: string, value: any) {
    //this._settings[key] = value;
    todo().controller.clearSettingManagers();
    todo().canvas.createDocumentView();
    todo().canvas.requestUpdate();
    // Changing one axis bound may cause the other to change due to
    // quantization, and this needs to get reflected in the UI.
    todo().deets!.requestUpdate();
    return true;
  }

  protected _createAxisLine() {
    this._axisLine = new VertAxisLine(this);
    this._layout.append(this._axisLine);
  }

  protected _createSpacer() {
    this._spacer = new RowSpacer(this.settings.title.gap);
    this._layout.append(this._spacer);
  }

  tickLabelTotalWidth() {
    return this._tickLabelTiers
      .map(tier => tier.width)
      .reduce((a, b) => a + b, 0);
  }

  layoutComponents() {
    //this.axisLabel!.y =  this.chartLayers.physHeight/2; 
    if (this.orientationSettings.position === 'west') {
      // NB: Both horizontal and vertical axis components are always 
      // created in the order: line, ticks, tiers, label
      // this.axisLabel!.x = this.axisLabel!.height + this.settings.label.marginTop;
      // const labelTotalWidth = this.tickLabelTotalWidth();
      // let x = this.axisLabel!.x +
      //   this.settings.label.marginBottom + labelTotalWidth; 
      // let prevTier: TickLabelTier<'vert'> | null = null;
      // // NB: Tier 0 is closest to the axis line
      // this._tickLabelTiers.forEach(tier => {
      //   x -= prevTier?.width ?? 0;
      //   prevTier = tier;
      //   tier.x = x;
      // });
      // this.tickStrip.x = this.width - this.settings.tick.length;
      // this.axisLine.x = this.width;
    } else {
      this._layout.reverseChildren();
      // this.axisLine.x = 0;
      // this.tickStrip.x = 0;
      // let x = this.tickStrip.width; 
      // let prevTier: TickLabelTier<'vert'> | null = null;
      // // NB: Tier 0 is closest to the axis line
      // this._tickLabelTiers.forEach(tier => {
      //   x += prevTier?.width ?? 0;
      //   prevTier = tier;
      //   tier.x = x;
      // });
      // this.axisLabel!.x = this.settings.label.marginBottom + this._tickLabelTiers.at(-1)!.right;
    }
    super.layoutComponents();
  }

  setPosition() {
    // the label has been rotated 90 degrees, so to get the thin axis size, we
    // ask for the height
    // this.x = this.docView.controller.settingStore.settings.chart.padding;
    // this.y = this.docView.controller.settingStore.settings.chart.padding;
    // if (this.orientationSettings.position === 'east') {
    //   this.x += this.chartLayers.physWidth;
    // }
    // if (this.orthoAxis.orientationSettings.position === 'north') {
    //   this.y += this.orthoAxis.height;
    // }
  }

  protected _getAxisTitleAngle() {
    return this.orientationSettings.position === 'east' ? 90 : -90;
  }

}
