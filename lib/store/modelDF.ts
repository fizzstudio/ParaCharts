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

import { zip } from "@fizz/chart-classifier-utils";
import { enumerate } from "../common/utils";
import { DataFrame, Facet, RawDataPoint } from "./dataframe/dataframe";
import { Datatype } from "@fizz/paramanifest";
import { ScalarMap } from "./dataframe/box";

export type DataPointDF = Record<string, ScalarMap[Datatype]>;

export class SeriesDF {
  private readonly dataframe: DataFrame;

  [i: number]: DataPointDF;
  /*protected xMap: Map<ScalarMap[X], number[]>;
  private yMap: Map<number, ScalarMap[X][]>;
  public readonly xs: ScalarMap[X][] = [];
  public readonly ys: number[] = [];
  public readonly length: number;
  public readonly boxedXs: Box<X>[] = [];
  public readonly boxedYs: Box<'number'>[] = [];*/

  constructor(
    public readonly key: string, 
    public readonly rawData: RawDataPoint[], 
    public readonly facets: Facet[]
  ) {
    this.dataframe = new DataFrame(facets);
    this.rawData.forEach((datapoint) => this.dataframe.addDatapoint(datapoint));
    /*this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(datapoint.x);
      this.boxedXs.push(new Box(datapoint.x, datapoint.xRaw));
      this.ys.push(datapoint.y);
      this.boxedYs.push(new Box(datapoint.y, datapoint.yRaw));
    });
    this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);
    this.length = this.xs.length;*/
  }

  /*atX(x: ScalarMap[X]): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): ScalarMap[X][] | null {
    return this.yMap.get(y) ?? null;
  }

  [Symbol.iterator](): Iterator<Datapoint2D<X>> {
    return this.datapoints[Symbol.iterator]();
  }*/
}

function facetsEquals(lhs: Facet[], rhs: Facet[]): boolean {
  if (lhs.length !== rhs.length) {
    return false;
  }
  for (const [lFacet, rFacet] of zip(lhs, rhs)) {
    if ((lFacet.key !== rFacet.key) || (lFacet.datatype !== rFacet.datatype)) {
      return false;
    }
  }
  return true;
}

// Like a dictionary for series
// TODO: In theory, facets should be a set, not an array. Maybe they should be sorted first?
export class ModelDF {
  public readonly keys: string[] = [];
  protected keyMap: Record<string, SeriesDF> = {};
  [i: number]: SeriesDF;
  public readonly multi: boolean;
  public readonly numSeries: number;
  /*public readonly xs: ScalarMap[X][];
  public readonly ys: number[];
  public readonly allPoints: Datapoint2D<X>[]
  public readonly boxedXs: Box<X>[];
  public readonly boxedYs: Box<'number'>[];*/
  public readonly facets: Facet[]

  constructor(public readonly series: SeriesDF[]) {
    if (this.series.length === 0) {
      throw new Error('models must have at least one series');
    }
    this.multi = this.series.length > 1;
    this.numSeries = this.series.length;
    this.facets = this.series[0].facets;
    for (const [aSeries, seriesIndex] of enumerate(this.series)) {
      if (this.keys.includes(aSeries.key)) {
        throw new Error('every series in a model must have a unique key');
      }
      if (!facetsEquals(aSeries.facets, this.facets)) {
        throw new Error('every series in a model must have the same facets');
      }
      this.keys.push(aSeries.key);
      this[seriesIndex] = aSeries;
      this.keyMap[aSeries.key] = aSeries;
    }
    /*this.xs = mergeUniqueBy(
      (lhs, rhs) => xDatatype === 'date'
        ? calendarEquals(lhs as CalendarPeriod, rhs as CalendarPeriod)
        : lhs === rhs,
      ...this.series.map((series) => series.xs));
    this.ys = mergeUnique(...this.series.map((series) => series.ys));
    this.boxedXs = mergeUniqueBy(
      (lhs: Box<X>, rhs: Box<X>) => lhs.raw === rhs.raw,
      ...this.series.map((series) => series.boxedXs)
    );
    this.boxedYs = mergeUniqueBy(
      (lhs: Box<'number'>, rhs: Box<'number'>) => lhs.raw === rhs.raw,
      ...this.series.map((series) => series.boxedYs)
    );
    this.allPoints = mergeUniqueDatapoints(...this.series.map((series) => series.datapoints));*/
  }

  /*atKey(key: string): Series2D<X> | null {
    return this.keyMap[key] ?? null;
  }

  
  atKeyAndIndex(key: string, index: number): Datapoint2D<X> | null {
    return this.atKey(key)?.[index] ?? null;
  }*/
}