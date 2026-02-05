import { ChartType, Manifest, type Datatype, type AllSeriesData } from '@fizz/paramanifest';

import papa from 'papaparse';

import { Logger, getLogger } from '@fizz/logger';

export type SourceKind = 'fizz-chart-data' | 'url' | 'content';

type LoadSuccess = {
  result: 'success',
  manifest: Manifest,
  data?: AllSeriesData
};

type LoadFailure = {
  result: 'failure',
  error: string
};

export type FieldInfo = {
  name: string;
  type: Datatype;
};

type LoadResult = LoadSuccess | LoadFailure;

const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';

export class ParaLoader {

  private log: Logger = getLogger("ParaLoader");

  protected _csvParseResult: papa.ParseResult<unknown> | null = null;

  async load(
    kind: SourceKind,
    manifestInput: string,
    chartType?: ChartType,
    description?: string
  ): Promise<LoadResult> {
    let manifest: Manifest;
    if (kind === 'content') {
      manifest = JSON.parse(manifestInput);
    } else {
      let filePath = '';
      if (kind === 'fizz-chart-data') {
        filePath = CHART_DATA_MODULE_PREFIX;
      }
      filePath += manifestInput;
      this.log.info(`loading manifest from ${filePath}`)
      const manifestRaw = await fetch(filePath);
      this.log.warn(manifestRaw);
      manifest = await manifestRaw.json() as Manifest;
    }

    let data: AllSeriesData | undefined = undefined;

    if (manifest.datasets[0].data.source === 'external') {
      // XXX convenient lie until proper external data loading works
      manifest.datasets[0].data.source = 'inline';
      data = {};
      if (manifest.datasets[0].data.path !== 'para:preload') {
        await this.preloadData(manifest.datasets[0].data.path!);
      }
      const seriesKeys = manifest.datasets[0].series.map(series => series.key);
      const indepKey = this._csvParseResult!.meta.fields!.filter(field => !seriesKeys.includes(field))[0];
      this._csvParseResult!.data.forEach((row: any, i) => {
        Object.entries(row).forEach(([field, val]) => {
          if (seriesKeys.includes(field)) {
            if (!data![field]) {
              data![field] = [];
            }
            data![field].push({
              x: row[indepKey],
              y: val as string
            });
          }
        });
      });
      // XXX this won't be necessary when proper external data loading works
      manifest.datasets[0].series.forEach(series => {
        series.records = data![series.key];
      });
    }

    this.log.info('manifest loaded');
    if (chartType) {
      manifest.datasets[0].type = chartType;
      this.log.info('manifest chart type changed')
    }
    if (description) {
      manifest.datasets[0].description = description;
      this.log.info('manifest description changed');
    }
    // XXX include `data` here for proper external data loading
    return { result: 'success', manifest };
  }

  /**
   * Fetch and parse a CSV, storing the parse results.
   * @param url - CSV URL
   * @returns List of FieldInfo records
   */
  async preloadData(url: string): Promise<FieldInfo[]> {
    const csvText = await (await fetch(url)).text();
    papa.parse(csvText, {
      header: true,
      complete: (results) => {
        this._csvParseResult = results;
      },
      error: (error: Error) => {
        throw new Error(`Papa Parse error: ${error}`);
      }
    });

    return this._csvParseResult!.meta.fields!.map(field => ({
      name: field,
      // XXX need to detect date formats
      type: isNaN(parseFloat((this._csvParseResult!.data[0] as Record<string, string>)[field] as string))
        ? 'string'
        : 'number'
    }));
  }
}