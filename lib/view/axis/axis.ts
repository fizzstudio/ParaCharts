/* ParaCharts: Axes
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

import { Container, Padding, PaddingInput, View } from '../base_view';
import { GridLayout, type Layout } from '../layout';
import { type GridTerritoryInput } from '../layout';
//import { type FlexLayout, type Layout, RowLayout, ColumnLayout } from '../layout';
import {
  type AxisSettings,
  type OrientedAxisSettings,
  type DeepReadonly
} from '../../state/settings_types';
import { Label } from '../label';
import { type AxisLine, HorizAxisLine, VertAxisLine } from './axis_line';
import { type TickLabelTier, HorizTickLabelTier, VertTickLabelTier } from './tick_label_tier';
import { type TickStrip, HorizTickStrip, VertTickStrip } from './tick_strip';
import { SettingsManager } from '../../state/settings_manager';
import { type ParaState } from '../../state/parastate';

import { type Datatype, type Scalar } from '@fizz/dataframe';
import { type Facet } from '@fizz/paramanifest';

import { type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import { PlaneModel } from '@fizz/paramodel';
import { Popup } from '../popup';
import { type ParaView } from '../../paraview';
import { AxisLabelTier, PlaneChartInfo } from '../../chart_types';

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

  // protected _layout!: FlexLayout;
  protected _layout!: GridLayout;
  protected _titleText: string;
  protected _axisTitle?: Label;
  protected _tickLabelTiers: TickLabelTier[] = [];
  protected _tickStrip: TickStrip | null = null;
  protected _axisLine!: AxisLine<T>;
  protected _tickLabelTierValues!: AxisLabelTier[];
  protected _tickStep: number;

  protected _paraState: ParaState;

  constructor(
    paraview: ParaView,
    public readonly orientation: T,
    protected _facet: Facet,
    protected _chartInfo: PlaneChartInfo,
    _length: number
  ) {
    super(paraview);
    this._paraState = this.paraview.paraState;

    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    // this._facet = docView.chartInfo.axisInfo!.getFacetForOrientation(this.orientation);
    //  ?? this._paraState.model!.getFacet(coord)!;
    this.datatype = this._facet.datatype;

    this.settings = SettingsManager.getGroupLink<AxisSettings>(
      this.managedSettingKeys[0], this._paraState.settings
    );
    this.orientationSettings = SettingsManager.getGroupLink<OrientedAxisSettings<T>>(
      `axis.${orientation}`, this._paraState.settings
    );
    this._tickStep = this.orientationSettings.ticks.step;

    this._tickLabelTierValues = _chartInfo.computeAxisLabelTiers(
      this.coord, this.orientationSettings.isStaggerLabels);

    this._titleText = this.orientationSettings.title.text ?? '';
  }

  get coord() {
    return this._paraState.model!.facetKeys.find(key =>
      this._paraState.model!.getFacet(key) === this._facet) as AxisCoord;
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

  get tickLabelTiers(): readonly TickLabelTier[] {
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

  get layout() {
    return this._layout;
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
    this._tickStrip = this._createTickStrip();
    this._appendTickStrip();
    if (this.orientationSettings.line.isDrawAxisLine) {
      this._createAxisLine();
      this._appendAxisLine();
    }
  }

  layoutComponents() {
    // uncomment if using flex layout
    // this._layout.layoutViews();
  }

  protected _createAxisTitle() {
    this._axisTitle = new Label(this.paraview, {
      id: `axis-title-${this.orientation}`,
      text: this.titleText,
      classList: [`axis-title-${this.orientation}`],
      role: 'heading',
      angle: this._getAxisTitleAngle(),
      pointerEnter: (e) => {
        this.paraview.paraState.settings.chart.isShowPopups
          && this.paraview.paraState.settings.popup.activation === "onHover"
          && !this.paraview.paraState.settings.ui.isNarrativeHighlightEnabled ? this.addPopup() : undefined;
      },
      pointerMove: (e) => {
        if (this._popup) {
          this.addPopup(undefined, this.paraview.paraState.pointerCoords.x, this.paraview.paraState.pointerCoords.y + this.paraview.paraState.settings.popup.margin)
        }
      },
      pointerLeave: (e) => {
        this.paraview.paraState.settings.chart.isShowPopups
          && this.paraview.paraState.settings.popup.activation === "onHover"
          && !this.paraview.paraState.settings.ui.isNarrativeHighlightEnabled ? this.paraview.paraState.removePopup(this.id) : undefined;
      }
    });
    this._axisTitle.padding = this._getAxisTitlePadding();
  }

  addPopup(text?: string, x?: number, y?: number) {
    let datapointText = `${this.titleText}`
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: x ?? this.x,
        y: y ?? this.y,
        id: this.id,
        type: "vertAxis",
        fill: "hsl(0, 0%, 0%)"
      },
      {
        fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    this.paraview.paraState.popups.push(popup)
    this._popup = popup;
  }

  protected abstract _appendTitle(): void;
  protected abstract _createTickLabelTiers(): TickLabelTier[];
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

  constructor(paraview: ParaView, facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    super(paraview, 'horiz', facet, chartInfo, length);
    this._width = length;
    this._canWidthFlex = true;
    this._layout = new GridLayout(this.paraview, {
      numCols: 1,
      rowAligns: 'end',
      colAligns: 'center',
      canWidthFlex: true,
      // width: this.docView.width,
      width: this.width,
      isAutoHeight: true
    }, 'horiz-axis-layout');
    // this._layout = new ColumnLayout(this.paraview, 0, 'center', 'horiz-axis-layout');
    this._layout.isBubbleSizeChange = true;
    this.append(this._layout);
  }

  get length() {
    return this._width;
  }

  computeSize(): [number, number] {
    return [
      // uncomment if using flex layout
      // this._width,
      this._layout.width,
      this._layout.height
    ];
  }

  protected _appendTitle(): void {
    this._layout.append(this._axisTitle!);
  }

  protected _createTickLabelTiers() {
    return this._tickLabelTierValues.map((tier, i) =>
      new HorizTickLabelTier(
        this.paraview,
        this.orientationSettings, {
        orientation: this.orientation,
        content: tier,
        index: i,
        length: this._width,
        step: this._tickStep,
        numTicks: this._tickLabelTierValues[0].labels.length,
        isChartIntertick: this._chartInfo.isIntertick,
        datatype: this.datatype,
        isFacetIndep: this._facet.variableType === 'independent'
      }
      ));
  }

  protected _appendTickLabelTiers() {
    this._tickLabelTiers.toReversed().forEach((tier, i) => {
      this._layout.splitRowTop(0, 'end');
      this._layout.append(tier);
    });
  }

  protected _createTickStrip() {
    return new HorizTickStrip(this.paraview, this.orientationSettings, 1, {
      orientation: this.orientation,
      length: this._width,
      // tickCount: this._labelInfo.labelTiers[0].length,
      tickCount: this._tickLabelTierValues[0].labels.length,
      isDrawOverhang: this.paraview.paraState.settings.axis.vert.line.isDrawOverhang,
      tickStep: this._tickStep,
      orthoAxisPosition: this.paraview.paraState.settings.axis.vert.position,
      // zeroIndex: this._labelInfo.labelTiers[0].findIndex(label => label === '0') - 1
      zeroIndex: this._tickLabelTierValues[0].labels.findIndex(label => label === '0') - 1,
      isChartIntertick: this._chartInfo.isIntertick,
      isFacetIndep: this._facet.variableType === 'independent'
    },);
  }

  protected _appendTickStrip() {
    this._layout.splitRowTop(0, 'end');
    this._layout.append(this._tickStrip!);
  }

  protected _createAxisLine() {
    this._axisLine = new HorizAxisLine(this, this._width);
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

  constructor(paraview: ParaView, facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    super(paraview, 'vert', facet, chartInfo, length);
    this._height = length;
    this._canHeightFlex = true;
    this._layout = new GridLayout(this.paraview, {
      numCols: 1, // new cols will get added as needed
      rowAligns: 'center',
      colAligns: 'start',
      canHeightFlex: true,
      // height: this.docView.height,
      height: this.height,
      isAutoWidth: true,
    }, 'vert-axis-layout');
    // this._layout = new RowLayout(this.paraview, 0, 'center', 'vert-axis-layout');
    this._layout.isBubbleSizeChange = true;
    this.append(this._layout);
  }

  get length() {
    return this._height;
  }

  computeSize(): [number, number] {
    return [
      this._layout.width,
      this._layout.height
      // this._height
    ];
  }

  protected _appendTitle(): void {
    this._layout.append(this._axisTitle!);
  }

  protected _createTickLabelTiers() {
    return this._tickLabelTierValues.map((tier, i) =>
      new VertTickLabelTier(
        this.paraview,
        this.orientationSettings, {
        orientation: this.orientation,
        content: tier,
        index: i,
        length: this._height,
        step: this._tickStep,
        numTicks: this._tickLabelTierValues[0].labels.length,
        isChartIntertick: this._chartInfo.isIntertick,
        datatype: this.datatype,
        isFacetIndep: this._facet.variableType === 'independent'
      }
      ));
  }

  protected _appendTickLabelTiers() {
    this._tickLabelTiers.toReversed().forEach((tier, i) => {
      this._layout.splitColumnRight(i, 0, 'start');
      this._layout.append(tier, {
        x: i + 1,
      });
    });
  }

  protected _createTickStrip() {
    return new VertTickStrip(this.paraview, this.orientationSettings, 1, {
      orientation: this.orientation,
      length: this._height,
      // tickCount: this._labelInfo.labelTiers[0].length,
      tickCount: this._tickLabelTierValues[0].labels.length,
      isDrawOverhang: this.paraview.paraState.settings.axis.horiz.line.isDrawOverhang,
      tickStep: this._tickStep,
      orthoAxisPosition: this.paraview.paraState.settings.axis.horiz.position,
      // XXX could be '0.0' or have a unit, etc.
      // zeroIndex: this._labelInfo.labelTiers[0].findIndex(label => label === '0')
      zeroIndex: this._tickLabelTierValues[0].labels.findIndex(label => label === '0'),
      isChartIntertick: this._chartInfo.isIntertick,
      isFacetIndep: this._facet.variableType === 'independent'
    });
  }

  protected _appendTickStrip() {
    this._layout.splitColumnRight(this._tickLabelTiers.length, 0, 'start');
    this._layout.append(this._tickStrip!, {
      x: this._layout.numCols - 1,
    });
  }

  protected _createAxisLine() {
    this._axisLine = new VertAxisLine(this, this._height);
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
