/* ParaCharts: Plane Charts
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

import { Decimal } from 'decimal.js';
import { type ChartType, type Facet, type Interval, numberToScaledNumberRounded, type Datapoint, type PlaneDatapoint, PlaneModel } from '@fizz/chartsignal-internal';
import { BaseChartInfo } from './base_chart';
import { DatapointNavNodeType, NavNode, NavNodeOptionsType, type NavMap } from '../view/layers/data/navigation';
import { type ParaState } from '../state';
import { DeepReadonly } from '../config/config_types';
import { type RiffOrder } from './base_chart';
import { type TypePlaneConfig, type HorizDirection } from '../config/config_types';

import { Bezier, loopParaviewRefresh } from '../common';
import { computeLabels } from '../common';
import { NOTE_LENGTH } from '../audio/sonifier';
import { type AxisOrientation } from '../view/axis/axis';

// Soni Constants
export const SONI_PLAY_SPEEDS = [1000, 250, 100, 50, 25];
export const SONI_RIFF_SPEEDS = [450, 300, 150, 100, 75];

export interface AxisRangeInfo {
  interval: Interval;
  step: number;
}

export function computeAxisRange(start: number, end: number): AxisRangeInfo {
  const minDec = new Decimal(start);
  const maxDec = new Decimal(end);
  const diff = maxDec.sub(minDec);
  const interval = diff.div(10);
  let quantizedStep: Decimal, quantizedMin: Decimal, quantizedMax: Decimal;
  quantizedStep = new Decimal(10).pow(interval.log(10).ceil());
  if (quantizedStep.div(diff).gte(0.8)) {
    quantizedStep = quantizedStep.div(10);
  } else if (quantizedStep.div(diff).gte(0.5)) {
    quantizedStep = quantizedStep.div(4);
  } else if (quantizedStep.div(diff).gte(0.2)) {
    quantizedStep = quantizedStep.div(2);
  }
  quantizedMin = minDec.div(quantizedStep).floor().mul(quantizedStep);
  quantizedMax = maxDec.div(quantizedStep).ceil().mul(quantizedStep);
  return {
    interval: {
      start: quantizedMin.toNumber(),
      end: quantizedMax.toNumber(),
    },
    step: quantizedStep.toNumber()
  };
}

export function computeAxisLabels(
  rangeInfo: AxisRangeInfo, isPercent: boolean, isGrouping = true, stagger = false
): string[][] {
  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5, useGrouping: isGrouping });
  const length = numberToScaledNumberRounded((rangeInfo.interval.end - rangeInfo.interval.start)/rangeInfo.step + 1, 5).number;
  const labels = new Array(length)
    .fill(0)
    .map((_, i) => fmt.format(rangeInfo.interval.start + rangeInfo.step*i) + (isPercent ? '%' : ''));
  const labelTiers = stagger
    ? [
        labels.map((label, i) => i % 2 === 0 ? label : ''),
        labels.map((label, i) => i % 2 === 1 ? label : '')
      ]
    : [labels];
  return labelTiers;
}


export interface AxisLabelTier {
  labels: string[];
  intervals?: Interval[];
}

/**
 * Abstract base class for business logic for charts drawn in a 2-D Cartesian coordinate system.
 */
