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
import { AxisInfo } from '../common/axisinfo';
import { type PointChartType } from '../store/settings_types';
import { dedupPrimitive, enumerate, strToId } from '../common/utils';
import { formatBox, formatDatapoint, formatDatapointX } from './formatter';

import { type coord, generateClusterAnalysis } from '@fizz/clustering';

/**
 * Abstract base class for charts that represent data values as points
 * (connected or not).
 */
export abstract class PointChart extends XYChart {
 
  protected _addedToParent() {
    super._addedToParent();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      yValues: this.paraview.store.model!.ys
    });
  }

  get datapointViews() {
    return super.datapointViews as ChartPoint[];
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ChartPoint(seriesView);
  }

  protected _createComponents() {
    const xs: string[] = [];
    for (const [x, i] of enumerate(this.paraview.store.model!.boxedXs)) {
      xs.push(formatBox(x, `${this.parent.docView.type as PointChartType}Point`, this.paraview.store));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
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

  protected _layoutDatapoints() {
    ChartPoint.computeSize(this);
    for (const datapointView of this.datapointViews) {
       datapointView.computeLayout();
    }
  }

  protected _generateClustering(){
    const data: Array<coord> = []
    const yValues = this.paraview.store.model!.ys;
    const xValues = this.paraview.store.model!.xs as number[];
    for (let i = 0; i < xValues.length; i++){
      data.push({x: xValues[i], y: yValues[i]})
    } 
    this._clustering = generateClusterAnalysis(data, true);
  } 

  seriesRef(series: string) {
    return this.paraview.ref<SVGGElement>(`series.${series}`);
  }

  raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getDatapointGroupBbox(labelText: string) {
    const labels = this.paraview.store.model!.boxedXs.map((box) => formatBox(box, 'xTick', this.paraview.store));
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
    const axisDivisions = chart.paraview.store.model!.xs.length - 1;
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

  protected _computeX() {
    return ChartPoint.width * this.index;
  }

  protected _computeY() {
    const pxPerYUnit = this.chart.height / this.chart.axisInfo!.yLabelInfo.range!;
    return this.chart.height - (this.datapoint.y as number - this.chart.axisInfo!. yLabelInfo.min!) * pxPerYUnit;
  }

  computeLayout() {
    this._x = this._computeX();
    this._y = this._computeY();
  }

}

