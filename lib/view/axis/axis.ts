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

import { svg, type TemplateResult } from 'lit';
import { literal } from 'lit/static-html.js';
import { type Datatype } from '@fizz/dataframe';
import { type Facet } from '@fizz/paramanifest';
import { Container, Padding, PaddingInput, View } from '../base_view';
import { GridLayout, type Layout } from '../layout';
import { Label } from '../label';
import { type AxisLine, HorizAxisLine, VertAxisLine } from './axis_line';
import { type TickLabelTier, HorizTickLabelTier, VertTickLabelTier } from './tick_label_tier';
import { type TickStrip, HorizTickStrip, VertTickStrip } from './tick_strip';
import { type ParaState } from '../../state/parastate';
import { Popup } from '../popup';
import { type ViewContext } from '../view_context';
import { type AxisLabelTier, type PlaneChartInfo } from '../../chart_types';
import { type AxisHorizConfig, type AxisVertConfig } from '../../config/config_types';

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

  readonly datatype: Datatype;

  // protected _layout!: FlexLayout;
  protected _layout!: GridLayout;
  protected _titleText!: string;
  protected _axisTitle?: Label;
  protected _tickLabelTiers: TickLabelTier[] = [];
  protected _tickStrip: TickStrip | null = null;
  protected _axisLine!: AxisLine<T>;
  protected _tickLabelTierValues!: AxisLabelTier[];

  protected _paraState: ParaState;

  constructor(
    paraview: ViewContext,
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

    // this.orientationSettings = SettingsManager.getGroupLink<OrientedAxisSettings<T>>(
    //   `axis.${orientation}`, this._paraState.config
    // );
    // this._tickStep = this.config.ticks.step;
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

  abstract get config(): AxisHorizConfig | AxisVertConfig;

  get parent() {
    return this._parent;
  }

  set parent(parent: Layout) {
    super.parent = parent;
  }

  get tickLabelTiers(): readonly TickLabelTier[] {
    return this._tickLabelTiers;
  }

  get tickLabelTierValues() {
    return this._tickLabelTierValues;
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
    if (this.config.title.isDrawTitle && this._titleText) {
      this._createAxisTitle();
      this._appendTitle();
    }
    if (this.config.ticks.labels.isDrawTickLabels) {
      this._tickLabelTiers = this._createTickLabelTiers();
      this._appendTickLabelTiers();
    }
    this._tickStrip = this._createTickStrip();
    this._appendTickStrip();
    if (this.config.line.isDrawAxisLine) {
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
      text: this._titleText,
      classList: [`axis-title-${this.orientation}`],
      role: 'heading',
      angle: this._getAxisTitleAngle(),
      wrapWidth: this._height,
      //textAnchor: 'middle',
      pointerEnter: (e) => {
        this.shouldAddHoverPopup() ? this.addPopup() : undefined;
      },
      pointerMove: (e) => {
        this.shouldAddHoverPopup() ?
          this.addPopup(undefined, this.paraview.paraState.pointerCoords.x, this.paraview.paraState.pointerCoords.y + this.paraview.paraState.config.popup.margin)
          : undefined;
      },
      pointerLeave: (e) => {
        this.paraview.paraState.removePopup(this.id);
      }
    });
    this._axisTitle.padding = this._getAxisTitlePadding();
  }

  addPopup(text?: string, x?: number, y?: number) {
    this.paraview.paraState.removePopup(this.id);
    let datapointText = `${this._titleText}`
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
    this._titleText = text ?? this.config.title.text ?? '';
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

  constructor(paraview: ViewContext, facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    super(paraview, 'horiz', facet, chartInfo, length);
    this._tickLabelTierValues = this._chartInfo.computeAxisLabelTiers(
      this.coord, 'horiz', this.config.isStaggerLabels);
    this._titleText = this.config.title.text ?? '';

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

  get config(): AxisHorizConfig {
    return this.paraview.paraState.config.axis.horiz;
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
        this.config, {
          orientation: this.orientation,
          content: tier,
          index: i,
          length: this._width,
          step: this.config.ticks.step,
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
    return new HorizTickStrip(this.paraview, this.config, 1, {
      orientation: this.orientation,
      coord: this.coord,
      length: this._width,
      // tickCount: this._labelInfo.labelTiers[0].length,
      tickCount: this._tickLabelTierValues[0].labels.length,
      isDrawOverhang: this.paraview.paraState.config.axis.vert.line.isDrawOverhang,
      tickStep: this.config.ticks.step,
      orthoAxisPosition: this.paraview.paraState.config.axis.vert.position,
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
    return this.config.position === 'south'
      ? { top: this.config.title.gap }
      : { bottom: this.config.title.gap };
  }

  layoutComponents() {
    if (this.config.position === 'south') {
      this._layout.reverseChildren();
      this._layout.layoutViews();
    }
    super.layoutComponents();
  }

  renderHighlight(type: 'fg' | 'bg') {
    return svg`
      <rect
        x=${this.x - 20}
        y=${this.y - 5}
        width=${this.width + 40}
        height=${this.height + 10}
        class="view-highlight-${type}"
      ></rect>
    `;
  }
}

/**
 * A vertical axis.
 * @internal
 */
export class VertAxis extends Axis<'vert'> {

  constructor(paraview: ViewContext, facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    super(paraview, 'vert', facet, chartInfo, length);
    this._tickLabelTierValues = this._chartInfo.computeAxisLabelTiers(
      this.coord, 'vert', this.config.isStaggerLabels);
    this._titleText = this.config.title.text ?? '';

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

  get config(): AxisVertConfig {
    return this.paraview.paraState.config.axis.vert;
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
        this.config, {
        orientation: this.orientation,
        content: tier,
        index: i,
        length: this._height,
        step: this.config.ticks.step,
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
    return new VertTickStrip(this.paraview, this.config, 1, {
      orientation: this.orientation,
      coord: this.coord,
      length: this._height,
      // tickCount: this._labelInfo.labelTiers[0].length,
      tickCount: this._tickLabelTierValues[0].labels.length,
      isDrawOverhang: this.paraview.paraState.config.axis.horiz.line.isDrawOverhang,
      tickStep: this.config.ticks.step,
      orthoAxisPosition: this.paraview.paraState.config.axis.horiz.position,
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
    return this.config.position === 'west'
      ? { right: this.config.title.gap }
      : { left: this.config.title.gap };
  }

  tickLabelTotalWidth() {
    return this._tickLabelTiers
      .map(tier => tier.width)
      .reduce((a, b) => a + b, 0);
  }

  layoutComponents() {
    if (this.config.position === 'west') {
    } else {
      this._layout.reverseChildren();
    }
    super.layoutComponents();
  }

  protected _getAxisTitleAngle() {
    return this.config.position === 'east' ? 90 : -90;
  }

  renderHighlight(type: 'fg' | 'bg') {
    return svg`
      <rect
        x=${this.x - 5}
        y=${this.y - 10}
        width=${this.width + 10}
        height=${this.height + 20}
        class="view-highlight-${type}"
      ></rect>
    `;
  }
}
