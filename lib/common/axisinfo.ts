
import { ParaStore } from '../store/parastore';
import { formatBox } from '@fizz/parasummary';

import Decimal from 'decimal.js';

export type Tier = string[];
export interface ChildTierItem {
  label: string;
  parent: number;
}
export type ChildTier = ChildTierItem[];

export interface AxisOptions {
  xValues?: readonly number[];
  yValues: readonly number[];
  yMin?: number;
  yMax?: number;
  // *tiers[0] cannot be a ChildTier
  xTiers?: (Tier | ChildTier)[];
  yTiers?: (Tier | ChildTier)[];
  // Are datapoint views drawn on ticks (false) or between them (true)?
  isXInterval?: boolean;
  isYInterval?: boolean;
}

export interface AxisLabelInfo {
  min?: number;
  max?: number;
  range?: number;
  labelTiers: (Tier | ChildTier)[];
}

function computeLabels(
    start: number, end: number, isPercent: boolean, isGrouping = true
  ): AxisLabelInfo {
    const minDec = new Decimal(start);
    const maxDec = new Decimal(end);
    const diff = maxDec.sub(minDec);
    const interval = diff.div(10);
    let quantizedInterval: Decimal, quantizedMin: Decimal, quantizedMax: Decimal;
    quantizedInterval = new Decimal(10).pow(interval.log(10).ceil());
    if (quantizedInterval.div(diff).gte(0.8)) {
      quantizedInterval = quantizedInterval.div(10);
    } else if (quantizedInterval.div(diff).gte(0.5)) {
      quantizedInterval = quantizedInterval.div(4);
    } else if (quantizedInterval.div(diff).gte(0.2)) {
      quantizedInterval = quantizedInterval.div(2);
    }
    quantizedMin = minDec.div(quantizedInterval).floor().mul(quantizedInterval);
    quantizedMax = maxDec.div(quantizedInterval).ceil().mul(quantizedInterval);
    const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5, useGrouping: isGrouping });
    const labels = new Array(quantizedMax.sub(quantizedMin).div(quantizedInterval).toNumber() + 1)
      .fill(0)
      .map((_, i) => fmt.format(+quantizedMin.add(quantizedInterval.mul(i))) + (isPercent ? '%' : ''));
    return {
      min: quantizedMin.toNumber(),
      max: quantizedMax.toNumber(),
      range: quantizedMax.sub(quantizedMin).toNumber(),
      labelTiers: [labels],
    };
  }

export class AxisInfo {
  protected _xLabelInfo!: AxisLabelInfo;
  protected _yLabelInfo!: AxisLabelInfo; 

  constructor(protected _store: ParaStore, protected _options: AxisOptions) {
    if (_options.xTiers) {
      this._xLabelInfo = {labelTiers: _options.xTiers};
    } else {
      this._computeXLabelInfo();
    }
    if (_options.yTiers) {
      this._yLabelInfo = {labelTiers: _options.yTiers}
    } else {
      this._computeYLabelInfo();
    }
  }

  get xLabelInfo() {
    return this._xLabelInfo;
  }

  get yLabelInfo() {
    return this._yLabelInfo;
  }

  get options() {
    return this._options;
  }

  protected _computeXLabels(xMin: number, xMax: number) {
    return computeLabels(
      this._store.settings.axis.x.minValue ?? xMin, 
      this._store.settings.axis.x.maxValue ?? xMax,
      false);
  }

  protected _computeYLabels(yMin: number, yMax: number) {
    return computeLabels(
      this._store.settings.axis.y.minValue ?? yMin, 
      this._store.settings.axis.y.maxValue ?? yMax, 
      false); //this._model.depFormat === 'percent');  
  }  

  protected _computeXLabelInfo() {
    if (this._options.xValues) {
      this._xLabelInfo = this._computeXLabels(
        Math.min(...this._options.xValues),
        Math.max(...this._options.xValues));
    } else {
      const labels = this._store.model!.series[0].facet('x')!.map(x => formatBox(x, this._store.getFormatType('xTick'));
      this._xLabelInfo = {
        labelTiers: [labels]
      };
    }
  }

  protected _computeYLabelInfo() {
    this._yLabelInfo = this._computeYLabels(
      this._options.yMin ?? Math.min(...this._options.yValues),
      this._options.yMax ?? Math.max(...this._options.yValues));
  }

}