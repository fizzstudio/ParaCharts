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

import { Manifest } from "@fizz/chart-metadata-validation";
import { arrayEqual, enumerate } from "./helpers";

/**
 * A datapoint consisting of x and y value strings.
 * @public
 */
// TODO?: box x and y values, allow for number and date values
export class Datapoint2D {
  constructor(public readonly x: string, public readonly y: string) {}

  isEqual(other: Datapoint2D) {
    return this.x === other.x && this.y === other.y;
  }

}

function mapDatapoints(dimension: 'x' | 'y', datapoints: Datapoint2D[]): Record<string, string[]> {
  const map = {} as Record<string, string[]>;
  for (const datapoint of datapoints) {
    if (!(datapoint[dimension] in map)) {
      map[datapoint[dimension]] = [] as string[];
    }
    map[datapoint[dimension]].push(datapoint[dimension === 'x' ? 'y' : 'x']);
  }
  return map;
}

export class Series2D {
  [i: number]: Datapoint2D;
  protected xMap: Record<string, string[]>;
  private yMap: Record<string, string[]>;
  public readonly xs: string[] = [];

  constructor(public readonly key: string, private readonly datapoints: Datapoint2D[]) {
    this.datapoints.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.xs.push(datapoint.x)
    });
    this.xMap = mapDatapoints('x', this.datapoints);
    this.yMap = mapDatapoints('y', this.datapoints);
  }

  atX(x: string): string[] | null {
    return this.xMap[x] ?? null;
  }

  atY(y: string): string[] | null {
    return this.yMap[y] ?? null;
  }
}

export class OrderedSeries2D extends Series2D {
  constructor(key: string, datapoints: Datapoint2D[]) {
    super(key, datapoints);
    for (const [_x, ys] of Object.values(this.xMap)) {
      if (ys.length > 1) {
        throw new Error('ordered series can only have one y-value per x-label')
      }
    }
  }

  onlyAtX(x: string): string | null {
    return this.xMap[x][0] ?? null;
  }
}

// Like a dictionary for series
// TODO?: allow for number and date values, add axes units properties, add bare/percent format, 
export class Model2D {
  public readonly keys: string[] = [];
  protected keyMap: Record<string, Series2D> = {};
  [i: number]: Series2D;
  public multi: boolean;

  static fromManifest(manifest: Manifest): Model2D {
    const dataset = manifest.datasets[0];
    const series = dataset.series.map((aSeries) => 
      new Series2D(aSeries.key, aSeries.records!.map((record) => new Datapoint2D(record.x, record.y)))
    );
    return new Model2D(series);
  }

  constructor(protected readonly series: Series2D[]) {
    this.multi = this.series.length > 1
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

  static fromManifest(manifest: Manifest): OrderedModel2D {
    const dataset = manifest.datasets[0];
    const series = dataset.series.map((aSeries) => 
      new OrderedSeries2D(aSeries.key, aSeries.records!.map((record) => new Datapoint2D(record.x, record.y)))
    );
    return new OrderedModel2D(series);
  }

  constructor(series: OrderedSeries2D[]) {
    super(series);
    if (this.multi) {
      this.series.forEach((series) => {
        if (!arrayEqual(series.xs, this.series[0].xs)) {
          throw new Error('each series in a ordered model must have all the same x-labels')
        }
      })
    }
  }
}
