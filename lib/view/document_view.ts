/* ParaCharts: The Document View
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

import { type BaseChartInfo, chartInfoClasses } from '../chart_types';
import { View, Container, Padding } from './base_view';
import { Label } from './label';
import { type CardinalDirection, ParaStore, Setting } from '../store';
import { type ChartType } from '@fizz/paramanifest';
import { PlotLayerManager } from './layers';
import { HorizAxis, VertAxis, type AxisCoord } from './axis';
import { Legend } from './legend';
import { GridLayout } from './layout';
import { DirectLabelStrip } from './direct_label_strip';
import { type LinePlotView } from './layers';
import { type ParaView } from '../paraview';

export type Legends = Partial<{[dir in CardinalDirection]: Legend}>;

/**
 * Root of the view hierarchy.
 */
export class DocumentView extends Container(View) {

  readonly type: ChartType;

  protected _chartInfo: BaseChartInfo;
  protected _chartLayers!: PlotLayerManager;
  protected _directLabelStrip: DirectLabelStrip | null = null;
  protected _titleLabel?: Label;
  protected _horizAxis?: HorizAxis;
  protected _vertAxis?: VertAxis;
  protected _titleText!: string;
  protected _grid!: GridLayout;
  protected _legends: Legends = {};

  protected _store: ParaStore;

  constructor(paraview: ParaView) {
    super(paraview);
    this._store = paraview.store;

    this.type = this._store.type;
    // @ts-ignore
    this._chartInfo = new chartInfoClasses[this.type](this.type, this._store);

    this.setTitleText(this._store.title);

    const expandedPadding = this._parsePadding(this._store.settings.chart.padding);
    // XXX temp hack for cpanel icon
    const leftPad = Math.max(8 + 1.1*16, expandedPadding.left);
    this.padding = {
      left: leftPad,
      right: expandedPadding.right,
      top: expandedPadding.top,
      bottom: expandedPadding.bottom
    };

    this._createGrid();

    //this.chartLayers.updateLoc();
  }

  protected _createGrid() {
    this._grid = new GridLayout(this.paraview, {
      width: this._store.settings.chart.size.width - this._padding.left - this._padding.right,
      height: this._store.settings.chart.size.height - this._padding.top - this._padding.bottom,
      canWidthFlex: false,
      canHeightFlex: false,
      numCols: 4,
        // (this._store.settings.legend.isDrawLegend &&
        // ['east', 'west'].includes(this._store.settings.legend.position))
        // ? 4 : 3,
      rowAligns: 'start',
      colAligns: 'start',
      // rowGaps: this._store.settings.chart.title.isDrawTitle && this._store.title
      //   ? [this._store.settings.chart.title.margin]
      //   : undefined
    }, 'doc-grid');
    this.append(this._grid);
    this.updateSize();

    this._populateGrid();

    this._grid.layoutViews();
    this.setSize(this._grid.paddedWidth, this._grid.paddedHeight, false);
  }

  /**
   * Parse `padding` like CSS padding (1-4 numbers, same order as CSS)
   */
  protected _parsePadding(padding: string): Padding {
    const vals = padding.trim().split(' ');
    if (vals.length === 0) {
      throw new Error(`must supply between 1 and 4 values for chart padding`);
    }
    if (vals.length === 1) {
      return this._expandPadding(parseFloat(vals[0]));
    } else if (vals.length === 2) {
      return this._expandPadding({
        vert: parseFloat(vals[0]),
        horiz: parseFloat(vals[1])
      });
    } else if (vals.length === 3) {
      return this._expandPadding({
        top: parseFloat(vals[0]),
        horiz: parseFloat(vals[1]),
        bottom: parseFloat(vals[2])
      });
    } else {
      return this._expandPadding({
        top: parseFloat(vals[0]),
        right: parseFloat(vals[1]),
        bottom: parseFloat(vals[2]),
        left: parseFloat(vals[3])
      });
    }
  }

