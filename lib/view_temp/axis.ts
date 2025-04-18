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
import { type TickLabelTier, HorizTickLabelTier, VertTickLabelTier } from './ticklabeltier';
import { type TickStrip, HorizTickStrip, VertTickStrip } from './tickstrip';
import { type AxisLabelInfo } from '../common/axisinfo';
import { SettingsManager } from '../store/settings_manager';
import { ParaStore } from '../store/parastore';

import { mapn } from '@fizz/chart-classifier-utils';
import { type Datatype, type Scalar } from '@fizz/dataframe';

import { type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import Decimal from 'decimal.js';

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

  //readonly settingGroup: string;
  readonly settings: DeepReadonly<AxisSettings>;
  readonly orientationSettings: DeepReadonly<OrientedAxisSettings<T>>;

  readonly datatype: Datatype;

  readonly chartLayers: ChartLayerManager;

  protected _labelInfo: AxisLabelInfo;
  protected _layout!: Layout;
  protected _titleText: string;
  protected _orthoAxis!: Axis<OrthoAxis<T>>;
  protected _axisTitle?: Label;
  protected _spacer!: Spacer;
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
    //this.settingGroup = `axis.${this.coord}`;
    this.settings = SettingsManager.getGroupLink<AxisSettings>(
      this.managedSettingKeys[0], this._store.settings
    );
    this._tickStep = tickStep ?? this.settings.tick.step;
    this.orientationSettings = SettingsManager.getGroupLink<OrientedAxisSettings<T>>(
      `axis.${orientation}`, this._store.settings
    );
    //todo().controller.registerSettingManager(this);
    this.datatype = this.coord === 'y' ? 'number' : this._store.model!.xDatatype;

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

  abstract settingDidChange(key: string, value: Setting | undefined): boolean;

  abstract setPosition(): void;

  createComponents() {
    if (this.settings.title.isDrawTitle && this._titleText) {
      this._createAxisTitle();
      this._createSpacer();
    }
    let tiersOk = false;
    while (!tiersOk) {
      try {
        this._tickLabelTiers = this._createTickLabelTiers();
        tiersOk = true;
      } catch (e) {
        if (e instanceof ChartTooDenseError) {
          console.log('chart too dense; preferred width:', e.preferredWidth);
          this.chartLayers.contentWidth = e.preferredWidth;
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

  protected abstract _createSpacer(): void;

  protected _createAxisTitle() {
    this._axisTitle = new Label({
      text: this.titleText,
      classList: ['axis-title'],
      role: 'heading',
      x: 0,
      y: 0,
      angle: this._getAxisTitleAngle()
    }, this.paraview);
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
      this.chartLayers.orientation === 'north' || this.chartLayers.orientation === 'south' ? 
        this.chartLayers.contentWidth : this.chartLayers.physWidth,
      this._layout.height
    ];
  }

  settingDidChange(key: string, value: any) {
    //todo().controller.clearSettingManagers();
    this.paraview.createDocumentView();
    this.paraview.requestUpdate();
    return true;
  }

  protected _createTickLabelTiers() {
    return [new HorizTickLabelTier(
      this, this._labelInfo.labelTiers[0] as string[], this.chartLayers.contentWidth, this.paraview)];
  }
  
  protected _createTickStrip() {
    return new HorizTickStrip(
      this, this._tickLabelTiers[0].tickInterval/this.tickStep, 1,
      this.chartLayers.contentWidth, this.chartLayers.contentHeight);
  }

  protected _createAxisLine() {
    this._axisLine = new HorizAxisLine(this, this.chartLayers.contentWidth);
    this._layout.append(this._axisLine);
  }


  protected _createSpacer() {
    this._spacer = new ColumnSpacer(this.settings.title.gap, this.paraview);
    this._layout.append(this._spacer);
  }

  resize(width: number, height: number) {
    this._tickLabelTiers.forEach(tier => tier.setLength(width));
    this._tickStrip!.setContentSize(width, height);
    this._axisLine.length = width;
  }

  layoutComponents() {
    this._tickLabelTiers.forEach(tier => tier.computeLayout());

    if (this.orientationSettings.position === 'south') {
      this._layout.reverseChildren();
    }
    super.layoutComponents();
  }

  setPosition() {

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

  /*protected _addedToParent() {
    super._addedToParent();
    const range = this.chartLayers.getYAxisInterval();
    todo().controller.settingViews.add(this, {
      type: 'textfield',
      key: 'axis.y.minValue',
      label: 'Min y-value',
      options: { inputType: 'number' },
      value: this.settings.minValue ?? range?.start,
      validator: value => {
        const values = this.chartLayers.model.data
          .dropCols([this.chartLayers.model.indepVar])
          .mapCols(col => col.numberSeries.data)
          .flat();
        const max = Math.min(...values);
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
        const values = this.chartLayers.model.data
          .dropCols([this.chartLayers.model.indepVar])
          .mapCols(col => col.numberSeries.data)
          .flat();
        const min = Math.max(...values)
        return value as number <= min ?
          { err: `Max y-value (${value}) must be greater than min (${min})` } : {};
      },
      parentView: 'chartDetails.tabs.chart.general',
    });  
  }*/

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this.chartLayers.orientation === 'east' || this.chartLayers.orientation === 'west' ? 
        this.chartLayers.contentWidth : this.chartLayers.physHeight
    ];
  }

  settingDidChange(key: string, value: any) {
    //todo().controller.clearSettingManagers();
    this.paraview.createDocumentView();
    this.paraview.requestUpdate();
    // Changing one axis bound may cause the other to change due to
    // quantization, and this needs to get reflected in the UI.
    //todo().deets!.requestUpdate();
    return true;
  }

  protected _createTickLabelTiers() {
    return [new VertTickLabelTier(
      this, this._labelInfo.labelTiers[0] as string[], this.chartLayers.height, this.paraview)];
  }

  protected _createTickStrip() {
    return new VertTickStrip(
      this, this._tickLabelTiers[0].tickInterval/this.tickStep, 1,
      this.chartLayers.contentWidth, this.chartLayers.contentHeight);
  }

  protected _createAxisLine() {
    this._axisLine = new VertAxisLine(this, this.chartLayers.contentHeight);
    this._layout.append(this._axisLine);
  }

  protected _createSpacer() {
    this._spacer = new RowSpacer(this.settings.title.gap, this.paraview);
    this._layout.append(this._spacer);
  }

  tickLabelTotalWidth() {
    return this._tickLabelTiers
      .map(tier => tier.width)
      .reduce((a, b) => a + b, 0);
  }

  resize(width: number, height: number) {
    this._tickLabelTiers.forEach(tier => tier.setLength(height));
    this._tickStrip!.setContentSize(width, height);
    // resize axis line
    // update layout size?
  }

  layoutComponents() {
    if (this.orientationSettings.position === 'west') {
    } else {
      this._layout.reverseChildren();
    }
    super.layoutComponents();
  }

  setPosition() {
  }

  protected _getAxisTitleAngle() {
    return this.orientationSettings.position === 'east' ? 90 : -90;
  }

}
