
import { ParaStore } from '../store/parastore';
import { formatBox } from '@fizz/parasummary';

import Decimal from 'decimal.js';
import { Facet } from '@fizz/paramanifest';
import { AxisOrientation, type PlaneModel } from '@fizz/paramodel';

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
  isXVertical?: boolean;
}

export interface AxisLabelInfo {
  min?: number;
  max?: number;
  range?: number;
  labelTiers: (Tier | ChildTier)[];
}

export function computeLabels(
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

function computeLabelsFromInterval(
  start: number, end: number, interval: number, isPercent: boolean, isGrouping = true
): AxisLabelInfo {
  if (interval < 0) {
    throw new Error('tick interval must be > 0');
  }
  const min = start - start % interval;
  const max = end + (interval - end % interval);
  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5, useGrouping: isGrouping });
  return {
    min,
    max,
    range: max - min,
    labelTiers: [new Array((max - min)/interval + 1)
    .fill(0)
    .map((_, i) => fmt.format(min + interval*i) + (isPercent ? '%' : ''))]
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

  get horizFacet(): Facet {
    // return (this._store.model as PlaneModel).getAxisFacet('horiz')
    //   ?? this._store.model!.getFacet(this._options.isXVertical ? 'y' : 'x')!;
    // const facetKey = this._options.isXVertical
    //     ? this._store.model!.dependentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
    //     : this._store.model!.independentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
    // return this._store.model!.getFacet(facetKey)!
    return (this._store.model as PlaneModel).getAxisFacet(this._options.isXVertical
      ? 'vert'
      : 'horiz'
    )!;
  }

  get vertFacet(): Facet {
    // return (this._store.model as PlaneModel).getAxisFacet('vert')
    //   ?? this._store.model!.getFacet(this._options.isXVertical ? 'x' : 'y')!;
    // const facetKey = this._options.isXVertical
    //     ? this._store.model!.independentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
    //     : this._store.model!.dependentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
    // return this._store.model!.getFacet(facetKey)!
    return (this._store.model as PlaneModel).getAxisFacet(this._options.isXVertical
      ? 'horiz'
      : 'vert'
    )!;
  }

  getFacetForOrientation(orientation: AxisOrientation) {
    return orientation === 'horiz' ? this.horizFacet : this.vertFacet;
  }

  updateYRange() {
    // this._options.yMin = min === 'unset'
    //   ? Math.min(...this._options.yValues)
    //   : min;
    // this._options.yMax = max === 'unset'
    //   ? Math.max(...this._options.yValues)
    //   : max;
    this._computeYLabelInfo();
  }

  protected _computeXLabels(xMin: number, xMax: number) {
    return computeLabels(
      this._store.settings.axis.x.minValue === 'unset'
        ? xMin
        : this._store.settings.axis.x.minValue as number,
      this._store.settings.axis.x.maxValue === 'unset'
        ? xMax
        : this._store.settings.axis.x.maxValue as number,
      false);
  }

  protected _computeYLabels(yMin: number, yMax: number) {
    if (this._store.settings.axis.y.interval !== 'unset') {
      return computeLabelsFromInterval(yMin, yMax, this._store.settings.axis.y.interval, false);
    } else {
      return computeLabels(yMin, yMax, false); //this._model.depFormat === 'percent');
    }
  }

  protected _computeXLabelInfo() {
    if (this._options.xValues) {
      this._xLabelInfo = this._computeXLabels(
        Math.min(...this._options.xValues),
        Math.max(...this._options.xValues));
    } else {
      const labels = this._store.model!.series[0].datapoints.map(
        (p) => formatBox(p.facetBox('x')!, this._store.getFormatType('horizTick'))
      );
      this._xLabelInfo = {
        labelTiers: [labels]
      };
    }
  }

  protected _computeYLabelInfo() {
    const yMin = this._store.settings.axis.y.minValue === 'unset'
      ? this._options.yMin ?? Math.min(...this._options.yValues)
      : this._store.settings.axis.y.minValue;
    const yMax = this._store.settings.axis.y.maxValue === 'unset'
      ? this._options.yMax ?? Math.max(...this._options.yValues)
      : this._store.settings.axis.y.maxValue;
    this._yLabelInfo = this._computeYLabels(yMin, yMax);
  }

}