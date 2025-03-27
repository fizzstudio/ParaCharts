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
  DataFrame, type ScalarArray
} from '@fizz/dataframe';
import { type Manifest } from '@fizz/chart-metadata-validation';
import { Scalar } from './dataframe/box';

/**
 * Wrapper around the internal data frame that holds the chart data.
 * @public
 */
// XXX For the moment, we assume all X-axis variables have the same type
export class Model2D<X extends Scalar, Y extends Scalar> {
  private _data: DataFrame;
  private _indepVar: string;
  private _depVars: string[];
  private _depFormat: 'bare' | 'percent';

  constructor(manifest: Manifest/*, seriesRecords: SeriesRecordMap<X, Y>*/) {
    console.log('creating model');
    const dataset = manifest.datasets[0];
    this._indepVar = dataset.facets.y.units ?? 'number';
    this._depVars = dataset.series.map((series) => series.key);
    this._depFormat = dataset.series[0].records![0].x.endsWith('%') ? 'percent' : 'bare';
    const data: ScalarArray[] = [rawData.independentLabels];
    data.push();
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

constructor(public readonly seriesKey: string, public readonly record: number, private model: Model) {
  this.x = model.indepSeries().atBoxed(record);
  this.y = model.data.col(seriesKey).atBoxed(record);
  this.series = model.data.col(seriesKey);
}
