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
import { GridLayout, type Layout } from '../layout';
import { type GridTerritoryInput } from '../layout';
import { type DocumentView } from '../document_view';
import { type PlotLayerManager } from '../layers';
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
import { type Facet } from '@fizz/paramanifest';

import { type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import { PlaneModel } from '@fizz/paramodel';
import { Popup } from '../popup';

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

  readonly chartLayers: PlotLayerManager;

  protected _facet: Facet;
  protected _labelInfo: AxisLabelInfo;
  protected _layout!: GridLayout;
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
  ) {
    super(docView.paraview);
    this._store = this.paraview.store;
    this.chartLayers = docView.chartLayers;

    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    this._facet = docView.chartInfo.axisInfo!.getFacetForOrientation(this.orientation);
    //  ?? this._store.model!.getFacet(coord)!;
    this.datatype = this._facet.datatype;

    this.settings = SettingsManager.getGroupLink<AxisSettings>(
      this.managedSettingKeys[0], this._store.settings
    );
    this.orientationSettings = SettingsManager.getGroupLink<OrientedAxisSettings<T>>(
      `axis.${orientation}`, this._store.settings
    );
    this._tickStep = this.orientationSettings.ticks.step;

    this._labelInfo = this.coord === 'x'
      ? docView.chartInfo.axisInfo!.xLabelInfo
      : docView.chartInfo.axisInfo!.yLabelInfo;
    this._isInterval = this.coord === 'x'
      ? !!docView.chartInfo.axisInfo!.options.isXInterval
      : !!docView.chartInfo.axisInfo!.options.isYInterval;

    this._titleText = this.orientationSettings.title.text ?? '';
  }

  get coord() {
    return this._store.model!.facetKeys.find(key =>
      this._store.model!.getFacet(key) === this._facet) as AxisCoord;
  }

  protected _createId() {
    return `${this.orientation}-axis`;
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

  // get range() {
  //   return this.chartLayers.getAxisInterval(this.coord);
  // }

  get orthoAxis() {
    return this._orthoAxis;
  }

  get layout() {
    return this._layout;
  }

  set orthoAxis(orthoAxis: Axis<OrthoAxis<T>>) {
    this._orthoAxis = orthoAxis;
  }

  resize(width: number, height: number) {
    this._layout.resize(width, height);
    super.resize(width, height);
  }

  abstract get length(): number;

  protected _childDidResize(_kid: View) {
    this.updateSize();
  }

  // settingDidChange(path: string, _oldValue?: Setting, _newValue?: Setting): void {
  //   if (['axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
  //     this._layout.clearChildren();
  //     this.createComponents();
  //     this.layoutComponents();
  //   }
  // }

  createComponents() {
    if (this.orientationSettings.title.isDrawTitle && this._titleText) {
      this._createAxisTitle();
      this._appendTitle();
    }
    if (this.orientationSettings.ticks.labels.isDrawTickLabels) {
      this._tickLabelTiers = this._createTickLabelTiers();
      this._appendTickLabelTiers();
    }
    if (this.orientationSettings.ticks.isDrawTicks) {
      this._tickStrip = this._createTickStrip();
      this._appendTickStrip();
    }
    if (this.orientationSettings.line.isDrawAxisLine) {
      this._createAxisLine();
      this._appendAxisLine();
    }
  }

  layoutComponents() {
//    this._layout.layoutViews();
  }

  protected _createAxisTitle() {
    this._axisTitle = new Label(this.paraview, {
      id: `axis-title-${this.orientation}`,
      text: this.titleText,
      classList: [`axis-title-${this.orientation}`],
      role: 'heading',
      angle: this._getAxisTitleAngle(),
      pointerEnter: (e) => {
        this.paraview.store.settings.chart.isShowPopups
          && this.paraview.store.settings.popup.activation === "onHover"
          && !this.paraview.store.settings.ui.isNarrativeHighlightEnabled ? this.addPopup() : undefined;
      },
      pointerMove: (e) => {
        if (this._popup) {
          this._popup.grid.x = this.paraview.store.pointerCoords.x;
          this._popup.grid.y = this.paraview.store.pointerCoords.y;
          this._popup.shiftGrid();
          this._popup.box.x = this._popup.grid.x;
          this._popup.box.y = this._popup.grid.bottom;
          this.paraview.requestUpdate();
        }
      },
      pointerLeave: (e) => {
        this.paraview.store.settings.chart.isShowPopups
          && this.paraview.store.settings.popup.activation === "onHover"
          && !this.paraview.store.settings.ui.isNarrativeHighlightEnabled ? this.removePopup(this.id) : undefined;
      }
    });
    this._axisTitle.padding = this._getAxisTitlePadding();
  }

  addPopup(text?: string) {
    let datapointText = `${this.titleText}`
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: this.x,
        y: this.y,
        id: this.id,
        type: "vertAxis",
        fill: "hsl(0, 0%, 0%)"
      },
      {fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    this.paraview.store.popups.push(popup)
    this._popup = popup;
  }

  removePopup(id: string) {
    this.paraview.store.popups.splice(this.paraview.store.popups.findIndex(p => p.id === id), 1)
    this.paraview.requestUpdate()
  }

  protected abstract _appendTitle(): void;
  protected abstract _createTickLabelTiers(): TickLabelTier<T>[];
  protected abstract _appendTickLabelTiers(): void;
  protected abstract _createTickStrip(): TickStrip;
  protected abstract _appendTickStrip(): void;
  protected abstract _createAxisLine(): void;
  protected abstract _appendAxisLine(): void;

  updateTickLabelIds() {
    for (const tier of this._tickLabelTiers) {
      tier.updateTickLabelIds();
    }
  }

  setAxisLabelText(text?: string) {
    this._titleText = text ?? this.orientationSettings.title.text ?? '';
    if (this._axisTitle) {
      this._axisTitle.text = this._titleText;
    }
  }

  protected abstract _getAxisTitlePadding(): PaddingInput;

  protected _getAxisTitleAngle() {
    return 0;
  }

  addGridRules(length: number) {
    this._tickStrip?.addRules(length);
  }

}

