/* ParaCharts: Chart Layer Manager
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

import { View } from '../base_view';
import { fixed, isPointerInbounds } from '../../common/utils';
import { type Layout } from '../layout';
import { type DocumentView } from '../document_view';
import { type CardinalDirection } from '../../state/settings_types';
import { AnnotationLayer, type DataLayer, HighlightsLayer, SelectionLayer, FocusLayer } from '.';
import { LinePlotView, ScatterPlotView, BarPlotView, PiePlotView, Bar, WaterfallPlotView, VennPlotView } from './data/chart_type';
import { type AxisCoord } from '../axis';
//import { StepLineChart } from './stepline';
//import { LollipopChart } from './lollipop';
//import { DonutChart } from './donut';
//import { GaugeChart } from './gauge';
//import { type Model } from '../data/model';

import { type Interval } from '@fizz/chart-classifier-utils';

import { svg } from 'lit';
import { HeatMapPlotView } from './data/chart_type';
import { Histogram } from './data/chart_type/histogram';
import { PopupLayer } from './popup_layer';
import { ParaView } from '../../paraview';


// FIXME: Temporarily replace chart types that haven't been introduced yet
export const chartClasses = {
  bar: BarPlotView,
  column: BarPlotView,
  line: LinePlotView,
  scatter: ScatterPlotView,
  histogram: Histogram,
  heatmap: HeatMapPlotView,
  pie: PiePlotView,
  donut: PiePlotView,
  gauge: BarPlotView, //GaugeChart,
  stepline: LinePlotView, //StepLineChart,
  lollipop: BarPlotView, //LollipopChart
  graph: LinePlotView,
  waterfall: WaterfallPlotView,
  venn: VennPlotView
};

export class PlotLayerManager extends View {
  declare protected _parent: DocumentView;

  protected _logicalWidth!: number;
  protected _logicalHeight!: number;

  protected _orientation!: CardinalDirection;
  protected _backgroundHighlightsLayer!: HighlightsLayer;
  protected _backgroundAnnotationLayer!: AnnotationLayer;
  protected _dataLayers!: DataLayer[];
  protected _foregroundHighlightsLayer!: HighlightsLayer;
  protected _selectionLayer!: SelectionLayer;
  protected _foregroundAnnotationLayer!: AnnotationLayer;
  protected _popupLayer!: PopupLayer;
  protected _focusLayer!: FocusLayer;

  constructor(paraview: ParaView, width: number, height: number) {
    super(paraview);
    this._orientation = this.paraview.paraState.settings.chart.orientation;
    this.width = width;
    this.height = height;
    this._canWidthFlex = true;
    this._canHeightFlex = true;
  }

  protected _createId() {
    return 'layers';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: DocumentView) {
    super.parent = parent;
  }

  createLayers() {
    this._backgroundHighlightsLayer = new HighlightsLayer(this.paraview, this._width, this._height, 'background');
    this.append(this._backgroundHighlightsLayer);
    this._backgroundAnnotationLayer = new AnnotationLayer(this.paraview, this._width, this._height, 'background');
    this.append(this._backgroundAnnotationLayer);
    this.createDataLayers();
    this._foregroundHighlightsLayer = new HighlightsLayer(this.paraview, this._width, this._height, 'foreground');
    this.append(this._foregroundHighlightsLayer);
    this._foregroundAnnotationLayer = new AnnotationLayer(this.paraview, this._width, this._height, 'foreground');
    this.append(this._foregroundAnnotationLayer);
    this._selectionLayer = new SelectionLayer(this.paraview, this._width, this._height);
    this.append(this._selectionLayer);
    this._focusLayer = new FocusLayer(this.paraview, this._width, this._height);
    this.append(this._focusLayer);
    this._popupLayer = new PopupLayer(this.paraview, this._width, this._height, "foreground");
    this.append(this._popupLayer);
  }

  /** Physical width of the chart; i.e., width onscreen after any rotation. */
  get width() {
    return super.width;
  }

  set width(width: number) {
    if (this._orientation === 'north' || this._orientation === 'south') {
      this._logicalWidth = width;
    } else {
      this._logicalHeight = width;
    }
    super.width = width;
    this._resizeLayers();
  }

  /** Physical height of the chart; i.e., height onscreen after any rotation. */
  get height() {
    return super.height;
  }

  set height(height: number) {
    if (this._orientation === 'north' || this._orientation === 'south') {
      this._logicalHeight = height;
    } else {
      this._logicalWidth = height;
    }
    super.height = height;
    this._resizeLayers();
  }

  get logicalWidth() {
    return this._logicalWidth;
  }

  set logicalWidth(logicalWidth: number) {
    if (this._orientation === 'north' || this._orientation === 'south') {
      this.width = logicalWidth;
    } else {
      this.height = logicalWidth;
    }
    this._logicalWidth = logicalWidth;
    this._resizeLayers();
  }

  get logicalHeight() {
    return this._logicalHeight;
  }

  set logicalHeight(logicalHeight: number) {
    if (this._orientation === 'north' || this._orientation === 'south') {
      this.height = logicalHeight;
    } else {
      this.width = logicalHeight;
    }
    this._logicalHeight = logicalHeight;
    this._resizeLayers();
  }

  get orientation() {
    return this._orientation;
  }

  get backgroundHighlightsLayer() {
    return this._backgroundHighlightsLayer;
  }

  get backgroundAnnotationLayer() {
    return this._backgroundAnnotationLayer;
  }

  get dataLayer() {
    return this._dataLayers[0];
  }

  get foregroundHighlightsLayer() {
    return this._foregroundHighlightsLayer;
  }

  get foregroundAnnotationLayer() {
    return this._foregroundAnnotationLayer;
  }

  get selectionLayer() {
    return this._selectionLayer;
  }

  get popupLayer() {
    return this._popupLayer;
  }

  protected _resizeLayers() {
    this._children.forEach(kid => {
      kid.resize(this._logicalWidth, this._logicalHeight);
    });
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    if (this._orientation === 'north' || this._orientation === 'south') {
      this._logicalWidth = width;
      this._logicalHeight = height;
    } else {
      this._logicalHeight = width;
      this._logicalWidth = height;
    }
    this._resizeLayers();
  }

  private createDataLayers() {
    const ctor = chartClasses[this.paraview.paraState.type];
    let dataLayer: DataLayer;
    if (ctor) {
      dataLayer = new ctor(this.paraview, this._width, this._height, 0, this._parent.chartInfo);
      this.append(dataLayer);
    } else {
      // TODO: Is this error possible?
      throw new Error(`no class found for chart type '${this.paraview.paraState.type}'`);
    }
    this._dataLayers = [dataLayer];
  }

  updateLoc() {

  }

  render() {
    let transform = fixed`translate(${this._x + this._padding.left},${this._y + this._padding.top})`;
    if (this._orientation === 'east') {
      transform += fixed`
        translate(${this._logicalHeight},${0})
        rotate(90)
      `;
    } else if (this._orientation === 'west') {
      transform += fixed`
        translate(0,${this._logicalHeight})
        rotate(-90)
      `;
    } else if (this._orientation === 'south') {
      transform += fixed`
        translate(0,${this._logicalHeight})
        scale(1,-1)
      `;
    }
    return svg`
      <g
        id="chart-layers"
        transform=${transform}
      >
        <rect
          id="data-backdrop"
          width=${fixed`${this._logicalWidth}`}
          height=${fixed`${this._logicalHeight}`}
        />
        ${this._backgroundHighlightsLayer.render()}
        ${this._backgroundAnnotationLayer.render()}
        ${this._dataLayers.map(layer => layer.render())}
        ${this._foregroundHighlightsLayer.render()}
        ${this._selectionLayer.render()}
        ${this._foregroundAnnotationLayer.render()}
        ${this._focusLayer.render()}
        ${this.popupLayer.render()}
      </g>
    `;
  }

}