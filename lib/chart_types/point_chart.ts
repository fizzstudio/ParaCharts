/* ParaCharts: Point Chart Info
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

import { PlaneChartInfo } from './plane_chart';
import { AxisInfo } from '../common/axisinfo';
import { type ParaStore } from '../store';

import { type ChartType } from '@fizz/paramanifest';
import { Series } from '@fizz/paramodel';


/**
 * Abstract base class for charts that represent data values as
 * points (connected or not).
 */
export abstract class PointChartInfo extends PlaneChartInfo {

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _init(): void {
    super._init();
    // XXX don't create if type === 'graph'
    this._axisInfo = new AxisInfo(this._store, {
      yValues: this._store.model!.allFacetValues('y')!.map((y) => y.value as number)
    });
  }

  protected _seriesInNavOrder(): Series[] {
    const depFacet = this._store.model!.dependentFacetKeys[0];
    // Sort by value of first datapoint from greatest to least
    return this._store.model!.series.toSorted((a, b) =>
      b.datapoints[0].facetValueNumericized(depFacet)! -
      a.datapoints[0].facetValueNumericized(depFacet)!);
  }
}