/**
 * A horizontal axis.
 * @internal
 */
export class HorizAxis extends Axis<'horiz'> {

  constructor(docView: DocumentView) {
    super(docView, 'horiz');
    this._canWidthFlex = true;
    this._layout = new GridLayout(this.paraview, {
      numCols: 1,
      rowAligns: 'end',
      colAligns: 'center',
      canWidthFlex: true,
      width: this.docView.width,
      isAutoHeight: true
    }, 'horiz-axis-layout');
    this._layout.isBubbleSizeChange = true;
    this.append(this._layout);
  }

  get length() {
    return this._width;
  }

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this._layout.height
    ];
  }

  protected _appendTitle(): void {
    this._layout.append(this._axisTitle!);
  }

  protected _createTickLabelTiers() {
    return this._labelInfo.labelTiers.map((tier, i) =>
      new HorizTickLabelTier(
        this, tier as string[], i, this.docView.width, this._tickStep, this.paraview));
  }

  protected _appendTickLabelTiers() {
    this._tickLabelTiers.forEach((tier, i) => {
      this._layout.splitRowTop(0, 'end');
      this._layout.append(tier);
    });
  }

  protected _createTickStrip() {
    return new HorizTickStrip(this.paraview, this.orientationSettings, 1, {
      orientation: this.orientation,
      length: this.docView.width,
      plotWidth: this.docView.width,
      plotHeight: this._layout.height,
      tickCount: this._labelInfo.labelTiers[0].length,
      isInterval: this._isInterval,
      isDrawOverhang: this.paraview.store.settings.axis.vert.line.isDrawOverhang,
      tickStep: this._tickStep,
      orthoAxisPosition: this.paraview.store.settings.axis.vert.position,
      zeroIndex: this._labelInfo.labelTiers[0].findIndex(label => label === '0') - 1
    });
  }

  protected _appendTickStrip() {
    this._layout.splitRowTop(0, 'end');
    this._layout.append(this._tickStrip!);
  }

  protected _createAxisLine() {
    this._axisLine = new HorizAxisLine(this, this.docView.width);
  }

  protected _appendAxisLine() {
    this._layout.splitRowTop(0, 'end');
    this._layout.append(this._axisLine);
  }

  protected _getAxisTitlePadding(): PaddingInput {
    return this.orientationSettings.position === 'south'
      ? { top: this.orientationSettings.title.gap }
      : { bottom: this.orientationSettings.title.gap };
  }

  layoutComponents() {
    if (this.orientationSettings.position === 'south') {
      this._layout.reverseChildren();
      this._layout.layoutViews();
    }
    super.layoutComponents();
  }

}

