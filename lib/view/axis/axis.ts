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

import { Container, Padding, PaddingInput, View } from '../base_view';
import { ColumnLayout, RowLayout, type Layout } from '../layout';
import { type DocumentView } from '../document_view';
import { type ChartLayerManager } from '../layers';
import {
  type AxisSettings,
  type OrientedAxisSettings,
  type DeepReadonly
} from '../../store/settings_types';
import { Label } from '../label';
import { type AxisLine, HorizAxisLine, VertAxisLine } from './axis_line';
import { type TickLabelTier, HorizTickLabelTier, VertTickLabelTier } from './tick_label_tier';
import { type TickStrip, HorizTickStrip, VertTickStrip } from './tick_strip';
import { type AxisLabelInfo } from '../../common/axisinfo';
import { SettingsManager } from '../../store/settings_manager';
import { ParaStore } from '../../store/parastore';

import { type Datatype, type Scalar } from '@fizz/dataframe';

import { type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import { PlaneModel } from '@fizz/paramodel';

export type AxisOrientation = 'horiz' | 'vert';
export type AxisCoord = 'x' | 'y';
export type OrthoAxis<T> = T extends 'horiz' ? 'vert' : 'horiz';

export class ChartTooDenseError extends Error {
  constructor(public readonly preferredWidth: number) {
    super();
  }
}

export class ChartTooWideError extends Error {
  constructor(public readonly preferredTickStep: number) {
    super();
  }
}

export abstract class Axis<T extends AxisOrientation> extends Container(View) {

  declare protected _parent: Layout;

  readonly settings: DeepReadonly<AxisSettings>;
  readonly orientationSettings: DeepReadonly<OrientedAxisSettings<T>>;

  readonly datatype: Datatype;

  readonly chartLayers: ChartLayerManager;

  protected _labelInfo: AxisLabelInfo;
  protected _layout!: Layout;
  protected _titleText: string;
  protected _orthoAxis!: Axis<OrthoAxis<T>>;
  protected _axisTitle?: Label;
  protected _tickLabelTiers: TickLabelTier<T>[] = [];
  protected _tickStrip: TickStrip | null = null;
  protected _axisLine!: AxisLine<T>;
  protected _tickStep: number;
  protected _isInterval: boolean;

  protected _store: ParaStore;

  constructor(
    public readonly docView: DocumentView,
    public readonly orientation: T,
    readonly coord: AxisCoord,
    title?: string,
    tickStep?: number
  ) {
    super(docView.paraview);
    this._store = this.paraview.store;
    this.chartLayers = docView.chartLayers;
    this.settings = SettingsManager.getGroupLink<AxisSettings>(
      this.managedSettingKeys[0], this._store.settings
    );
    this._tickStep = tickStep ?? this.settings.tick.step;
    this.orientationSettings = SettingsManager.getGroupLink<OrientedAxisSettings<T>>(
      `axis.${orientation}`, this._store.settings
    );

    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    const axisFacet = (this._store.model as PlaneModel).getAxisFacet(this.orientation) 
      ?? this._store.model!.getFacet(coord)!;
    this.datatype = axisFacet.datatype;

    this._labelInfo = this.coord === 'x'
      ? this.chartLayers.dataLayer.axisInfo!.xLabelInfo
      : this.chartLayers.dataLayer.axisInfo!.yLabelInfo;
    this._isInterval = this.coord === 'x'
      ? !!this.chartLayers.dataLayer.axisInfo!.options.isXInterval
      : !!this.chartLayers.dataLayer.axisInfo!.options.isYInterval;

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

  get tickStep() {
    return this._tickStep;
  }

  get isInterval() {
    return this._isInterval;
  }

  get tickLabelTiers(): readonly TickLabelTier<T>[] {
    return this._tickLabelTiers;
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

  // settingDidChange(path: string, _oldValue?: Setting, _newValue?: Setting): void {
  //   if (['axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
  //     this._layout.clearChildren();
  //     this.createComponents();
  //     this.layoutComponents();
  //   }
  // }

  createComponents() {
    if (this.settings.title.isDrawTitle && this._titleText) {
      this._createAxisTitle();
    }
    let tiersOk = false;
    while (!tiersOk) {
      try {
        this._tickLabelTiers = this._createTickLabelTiers();
        tiersOk = true;
      } catch (e) {
        if (e instanceof ChartTooDenseError) {
          console.log('chart too dense; preferred width:', e.preferredWidth);
          this.chartLayers.width = e.preferredWidth;
        } else if (e instanceof ChartTooWideError) {
          console.log('chart too wide; preferred tick step:', e.preferredTickStep);
          this._tickStep = e.preferredTickStep;
        } else {
          throw e;
        }
      }
    }
    this._tickLabelTiers.forEach(tier => this._layout.append(tier));
    this._tickStrip = this._createTickStrip();
    this._layout.append(this._tickStrip);
    this._createAxisLine();
  }

  abstract resize(width: number, height: number): void;

  layoutComponents() {
    this._layout.layoutViews();
  }

  protected abstract _createTickLabelTiers(): TickLabelTier<T>[];

  protected abstract _createTickStrip(): TickStrip<T>;

  protected abstract _createAxisLine(): void;

  // protected _createTickLabels() {
  //   for (const tier of this._tickLabelTiers) {
  //     tier.createTickLabels();
  //   }
  // }

  updateTickLabelIds() {
    for (const tier of this._tickLabelTiers) {
      tier.updateTickLabelIds();
    }
  }

  setAxisLabelText(text?: string) {
    this._titleText = text ?? this.settings.title.text ?? '';
    if (this._axisTitle) {
      this._axisTitle.text = this._titleText;
    }
  }

  protected _createAxisTitle() {
    this._axisTitle = new Label(this.paraview, {
      text: this.titleText,
      classList: ['axis-title'],
      role: 'heading',
      angle: this._getAxisTitleAngle()
    });
    this._axisTitle.padding = this._getAxisTitlePadding();
    this._layout.append(this._axisTitle);
  }

  protected abstract _getAxisTitlePadding(): PaddingInput;

  protected _getAxisTitleAngle() {
    return 0;
  }

}

/**
 * A horizontal axis.
 * @internal
 */
export class HorizAxis extends Axis<'horiz'> {

  constructor(docView: DocumentView, title?: string, tickStep?: number) {
    const orientation = docView.paraview.store.settings.chart.orientation;
    super(docView, 'horiz',
      orientation === 'north' || orientation === 'south' ? 'x' : 'y',
      title, tickStep);
    this._layout = new ColumnLayout(this.paraview, 0, 'center', 'horiz-axis-group');
    this.append(this._layout);
  }

  computeSize(): [number, number] {
    return [
      this.chartLayers.width,
      this._layout.height
    ];
  }

  // settingDidChange(key: string, value: any) {
  //   //todo().controller.clearSettingManagers();
  //   this.paraview.createDocumentView();
  //   this.paraview.requestUpdate();
  //   return true;
  // }

  protected _createTickLabelTiers() {
    return [new HorizTickLabelTier(
      this, this._labelInfo.labelTiers[0] as string[], this.chartLayers.width, this.paraview)];
  }

  protected _createTickStrip() {
    return new HorizTickStrip(
      this, this._tickLabelTiers[0].tickInterval/this.tickStep, 1,
      this.chartLayers.width, this.chartLayers.height);
  }

  protected _createAxisLine() {
    this._axisLine = new HorizAxisLine(this, this.chartLayers.width);
    this._layout.append(this._axisLine);
  }

  protected _getAxisTitlePadding(): PaddingInput {
    return this.orientationSettings.position === 'south'
      ? { top: this.settings.title.gap }
      : { bottom: this.settings.title.gap };
  }

  resize(width: number, height: number) {
    this._tickLabelTiers.forEach(tier => tier.setLength(width));
    this._tickStrip!.resize(width, height, this._tickLabelTiers[0].tickInterval/this.tickStep);
    this._axisLine.length = width;
  }

  layoutComponents() {
    if (this.orientationSettings.position === 'south') {
      this._layout.reverseChildren();
    }
    super.layoutComponents();
  }

}

/**
 * A vertical axis.
 * @internal
 */
export class VertAxis extends Axis<'vert'> {

  constructor(docView: DocumentView, title?: string) {
    const orientation = docView.paraview.store.settings.chart.orientation;
    super(docView, 'vert',
      orientation === 'east' || orientation === 'west' ? 'x' : 'y')
    this._layout = new RowLayout(this.paraview, 0, 'center', 'vert-axis-group');
    this.append(this._layout);
  }

  protected _addedToParent() {
    super._addedToParent();
    const range = this.chartLayers.getYAxisInterval();
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.y.minValue',
      label: 'Min y-value',
      options: { inputType: 'number' },
      value: this.settings.minValue === 'unset' ? range.start : this.settings.minValue,
      validator: value => {
        const min = this.paraview.store.settings.axis.y.maxValue == "unset"
          ? Math.max(...this.chartLayers.dataLayer.axisInfo!.options.yValues)
          : this.paraview.store.settings.axis.y.maxValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min y-value (${value}) must be less than (${min})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.y.maxValue',
      label: 'Max y-value',
      options: { inputType: 'number' },
      value: this.settings.maxValue == "unset" ? range?.end : this.settings.maxValue,
      validator: value => {
        const max = this.paraview.store.settings.axis.y.minValue == "unset"
          ? Math.min(...this.chartLayers.dataLayer.axisInfo!.options.yValues)
          : this.paraview.store.settings.axis.y.minValue as number
        return value as number <= max ?
          { err: `Max y-value (${value}) must be greater than (${max})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
  }

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this.chartLayers.height
    ];
  }

  // settingDidChange(key: string, value: any) {
  //   //todo().controller.clearSettingManagers();
  //   this.paraview.createDocumentView();
  //   this.paraview.requestUpdate();
  //   // Changing one axis bound may cause the other to change due to
  //   // quantization, and this needs to get reflected in the UI.
  //   //todo().deets!.requestUpdate();
  //   return true;
  // }

  protected _createTickLabelTiers() {
    return [new VertTickLabelTier(
      this, this._labelInfo.labelTiers[0] as string[], this.chartLayers.height, this.paraview)];
  }

  protected _createTickStrip() {
    return new VertTickStrip(
      this, this._tickLabelTiers[0].tickInterval/this.tickStep, 1,
      this.chartLayers.width, this.chartLayers.height);
  }

  protected _createAxisLine() {
    this._axisLine = new VertAxisLine(this, this.chartLayers.height);
    this._layout.append(this._axisLine);
  }

  protected _getAxisTitlePadding(): PaddingInput {
    return this.orientationSettings.position === 'west'
      ? { right: this.settings.title.gap }
      : { left: this.settings.title.gap };
  }

  tickLabelTotalWidth() {
    return this._tickLabelTiers
      .map(tier => tier.width)
      .reduce((a, b) => a + b, 0);
  }

  resize(width: number, height: number) {
    this._tickLabelTiers.forEach(tier => tier.setLength(height));
    this._tickStrip!.resize(width, height, this._tickLabelTiers[0].tickInterval/this.tickStep);
    this._axisLine.length = height;
  }

  layoutComponents() {
    if (this.orientationSettings.position === 'west') {
    } else {
      this._layout.reverseChildren();
    }
    super.layoutComponents();
  }

  protected _getAxisTitleAngle() {
    return this.orientationSettings.position === 'east' ? 90 : -90;
  }

}
