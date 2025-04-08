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

import { View } from './base_view';
import { fixed } from '../common/utils';
import { type Layout } from './layout';
import { type DocumentView } from './document_view';
import { type CardinalDirection } from '../store/settings_types';
//import { AnnotationLayer } from './annotationlayer';
import { type DataLayer } from './datalayer';
import { HighlightsLayer } from './highlightslayer';
import { SelectionLayer } from './selectionlayer';
import { LineChart } from './line';
//import { StepLineChart } from './stepline';
//import { LollipopChart } from './lollipop';
import { ScatterPlot } from './scatter';
import { BarChart } from './bar';
//import { PieChart } from './pie';
//import { DonutChart } from './donut';
//import { GaugeChart } from './gauge';
import { XYChart } from './xychart';
//import { type Model } from '../data/model';
import { 
  type AxisCoord, type AxisOrientation, Axis
} from './axis';
import { type TickLabelTier } from './ticklabeltier';

import { type Interval } from '@fizz/chart-classifier-utils';

import { svg } from 'lit';

// FIXME: Temporarily replace chart types that haven't been introduced yet
export const chartClasses = {
  bar: BarChart,
  column: BarChart,
  line: LineChart,
  scatter: ScatterPlot,
  pie: BarChart, //PieChart,
  donut: BarChart, //DonutChart,
  gauge: BarChart, //GaugeChart,
  stepline: LineChart, //StepLineChart,
  lollipop: BarChart, //LollipopChart
};

export class ChartLayerManager extends View {

  declare protected _parent: Layout;

  private _contentWidth!: number;
  private _orientation!: CardinalDirection;
  //private model!: Model;
  //private _backgroundAnnotationLayer!: AnnotationLayer;
  private dataLayers!: DataLayer[];
  private _highlightsLayer!: HighlightsLayer;
  private _selectionLayer!: SelectionLayer;
  //private _foregroundAnnotationLayer!: AnnotationLayer;

