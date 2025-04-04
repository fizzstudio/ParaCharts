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

type Scalar = number | string | Datapoint2D

/**
 * A datapoint consisting of x and y values.
 * @public
 */
interface Datapoint2D {
  x: Scalar;
  y: number;
  xRaw: string;
  yRaw: string;

  isEqual(other: Datapoint2D): boolean;

  //new (xRaw: string, yRaw: string): this;
  //fromRecord(record: XyPoint): Datapoint2D;
}

export class NominalDatapoint2D implements Datapoint2D {
  public readonly x: string;
  public readonly y: number;

  static fromRecord(record: XyPoint): NominalDatapoint2D {
    return new NominalDatapoint2D(record.x, record.y);
  }

  constructor(public readonly xRaw: string, public readonly yRaw: string) {
    this.x = this.xRaw;
    this.y = parseFloat(yRaw);
    if (isNaN(this.y)) {
      throw new Error('y values must be numbers');
    }
  }

  isEqual(other: Datapoint2D): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export class NumericDatapoint2D implements Datapoint2D {
  public readonly x: number;
  public readonly y: number;

  static fromRecord(record: XyPoint): NumericDatapoint2D {
    return new NumericDatapoint2D(record.x, record.y);
  }

  constructor(public readonly xRaw: string, public readonly yRaw: string) {
    this.x = parseFloat(xRaw);
    if (isNaN(this.x)) {
      throw new Error('x values in Numeric Datapoints must be numbers');
    }
    this.y = parseFloat(yRaw);
    if (isNaN(this.y)) {
      throw new Error('y values must be numbers');
    }
  }

  isEqual(other: Datapoint2D): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

function mapDatapoints<K extends Scalar, V extends Scalar>(
  dimension: 'x' | 'y', datapoints: Datapoint2D[]
): Map<K, V[]> {
  const map = new Map<K, V[]>();
  for (const datapoint of datapoints) {
    const key = datapoint[dimension] as K;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(datapoint[dimension === 'x' ? 'y' : 'x'] as V);
  }
  return map;
}

export class Series2D<D extends Datapoint2D> {
  [i: number]: Datapoint2D;
  protected xMap: Map<string, number[]>;
  private yMap: Map<number, string[]>;
  public readonly xs: string[] = [];
  public readonly length: number;

  static fromKeyAndData(key: string, data: XyPoint[]): Series2D {
    return new Series2D(key, data.map((record) => Datapoint2D.fromRecord(record)));
  }

  static fromSeriesManifest(seriesManifest: Series): Series2D {
    if (!seriesManifest.records) {
      throw new Error('only series manifests with inline data can use this method.');
    }
    return Series2D.fromKeyAndData(seriesManifest.key, seriesManifest.records!);
  }

  constructor(public readonly key: string, private readonly datapoints: Datapoint2D[]) {
    this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(`${datapoint.x}`);
    });
    this.xMap = mapDatapoints('x', this.datapoints);
    this.yMap = mapDatapoints('y', this.datapoints);
    this.length = this.xs.length;
  }

  atX(x: string): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): string[] | null {
    return this.yMap.get(y) ?? null;
  }

  [Symbol.iterator](): Iterator<Datapoint2D> {
    return this.datapoints[Symbol.iterator]();
  }
}

export class OrderedSeries2D extends Series2D {

  static fromKeyAndData(key: string, data: XyPoint[]): OrderedSeries2D {
    return new OrderedSeries2D(key, data.map((record) => Datapoint2D.fromRecord(record)));
  }

  static fromSeriesManifest(seriesManifest: Series): OrderedSeries2D {
    if (!seriesManifest.records) {
      throw new Error('only series manifests with inline data can use this method.');
    }
    return OrderedSeries2D.fromKeyAndData(seriesManifest.key, seriesManifest.records!);
  }

  constructor(key: string, datapoints: Datapoint2D[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: string): number | null {
    return this.xMap.get(x)?.[0] ?? null;
  }
}

export class NumericSeries2D extends OrderedSeries2D {
  declare datapoints: NumericDatapoint2D[]

  static fromKeyAndData(key: string, data: XyPoint[]): NumericSeries2D {
    return new NumericSeries2D(key, data.map((record) => NumericDatapoint2D.fromRecord(record)));
  }

  static fromSeriesManifest(seriesManifest: Series): NumericSeries2D {
    if (!seriesManifest.records) {
      throw new Error('only series manifests with inline data can use this method.');
    }
    return NumericSeries2D.fromKeyAndData(seriesManifest.key, seriesManifest.records!);
  }

  constructor(key: string, datapoints: NumericDatapoint2D[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: string): number | null {
    return this.xMap.get(x)?.[0] ?? null;
  }
}

// Like a dictionary for series
// TODO?: allow for number and date values, add axes units properties, add bare/percent format, 
export class Model2D {
  public readonly keys: string[] = [];
  protected keyMap: Record<string, Series2D> = {};
  [i: number]: Series2D;
  public readonly multi: boolean;
  public readonly numSeries: number;

  static fromManifest(manifest: Manifest): Model2D {
    const dataset = manifest.datasets[0];
    if (dataset.data.source !== 'inline') {
      throw new Error('only manifests with inline data can use this method.');
    }
    const series = dataset.series.map((aSeries) => Series2D.fromSeriesManifest(aSeries));
    return new Model2D(series);
  }

  static fromAllSeriesData(data: AllSeriesData): Model2D {
    const series = Object.keys(data).map((key) => Series2D.fromKeyAndData(key, data[key]));
    return new Model2D(series);
  }

  constructor(public readonly series: Series2D[]) {
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

  atKey(key: string): Series2D | null {
    return this.keyMap[key] ?? null;
  }
}

export class OrderedModel2D extends Model2D {
  declare keyMap: Record<string, OrderedSeries2D>;
  public readonly numXs: number;

  static fromManifest(manifest: Manifest): Model2D {
    const dataset = manifest.datasets[0];
    if (dataset.data.source !== 'inline') {
      throw new Error('only manifests with inline data can use this method.');
    }
    const series = dataset.series.map((aSeries) => OrderedSeries2D.fromSeriesManifest(aSeries));
    return new OrderedModel2D(series);
  }

  static fromAllSeriesData(data: AllSeriesData): OrderedModel2D {
    const series = Object.keys(data).map((key) => OrderedSeries2D.fromKeyAndData(key, data[key]));
    return new OrderedModel2D(series);
  }

  constructor(series: OrderedSeries2D[]) {
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
