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

import { arrayEqualsBy, enumerate } from "../common/utils";
import { DataFrame, DataFrameColumn, DataFrameRow, FacetSignature, RawDataPoint } from "./dataframe/dataframe";
import { AllSeriesData, Dataset, Datatype, Manifest, Series } from "@fizz/paramanifest";
import { Box, BoxSet } from "./dataframe/box";
import { calculateWholeChartFacetStats, ChartFacetStats } from "./metadata";

export type DataPointDF = DataFrameRow;

export interface XYDatapointDF {
  x: Box<Datatype>,
  y: Box<Datatype>,
  [facetKey: string]: Box<Datatype>
}


export class SeriesDF {
  private readonly dataframe: DataFrame;

  [i: number]: DataPointDF;
  public readonly length: number;
  private readonly uniqueValuesForFacet: Record<string, BoxSet<Datatype>> = {};
  private readonly datapoints: DataPointDF[] = [];
  /*protected xMap: Map<ScalarMap[X], number[]>;
  private yMap: Map<number, ScalarMap[X][]>;*/

  constructor(
    public readonly key: string, 
    public readonly rawData: RawDataPoint[], 
    public readonly facets: FacetSignature[]
  ) {
    this.dataframe = new DataFrame(facets);
    this.facets.forEach((facet) => this.uniqueValuesForFacet[facet.key] = new BoxSet<Datatype>);
    this.rawData.forEach((datapoint) => this.dataframe.addDatapoint(datapoint));
    this.dataframe.rows.forEach((datapoint, index) => {
      this[index] = datapoint;
      this.datapoints.push(datapoint);
      Object.keys(datapoint).forEach(
        (facetKey) => this.uniqueValuesForFacet[facetKey].add(datapoint[facetKey])
      );
    });
    /*this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);*/
    this.length = this.rawData.length;
  }

  public facet(key: string): DataFrameColumn<Datatype> | null {
    return this.dataframe.facet(key);
  }

  public allFacetValues(key: string): Box<Datatype>[] | null {
    return this.uniqueValuesForFacet[key]?.values ?? null;
  }

  /*atX(x: ScalarMap[X]): number[] | null {
    return this.xMap.get(x) ?? null;
  }

  atY(y: number): ScalarMap[X][] | null {
    return this.yMap.get(y) ?? null;
  }*/

  [Symbol.iterator](): Iterator<DataPointDF> {
    return this.datapoints[Symbol.iterator]();
  }
}

export function seriesDFFromSeriesManifest(seriesManifest: Series, facets: FacetSignature[]): SeriesDF {
  if (!seriesManifest.records) {
    throw new Error('only series manifests with inline data can use this method.');
  }
  return new SeriesDF(seriesManifest.key, seriesManifest.records!, facets);
}

// Like a dictionary for series
// TODO: In theory, facets should be a set, not an array. Maybe they should be sorted first?
export class ModelDF {
  public readonly keys: string[] = [];
  [i: number]: SeriesDF;
  public readonly facets: FacetSignature[];
  public readonly multi: boolean;
  public readonly numSeries: number;

  protected keyMap: Record<string, SeriesDF> = {};
  protected datatypeMap: Record<string, Datatype> = {};
  private uniqueValuesForFacet: Record<string, BoxSet<Datatype>> = {};
  statsForFacet: Record<string, ChartFacetStats | null> = {}; // Should be private but needs to be public for memo

  /*public readonly xs: ScalarMap[X][];
  public readonly ys: number[];
  public readonly allPoints: Datapoint2D<X>[]*/

  constructor(public readonly series: SeriesDF[]) {
    if (this.series.length === 0) {
      throw new Error('models must have at least one series');
    }
    this.multi = this.series.length > 1;
    this.numSeries = this.series.length;
    this.facets = this.series[0].facets;
    this.facets.forEach((facet) => {
      this.uniqueValuesForFacet[facet.key] = new BoxSet<Datatype>;
      this.datatypeMap[facet.key] = facet.datatype;
    });
    for (const [aSeries, seriesIndex] of enumerate(this.series)) {
      if (this.keys.includes(aSeries.key)) {
        throw new Error('every series in a model must have a unique key');
      }
      if (!arrayEqualsBy(
        (l, r) => (l.key === r.key) && (l.datatype === r.datatype), 
        aSeries.facets, this.facets
      )) {
        throw new Error('every series in a model must have the same facets');
      }
      this.keys.push(aSeries.key);
      this[seriesIndex] = aSeries;
      this.keyMap[aSeries.key] = aSeries;
      Object.keys(this.uniqueValuesForFacet).forEach((facetKey) => {
        this.uniqueValuesForFacet[facetKey].merge(aSeries.allFacetValues(facetKey)!);
      });
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

  private memo<R>(memoKey: keyof this, func: (arg: string) => R | null, arg: string) {
    if ((this[memoKey] as Record<string, R | null>)[arg] === undefined) {
      (this[memoKey] as Record<string, R | null>)[arg] = func(arg);
    }
    return (this[memoKey] as Record<string, R | null>)[arg];
  }

  public atKey(key: string): SeriesDF | null {
    return this.keyMap[key] ?? null;
  }
  
  public atKeyAndIndex(key: string, index: number): DataPointDF | null {
    return this.atKey(key)?.[index] ?? null;
  }

  public allFacetValues(key: string): Box<Datatype>[] | null {
    return this.uniqueValuesForFacet[key]?.values ?? null;
  }

  public getFacetStats(key: string): ChartFacetStats | null {
    return this.memo(
      'statsForFacet', 
      (innerKey) => {
        const facetDatatype = this.datatypeMap[innerKey];
        // Checks for both non-existent and non-numerical facets
        if (facetDatatype !== 'number') {
          return null;
        }
        const allBoxes = this.allFacetValues(innerKey) as Box<'number'>[];
        const allValues = allBoxes.map((box) => box.value);
        return calculateWholeChartFacetStats(allValues);
      },
      key
    )
  }
}

export function facetsFromDataset(dataset: Dataset): FacetSignature[] {
  return Object.keys(dataset.facets).map((key) => ({ key, datatype: dataset.facets[key].datatype }))
}

export function modelDFFromManifest(manifest: Manifest): ModelDF {
  const dataset = manifest.datasets[0];
  if (dataset.data.source !== 'inline') {
    throw new Error('only manifests with inline data can use this method.');
  }
  const facets = facetsFromDataset(dataset);
  const series = dataset.series.map((seriesManifest) => 
    seriesDFFromSeriesManifest(seriesManifest, facets)
  );
  return new ModelDF(series);
}

export function modelDFFromAllSeriesData(
  data: AllSeriesData, facets: FacetSignature[]
): ModelDF {
  const series = Object.keys(data).map((key) => 
    new SeriesDF(key, data[key], facets)
  );
  return new ModelDF(series);
}