  protected _populateGrid() {
    if (this._store.settings.chart.title.isDrawTitle && this._store.title) {
      this.createTitle();
    }

    const horizAxisPos = this._store.settings.axis.horiz.position;

    if (this._chartInfo.axisInfo) {
      this._vertAxis = new VertAxis(this);
      this._horizAxis = new HorizAxis(this);
      //this._vertAxis.orthoAxis = this._horizAxis;
      //this._horizAxis.orthoAxis = this._vertAxis;
      ////////////////////////////////////////////
      // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
      //   have two axes
      // const horizAxisFacet = this._store.model!.getAxisFacet('horiz') ?? this._store.model!.facetMap['x']!;
      // const vertAxisFacet = this._store.model!.getAxisFacet('vert') ?? this._store.model!.facetMap['y']!;
      const horizAxisFacet = this._chartInfo.axisInfo.horizFacet;
      const vertAxisFacet = this._chartInfo.axisInfo.vertFacet;

      ////////////////////////////////////////////
      // XXX Change this method to set axis.titleText
      this._horizAxis.setAxisLabelText(horizAxisFacet.label);
      this._vertAxis.setAxisLabelText(vertAxisFacet.label);
      this._horizAxis.createComponents();
      this._vertAxis.createComponents();
      this._horizAxis.layoutComponents();
      this._vertAxis.layoutComponents();
      this._grid.append(this._vertAxis, {
        x: 0,
        y: this._titleLabel ? 1 : 0, // XXX title might be at bottom
        height: 1,
        rowAlign: horizAxisPos === 'north' ? 'end' : 'start'
      });
      this._grid.append(this._horizAxis, {
        x: 1,
        y: (horizAxisPos === 'north' ? 0 : 1) + (this._titleLabel ? 1 : 0),
        width: 1,
        rowAlign: 'end'
      });

      // this._chartLayers.dataLayer.init();
      // if (this._horizAxis.width < this._chartLayers.width || this._vertAxis.height < this._chartLayers.height) {
      //   console.log('RESIZE to', this._chartLayers.width, this._chartLayers.height, this._horizAxis.width, this._vertAxis.height);
      //   this._horizAxis.resize(this._chartLayers.width, this._chartLayers.height);
      //   this._vertAxis.resize(this._chartLayers.width, this._chartLayers.height);
      // }

      // Update tick label IDs now that JIM selectors have been created
      //this._horizAxis.updateTickLabelIds();
      // this._vertAxis.updateTickLabelIds();

        // this._horizAxis.setPosition();
        // this._vertAxis.setPosition();

  //      if (this._vertAxis!.orientationSettings.position === 'west') {
  //        this._horizGroup.reverseChildren();
  //      }

      this._titleText = this._store.title
        ?? this._store.settings.chart.title.text;
        //?? `${this._vertAxis.titleText} by ${this._horizAxis.titleText}`;
    } /*else {
      // No axis info
      this._chartLayers.dataLayer.init();
    }*/

    const plotRow = (this._chartInfo.axisInfo && horizAxisPos === 'north'
      ? 1
      : 0) + (this._titleLabel ? 1 : 0);
    // It only makes sense to take the plot size from the grid if axes have been
    // created that define the space for the plot
    const plotWidth = this._horizAxis ? this._grid.colWidth(1) : this._grid.width;
    const plotHeight = this._vertAxis ? this._grid.rowHeight(plotRow) : this._grid.height;
    this._chartLayers = new PlotLayerManager(this, plotWidth, plotHeight);
    this._chartLayers.dataLayer.init();
    this._grid.append(this._chartLayers, {
      x: 1,
      y: plotRow
    });

    // At this point, we're fully connected to the root of the view tree,
    // so we can safely observe
    this._chartLayers.dataLayer.observeStore();


    if (this._store.settings.chart.hasDirectLabels
        && this.type === 'line'
        && (/*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
            this._store.model!.multi)
    ) {
      this._directLabelStrip = new DirectLabelStrip(this._chartLayers.dataLayer as LinePlotView);
      this._grid.append(this._directLabelStrip, {
        x: 2,
        y: plotRow,
        height: 1
      });
    }

    if (this._shouldAddLegend) {
      this.addLegend(this._store.settings.legend.position);
    }

    if (this._chartInfo.axisInfo) {
      this._horizAxis?.addGridRules(this._chartLayers.height);
      this._vertAxis?.addGridRules(this._chartLayers.width);
    }

  }

  protected get _shouldAddLegend(): boolean {
    return this._store.settings.legend.isDrawLegend &&
      (this._store.settings.legend.isAlwaysDrawLegend
        || (this._directLabelStrip && this._store.settings.chart.hasLegendWithDirectLabels)
        || (!this._directLabelStrip && this._store.model!.multi));
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this._chartInfo.settingDidChange(path, oldValue, newValue);
    if (['chart.size.width', 'chart.size.height'].includes(path)) {
      this._grid.remove();
      this._createGrid();
      //this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  async storeDidChange(key: string, value: any): Promise<void> {
    await super.storeDidChange(key, value);
    return this._chartInfo.storeDidChange(key, value);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  protected _createId() {
    return 'doc-view';
  }

  get role() {
    return 'graphics-document';
  }

  get roleDescription() {
    return `${this.type} chart`;
  }

  get chartLayers() {
    return this._chartLayers;
  }

  get titleText() {
    return this._titleText;
  }

  setTitleText(text?: string) {
    this._titleText = text
      ?? this._store.settings.chart.title.text
      ?? '[TITLE]';
    if (this._titleLabel) {
      this._titleLabel.text = this._titleText;
    }
  }

  get horizAxis() {
    return this._horizAxis;
  }

  get vertAxis() {
    return this._vertAxis;
  }

  get xAxis() {
    return this.getAxisForCoord('x');
  }

  get yAxis() {
    return this.getAxisForCoord('y');
  }

  getAxisForCoord(coord: AxisCoord) {
    if (this._horizAxis?.coord === coord) {
      return this._horizAxis;
    } else if (this._vertAxis?.coord === coord) {
      return this._vertAxis;
    }
    console.log('no axis!', this._horizAxis, this._vertAxis, coord)
    return undefined;
  }

  /*protected get _hotkeyActions() {
    return hotkeyActions.global;
  }

  get keymap() {
    return keymaps.global;
  }*/

  private createTitle() {
    const align = this._store.settings.chart.title.align ?? 'center';
    this._titleLabel = new Label(this.paraview, {
      id: 'chart-title',
      role: 'heading',
      classList: ['chart-title'],
      text: this._titleText,
      wrapWidth: this._grid.width,
      justify: align
    });
    this._titleLabel.canHeightFlex = false;
    let titleRow = 0;
    const titleMargin = this._store.settings.chart.title.margin;
    const titlePos = this._store.settings.chart.title.position;
    if (this._store.settings.chart.title.position === 'top') {
      this._grid.insertRow(0, this._store.settings.chart.title.margin);
    } else {
      this._grid.insertRow(this._grid.numRows, this._store.settings.chart.title.margin);
      titleRow = this._grid.numRows;
    }
    this._grid.append(this._titleLabel, {
      x: 0,
      y: titleRow,
      colAlign: align,
      width: this._chartInfo.axisInfo ? 2 : 1
      // margin: {
      //   top: titlePos === 'top' ? 0 : titleMargin,
      //   bottom: titlePos === 'bottom' ? 0 : titleMargin
      // }
    });
  }

  computeSize(): [number, number] {
    return [this._grid.width, this._grid.height];
  }

  protected _childDidResize(_kid: View) {
    this.updateSize(false);
  }

  protected _boundingSizeDidChange() {
    this.paraview.computeViewBox();
  }

  /*updateAllKeymaps() {
    const update = (v: View) => {
      v.updateKeymap();
      v.children.forEach(update);
    };
    update(this);
  }*/

  addLegend(position: CardinalDirection) {
    const items = this._chartInfo.legend();
    const margin = this._store.settings.legend.margin;
    if (position === 'east') {
      this._legends.east = new Legend(this.paraview, items);
      this._grid.append(this._legends.east, {
        x: 3,
        y: 1,
        height: 1,
        //margin: {left: margin}
      });
      this._grid.setColGap(this._directLabelStrip ? 2 : 1, margin);
    } else if (position === 'west') {
      this._legends.west = new Legend(this.paraview, items);
      this._grid.addColumnLeft();
      this._grid.append(this._legends.west, {
        x: 0,
        y: 0,
        height: 2,
        //margin: {right: margin}
      });
    } else if (position === 'south') {
      this._legends.south = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: this._chartLayers.paddedWidth
      });
      this._grid.insertRow(this._grid.numRows);
      this._grid.append(this._legends.south, {
        x: 1,
        y: -1,
        width: 1,
        colAlign: 'center',
        //margin: {top: margin}
      });
    } else if (position === 'north') {
      this._legends.north = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: this._chartLayers.paddedWidth
      });
      this._grid.insertRow(this._store.settings.chart.title.isDrawTitle && this._store.title ? 1 : 0);
      this._grid.append(this._legends.north, {
        x: 1,
        y: 0,
        width: 1,
        colAlign: 'center',
        //margin: {bottom: margin}
      });
    }
  }

}