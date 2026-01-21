/* ParaCharts: Waterfall Charts
Copyright (C) 2025 Fizz Studio

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
  DeepReadonly, WaterfallSettings, type ParaState
} from '../state';
import { type ParaView } from '../paraview';
import { NavNode } from '../view/layers';

import { ChartType } from '@fizz/paramanifest';
import { PlaneChartInfo, SONI_RIFF_SPEEDS } from './plane_chart';
import { AxisInfo, loopParaviewRefresh } from '../common';
import { computeAxisRange } from './plane_chart';

import { Datapoint, PlaneDatapoint, Box } from '@fizz/paramodel';

import { formatXYDatapointX } from '@fizz/parasummary';
import { SoniPoint } from '../audio/soni_point';
import { Datatype } from '@fizz/paramanifest';
import { Interval } from '@fizz/chart-classifier-utils';

export class WaterfallChartInfo extends PlaneChartInfo {
  protected _cumulativeTotals!: number[];
  protected _prevHighlightNavcode = '';

  constructor(type: ChartType, paraView: ParaView) {
    super(type, paraView);
  }

  get isIntertick(): boolean {
    return true;
  }

  get settings() {
    return super.settings as DeepReadonly<WaterfallSettings>;
  }

  protected _init(): void {
    // XXX HACK Cumulative totals must be computed before calling _init()
    // Assume the final point is a total column
    this._cumulativeTotals = this._paraState.model!.series[0].datapoints.slice(0, -1).map(dp =>
      this._cumulativeTotalForDatapoint(dp));
    this._cumulativeTotals.push(this._cumulativeTotals.at(-1)!);
    super._init();
    const xValues = this._paraState.model!.series[0].datapoints.map(dp => formatXYDatapointX(dp, 'raw'));
    const yValues: number[] = [...this._cumulativeTotals];
    // this._paraState.model!.series[0].datapoints.forEach((dp, i) => {
    //   yValues.push(i === 0
    //     ? dp.facetValueAsNumber('y')!
    //     : yValues[i - 1] + dp.facetValueAsNumber('y')!
    //   );
    // });
    yValues.push(0);
    // this._axisInfo = new AxisInfo(this._paraState, {
    //   xTiers: [xValues],
    //   yValues: yValues,
    //   yMin: Math.min(0, Math.min(...yValues)),
    //   isXInterval: true,
    // });
  }

  protected _facetTickLabelValues(facetKey: string): string[] {
    if (facetKey === 'x') {
      return this._paraState.model!.series[0].datapoints.map(dp => formatXYDatapointX(dp, 'value'));
    } else if (facetKey === 'y') {
      return [...this._cumulativeTotals.map(ct => ct.toString())];
    } else {
      throw new Error("facet key must be 'x' or 'y'");
    }
  }

  protected _numericYAxisRange(facetKey: string): Interval {
    return facetKey === 'x'
      ? super._numericYAxisRange(facetKey)
      : computeAxisRange(0, Math.max(...this._cumulativeTotals))
  }

  navCursorDidChange(cursor: NavNode): void {
  }

  // async navRunDidEnd(cursor: NavNode) {
  //   super.navRunDidEnd(cursor);
  //   if (cursor.isNodeType('tableCell')) {
  //     this._paraState.announce(this._contents[cursor.options.row][cursor.options.column]);
  //   }
  // }

  protected _cumulativeTotalForDatapoint(datapoint: Datapoint): number {
    const series = this._paraState.model!.atKey(datapoint.seriesKey)!;
    return series.datapoints
      .slice(0, datapoint.datapointIndex + 1)
      .reduce((accum, dp) => accum + dp.facetValueAsNumber('y')!, 0);
  }

  // playDatapoints(datapoints: PlaneDatapoint[]): void {
  //   new PlaneDatapoint()
  //   super.playDatapoints(datapoints);
  // }

  playDatapoints(datapoints: PlaneDatapoint[]): void {
    const length = datapoints.length;
    loopParaviewRefresh(this._paraView,
      this._paraView.paraState.settings.animation.popInAnimateRevealTimeMs
      + SONI_RIFF_SPEEDS.at(this._paraState.settings.sonification.riffSpeedIndex)! * length, 50);
    // We can't make the sonipoint directly from the model datapoint; we need to
    // take the sonipoint y-min/max from the cumulative totals for each datapoint
    const soniPoints = [new SoniPoint(
      datapoints[0].datapointIndex,
      this._cumulativeTotals[datapoints[0].datapointIndex],
      0, this._paraState.model!.series[0].length - 1,
      Math.min(...this._cumulativeTotals), Math.max(...this._cumulativeTotals)
    )];
    if (datapoints[0].datapointIndex
      && datapoints[0].datapointIndex < this._paraState.model!.series[0].length - 1) {
      soniPoints.unshift(new SoniPoint(
        datapoints[0].datapointIndex - 1,
        this._cumulativeTotals[datapoints[0].datapointIndex - 1],
        0, this._paraState.model!.series[0].length - 1,
        Math.min(...this._cumulativeTotals), Math.max(...this._cumulativeTotals)
      ));
    }
    // const total = this._cumulativeTotalForDatapoint(datapoints[0]);
    // console.log('TOTAL', total);
    // soniPoint.y = total;
    this._sonifier.playSoniPoints([soniPoints[0]]);
    if (soniPoints.length > 1) {
      setTimeout(() => {
        this._sonifier.playSoniPoints([soniPoints[1]]);
      }, SONI_RIFF_SPEEDS.at(this._paraState.settings.sonification.riffSpeedIndex));
    }
  }

}