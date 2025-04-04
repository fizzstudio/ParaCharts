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

import type { Manifest, Series, XyPoint } from "@fizz/paramanifest";
import { arrayEqual } from "./helpers";
import { AllSeriesData } from "../common/types";
import { enumerate } from "../common/utils";
import { CalendarPeriod } from "./calendar_period";

type Scalar = number | string | CalendarPeriod

/**
 * A datapoint consisting of x and y values.
 * @public
 */
abstract class Datapoint2D<X extends Scalar>{
  public readonly x: X;
  public readonly y: number;

  constructor(public readonly xRaw: string, public readonly yRaw: string) {
    this.x = this.getX();
    this.y = parseFloat(yRaw);
    if (isNaN(this.y)) {
      throw new Error('y values must be numbers');
    }
  }

  isEqual(other: Datapoint2D<X>): boolean {
    return this.x === other.x && this.y === other.y;
  }

  abstract getX(): X;
}

type DatapointConstructor<X extends Scalar, D extends Datapoint2D<X>> = 
  new (xRaw: string, yRaw: string) => D

export function datapointFromRecord<X extends Scalar, D extends Datapoint2D<X>>(
  constructor: DatapointConstructor<X, D>, record: XyPoint
): D {
  return new constructor(record.x, record.y);
}

export class NominalDatapoint2D extends Datapoint2D<string> {
  
  getX(): string {
    return this.xRaw;
  }

}

export class NumericDatapoint2D extends Datapoint2D<number> {
  
  getX(): number {
    const x = parseFloat(this.xRaw);
    if (isNaN(x)) {
      throw new Error('x values in Numeric Datapoints must be numbers');
    }
    return x;
  }

}

function mapDatapointsXtoY<X extends Scalar>(
  datapoints: Datapoint2D<X>[]
): Map<X, number[]> {
  const map = new Map<X, number[]>();
  for (const datapoint of datapoints) {
    if (!map.has(datapoint.x)) {
      map.set(datapoint.x, []);
    }
    map.get(datapoint.x)!.push(datapoint.y);
  }
  return map;
}

function mapDatapointsYtoX<X extends Scalar>(
  datapoints: Datapoint2D<X>[]
): Map<number, X[]> {
  const map = new Map<number, X[]>();
  for (const datapoint of datapoints) {
    if (!map.has(datapoint.y)) {
      map.set(datapoint.y, []);
    }
    map.get(datapoint.y)!.push(datapoint.x);
  }
  return map;
}

abstract class Series2D<X extends Scalar, D extends Datapoint2D<X>> {
  [i: number]: Datapoint2D<X>;
  protected xMap: Map<X, number[]>;
  private yMap: Map<number, X[]>;
  public readonly xs: X[] = [];
  public readonly length: number;

  constructor(public readonly key: string, private readonly datapoints: D[]) {
    this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(datapoint.x);
    });
    this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);
    this.length = this.xs.length;
  }

  atX(x: X): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): X[] | null {
    return this.yMap.get(y) ?? null;
  }

  [Symbol.iterator](): Iterator<D> {
    return this.datapoints[Symbol.iterator]();
  }
}

type SeriesConstructor<X extends Scalar, D extends Datapoint2D<X>, S extends Series2D<X, D>> = 
  new (key: string, data: D[]) => S

export function seriesFromKeyAndData<
  X extends Scalar, 
  D extends Datapoint2D<X>,
  S extends Series2D<X, D>
>(
  seriesConstructor: SeriesConstructor<X, D, S>, 
  datapointConstructor: DatapointConstructor<X, D>,
  key: string, 
  data: XyPoint[]): S {
  return new seriesConstructor(
    key, data.map((record) => datapointFromRecord(datapointConstructor, record))
  );
}

export function seriesFromSeriesManifest<
  X extends Scalar, 
  D extends Datapoint2D<X>,
  S extends Series2D<X, D>
>(
  seriesConstructor: SeriesConstructor<X, D, S>, 
  datapointConstructor: DatapointConstructor<X, D>, 
  seriesManifest: Series
): S {
  if (!seriesManifest.records) {
    throw new Error('only series manifests with inline data can use this method.');
  }
  return seriesFromKeyAndData(
    seriesConstructor, datapointConstructor, seriesManifest.key, seriesManifest.records!
  );
}

