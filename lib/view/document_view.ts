/* ParaCharts: Document Views
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

import { View, Container, Padding } from './base_view';
import { Label } from './label';
import { type CardinalDirection, ParaStore } from '../store';
import { type ChartType } from '@fizz/paramanifest';
import { ChartLayerManager } from './layers';
import { HorizAxis, VertAxis, type AxisCoord } from './axis';
/*import { hotkeyActions } from '../input/defaultactions';
import { keymaps } from '../input';*/
import { Legend } from './legend';
import { GridLayout } from './layout';
import { SeriesLabelStrip } from './serieslabelstrip';
import { type LineChart } from './layers';
import { type ParaView } from '../paraview';

export type Legends = Partial<{[dir in CardinalDirection]: Legend}>;

/**
 * Root of the view hierarchy.
 */
export class DocumentView extends Container(View) {

  readonly type: ChartType;

  protected _chartLayers!: ChartLayerManager;
  protected _seriesLabelStrip: SeriesLabelStrip | null = null;
  protected _titleLabel?: Label;
  protected _horizAxis?: HorizAxis;
  protected _vertAxis?: VertAxis;
  protected _titleText!: string;
  protected _grid: GridLayout;
  protected _legends: Legends = {};

  protected _store: ParaStore;

  constructor(paraview: ParaView) {
    super(paraview);
    this._store = paraview.store;

    this.type = this._store.type;
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
    this._grid = new GridLayout(this.paraview, {
      numCols:
        (this._store.settings.legend.isDrawLegend &&
        ['east', 'west'].includes(this._store.settings.legend.position))
        ? 4 : 3,
      rowAligns: 'start',
      colAligns: 'start',
    });
    this.append(this._grid);

    this._populateGrid();

    if (this._store.settings.chart.title.isDrawTitle && this._store.title) {
      this.createTitle();
    }
    // Draw the layers on top of the axes
    this._grid.reverseChildren();

    this._grid.layoutViews();
    this.setSize(this._grid.paddedWidth, this._grid.paddedHeight);

    //this.chartLayers.updateLoc();

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
    const horizAxisPos = this._store.settings.axis.horiz.position;

    this._chartLayers = new ChartLayerManager(this);
    // Creates layers, does not init data layer yet
    this._grid.append(this._chartLayers, {
      x: 1,
      y: this._chartLayers.dataLayer.axisInfo && horizAxisPos === 'north' ? 1 : 0
    });
    if (this._chartLayers.dataLayer.axisInfo) {
      this._vertAxis = new VertAxis(this);
      this._horizAxis = new HorizAxis(this, undefined);
      this._vertAxis.orthoAxis = this._horizAxis;
      this._horizAxis.orthoAxis = this._vertAxis;
      ////////////////////////////////////////////
      // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
      //   have two axes
      // const horizAxisFacet = this._store.model!.getAxisFacet('horiz') ?? this._store.model!.facetMap['x']!;
      // const vertAxisFacet = this._store.model!.getAxisFacet('vert') ?? this._store.model!.facetMap['y']!;
      const horizAxisFacet = this._chartLayers.dataLayer.axisInfo.horizFacet;
      const vertAxisFacet = this._chartLayers.dataLayer.axisInfo.vertFacet;

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
        y: 0,
        height: 1,
        rowAlign: horizAxisPos === 'north' ? 'end' : 'start'
      });
      this._grid.append(this._horizAxis, {
        x: 1,
        y: horizAxisPos === 'north' ? 0 : 1,
        width: 1,
        rowAlign: 'end'
      });
      this._chartLayers.dataLayer.init();
      if (this._horizAxis.width < this._chartLayers.width || this._vertAxis.height < this._chartLayers.height) {
        console.log('RESIZE to', this._chartLayers.width, this._chartLayers.height);
        this._horizAxis.resize(this._chartLayers.width, this._chartLayers.height);
        this._vertAxis.resize(this._chartLayers.width, this._chartLayers.height);
      }

      // Update tick label IDs now that JIM selectors have been created
      this._horizAxis.updateTickLabelIds();
      this._vertAxis.updateTickLabelIds();

        // this._horizAxis.setPosition();
        // this._vertAxis.setPosition();

  //      if (this._vertAxis!.orientationSettings.position === 'west') {
  //        this._horizGroup.reverseChildren();
  //      }

      this._titleText = this._store.title
        ?? this._store.settings.chart.title.text
        ?? `${this._vertAxis.titleText} by ${this._horizAxis.titleText}`;
    } else {
      // No axis info
      this._chartLayers.dataLayer.init();
    }

    let hasDirectLabels = false;
    if ( this._store.settings.chart.hasDirectLabels
        && this.type === 'line'
        && (/*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
            this._store.model!.multi)
    ) {
      this._seriesLabelStrip = new SeriesLabelStrip(this._chartLayers.dataLayer as LineChart);
      this._grid.append(this._seriesLabelStrip, {x: 2, y: 0});
      hasDirectLabels = true;
    }
    if (this._store.settings.legend.isDrawLegend) {
      if (this._store.settings.legend.isAlwaysDrawLegend
        || (hasDirectLabels && this._store.settings.chart.hasLegendWithDirectLabels)
        || (!hasDirectLabels && this._store.model!.multi)) {
        this.addLegend(this._store.settings.legend.position);
      }
    }
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
      wrapWidth: this._chartLayers.dataLayer.width,
      justify: align
    });
    let titleRow = 0;
    const titleMargin = this._store.settings.chart.title.margin;
    const titlePos = this._store.settings.chart.title.position;
    if (this._store.settings.chart.title.position === 'top') {
      this._grid.insertRow(0);
    } else {
      this._grid.insertRow(this._grid.numRows);
      titleRow = this._grid.numRows - 1;
    }
    this._grid.append(this._titleLabel, {
      x: 1,
      y: titleRow,
      colAlign: align,
      margin: {
        top: titlePos === 'top' ? 0 : titleMargin,
        bottom: titlePos === 'bottom' ? 0 : titleMargin
      }
    });
  }

  /*updateAllKeymaps() {
    const update = (v: View) => {
      v.updateKeymap();
      v.children.forEach(update);
    };
    update(this);
  }*/

  addLegend(position: CardinalDirection) {
    const items = this._chartLayers.dataLayer.legend();
    const margin = this._store.settings.legend.margin;
    if (position === 'east') {
      this._legends.east = new Legend(this.paraview, items);
      this._grid.append(this._legends.east, {x: 3, y: 0, height: 2, margin: {left: margin}});
    } else if (position === 'west') {
      this._legends.west = new Legend(this.paraview, items);
      this._grid.addColumnLeft();
      this._grid.append(this._legends.west, {x: 0, y: 0, height: 2, margin: {right: margin}});
    } else if (position === 'south') {
      this._legends.south = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: this._chartLayers.paddedWidth
      });
      this._grid.insertRow(this._grid.numRows);
      this._grid.append(this._legends.south, {x: 1, y: -1, width: 1, colAlign: 'center', margin: {top: margin}});
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
        margin: {bottom: margin}
      });
    }
  }

}