/**
 * A vertical axis.
 * @internal
 */
export class VertAxis extends Axis<'vert'> {

  constructor(docView: DocumentView) {
    super(docView, 'vert');
    this._canHeightFlex = true;
    this._layout = new GridLayout(this.paraview, {
      numCols: 1, // new cols will get added as needed
      rowAligns: 'center',
      colAligns: 'start',
      canHeightFlex: true,
      height: this.docView.height,
      isAutoWidth: true,
    }, 'vert-axis-layout');
    this._layout.isBubbleSizeChange = true;
    this.append(this._layout);
  }

  get length() {
    return this._height;
  }

  protected _addedToParent() {
    super._addedToParent();
    //const range = this.chartLayers.getYAxisInterval();
    const min = this._labelInfo.min!;
    const max = this._labelInfo.max!;
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.y.minValue',
      label: 'Min y-value',
      options: { inputType: 'number' },
      value: this.settings.minValue === 'unset'
        ? min
        : this.settings.minValue,
      validator: value => {
        const min = this.paraview.store.settings.axis.y.maxValue === 'unset'
          ? Math.max(...this.docView.chartInfo.axisInfo!.options.yValues)
          : this.paraview.store.settings.axis.y.maxValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min y-value (${value}) must be less than (${min})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general.minY',
    });
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.y.maxValue',
      label: 'Max y-value',
      options: { inputType: 'number' },
      value: this.settings.maxValue === 'unset'
        ? max
        : this.settings.maxValue,
      validator: value => {
        const max = this.paraview.store.settings.axis.y.minValue == "unset"
          ? Math.min(...this.docView.chartInfo.axisInfo!.options.yValues)
          : this.paraview.store.settings.axis.y.minValue as number
        return value as number <= max ?
          { err: `Max y-value (${value}) must be greater than (${max})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general.maxY',
    });
  }

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this._layout.height
    ];
  }

  protected _appendTitle(): void {
    this._layout.append(this._axisTitle!);
  }

  protected _createTickLabelTiers() {
    return this._labelInfo.labelTiers.map((tier, i) =>
      new VertTickLabelTier(
        this, tier as string[], i, this.docView.height, this._tickStep, this.paraview));
  }

  protected _appendTickLabelTiers() {
    this._tickLabelTiers.forEach((tier, i) => {
      this._layout.splitColumnRight(i, 0, 'start');
      this._layout.append(tier, {
        x: i + 1,
      });
    });
  }

  protected _createTickStrip() {
    return new VertTickStrip(this.paraview, this.orientationSettings, 1, {
      orientation: this.orientation,
      length: this.docView.height,
      plotWidth: this.docView.width,
      plotHeight: this.docView.height,
      tickCount: this._labelInfo.labelTiers[0].length,
      isInterval: this._isInterval,
      isDrawOverhang: this.paraview.store.settings.axis.horiz.line.isDrawOverhang,
      tickStep: this._tickStep,
      orthoAxisPosition: this.paraview.store.settings.axis.horiz.position,
      // XXX could be '0.0' or have a unit, etc.
      zeroIndex: this._labelInfo.labelTiers[0].findIndex(label => label === '0')
    });
  }

  protected _appendTickStrip() {
    this._layout.splitColumnRight(this._tickLabelTiers.length, 0, 'start');
    this._layout.append(this._tickStrip!, {
      x: this._layout.numCols - 1,
    });
  }

  protected _createAxisLine() {
    this._axisLine = new VertAxisLine(this, this.docView.height);
  }

  protected _appendAxisLine() {
    this._layout.splitColumnRight(this._tickLabelTiers.length + 1, 0, 'start');
    this._layout.append(this._axisLine, {
      x: this._layout.numCols - 1,
    });
  }

  protected _getAxisTitlePadding(): PaddingInput {
    return this.orientationSettings.position === 'west'
      ? { right: this.orientationSettings.title.gap }
      : { left: this.orientationSettings.title.gap };
  }

  tickLabelTotalWidth() {
    return this._tickLabelTiers
      .map(tier => tier.width)
      .reduce((a, b) => a + b, 0);
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