export class OrderedSeries2D<X extends Scalar, D extends Datapoint2D<X>> extends Series2D<X, D> {

  constructor(key: string, datapoints: D[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: X): number | null {
    return this.xMap.get(x)?.[0] ?? null;
  }
}


export class NominalSeries2D extends Series2D<string, NominalDatapoint2D> { }
export class OrderedNominalSeries2D extends OrderedSeries2D<string, NominalDatapoint2D> { }
export class NumericSeries2D extends Series2D<number, NumericDatapoint2D> { }
export class OrderedNumericSeries2D extends OrderedSeries2D<number, NumericDatapoint2D> { }

// Like a dictionary for series
// TODO?: add axes units properties, add bare/percent format, 
export class Model2D<X extends Scalar, D extends Datapoint2D<X>, S extends Series2D<X, D>> {
  public readonly keys: string[] = [];
  protected keyMap: Record<string, S> = {};
  [i: number]: S;
  public readonly multi: boolean;
  public readonly numSeries: number;

  constructor(public readonly series: S[]) {
    this.multi = this.series.length > 1;
    this.numSeries = this.series.length;
    for (const [aSeries, seriesIndex] of enumerate(this.series)) {
      if (this.keys.includes(aSeries.key)) {
        throw new Error('Non-unique key');
      }
      this.keys.push(aSeries.key);
      this[seriesIndex] = aSeries;
      this.keyMap[aSeries.key] = aSeries;
    }
  }

  atKey(key: string): S | null {
    return this.keyMap[key] ?? null;
  }
}

type ModelConstructor<
  X extends Scalar, 
  D extends Datapoint2D<X>,
  S extends Series2D<X, D>,
  M extends Model2D<X, D, S>
> = new (series: S[]) => M;

export function modelFromManifest<
  X extends Scalar, 
  D extends Datapoint2D<X>,
  S extends Series2D<X, D>,
  M extends Model2D<X, D, S>
>(
  modelConstructor: ModelConstructor<X, D, S, M>,
  seriesConstructor: SeriesConstructor<X, D, S>, 
  datapointConstructor: DatapointConstructor<X, D>, 
  manifest: Manifest
): M {
  const dataset = manifest.datasets[0];
  if (dataset.data.source !== 'inline') {
    throw new Error('only manifests with inline data can use this method.');
  }
  const series = dataset.series.map((aSeries) => 
    seriesFromSeriesManifest(seriesConstructor, datapointConstructor, aSeries)
  );
  return new modelConstructor(series);
}

export function modelFromAllSeriesData<
  X extends Scalar, 
  D extends Datapoint2D<X>,
  S extends Series2D<X, D>,
  M extends Model2D<X, D, S>
>(
  modelConstructor: ModelConstructor<X, D, S, M>,
  seriesConstructor: SeriesConstructor<X, D, S>, 
  datapointConstructor: DatapointConstructor<X, D>, 
  data: AllSeriesData
): M {
  const series = Object.keys(data).map((key) => 
    seriesFromKeyAndData(seriesConstructor, datapointConstructor, key, data[key])
  );
  return new modelConstructor(series);
}

abstract class OrderedModel2D<
  X extends Scalar, D extends Datapoint2D<X>, S extends OrderedSeries2D<X, D>
> extends Model2D<X, D, S>  {
  public readonly numXs: number;

  constructor(series: S[]) {
    super(series);
    if (this.multi) {
      this.series.forEach((series) => {
        if (!arrayEqual(series.xs, this.series[0].xs)) {
          throw new Error('each series in a ordered model must have all the same x-labels');
        }
      })
    }
    this.numXs = this.series[0].length;
  }
}

export class NominalModel2D extends Model2D<string, NominalDatapoint2D, NominalSeries2D> { }
export class OrderedNominalModel2D extends OrderedModel2D<string, NominalDatapoint2D, OrderedNominalSeries2D> { }
export class NumericModel2D extends Model2D<number, NumericDatapoint2D, NumericSeries2D> { }
export class OrderedNumericModel2D extends OrderedModel2D<number, NumericDatapoint2D, OrderedNumericSeries2D> { }