  constructor(public readonly docView: DocumentView) {
    super();
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

  protected _addedToParent() {
    //this.model = todo().controller.model!;
    this._orientation = this.docView.paraview.store.settings.chart.orientation;
    this._contentWidth = this.docView.paraview.store.settings.chart.size.width!;
    //this._backgroundAnnotationLayer = new AnnotationLayer('background');
    //this.append(this._backgroundAnnotationLayer);
    this.createDataLayers();
    this._highlightsLayer = new HighlightsLayer();
    this.append(this._highlightsLayer);
    //this._foregroundAnnotationLayer = new AnnotationLayer('foreground');
    //this.append(this._foregroundAnnotationLayer);
    this._selectionLayer = new SelectionLayer();
    this.append(this._selectionLayer);    
  }

  /** Logical width of the chart. */
  get width() {
    return this.contentWidth;
  }

  /** Logical height of the chart. */
  get height() {
    return this.docView.paraview.store.settings.chart.size.height!;
  }
  
  /** 
   * Logical width of the main chart content; includes datapoints, but 
   * not, e.g., series labels, leader lines, etc. 
   */
  get contentWidth() {
    return this._contentWidth;
  }

  set contentWidth(newContentWidth: number) {
    this._contentWidth = newContentWidth;
  }

  get contentHeight() {
    return this.height;
  }

  /** Physical width of the chart; i.e., width onscreen after any rotation. */
  get physWidth() {
    return this._orientation === 'north' || this._orientation === 'south' ?
      this.width : this.height;
  }

  /** Physical height of the chart; i.e., height onscreen after any rotation. */
  get physHeight() {
    return this._orientation === 'north' || this._orientation === 'south' ?
      this.height : this.width;
  }

  /** Physical content width of the chart; i.e., content width onscreen after any rotation. */
  get physContentWidth() {
    return this._orientation === 'north' || this._orientation === 'south' ?
      this.contentWidth : this.contentHeight;
  }

  /** Physical content height of the chart; i.e., content height onscreen after any rotation. */
  get physContentHeight() {
    return this._orientation === 'north' || this._orientation === 'south' ?
      this.contentHeight : this.contentWidth;
  }

  get orientation() {
    return this._orientation;
  }

  /*get backgroundAnnotationLayer() {
    return this._backgroundAnnotationLayer;
  }*/

  get dataLayer() {
    return this.dataLayers[0];
  }

  get highlightsLayer() {
    return this._highlightsLayer;
  }

  /*get foregroundAnnotationLayer() {
    return this._foregroundAnnotationLayer;
  }*/

  get selectionLayer() {
    return this._selectionLayer;
  }

  private createDataLayers() {
    const ctor = chartClasses[this.docView.paraview.store.type];
    let dataLayer: DataLayer;
    if (ctor) {
      dataLayer = new ctor(0, this.docView.paraview);
      this.append(dataLayer);
    } else {
      // TODO: Is this error possible?
      throw new Error(`no class found for chart type '${this.docView.paraview.store.type}'`);
    }
    dataLayer.init();
    this.dataLayers = [dataLayer];
  }

  shouldHaveAxes() {
    return this.dataLayers[0] instanceof XYChart;
  }

  getXAxisInterval(): Interval {
    if (this.docView.paraview.store.model.xDatatype !== 'number') {
      throw new Error('X-axis intervals no specified for non-numeric x-axes')
    }
    const xs = this.docView.paraview.store.model.xs as number[];
    return {start: Math.min(...xs), end: Math.max(...xs)};
  }

  getYAxisInterval(): Interval {
    if (!(this.dataLayers[0] instanceof XYChart)) {
      throw new Error('cannot get y-axis interval for non-XYChart');
    }
    return {
      start: this.dataLayers[0].yLabelInfo.min!, 
      end: this.dataLayers[0].yLabelInfo.max!
    };
  }

  getAxisInterval(coord: AxisCoord): Interval | undefined {
    if (coord === 'x') { 
      return this.getXAxisInterval();
    } else if (coord === 'y') {
      return this.getYAxisInterval();
    } else {
      throw new Error(`axis coordinate '${coord}' has no interval`);
    }
  }

  getTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<T>[] {
    if (axis.coord === 'x') { 
      return this.dataLayers[0].getXTickLabelTiers(axis);
    } else if (axis.coord === 'y') {
      return this.dataLayers[0].getYTickLabelTiers(axis);
    } else {
      throw new Error(`axis coord '${axis.coord}' has no tick label tiers`);
    }
  }

  updateLoc() {
    // this._x = this.controller.settingStore.settings.chart.padding;
    // this._y = this.controller.settingStore.settings.chart.padding;
    // if (this.shouldHaveAxes()) {
    //   if (this.docView.vertAxis!.orientationSettings.position === 'west') {
    //     this._x += this.docView.vertAxis!.width;
    //   }
    //   if (this.docView.horizAxis!.orientationSettings.position === 'north') {
    //     this._y += this.docView.horizAxis!.height;
    //   }  
    // }
  }

  setLowVisionMode(lvm: boolean) {
    this.dataLayer.setLowVisionMode(lvm);
  }
  
  render() {
    let transform = fixed`translate(${this._x},${this._y})`;
    if (this._orientation === 'east') {
      transform += fixed`
        translate(${this.height},${0}) 
        rotate(90) 
      `;
    } else if (this._orientation === 'west') {
      transform += fixed`
        translate(0,${this.height}) 
        rotate(-90) 
      `;
    } else if (this._orientation === 'south') {
      transform += fixed`
        translate(0,${this.height}) 
        scale(1,-1) 
      `;
    }
    //clip-path="url(#clip-path)"
    return svg`
      <g
        id="chart-layers"
        transform=${transform}
      >
        <rect 
          id="data-backdrop" 
          width=${this.physContentWidth} 
          height=${this.physContentHeight}
        />
        ${this.dataLayers.map(layer => layer.render())}
        ${this._highlightsLayer.render()}
        ${this._selectionLayer.render()}
      </g>
    `;
  }

}