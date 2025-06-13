/* ParaCharts: Chart Layer Manager
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

import { View } from '../base_view';
import { fixed } from '../../common/utils';
import { type Layout } from '../layout';
import { type DocumentView } from '../document_view';
import { type CardinalDirection } from '../../store/settings_types';
import { AnnotationLayer, type DataLayer, HighlightsLayer, SelectionLayer } from '.';
import { LineChart, ScatterPlot, BarChart, PieChart } from './data/chart_type';
//import { StepLineChart } from './stepline';
//import { LollipopChart } from './lollipop';
//import { DonutChart } from './donut';
//import { GaugeChart } from './gauge';
//import { type Model } from '../data/model';
import { 
  type AxisCoord, type AxisOrientation, Axis
} from '../axis';

import { type Interval } from '@fizz/chart-classifier-utils';

import { calendarNumber, type CalendarPeriod } from '@fizz/paramodel';

import { svg } from 'lit';
import { Heatmap } from './data/chart_type/heatmap';
import { Histogram } from './data/chart_type/histogram';


// FIXME: Temporarily replace chart types that haven't been introduced yet
export const chartClasses = {
  bar: BarChart,
  column: BarChart,
  line: LineChart,
  scatter: ScatterPlot,
  histogram: Histogram,
  heatmap: Heatmap,
  pie: PieChart,
  donut: PieChart,
  gauge: BarChart, //GaugeChart,
  stepline: LineChart, //StepLineChart,
  lollipop: BarChart, //LollipopChart
};

export class ChartLayerManager extends View {

  declare protected _parent: Layout;

  protected _logicalWidth!: number;
  protected _logicalHeight!: number;

  protected _orientation!: CardinalDirection;
  protected _backgroundAnnotationLayer!: AnnotationLayer;
  protected _dataLayers!: DataLayer[];
  protected _highlightsLayer!: HighlightsLayer;
  protected _selectionLayer!: SelectionLayer;
  protected _foregroundAnnotationLayer!: AnnotationLayer;

  constructor(public readonly docView: DocumentView) {
    super(docView.paraview);
    this._orientation = this.paraview.store.settings.chart.orientation;
    this.width = this.paraview.store.settings.chart.size.width!;
    this.height = this.paraview.store.settings.chart.size.height!;
    this.createLayers();
  }

  protected _createId() {
    return 'layers';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: Layout) {
    super.parent = parent;
  }

  createLayers() {
    this._backgroundAnnotationLayer = new AnnotationLayer(this.paraview, 'background');
    this.append(this._backgroundAnnotationLayer);
    this.createDataLayers();
    this._highlightsLayer = new HighlightsLayer(this.paraview);
    this.append(this._highlightsLayer);
    this._foregroundAnnotationLayer = new AnnotationLayer(this.paraview, 'foreground');
    this.append(this._foregroundAnnotationLayer);
    this._selectionLayer = new SelectionLayer(this.paraview);
    this.append(this._selectionLayer);    
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
    
  get backgroundAnnotationLayer() {
    return this._backgroundAnnotationLayer;
  }

  get dataLayer() {
    return this._dataLayers[0];
  }

  get highlightsLayer() {
    return this._highlightsLayer;
  }

  get foregroundAnnotationLayer() {
    return this._foregroundAnnotationLayer;
  }

  get selectionLayer() {
    return this._selectionLayer;
  }

  protected _resizeLayers() {
    this._children.forEach(kid => kid.setSize(this._logicalWidth, this._logicalHeight, false));
  }

  private createDataLayers() {
    const ctor = chartClasses[this.paraview.store.type];
    let dataLayer: DataLayer;
    if (ctor) {
      dataLayer = new ctor(this.paraview, 0);
      this.append(dataLayer);
    } else {
      // TODO: Is this error possible?
      throw new Error(`no class found for chart type '${this.paraview.store.type}'`);
    }
    this._dataLayers = [dataLayer];
  }

  getXAxisInterval(): Interval {
    let xs: number[] = [];
    if (this.paraview.store.model!.getFacet('x')!.datatype === 'number') {
      xs = this.paraview.store.model!.allFacetValues('x')!.map((box) => box.value as number);
    } else if (this.paraview.store.model!.getFacet('x')!.datatype === 'date') { 
      xs = this.paraview.store.model!.allFacetValues('x')!.map((box) =>
        calendarNumber(box.value as CalendarPeriod));
    } else {
      throw new Error('axis must be of type number or date to take interval');
    }
    return {start: Math.min(...xs), end: Math.max(...xs)};
  }


  getYAxisInterval(): Interval {
    if (!this._dataLayers[0].axisInfo) {
      throw new Error('chart is missing `axisInfo` object');
    }
    return {
      start: this._dataLayers[0].axisInfo.yLabelInfo.min!, 
      end: this._dataLayers[0].axisInfo.yLabelInfo.max!
    };
  }

  getAxisInterval(coord: AxisCoord): Interval | undefined {
    if (coord === 'x') { 
      return this.getXAxisInterval();
    } else {
      return this.getYAxisInterval();
    }
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
          width=${this.width} 
          height=${this.height}
        />
        ${this._backgroundAnnotationLayer.render()}
        ${this._dataLayers.map(layer => layer.render())}
        ${this._highlightsLayer.render()}
        ${this._foregroundAnnotationLayer.render()}
        ${this._selectionLayer.render()}
      </g>
    `;
  }

}