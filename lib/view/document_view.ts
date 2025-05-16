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

import { View, Container } from './base_view';
import { Label } from './label';
import { type CardinalDirection, ParaStore } from '../store';
import { type ChartType } from '@fizz/paramanifest';
import { ChartLayerManager } from './chartlayermanager';
import { HorizAxis, VertAxis, type AxisCoord } from './axis';
/*import { hotkeyActions } from '../input/defaultactions';
import { keymaps } from '../input';*/
import { Legend } from './legend';
import { GridLayout } from './layout';
import { SeriesLabelStrip } from './serieslabelstrip';
import { type LineChart } from './line';
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

    this.padding = this._store.settings.chart.padding;
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

    if (this._store.title) {
      this.createTitle();
    }
    // Draw the layers on top of the axes
    this._grid.reverseChildren();

    this._grid.layoutViews();
    this.setSize(this._grid.boundingWidth, this._grid.boundingHeight);

    //this.chartLayers.updateLoc();

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
      // XXX Change this method to set axis.titleText
      this.xAxis!.setAxisLabelText(this._store.model!.getAxisFacet('horiz')!.label);
      this.yAxis!.setAxisLabelText(this._store.model!.getAxisFacet('vert')!.label);
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
    if ( this._store.settings.legend.isDrawLegend) {
      if ( this._store.settings.legend.isAlwaysDrawLegend
        || (hasDirectLabels && this._store.settings.chart.hasLegendWithDirectLabels) 
        || (!hasDirectLabels && this._store.model!.numSeries)) {
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

  cleanup() {
    // remove any event listeners we added, etc.
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
        wrapWidth: this._chartLayers.boundingWidth
      });
      this._grid.insertRow(this._grid.numRows);
      this._grid.append(this._legends.south, {x: 1, y: -1, width: 1, colAlign: 'center', margin: {top: margin}});
    } else if (position === 'north') {
      this._legends.north = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: this._chartLayers.boundingWidth
      });
      this._grid.insertRow(1);
      this._grid.append(this._legends.north, {x: 1, y: 0, width: 1, colAlign: 'center', margin: {bottom: margin}});
    }
  }

  setLowVisionMode(lvm: boolean) {
    // XXX May need to do the same for other visual elements as well
    this._chartLayers.setLowVisionMode(lvm);
  }

}