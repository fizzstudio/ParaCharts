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

// * Prelude *

// Imports

import type { Manifest, Series, XyPoint } from "@fizz/paramanifest";
import { arrayEqual } from "./helpers";
import { AllSeriesData, ChartType, Datatype } from "../common/types";
import { enumerate } from "../common/utils";
import { calendarEquals, CalendarPeriod, parseCalendar } from "./calendar_period";

// Types

export type Scalar = number | string | CalendarPeriod;

// TODO: This type lacks a completeness type check. This could be implemented by testing in Vitest
// that `keyof ScalarMap extends Datatype` and vice versa and `ScalarMap[Datatype] extends Scalar` 
// and vice versa. 
type ScalarMap = {
  number: number,
  string: string,
  date: CalendarPeriod
}

// * Datapoints *

// Generic Datapoint

/**
 * A datapoint consisting of x and y values.
 * @public
 */
abstract class Datapoint2D<X extends Datatype>{
  public readonly x: ScalarMap[X];
  public readonly y: number;

  constructor(public readonly xRaw: string, public readonly yRaw: string) {
    this.x = this.getX();
    this.y = parseFloat(yRaw);
    if (isNaN(this.y)) {
      throw new Error('y values must be numbers');
    }
  }

  public isEqual(other: Datapoint2D<X>): boolean {
    return this.x === other.x && this.y === other.y;
  }

  abstract getX(): ScalarMap[X];
}

// Specific Datapoints

export class NominalDatapoint2D extends Datapoint2D<'string'> {
  
  getX(): string {
    return this.xRaw;
  }

}

export class NumericDatapoint2D extends Datapoint2D<'number'> {
  
  getX(): number {
    const x = parseFloat(this.xRaw);
    if (isNaN(x)) {
      throw new Error('x values in Numeric Datapoints must be numbers');
    }
    return x;
  }

}

export class CalendarDatapoint2D extends Datapoint2D<'date'> {
  
  getX(): CalendarPeriod {
    const x = parseCalendar(this.xRaw);
    if (x === null) {
      throw new Error('x values in Calendar Datapoints must be parsable');
    }
    return x;
  }

  public isEqual(other: Datapoint2D<'date'>): boolean {
    return calendarEquals(this.x, other.x) && this.y === other.y;
  }

}

// Datapoint Construction

type DatapointConstructor<X extends Datatype> 
  = new (xRaw: string, yRaw: string) => Datapoint2D<X>

type DatapointConstructorMap = {
  [X in Datatype]: DatapointConstructor<X>;
};

const DATAPOINT_CONSTRUCTORS: DatapointConstructorMap = {
  string: NominalDatapoint2D,
  number: NumericDatapoint2D,
  date: CalendarDatapoint2D
}

export function datapointFromRecord<X extends Datatype>(datatype: X, record: XyPoint): Datapoint2D<X> {
  return new DATAPOINT_CONSTRUCTORS[datatype](record.x, record.y);
}

// * Series *

// Helpers

function mapDatapointsXtoY<X extends Datatype>(
  datapoints: Datapoint2D<X>[]
): Map<ScalarMap[X], number[]> {
  const map = new Map<ScalarMap[X], number[]>();
  for (const datapoint of datapoints) {
    if (!map.has(datapoint.x)) {
      map.set(datapoint.x, []);
    }
    map.get(datapoint.x)!.push(datapoint.y);
  }
  return map;
}

function mapDatapointsYtoX<X extends Datatype>(
  datapoints: Datapoint2D<X>[]
): Map<number, ScalarMap[X][]> {
  const map = new Map<number, ScalarMap[X][]>();
  for (const datapoint of datapoints) {
    if (!map.has(datapoint.y)) {
      map.set(datapoint.y, []);
    }
    map.get(datapoint.y)!.push(datapoint.x);
  }
  return map;
}

// Generic Series

abstract class Series2D<X extends Datatype> {
  [i: number]: Datapoint2D<X>;
  protected xMap: Map<ScalarMap[X], number[]>;
  private yMap: Map<number, ScalarMap[X][]>;
  public readonly xs: ScalarMap[X][] = [];
  public readonly length: number;

  constructor(public readonly key: string, private readonly datapoints: Datapoint2D<X>[]) {
    this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(datapoint.x);
    });
    this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);
    this.length = this.xs.length;
  }

  atX(x: ScalarMap[X]): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): ScalarMap[X][] | null {
    return this.yMap.get(y) ?? null;
  }

  [Symbol.iterator](): Iterator<Datapoint2D<X>> {
    return this.datapoints[Symbol.iterator]();
  }
}

export class OrderedSeries2D<X extends Datatype> extends Series2D<X> {

