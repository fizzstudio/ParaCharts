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

import { SeriesView } from '../../../data';
import { XYChart, XYDatapointView, XYSeriesView } from '.';
import { AxisInfo } from '../../../../common/axisinfo';
import { Setting, type PointChartType } from '../../../../store/settings_types';

import { enumerate, strToId } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { svg } from 'lit';
import { linearRegression } from 'simple-statistics';
import { View } from '../../../base_view';


/**
 * Abstract base class for charts that represent data values as points
 * (connected or not).
 */
export abstract class PointChart extends XYChart {
 
  protected _addedToParent() {
    super._addedToParent();
    //@ts-ignore Remove when graph is added to ChartTypes in ParaManifest
    if (this.paraview.store.type !== "graph"){
      this._axisInfo = new AxisInfo(this.paraview.store, {
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((y) => y.value as number)
    });
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
      // this._axisInfo!.updateYRange();
      // for (const datapointView of this.datapointViews) {
      //   datapointView.computeLocation();
      // }
      // for (const datapointView of this.datapointViews) {
      //   datapointView.completeLayout();
      // }
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get datapointViews() {
    return super.datapointViews as ChartPoint[];
  }

  protected _newSeriesView(seriesKey: string) {
    return new PointSeriesView(this, seriesKey);    
  }

  protected _newDatapointView(seriesView: SeriesView) {
    return new ChartPoint(seriesView);
  }

  protected _createDatapoints() {
    const xs: string[] = [];
    for (const [p, i] of enumerate(this.paraview.store.model!.series[0].datapoints)) {
      xs.push(formatBox(p.facetBox('x')!, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: XYSeriesView, b: XYSeriesView) => {
      return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    });  
  }

  // protected _layoutDatapoints() {
  //   ChartPoint.computeSize(this);
  //   for (const datapointView of this.datapointViews) {
  //      datapointView.computeLayout();
  //   }
  // }

  seriesRef(series: string) {
    return this.paraview.ref<SVGGElement>(`series.${series}`);
  }

  _raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getDatapointGroupBbox(labelText: string) {
    const labels = this.paraview.store.model!.allFacetValues('x')!.map(
      (box) => formatBox(box, this.paraview.store.getFormatType('xTick'))
    );
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

export class PointSeriesView extends XYSeriesView {

  get styleInfo() {
    const style = super.styleInfo;
    style.fill = 'none';
    return style;
  }

}


/**
 * Basic point marker.
 */
export class ChartPoint extends XYDatapointView {

  declare readonly chart: PointChart;

  static width: number;

  // static computeSize(chart: PointChart) {
  //   const axisDivisions = chart.paraview.store.model!.allFacetValues('x')!.length - 1;
  //   this.width = chart.parent.contentWidth/axisDivisions;
  // }

  constructor(seriesView: SeriesView) {
    super(seriesView);
  }

  get width() {
    const axisDivisions = this.paraview.store.model!.series[0].length - 1;
    return this.chart.parent.width/axisDivisions;
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

  protected _computeX() {
    return this.width * this.index;
  }

  protected _computeY() {
    const pxPerYUnit = this.chart.height / this.chart.axisInfo!.yLabelInfo.range!;
    return this.chart.height - (this.datapoint.facetValueNumericized(this.datapoint.depKey)! - this.chart.axisInfo!. yLabelInfo.min!) * pxPerYUnit;
  }

  computeLocation() {
    this._x = this._computeX();
    this._y = this._computeY();
  }

}

export class TrendLineView extends View {
  protected x1: number = 0;
  protected x2: number = 0;
  protected y1: number = 0;
  protected y2: number = 0;

  constructor(private chart: XYChart) {
    super(chart.paraview);
    this._generateEndpoints()
  }

  protected _generateEndpoints() {
    const pointsArray: number[][] = [];
    for (const child of this.chart.datapointViews) {
      pointsArray.push([child.x, child.y])
    }
    const linReg: { m: number; b: number; } = linearRegression(pointsArray);
    this.y1 = linReg.b
    this.x2 = this.chart.parent.width
    this.y2 = this.x2 * linReg.m + linReg.b
    if (this.y2 < 0) {
      this.x2 = -1 * linReg.b / linReg.m
      this.y2 = 0;
    }
    if (this.y2 > this.chart.parent.height) {
      this.x2 = (this.chart.parent.height - linReg.b) / linReg.m
      this.y2 = this.chart.parent.height;
    }
  }

  render() {
    return svg`
    <line x1=${this.x1} x2=${this.x2} y1=${this.y1} y2=${this.y2} style="stroke:red;stroke-width:3"/>
    `}
}