export abstract class PlaneChartInfo extends BaseChartInfo {
  protected _altNavMap!: NavMap;
  protected _soniSequenceIndex = 0;
  protected _soniNoteIndex = 0;
  protected _soniSpeedRateIndex = 1;
  /** X-axis interval, if axis is numeric */
  protected _xRangeInfo!: AxisRangeInfo | null;
  /** Y-axis interval, if axis is numeric */
  protected _yRangeInfo!: AxisRangeInfo | null;
  /** Min and max chart y values, if y is numeric */
  protected _yExtremes!: Interval | null;

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
  }

  protected _init(): void {
    super._init();
    const indepFacet = this.model!.getFacet("x")!;
    const depFacet = this.model!.getFacet("y")!;
    if (indepFacet.datatype === 'number') {
      this._xRangeInfo = this._numericXAxisRange("x");
    } else {
      this._xRangeInfo = null;
    }
    if (depFacet.datatype === 'number') {
      this._yRangeInfo = this._numericYAxisRange("y");
    } else {
      this._yRangeInfo = null;
    }
  }

  protected _addSettingControls() {
    super._addSettingControls();
    // Only add these controls if the y-axis is numeric
    if (this.model!.getFacet('y')!.datatype !== 'number') return;
    // const range = this.chartLayers.getYAxisInterval();
    // XXX should be min/max label values as numbers, not min/max data values
    const min = this._yRangeInfo!.interval.start; // this._labelInfo.min!;
    const max = this._yRangeInfo!.interval.end; // this._labelInfo.max!;

    this._paraState.settingControls.insert(
      `type.${this.configType}.minYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? min
        : value,
      value => {
        const min = this.config.maxYValue === 'unset'
          ? max
          : this.config.maxYValue
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min y-value (${value}) must be less than ${min}` } : {};
      });
    this._paraState.settingControls.insert(
      `type.${this.configType}.maxYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? max
        : value,
      value => {
        const max = this.config.minYValue === 'unset'
          ? min
          : this.config.minYValue
        return value as number <= max ?
          { err: `Max y-value (${value}) must be greater than ${max}` } : {};
      });
  }

  /**
   * Whether the chart's datapoints fall on an x-axis tick (default) or between them.
   */
  get isIntertick(): boolean {
    return false;
  }

  get xRangeInfo(): AxisRangeInfo | null {
    return this._xRangeInfo;
  }

  get yRangeInfo(): AxisRangeInfo | null {
    return this._yRangeInfo;
  }

  get yExtremes(): Interval | null {
    return this._yExtremes;
  }

  get config() {
    return super.config as DeepReadonly<TypePlaneConfig>;
  }

  get horizFacet(): Facet | null {
    // return (this._paraState.model as PlaneModel).getAxisFacet('horiz')
    //   ?? this._paraState.model!.getFacet(this._options.isXVertical ? 'y' : 'x')!;
    // const facetKey = this._options.isXVertical
    //     ? this._paraState.model!.dependentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
    //     : this._paraState.model!.independentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
    // return this._paraState.model!.getFacet(facetKey)!
    return (this.model as PlaneModel).getAxisFacet(this._isXVertical
      ? 'vert'
      : 'horiz'
    )!;
  }

  get vertFacet(): Facet | null {
    // return (this._paraState.model as PlaneModel).getAxisFacet('vert')
    //   ?? this._paraState.model!.getFacet(this._options.isXVertical ? 'x' : 'y')!;
    // const facetKey = this._options.isXVertical
    //     ? this._paraState.model!.independentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
    //     : this._paraState.model!.dependentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
    // return this._paraState.model!.getFacet(facetKey)!
    return (this.model as PlaneModel).getAxisFacet(this._isXVertical
      ? 'horiz'
      : 'vert'
    )!;
  }

  protected get _isXVertical(): boolean {
    return false;
  }

  /**
   * Called by `Axis` instances to obtain label tiers.
   * @param facetKey - Axis facet key
   * @param isStagger - Whether to stagger labels between two tiers
   * @returns Array of tiers (each tier being an array of strings)
   */
  computeAxisLabelTiers(facetKey: string, isStagger: boolean): AxisLabelTier[] {
    const rawVals = this._facetTickLabelValues(facetKey);
    const facet = this.model!.getFacet(facetKey)!;
    if (facet.datatype === 'date') {
      // XXX HACK: should convert date values to standard string values
      if (rawVals[0][0] === 'Q') {
        const tier2: string[] = [];
        const tier2Intervals: Interval[] = [];
        rawVals.forEach((raw, i) => {
          const year = raw.split(' ')[1];
          if (!tier2.includes(year)) {
            tier2.push(year);
            const val = i / (rawVals.length - (this.isIntertick ? 0 : 1));
            tier2Intervals.push({
              start: val,
              end: val
            });
          } else {
            tier2Intervals.at(-1)!.end = this.isIntertick
              ? (i / rawVals.length + 1 / rawVals.length)
              : (i / (rawVals.length - 1));
          }
        });
        return [
          { labels: rawVals.map(raw => raw.split(' ')[0]) },
          { labels: tier2, intervals: tier2Intervals }
        ];
      } else {
        return [{ labels: rawVals }];
      }
    } else if (facet.datatype === 'number') {
      const rangeInfo = facet.variableType === 'independent'
        ? this._numericXAxisRange(facetKey)
        : this._numericYAxisRange(facetKey);
      const computed = computeAxisLabels(
        rangeInfo, false, true, isStagger);
      const ret: AxisLabelTier[] = [];
      ret.push({ labels: computed[0] });
      if (isStagger) {
        ret.push({ labels: computed[1] });
      }
      return ret;
    } else {
      return isStagger
        ? [
          { labels: rawVals.map((label, i) => i % 2 === 0 ? label : '') },
          { labels: rawVals.map((label, i) => i % 2 === 1 ? label : '') }
        ]
        : [{ labels: rawVals }];
    }
  }

  /**
   * Called by `computeAxisLabelTiers` to get string values to be displayed
   * as axis tick labels for a given facet.
   * @param facetKey - Facet key
   * @returns Strings to display.
   * @remarks
   * May be overridden to return, e.g., computed stacked bar or waterfall totals
   */
  protected _facetTickLabelValues(facetKey: string): string[] {
    return this.model!.allFacetValues(facetKey)!.map(box => box.raw);
  }

  facetTickLabelValues(facetKey: string): string[] {
    return this._facetTickLabelValues(facetKey);
  }

  /**
   * Called by `computeAxisLabelTiers` to get the displayed range for a numeric x-axis.
   * @param facetKey - Facet key
   * @returns Displayed axis range info
   */
  protected _numericXAxisRange(facetKey: string): AxisRangeInfo {
    const facetInterval = this.model!.getFacetInterval(facetKey)!;
    return computeAxisRange(facetInterval.start, facetInterval.end);
  }

  /**
   * Called by `computeAxisLabelTiers` to get the displayed range for a numeric y-axis.
   * @param facetKey - Facet key
   * @returns Displayed axis range info
   * @remarks
   * May be overridden to return, e.g., stacked bar or waterfall total intervals
   */
  protected _numericYAxisRange(facetKey: string): AxisRangeInfo {
    const facetInterval = this.model!.getFacetInterval(facetKey)!;
    this._yExtremes = facetInterval;
    return computeAxisRange(
      this.config.minYValue === 'unset'
        ? facetInterval.start
        : this.config.minYValue,
      this.config.maxYValue === 'unset'
        ? facetInterval.end
        : this.config.maxYValue);
  }

  protected get _datapointNavNodeType(): DatapointNavNodeType {
    return 'datapoint';
  }

  protected _datapointNavNodeOptions(datapoint: Datapoint): NavNodeOptionsType<DatapointNavNodeType> {
    return {
      seriesKey: datapoint.seriesKey,
      index: datapoint.datapointIndex
    };
  }

  playRiff(datapoints: Datapoint[], order?: RiffOrder, isChord?: boolean): Promise<void> {
    const datapointsClone = [...datapoints];
    datapointsClone.forEach(d => {
      const dpView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(d.seriesKey, d.datapointIndex)!;
      if (!isChord) {
        dpView.alwaysClip = true;
      }
      dpView.baseSymbolScale = 0;
    })
    for (let dpView of this._paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      if (datapointsClone.filter(dp => dp.seriesKey == dpView.seriesKey && dp.datapointIndex == dpView.index).length == 0) {
        dpView.alwaysClip = false;
        dpView.baseSymbolScale = 1;
      }
    }
    let paraview = this._paraView;
    paraview.documentView!.chartLayers.dataLayer.datapointViews.map(d => d.completeLayout())
    if (order === 'sorted') {
      datapoints.sort((a, b) => a.facetValueAsNumber('y')! - b.facetValueAsNumber('y')!);
    } else if (order === 'reversed') {
      datapoints.reverse();
    }
    if (datapoints.length) {
      if (this._soniRiffInterval!) {
        clearInterval(this._soniRiffInterval!);
      }
      this._soniSequenceIndex++;
      const length = datapoints.length;
      let start = -1;
      const linear = new Bezier(0, 0, 1, 1, 10);
      const step = (timestamp: number) => {
        if (start === -1) {
          start = timestamp;
        }
        const elapsed = timestamp - start;
        // We can't really disable the animation, but setting the reveal time to 0
        // will result in an imperceptibly short animation duration
        const revealTime = SONI_RIFF_SPEEDS.at(this._paraState.config.sonification.riffSpeedIndex)! * length
        const t = Math.min(elapsed / revealTime, 1);
        const linearT = linear.eval(t)!;
        this._paraView.clipWidth = linearT;
        if (elapsed < revealTime) {
          requestAnimationFrame(step);
        } else {
          //this._animEnd();
        }
      };
      requestAnimationFrame(step);
      loopParaviewRefresh(paraview,
        paraview.paraState.config.animation.popInAnimateRevealTimeMs
        + SONI_RIFF_SPEEDS.at(this._paraState.config.sonification.riffSpeedIndex)! * length, 50);
      return new Promise<void>(resolve => {
        this._soniRiffInterval = setInterval(() => {
          const datapoint = datapoints.shift();
          if (!datapoint) {
            clearInterval(this._soniRiffInterval!);
            setTimeout(resolve, NOTE_LENGTH * 1000);
          } else {
            this._sonifier.playDatapoints([datapoint as PlaneDatapoint]);
            this._soniNoteIndex++;
          }
        }, SONI_RIFF_SPEEDS.at(this._paraState.config.sonification.riffSpeedIndex));
      });
    }
    return Promise.resolve();
  }

  playDatapoints(datapoints: PlaneDatapoint[]): Promise<void> {
    const length = datapoints.length;
    for (let dpView of this._paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      dpView.alwaysClip = false;
      dpView.baseSymbolScale = 1;
      dpView.completeLayout();
    }
    loopParaviewRefresh(this._paraView,
      this._paraView.paraState.config.animation.popInAnimateRevealTimeMs
      + SONI_RIFF_SPEEDS.at(this._paraState.config.sonification.riffSpeedIndex)! * length, 50);
    return this._sonifier.playDatapoints(datapoints);
  }

  playDir(dir: HorizDirection) {
    if (this._navMap!.cursor!.type !== this._datapointNavNodeType) {
      return;
    }
    this.clearPlay();
    let cursor = this._navMap!.cursor;
    this._soniInterval = setInterval(() => {
      const next = cursor!.peekNode(dir, 1);
      if (next && next.type === this._datapointNavNodeType) {
        this.playDatapoints([next.datapoints[0] as PlaneDatapoint]);
        cursor = next;
      } else {
        this.clearPlay();
      }
    }, SONI_PLAY_SPEEDS.at(this._soniSpeedRateIndex));
  }

  protected _sparkBrailleInfo() {
    return {
      data: this._sparkBrailleData(),
      isBar: this._type === 'bar' || this._type === 'column'
    };
  }

  protected _sparkBrailleData(): string {
    if (this._navMap!.cursor!.isNodeType('top')) {
      return this.model!.series[0].datapoints
        .map(dp => dp.facetValueAsNumber('y')!)
        .join(' ');
    } else if (this._navMap!.cursor!.isNodeType(this._datapointNavNodeType)
      || this._navMap!.cursor!.isNodeType('series')
      || this._navMap!.cursor!.isNodeType('sequence')) {
      return this.model!.atKey(this._navMap!.cursor.options.seriesKey)!.datapoints
        .map(dp => dp.facetValueAsNumber('y')!)
        .join(' ');
    } else {
      return '0';
    }
  }
}
