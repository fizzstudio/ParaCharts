/* ParaCharts: Chart Data Model
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

/**
 * Logical datatype of series elements.
 * @public
 */
//export declare type Datatype = 'string' | 'number' | 'date';

import { 
  DataFrame, type ScalarArray, type AnySeries,
  type Box 
} from '@fizz/dataframe';
import { type Data } from '@fizz/chart-metadata-validation';
import { Scalar } from './dataframe/box';

/**
 * A datapoint consisting of boxed x and y values.
 * @public
 */
export class Datapoint2D {

  public readonly x: Box<Scalar>;
  public readonly y: Box<Scalar>;
  public readonly series: AnySeries;

  constructor(public readonly seriesKey: string, public readonly record: number, private model: Model) {
    this.x = model.indepSeries().atBoxed(record);
    this.y = model.data.col(seriesKey).atBoxed(record);
    this.series = model.data.col(seriesKey);
  }

  formatX(context: FormatContext) {
    return this.model.format(this.x, context);
  }

  formatY(context: FormatContext) {
    return this.model.format(this.y, context);
  }

  format(context: FormatContext) {
    return `${this.formatX(context)}, ${this.formatY(context)}`;
  }

  isEqual(other: Datapoint) {
    return this.x.isEqual(other.x) && this.y.isEqual(other.y);
  }

}

export interface DatapointReference {
  /** Record (i.e., model row) index. */
  x: number;
  /** Series (i.e., column) name. */
  y: string;
}

/** 
 * Context where a particular value appears. 
 * @public
 */
export type FormatContext = keyof typeof formatContextSettings;
// Settings that control the format for each context
const formatContextSettings = {
  xTick: 'axis.x.tick.labelFormat',
  yTick: 'axis.y.tick.labelFormat',
  linePoint: 'type.line.pointLabelFormat',
  scatterPoint: 'type.scatter.pointLabelFormat',
  barCluster: 'type.bar.clusterLabelFormat',
  pieChunk: 'type.pie.chunkLabelFormat',
  donutChunk: 'type.donut.chunkLabelFormat',
  gaugeChunk: 'type.gauge.chunkLabelFormat',
  steplinePoint: 'type.stepline.pointLabelFormat',
  lollipopPoint: 'type.lollipop.pointLabelFormat',
  lollipopCluster: 'type.lollipop.clusterLabelFormat',
  jimX: 'jim.xValueFormat',
  dataTableX: 'dataTable.xValueFormat',
  dataTableY: 'dataTable.yValueFormat',
  statusBar: 'statusBar.valueFormat',
  domId: 'NA'
};

/**
 * Wrapper around the internal data frame that holds the chart data.
 * @public
 */
export class Model {

  public readonly indepType: Datatype;
  // XXX For the moment, we assume all dependent-axis variables have the same type
  public readonly depType: Datatype;

  private _data: DataFrame;
  private _indepVar!: string;
  private _depVars!: string[];
  private _depFormat!: 'bare' | 'percent';

  constructor(datatypes: Datatypes, rawData: Data) {
    console.log('creating model');
    const data: ScalarArray[] = [];
    this._indepVar = rawData.independentUnit;
    this._depVars = Object.keys(rawData.series);
    this._depFormat = rawData.series[this._depVars[0]][0].endsWith('%') ? 'percent' : 'bare';
    data.push(rawData.independentLabels);
    for (const dep of this._depVars) {
      data.push(rawData.series[dep]);
    }
    const columns = [rawData.independentUnit, ...this._depVars];
    this._data = new DataFrame(data, {
      columns,
      dtypes: columns.map(c => datatypes[c]) 
    });
    this.indepType = datatypes[rawData.independentUnit];
    this.depType = datatypes[this._depVars[0]];
  }

  get data() {
    return this._data;
  }

  get indepVar() {
    return this._indepVar;
  }

  get depVars(): readonly string[] {
    return this._depVars;
  }

  get depFormat() {
    return this._depFormat;
  }

  indepSeries() {
    return this._data.col(this._indepVar);
  }

  datapoint(series: string, record: number) {
    return new Datapoint(series, record, this);
  }

}