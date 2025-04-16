/* ParaCharts: Point Charts
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

import { XYChart, XYDatapointView, XYSeriesView } from './xychart';
import { Axis, type AxisOrientation } from './axis';
import { type TickLabelTier, HorizTickLabelTier, VertTickLabelTier } from './ticklabeltier';
//import { utils, fixed } from '../utilities';
import { type PointChartType } from '../store/settings_types';
import { dedupPrimitive, enumerate, strToId } from '../common/utils';
import { formatBox, formatDatapoint, formatDatapointX } from './formatter';

import { type coord, generateClusterAnalysis } from '@fizz/clustering';

/**
 * Abstract base class for charts that represent data values as points
 * (connected or not).
 */
export abstract class PointChart extends XYChart {

  protected _tickIntervalX!: number;
  protected _tickIntervalY!: number;
  protected _isComputeXTicks = false;

  private selectors: string[][] = [];
 
  protected _addedToParent() {
    super._addedToParent();
  }

  get datapointViews() {
    return super.datapointViews as ChartPoint[];
  }

  get isComputeXTicks(): boolean {
    return this._isComputeXTicks;
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ChartPoint(seriesView);
  }

  protected _createComponents() {
    const xs: string[] = [];
    for (const [x, i] of enumerate(this.paraview.store.model.boxedXs)) {
      xs.push(formatBox(x, `${this.parent.docView.type as PointChartType}Point`, this.paraview.store));
      const xId = strToId(xs.at(-1)!);
      if (this.selectors[i] === undefined) {
        this.selectors[i] = [];
      }
      this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model.series)) {
      const seriesView = new XYSeriesView(this, col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
        //todo().canvas.jimerator.addSelector(col.name!, j, datapointView.id);
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: XYSeriesView, b: XYSeriesView) => {
      return b.children[0].datapoint.y - a.children[0].datapoint.y;
    });  
  }

  protected _layoutComponents() {
    super._layoutComponents();
    this._layoutSymbols();
  }

  protected _computeXLabelInfo() {
    if (this._isComputeXTicks) {
      const values = this.paraview.store.model.xs as number[];
      this._xLabelInfo = Axis.computeNumericLabels(
        this.paraview.store.settings.axis.x.minValue ?? Math.min(...values), 
        this.paraview.store.settings.axis.x.maxValue ?? Math.max(...values),
        false);
    } else {
      const datapoints = this.paraview.store.model.allPoints;
      const labels = dedupPrimitive(datapoints.map(point => formatDatapointX(point, 'xTick', this.paraview.store)));
      this._xLabelInfo = {
        labels,
        maxChars: Math.max(...labels.map(l => l.length))
      };
    }
  }

  protected _computeYLabelInfo() {
    const values = this.paraview.store.model.ys;
    this._yLabelInfo = Axis.computeNumericLabels(
      this.paraview.store.settings.axis.y.minValue ?? Math.min(...values), 
      this.paraview.store.settings.axis.y.maxValue ??  Math.max(...values), 
      false /*this._model.depFormat === 'percent'*/);  
  }

  protected _layoutDatapoints() {
    this._tickIntervalX = this.parent.contentWidth/(this._xLabelInfo.labels.length - 1);
    this._tickIntervalY = this.height/(this._yLabelInfo.labels.length - 1);
    //this.updateGrid(this.tickIntervalY, this.tickIntervalX);
    ChartPoint.computeSize(this);
    for (const datapointView of this.datapointViews) {
       datapointView.computeLayout();
    }
  }

  getXTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<any>[] {
    //const xSeries = this.paraview.store.model.xs;
    const slots = this._xLabelInfo.labels.map((tickLabel, i) => 
      ({
        pos: this._tickIntervalX*i,
        text: tickLabel,
        id: this.selectors[i][0]
      }));
    if (axis.isHoriz()) {
      return [new HorizTickLabelTier(
        axis,
        slots,
        this._tickIntervalX,
        this.paraview
      )];
    } else if (axis.isVert()) {
      return [new VertTickLabelTier(
        axis,
        slots,
        this._tickIntervalX,
        this.paraview
      )];
    } else {
      throw new Error('impossible axis orientation!');
    }
  }

  getYTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<any>[] {
    const slots = this._yLabelInfo.labels.map((tickLabel, i) => 
      ({
        pos: this._tickIntervalY*i,
        text: tickLabel,
        id: `tick-y-${strToId(tickLabel)}`
      }));
    if (axis.isHoriz()) {
      return [new HorizTickLabelTier(
        axis,
        slots,
        this._tickIntervalY,
        this.paraview
      )];
    } else if (axis.isVert()) {
      return [new VertTickLabelTier(
        axis,
        slots,
        this._tickIntervalY,
        this.paraview
      )];
    } else {
      throw new Error('impossible axis orientation!');
    }
  }

  /*protected _generateClustering(){
    const data: coord[] = []
    for (let i = 0; i < this._model.data.data[0].data.length; i++){
      data.push({x: Number(this._model.data.data[0].data[i]), y: Number(this._model.data.data[1].data[i])})
    }
    this._clustering = generateClusterAnalysis(data, true);
  }*/

  seriesRef(series: string) {
    return this.paraview.ref<SVGGElement>(`series.${series}`);
  }

  raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getDatapointGroupBbox(labelText: string) {
    const labels = this.paraview.store.model.boxedXs.map((box) => formatBox(box, 'xTick', this.paraview.store));
    const idx = labels.findIndex(label => label === labelText);
    if (idx === -1) {
      throw new Error(`no such datapoint with label '${labelText}'`);
    }
    const g = this.paraview.ref<SVGGElement>('dataset').value!.children[idx] as SVGGElement;
    return g.getBBox();
  }

  getTickX(idx: number) {
    return this.datapointViews[idx].x;
  }

}

/**
 * Basic point marker.
 */
export class ChartPoint extends XYDatapointView {

  declare readonly chart: PointChart;

  static width: number;

  static computeSize(chart: PointChart) {
    const axisDivisions = chart.paraview.store.model.numSeries;
    this.width = chart.parent.contentWidth/axisDivisions;
  }

  constructor(seriesView: XYSeriesView) {
    super(seriesView);
  }

  get width() {
    return ChartPoint.width;
  }

  get height() {
    return 0;
  }

  get _selectedMarkerX() {
    return this._x - this.width/2;
  }

  get _selectedMarkerY() {
    return this._y - this.height/2;
  }

  protected get _visitedTransform() {
    return 'scale(1.5)';
  }

  computeLayout() {
    const ylabelInfo = this.chart.yLabelInfo;
    const xlabelInfo = this.chart.xLabelInfo;
    const canvasHeightPx = this.chart.height;
    // pixel height/y-value range
    const pxPerYUnit = canvasHeightPx / ylabelInfo.range!;
    // height (= distance from x-axis) in pixels
    const height = (this.datapoint.y - ylabelInfo.min!) * pxPerYUnit;
    // pixels above the datapoint

    //Scales points in proportion to the data range, should only activate for scatterplots
    if (this.chart.isComputeXTicks){
      const xTemp: number = (Number(this.datapoint.xRaw) - Number(xlabelInfo.min!)) / Number(xlabelInfo.range!);
      const parentWidth: number = this.chart.parent.contentWidth;
      this._x = parentWidth * xTemp;
    }
    else {
      this._x = ChartPoint.width * this.index;
    }
    this._y = canvasHeightPx - height;
  }

}

