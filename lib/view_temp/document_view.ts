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
//import { type CardinalDirection } from '../store/settings_types';
import { type ChartType } from '../common/types';
import { ChartLayerManager } from './chartlayermanager';
import { HorizAxis, VertAxis, type AxisCoord } from './axis';
/*import { hotkeyActions } from '../input/defaultactions';
import { keymaps } from '../input';*/
//import { Legend } from './legend';
import { GridLayout } from './layout';
import { SeriesLabelStrip } from './serieslabelstrip';
import { LineChart } from './line';
import { ParaView } from './paraview';
import { ParaStore } from '../store/parastore';

//export type Legends = Partial<{[dir in CardinalDirection]: Legend}>;

/**
 * Root of the view hierarchy. 
 */
export class DocumentView extends Container(View) {

  readonly type: ChartType;
  readonly chartLayers: ChartLayerManager;

  private _seriesLabelStrip: SeriesLabelStrip | null = null;
  private _titleLabel?: Label;
  private _horizAxis?: HorizAxis;
  private _vertAxis?: VertAxis;
  private _titleText!: string;
  private _grid: GridLayout;
  //private _legends: Legends = {};

  private store: ParaStore;

  constructor(paraview: ParaView, contentWidth?: number, horizTickStep?: number) {
    super(paraview);
    this.store = paraview.store;

    this.type = this.store.type;
    this.setTitleText(this.store.title);

    this.padding = this.store.settings.chart.padding;
    this._grid = new GridLayout(this.paraview, {
      numCols:
        (this.store.settings.legend.isDrawLegend &&
        ['east', 'west'].includes(this.store.settings.legend.position))
        ? 4 : 3, 
      rowAligns: 'start', 
      colAligns: 'start',
    });
    this.append(this._grid);
    this.chartLayers = new ChartLayerManager(this);
    this._grid.append(this.chartLayers, {x: 1, y: 0});

    let hasDirectLabels = false;
    if ( this.store.settings.chart.hasDirectLabels
        && this.type === 'line' 
        && (/*this.chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
          this.store.model.multi)
    ) {
      this._seriesLabelStrip = new SeriesLabelStrip(this.chartLayers.dataLayer as LineChart);
      this._grid.append(this._seriesLabelStrip, {x: 2, y: 0});
      hasDirectLabels = true;
    }

    if (this.chartLayers.shouldHaveAxes()) {
      this._vertAxis = new VertAxis(this);
      this._grid.append(this._vertAxis, {x: 0, y: 0, height: 2});
      this._horizAxis = new HorizAxis(this);
      this._grid.append(this._horizAxis, {x: 1, y: 1, width: 2});
      this._vertAxis.orthoAxis = this._horizAxis;
      this._horizAxis.orthoAxis = this._vertAxis;
      // XXX Change this method to set axis.titleText
      this.xAxis!.setAxisLabelText(this.store.xAxisLabel);
      this.yAxis!.setAxisLabelText(this.store.yAxisLabel);
      this._horizAxis.createComponents();
      this._horizAxis.layoutComponents();
      this._vertAxis.createComponents();
      this._vertAxis.layoutComponents();

      this._titleText = this.store.title 
        ?? this.store.settings.chart.title.text 
        ?? `${this._vertAxis.titleText} by ${this._horizAxis.titleText}`;
    }

    /*if ( this.paraview.store.settings.legend.isDrawLegend) {
      if ( this.paraview.store.settings.legend.isAlwaysDrawLegend
        || (hasDirectLabels && this.paraview.store.settings.chart.hasLegendWithDirectLabels) 
        || (!hasDirectLabels && this.paraview.store.model.multi)) {
        this.addLegend(this.paraview.store.settings.legend.position);
      }
    }*/

     this.createTitle();
     // Draw the layers on top of the axes
     this._grid.reverseChildren();

    this._grid.layoutViews();
    
    this.setSize(this._grid.boundingWidth, this._grid.boundingHeight);

    this.chartLayers.updateLoc();

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

  get titleText() {
    return this._titleText;
  }

  setTitleText(text?: string) {
    this._titleText = text 
      ?? this.store.settings.chart.title.text 
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
    const align = this.store.settings.chart.title.align ?? 'center';
    this._titleLabel = new Label({
      id: 'chart-title',
      role: 'heading',
      classList: ['chart-title'],
      text: this._titleText,
      x: 0,
      y: 0,
      wrapWidth: this.chartLayers.dataLayer.width,
      justify: align
    }, this.paraview);
    let titleRow = 0;
    const titleMargin = this.store.settings.chart.title.margin;
    const titlePos = this.store.settings.chart.title.position;
    if (this.store.settings.chart.title.position === 'top') {
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
  }

  addLegend(position: CardinalDirection) {
    const margin = todo().controller.settingStore.settings.legend.margin;
    if (position === 'east') {
      this._legends.east = new Legend();
      this._grid.append(this._legends.east, {x: 3, y: 0, margin: {left: margin}});
    } else if (position === 'west') {
      this._legends.west = new Legend();
      this._grid.addColumnLeft();
      this._grid.append(this._legends.west, {x: 0, y: 0, margin: {right: margin}});
    } else if (position === 'south') {
      this._legends.south = new Legend({
        orientation: 'horiz', 
        wrapWidth: this.chartLayers.boundingWidth
      });
      this._grid.insertRow(this._grid.numRows);
      this._grid.append(this._legends.south, {x: 1, y: -1, width: 1, colAlign: 'center', margin: {top: margin}});
    } else if (position === 'north') {
      this._legends.north = new Legend({
        orientation: 'horiz',
        wrapWidth: this.chartLayers.boundingWidth
      });
      this._grid.insertRow(1);
      this._grid.append(this._legends.north, {x: 1, y: 0, width: 1, colAlign: 'center', margin: {bottom: margin}});
    }
  }*/

  setLowVisionMode(lvm: boolean) {
    // XXX May need to do the same for other visual elements as well
    this.chartLayers.setLowVisionMode(lvm);
  }

}