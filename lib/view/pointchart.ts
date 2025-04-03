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
import { enumerate } from '../common/utils';

// type CanComputeSize = {
//   computeSize: (chart: PointChart<any, any>) => void;
//   width: number;
// };

/**
 * Abstract base class for charts that represent data values as points
 * (connected or not).
 */
export abstract class PointChart extends XYChart {

  protected _tickIntervalX!: number;
  protected _tickIntervalY!: number;
  protected _isComputeXTicks = false;
  //private seriesRefs: {[name: string]: Ref<SVGGElement>} = {};
  //private visitedMarkRefs: {[name: string]: Ref<SVGUseElement>} = {};

  protected _addedToParent() {
    super._addedToParent();
    /*if (this._model.depType !== 'number') {
      throw new Error('point chart dependent variables must be numbers');
    }*/
  }

  get datapointViews() {
    return super.datapointViews as ChartPoint[];
  }

  //protected sortSeries() {
    // this.visibleSeries.sort((a, b) => 
    //   this.model.data.at(0, b).number - this.model.data.at(0, a).number);  
  //}

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ChartPoint(seriesView);
  }

  protected _createComponents() {
    /*const indep = this._model.indepVar;
    const indepSeries = this._model.indepSeries();
    const xs: string[] = [];
    for (const [i, record] of this._model.data) {
      xs.push(this._model.format(
        indepSeries.atBoxed(i), `${this.parent.docView.type as PointChartType}Point`));
      const xId = utils.strToId(xs.at(-1)!);
      todo().canvas.jimerator.addSelector(indep, i, `tick-x-${xId}`);
    }*/
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
      const values = this._model.data.col(this._model.indepVar).toNumberSeries().data;
      this._xLabelInfo = Axis.computeLabels(
        todo().controller.settingStore.settings.axis.x.minValue ?? Math.min(...values), 
        todo().controller.settingStore.settings.axis.x.maxValue ?? Math.max(...values),
        false);
    } else {
      const values = this._model.indepSeries();
      const labels = values.mapBoxed(x => this._model.format(x, 'xTick'));
      this._xLabelInfo = {
        labels,
        maxChars: Math.max(...labels.map(l => l.length))
      };
    }
  }

  protected _computeYLabelInfo() {
    const values = this._model.data
      .dropCols([this._model.indepVar])
      .mapCols(col => col.numberSeries.data)
      .flat();
    this._yLabelInfo = Axis.computeLabels(
      todo().controller.settingStore.settings.axis.y.minValue ?? Math.min(...values), 
      todo().controller.settingStore.settings.axis.y.maxValue ??  Math.max(...values), 
      this._model.depFormat === 'percent');  
  }

  protected _layoutDatapoints() {
    this._tickIntervalX = this.parent.contentWidth/(this._xLabelInfo.labels.length - 1);
    this._tickIntervalY = this.height/(this._yLabelInfo.labels.length - 1);
    //this.updateGrid(this.tickIntervalY, this.tickIntervalX);
    ChartPoint.computeSize(this);
    // for (const tickPoints of this.points) {
    //   for (const point of tickPoints) {
    //     point.computeLayout();
    //   }
    // }
    for (const datapointView of this.datapointViews) {
       datapointView.computeLayout();
    }
  }

  getXTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<any>[] {
    const xSeries = this._model.indepSeries();
    const slots = this._xLabelInfo.labels.map((tickLabel, i) => 
      ({
        pos: this._tickIntervalX*i,
        text: tickLabel,
        id: todo().canvas.jimerator.modelSelectors[xSeries.name!][i][0]
      }));
    if (axis.isHoriz()) {
      return [new HorizTickLabelTier(
        axis,
        slots,
        this._tickIntervalX
      )];
    } else if (axis.isVert()) {
      return [new VertTickLabelTier(
        axis,
        slots,
        this._tickIntervalX
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
        id: `tick-y-${utils.strToId(tickLabel)}`
      }));
    if (axis.isHoriz()) {
      return [new HorizTickLabelTier(
        axis,
        slots,
        this._tickIntervalY
      )];
    } else if (axis.isVert()) {
      return [new VertTickLabelTier(
        axis,
        slots,
        this._tickIntervalY
      )];
    } else {
      throw new Error('impossible axis orientation!');
    }
  }

  seriesRef(series: string) {
    return todo().canvas.ref<SVGGElement>(`series.${series}`);
  }

  raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getDatapointGroupBbox(labelText: string) {
    const xSeries = this._model.indepSeries();
    // XXX Could take these directly from the DOM
    const labels = xSeries.mapBoxed(box => this._model.format(box, 'xTick'));
    const idx = labels.findIndex(label => label === labelText);
    if (idx === -1) {
      throw new Error(`no such datapoint with label '${labelText}'`);
    }
    const g = todo().canvas.ref<SVGGElement>('dataset').value!.children[idx] as SVGGElement;
    return g.getBBox();
  }

  getTickX(idx: number) {
    return this.datapointViews[idx].x; // this.points[idx][0].x;
  }

}

/**
 * Basic point marker.
 */
export class ChartPoint extends XYDatapointView {

  declare readonly chart: PointChart;

  static width: number;

  static computeSize(chart: PointChart) {
    const axisDivisions = chart.model.data.nRows - 1;
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
    const labelInfo = this.chart.yLabelInfo;
    const canvasHeightPx = this.chart.height;
    // pixel height/y-value range
    const pxPerYUnit = canvasHeightPx/labelInfo.range!;
    // height (= distance from x-axis) in pixels
    const height = (this.datapoint.y.number - labelInfo.min!)*pxPerYUnit;
    // pixels above the datapoint
    this._x = ChartPoint.width*this.index;
    this._y = canvasHeightPx - height;
  }

  // focus() {
  //   super.focus();
  //   for (const v of this.chart.visitedDatapointViews) {
  //     const seriesG = this.chart.seriesRef(v.series.name!).value!;
  //     const visitedDatapoint = seriesG.children[v.index] as SVGElement;
  //     this.chart.parent.highlightsLayer.activateMark(v.series.name!, visitedDatapoint.id);
  //   }
  // }

  // blur() {
  //   super.blur()
  // }

}

