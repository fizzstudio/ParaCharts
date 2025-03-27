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

import { enumerate } from "./helpers";

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
  private xMap?: Record<string, string[]>;
  private yMap?: Record<string, string[]>;

  constructor(public readonly key: string, private readonly datapoints: Datapoint2D[]) {
    this.datapoints.forEach((record, index) => this[index] = record);
  }

  atX(x: string): string[] | null {
    if (!(this.xMap)) {
      this.xMap = mapDatapoints('x', this.datapoints);
    }
    return this.xMap[x] ?? null;
  }

  atY(y: string): string[] | null {
    if (!(this.yMap)) {
      this.yMap = mapDatapoints('y', this.datapoints);
    }
    return this.yMap[y] ?? null;
  }
}

// Like a dictionary for series
export class Model2D {
  public readonly keys: string[] = [];
  private keyMap: Record<string, Series2D> = {};
  [i: number]: Series2D;

  constructor(private readonly series: Series2D[]) {
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