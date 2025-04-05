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

type Scalar = number | string | CalendarPeriod;

// TODO: This type lacks a completeness type check
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

  public isEqual(other: Datapoint2D<X>): boolean {
    return this.x === other.x && this.y === other.y;
  }

  abstract getX(): X;
}

// Specific Datapoints

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

export class CalendarDatapoint2D extends Datapoint2D<CalendarPeriod> {
  
  getX(): CalendarPeriod {
    const x = parseCalendar(this.xRaw);
    if (x === null) {
      throw new Error('x values in Calendar Datapoints must be parsable');
    }
    return x;
  }

  public isEqual(other: Datapoint2D<CalendarPeriod>): boolean {
    return calendarEquals(this.x, other.x) && this.y === other.y;
  }

}

// Datapoint Construction

type DatapointMap<T extends Datatype> = Datapoint2D<ScalarMap[T]>

type DatapointConstructor<T extends Datatype> 
  = new (xRaw: string, yRaw: string) => DatapointMap<T>

type DatapointConstructorMap = {
  [T in Datatype]: DatapointConstructor<T>;
};

const DATAPOINT_CONSTRUCTORS: DatapointConstructorMap = {
  'string': NominalDatapoint2D,
  'number': NumericDatapoint2D,
  'date': CalendarDatapoint2D
}

export function datapointFromRecord<T extends Datatype>(tp: T, record: XyPoint): DatapointMap<T> {
  return new DATAPOINT_CONSTRUCTORS[tp](record.x, record.y);
}

// * Series *

// Helpers

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

// Generic Series

abstract class Series2D<T extends Datatype> {
  [i: number]: Datapoint2D<ScalarMap[T]>;
  protected xMap: Map<ScalarMap[T], number[]>;
  private yMap: Map<number, ScalarMap[T][]>;
  public readonly xs: ScalarMap[T][] = [];
  public readonly length: number;

  constructor(public readonly key: string, private readonly datapoints: DatapointMap<T>[]) {
    this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(datapoint.x);
    });
    this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);
    this.length = this.xs.length;
  }

  atX(x: ScalarMap[T]): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): ScalarMap[T][] | null {
    return this.yMap.get(y) ?? null;
  }

  [Symbol.iterator](): Iterator<DatapointMap<T>> {
    return this.datapoints[Symbol.iterator]();
  }
}

export class OrderedSeries2D<T extends Datatype> extends Series2D<T> {

  constructor(key: string, datapoints: DatapointMap<T>[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: ScalarMap[T]): number | null {
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

type SeriesMap<T extends Datatype> = Series2D<T>

type SeriesConstructor<T extends Datatype> 
  = new (key: string, data: DatapointMap<T>[]) => S
  = new (xRaw: string, yRaw: string) => DatapointMap<T>

type SeriesConstructorMap = {
  [T in Datatype]: SeriesConstructor<T>;
};

const UNORDERED_SERIES_CONSTRUCTORS: SeriesConstructorMap = {
  'string': NominalSeries2D,
  'number': NumericSeries2D,
  'date': CalendarSeries2D
}

export function datapointFromRecord<T extends Datatype>(tp: T, record: XyPoint): DatapointMap<T> {
  return new DATAPOINT_CONSTRUCTORS[tp](record.x, record.y);
}

type SeriesConstructor<T extends Datatype, S extends Series2D<T>> = 
  new (key: string, data: DatapointMap<T>[]) => S

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

// * Models *

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
export const nominalModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(NominalModel2D, NominalSeries2D, NominalDatapoint2D, manifest);
export const nominalModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(NominalModel2D, NominalSeries2D, NominalDatapoint2D, data);

export class OrderedNominalModel2D extends OrderedModel2D<string, NominalDatapoint2D, OrderedNominalSeries2D> { }
export const orderedNominalModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(OrderedNominalModel2D, OrderedNominalSeries2D, NominalDatapoint2D, manifest);
export const orderedNominalModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(OrderedNominalModel2D, OrderedNominalSeries2D, NominalDatapoint2D, data);

export class NumericModel2D extends Model2D<number, NumericDatapoint2D, NumericSeries2D> { }
export const numericModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(NumericModel2D, NumericSeries2D, NumericDatapoint2D, manifest);
export const numericModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(NumericModel2D, NumericSeries2D, NumericDatapoint2D, data);

export class OrderedNumericModel2D extends OrderedModel2D<number, NumericDatapoint2D, OrderedNumericSeries2D> { }
export const orderedNumericModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(OrderedNumericModel2D, OrderedNumericSeries2D, NumericDatapoint2D, manifest);
export const orderedNumericModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(OrderedNumericModel2D, OrderedNumericSeries2D, NumericDatapoint2D, data);

export class CalendarModel2D extends Model2D<CalendarPeriod, CalendarDatapoint2D, CalendarSeries2D> { }
export const calendarModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(CalendarModel2D, CalendarSeries2D, CalendarDatapoint2D, manifest);
export const calendarModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(CalendarModel2D, CalendarSeries2D, CalendarDatapoint2D, data);

export class OrderedCalendarModel2D extends OrderedModel2D<CalendarPeriod, CalendarDatapoint2D, OrderedCalendarSeries2D> { }
export const orderedCalendarModelFromManifest = (manifest: Manifest) => 
  modelFromManifest(OrderedCalendarModel2D, OrderedCalendarSeries2D, CalendarDatapoint2D, manifest);
export const orderedCalendarModelFromSeriesData = (data: AllSeriesData) => 
  modelFromAllSeriesData(OrderedCalendarModel2D, OrderedCalendarSeries2D, CalendarDatapoint2D, data);

export type Model = NominalModel2D | OrderedNominalModel2D | NumericModel2D | OrderedNumericModel2D
  | CalendarModel2D | OrderedCalendarModel2D;
export type ModelFromManifest = (manifest: Manifest) => Model;
export type ModelFromSeriesData = (data: AllSeriesData) => Model;

export const ModelMap: Record<ChartType, 
  Record<Datatype, [ModelConstructor<any, any, any, any>, ModelFromManifest, ModelFromSeriesData]>
> = {
  line: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  },
  stepline: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  },
  column: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  },
  bar: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  },
  lollipop: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  },
  scatter: {
    string: [NominalModel2D, nominalModelFromManifest, nominalModelFromSeriesData],
    number: [NumericModel2D, numericModelFromManifest, numericModelFromSeriesData],
    date: [CalendarModel2D, calendarModelFromManifest, calendarModelFromSeriesData]
  },
  pie: {
    string: [OrderedNominalModel2D, orderedNominalModelFromManifest, orderedNominalModelFromSeriesData],
    number: [OrderedNumericModel2D, orderedNumericModelFromManifest, orderedNumericModelFromSeriesData],
    date: [OrderedCalendarModel2D, orderedCalendarModelFromManifest, orderedCalendarModelFromSeriesData]
  }
}

/*

type DatapointMap = {
  string: NominalDatapoint2D,
  number: NumericDatapoint2D,
  date: CalendarDatapoint2D
}

Record<Datatype, DatapointConstructor<Datatype>>

type T = ScalarMap['string']

function getDatapointConstructor<T extends keyof ScalarMap>(tp: T): DatapointConstructor<T> {
  if (tp === 'string') {
    return NominalDatapoint2D;
  }
}

type DatapointConstructorGeneric<X extends Scalar, D extends Datapoint2D<X>> = 
  new (xRaw: string, yRaw: string) => D

type DatapointConstructor<T extends Datatype> 
  = DatapointConstructorGeneric<ScalarMap[T], Datapoint2D<ScalarMap[T]>>;

*/