  constructor(key: string, datapoints: Datapoint2D<X>[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: ScalarMap[X]): number | null {
    return this.xMap.get(x)?.[0] ?? null;
  }
}

// Specific Series

export class NominalSeries2D extends Series2D<'string'> { }
export class OrderedNominalSeries2D extends OrderedSeries2D<'string'> { }
export class NumericSeries2D extends Series2D<'number'> { }
export class OrderedNumericSeries2D extends OrderedSeries2D<'number'> { }
export class CalendarSeries2D extends Series2D<'date'> { }
export class OrderedCalendarSeries2D extends OrderedSeries2D<'date'> { }

// Series Construction

type SeriesConstructor<T extends Datatype> 
  = new (key: string, data: Datapoint2D<T>[]) => Series2D<T>

type OrderedSeriesConstructor<T extends Datatype> 
  = new (key: string, data: Datapoint2D<T>[]) => OrderedSeries2D<T>

type SeriesConstructorMap = {
  [T in Datatype]: SeriesConstructor<T>;
};

type OrderedSeriesConstructorMap = {
  [T in Datatype]: OrderedSeriesConstructor<T>;
};

// TYPE SAFETY: There is no check that these constructors are unordered
const UNORDERED_SERIES_CONSTRUCTORS: SeriesConstructorMap = {
  string: NominalSeries2D,
  number: NumericSeries2D,
  date: CalendarSeries2D
}

const ORDERED_SERIES_CONSTRUCTORS: OrderedSeriesConstructorMap = {
  string: OrderedNominalSeries2D,
  number: OrderedNumericSeries2D,
  date: OrderedCalendarSeries2D
}

type Order = 'unordered' | 'ordered';

// TODO: There is no check these constructors are unordered/ordered
const SERIES_CONSTRUCTORS: Record<Order, SeriesConstructorMap> = {
  'unordered': UNORDERED_SERIES_CONSTRUCTORS,
  'ordered': ORDERED_SERIES_CONSTRUCTORS
}

export function seriesFromKeyAndData<X extends Datatype>(
  key: string, data: XyPoint[], datatype: X, ordered: boolean
): Series2D<X> {
  const order = ordered ? 'ordered' : 'unordered';
  const datapoints = data.map((record) => datapointFromRecord(datatype, record));
  return new SERIES_CONSTRUCTORS[order][datatype](key, datapoints);
}

export function seriesFromSeriesManifest<X extends Datatype>(
  seriesManifest: Series, datatype: X, ordered: boolean
): Series2D<X> {
  if (!seriesManifest.records) {
    throw new Error('only series manifests with inline data can use this method.');
  }
  return seriesFromKeyAndData(
    seriesManifest.key, seriesManifest.records!, datatype, ordered
  );
}

// * Models *

// Generic Models

// Like a dictionary for series
// TODO?: add axes units properties, add bare/percent format, 
export class Model2D<X extends Datatype> {
  public readonly keys: string[] = [];
  protected keyMap: Record<string, Series2D<X>> = {};
  [i: number]: Series2D<X>;
  public readonly multi: boolean;
  public readonly numSeries: number;

  constructor(public readonly series: Series2D<X>[]) {
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

  atKey(key: string): Series2D<X> | null {
    return this.keyMap[key] ?? null;
  }
}

abstract class OrderedModel2D<X extends Datatype> extends Model2D<X>  {
  declare series: OrderedSeries2D<X>[];
  declare keyMap: Record<string, OrderedSeries2D<X>>;

  public readonly numXs: number;

  constructor(series: OrderedSeries2D<X>[]) {
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

// Specific Models

export class NominalModel2D extends Model2D<'string'> { }
export class OrderedNominalModel2D extends OrderedModel2D<'string'> { }
export class NumericModel2D extends Model2D<'number'> { }
export class OrderedNumericModel2D extends OrderedModel2D<'number'> { }
export class CalendarModel2D extends Model2D<'date'> { }
export class OrderedCalendarModel2D extends OrderedModel2D<'date'> { }

// Model Construction

type ModelConstructor<X extends Datatype> = new (series: Series2D<X>[]) => Model2D<X>;

type OrderedModelConstructor<T extends Datatype> 
  = new (series: OrderedSeries2D<T>[]) => OrderedModel2D<T>;

type ModelConstructorMap = {
  [T in Datatype]: ModelConstructor<T>;
};

type OrderedModelConstructorMap = {
  [T in Datatype]: OrderedModelConstructor<T>;
};

// TODO: There is no check that these constructors are unordered
const UNORDERED_MODEL_CONSTRUCTORS: ModelConstructorMap = {
  string: NominalModel2D,
  number: NumericModel2D,
  date: CalendarModel2D
}

const ORDERED_MODEL_CONSTRUCTORS: OrderedModelConstructorMap = {
  string: OrderedNominalModel2D,
  number: OrderedNumericModel2D,
  date: OrderedCalendarModel2D
}

// TODO: There is no check these constructors are unordered/ordered
const MODEL_CONSTRUCTORS: Record<Order, ModelConstructorMap> = {
  unordered: UNORDERED_MODEL_CONSTRUCTORS,
  ordered: ORDERED_MODEL_CONSTRUCTORS
}

const MODEL_ORDERED: Record<ChartType, boolean> = {
  line: true,
  stepline: true,
  column: true,
  bar: true,
  lollipop: true,
  scatter: false,
  pie: true,
}

export function modelFromManifest<X extends Datatype>(manifest: Manifest, datatype: X): Model2D<X> {
  const dataset = manifest.datasets[0];
  const order = MODEL_ORDERED[dataset.type];
  if (dataset.data.source !== 'inline') {
    throw new Error('only manifests with inline data can use this method.');
  }
  const series = dataset.series.map((seriesManifest) => 
    seriesFromSeriesManifest<X>(seriesManifest, datatype, order)
  );
  return new MODEL_CONSTRUCTORS[order ? 'ordered' : 'unordered'][datatype](series);
}

export function modelFromAllSeriesData<X extends Datatype>(
  data: AllSeriesData, datatype: X, chartType: ChartType
): Model2D<X> {
  const order = MODEL_ORDERED[chartType];
  const series = Object.keys(data).map((key) => 
    seriesFromKeyAndData(key, data[key], datatype, order)
  );
  return new MODEL_CONSTRUCTORS[order ? 'ordered' : 'unordered'][datatype](series);
}
