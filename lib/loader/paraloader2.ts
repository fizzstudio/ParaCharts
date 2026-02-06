import { ChartType, Manifest, type Datatype, type AllSeriesData } from '@fizz/paramanifest';

import papa from 'papaparse';

import { Logger, getLogger } from '@fizz/logger';

export type SourceKind = 'fizz-chart-data' | 'url' | 'content';

export type FieldInfo = {
  name: string;
  type: Datatype;
};

type CSVParseSuccess = {
  result: 'success';
  data: Record<string, string>[];
  fields: FieldInfo[];
};

type CSVParseFailure = {
  result: 'failure';
  error: string;
};

export type CSVParseResult = CSVParseSuccess | CSVParseFailure;

/**
 * Parse CSV text into structured data with field information.
 * @param csvText - Raw CSV content
 * @returns Parse result with data and field info, or error
 */
export function parseCSV(csvText: string): CSVParseResult {
  const result = papa.parse<Record<string, string>>(csvText, { header: true });
  
  if (result.errors.length > 0) {
    return {
      result: 'failure',
      error: result.errors[0].message
    };
  }
  
  if (result.data.length === 0) {
    return {
      result: 'failure',
      error: 'CSV parsing returned no data'
    };
  }
  
  return {
    result: 'success',
    data: result.data,
    fields: extractFieldInfo(result.data)
  };
}

/**
 * Extract field information from parsed CSV data.
 * @param data - Parsed CSV rows
 * @returns List of field names and detected types
 */
function extractFieldInfo(data: Record<string, string>[]): FieldInfo[] {
  if (data.length === 0) {
    return [];
  }
  
  const fields = Object.keys(data[0]);
  
  return fields.map(field => ({
    name: field,
    // XXX need to detect date formats
    type: isNaN(parseFloat(data[0][field]))
      ? 'string'
      : 'number'
  }));
}

type LoadSuccess = {
  result: 'success',
  manifest: Manifest,
  data?: AllSeriesData
};

type LoadFailure = {
  result: 'failure',
  error: string
};

type LoadResult = LoadSuccess | LoadFailure;

const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';

/**
 * Load manifest from content, URL, or fizz-chart-data module.
 * @param kind - Source type
 * @param manifestInput - Manifest content or path
 * @returns Parsed manifest
 */
async function loadManifest(
  kind: SourceKind,
  manifestInput: string
): Promise<Manifest> {
  if (kind === 'content') {
    return JSON.parse(manifestInput);
  }
  
  let filePath = '';
  if (kind === 'fizz-chart-data') {
    filePath = CHART_DATA_MODULE_PREFIX;
  }
  filePath += manifestInput;
  const manifestRaw = await fetch(filePath);
  return await manifestRaw.json() as Manifest;
}

export class ParaLoader {

  private log: Logger = getLogger("ParaLoader");

  async load(
    kind: SourceKind,
    manifestInput: string,
    chartType?: ChartType,
    description?: string
  ): Promise<LoadResult> {
    const manifest = await loadManifest(kind, manifestInput);

    let data: AllSeriesData | undefined = undefined;

    if (manifest.datasets[0].data.source === 'external') {
      // XXX convenient lie until proper external data loading works
      manifest.datasets[0].data.source = 'inline';
      data = {};
      let csvData: Record<string, string>[] = [];
      if (manifest.datasets[0].data.path !== 'para:preload') {
        const parseResult = await this.preloadData(manifest.datasets[0].data.path!);
        if (parseResult.result === 'failure') {
          return { result: 'failure', error: parseResult.error };
        }
        csvData = parseResult.data;
      }
      const seriesKeys = manifest.datasets[0].series.map(series => series.key);
      const fields = Object.keys(csvData[0]);
      const indepKey = fields.filter(field => !seriesKeys.includes(field))[0];
      csvData.forEach((row) => {
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
      manifest.datasets[0].representation = { 
        type: 'chart',
        subtype: chartType
      };
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
   * Fetch and parse a CSV.
   * @param url - CSV URL
   * @returns Parse result with data and field info, or error
   */
  async preloadData(url: string): Promise<CSVParseResult> {
    const csvText = await (await fetch(url)).text();
    return parseCSV(csvText);
  }
}