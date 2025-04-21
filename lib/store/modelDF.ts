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

import { DataFrame, Dimension, RawDataPoint } from "./dataframe/dataframe";

export class SeriesDF {
  private readonly dataframe: DataFrame;

  /*[i: number]: Datapoint2D<X>;
  protected xMap: Map<ScalarMap[X], number[]>;
  private yMap: Map<number, ScalarMap[X][]>;
  public readonly xs: ScalarMap[X][] = [];
  public readonly ys: number[] = [];
  public readonly length: number;
  public readonly boxedXs: Box<X>[] = [];
  public readonly boxedYs: Box<'number'>[] = [];*/

  constructor(
    public readonly key: string, 
    public readonly rawData: RawDataPoint[], 
    public readonly dimensionSignatures: Dimension[]
  ) {
    this.dataframe = new DataFrame(dimensionSignatures);
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