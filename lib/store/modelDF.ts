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

import { Memoize } from 'typescript-memoize';
import { AllSeriesData, Dataset, Datatype, Manifest, Series, Theme1 as Theme } from "@fizz/paramanifest";

import { arrayEqualsBy, enumerate, strToId } from "../common/utils";
import { DataFrame, DataFrameColumn, DataFrameRow, FacetSignature, RawDataPoint } from "./dataframe/dataframe";
import { Box, BoxSet, ScalarMap } from "./dataframe/box";
import { calculateWholeChartFacetStats, ChartFacetStats } from "./metadata";

export class DataPointDF {
  constructor(protected data: DataFrameRow, public seriesKey: string, public datapointIndex: number) { }

  public entries(): Iterable<[string, Box<Datatype>]> {
    return Object.entries(this.data)[Symbol.iterator]();
  }

  public facetBox(key: string): Box<Datatype> | null {
    return this.data[key] ?? null;
  }

  public facetValue(key: string): ScalarMap[Datatype] | null {
    return this.data[key].value ?? null;
  }
}

export class XYDatapointDF extends DataPointDF {
  constructor(data: DataFrameRow, seriesKey: string, datapointIndex: number) {
    super(data, seriesKey, datapointIndex);
    if (!('x' in data) || !('y' in data)) {
      throw new Error('`XYDatapointDF` must contain `x` and `y` facets')
    }
  }

  get x(): Box<Datatype> {
    return this.data.x;
  }

  get y(): Box<Datatype> {
    return this.data.y;
  }
}

export class SeriesDF {
  [i: number]: DataPointDF;
  public readonly length: number;
  public readonly id: string;
  public readonly label: string;
  public readonly theme?: Theme;

  private readonly dataframe: DataFrame;
  private readonly uniqueValuesForFacet: Record<string, BoxSet<Datatype>> = {};
  private readonly datapoints: DataPointDF[] = [];

  /*protected xMap: Map<ScalarMap[X], number[]>;
  private yMap: Map<number, ScalarMap[X][]>;*/
  constructor(
    public readonly key: string, 
    public readonly rawData: RawDataPoint[], 
    public readonly facets: FacetSignature[],
    label?: string,
    theme?: Theme
  ) {
    this.dataframe = new DataFrame(facets);
    this.facets.forEach((facet) => this.uniqueValuesForFacet[facet.key] = new BoxSet<Datatype>);
    this.rawData.forEach((datapoint) => this.dataframe.addDatapoint(datapoint));
    this.dataframe.rows.forEach((row, index) => {
      const datapoint = new DataPointDF(row, this.key, index);
      this[index] = datapoint;
      this.datapoints.push(datapoint);
      Object.keys(row).forEach(
        (facetKey) => this.uniqueValuesForFacet[facetKey].add(row[facetKey])
      );
    });
    /*this.xMap = mapDatapointsXtoY(this.datapoints);
    this.yMap = mapDatapointsYtoX(this.datapoints);*/
    this.length = this.rawData.length;
    this.id = strToId(this.key); // TODO: see if we need to make this more unique
    this.label = label ?? this.key;
    if (theme) {
      this.theme = theme;
    }
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
  return new SeriesDF(
    seriesManifest.key, 
    seriesManifest.records!, 
    facets, 
    seriesManifest.label,
    seriesManifest.theme
  );
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

  public atKey(key: string): SeriesDF | null {
    return this.keyMap[key] ?? null;
  }
  
  public atKeyAndIndex(key: string, index: number): DataPointDF | null {
    return this.atKey(key)?.[index] ?? null;
  }

  public allFacetValues(key: string): Box<Datatype>[] | null {
    return this.uniqueValuesForFacet[key]?.values ?? null;
  }

  @Memoize()
  public getFacetStats(key: string): ChartFacetStats | null {
    const facetDatatype = this.datatypeMap[key];
    // Checks for both non-existent and non-numerical facets
    if (facetDatatype !== 'number') {
      return null;
    }
    const allBoxes = this.allFacetValues(key) as Box<'number'>[];
    const allValues = allBoxes.map((box) => box.value);
    return calculateWholeChartFacetStats(allValues);
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

// FIXME: This function does not include series labels (as seperate from series keys) or series themes
export function modelDFFromAllSeriesData(
  data: AllSeriesData, facets: FacetSignature[]
): ModelDF {
  const series = Object.keys(data).map((key) => 
    new SeriesDF(key, data[key], facets)
  );
  return new ModelDF(series);
}
