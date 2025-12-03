/* ParaCharts: Waterfall Charts
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

import {
  DeepReadonly, WaterfallSettings, type ParaStore
} from '../store';
import { NavNode } from '../view/layers';

import { ChartType } from '@fizz/paramanifest';
import { PlaneChartInfo } from './plane_chart';
import { AxisInfo } from '../common';

import { formatXYDatapointX } from '@fizz/parasummary';

export class WaterfallChartInfo extends PlaneChartInfo {

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  get settings() {
    return super.settings as DeepReadonly<WaterfallSettings>;
  }

  protected _init(): void {
    super._init();
    const xValues = this._store.model!.series[0].datapoints.map(dp => formatXYDatapointX(dp, 'raw'));
    const yValues: number[] = [];
    this._store.model!.series[0].datapoints.forEach((dp, i) => {
      yValues.push(i === 0
        ? dp.facetValueAsNumber('y')!
        : yValues[i - 1] + dp.facetValueAsNumber('y')!
      );
    });
    yValues.push(0);
    this._axisInfo = new AxisInfo(this._store, {
      xTiers: [xValues],
      yValues: yValues,
      yMin: Math.min(0, Math.min(...yValues)),
      isXInterval: true,
    });
  }

  navCursorDidChange(cursor: NavNode): void {
  }

  // async navRunDidEnd(cursor: NavNode) {
  //   super.navRunDidEnd(cursor);
  //   if (cursor.isNodeType('tableCell')) {
  //     this._store.announce(this._contents[cursor.options.row][cursor.options.column]);
  //   }
  // }

}