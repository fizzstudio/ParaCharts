import { ChartType, Manifest, type Datatype, type AllSeriesData } from '@fizz/paramanifest';

import papa from 'papaparse';

import { getLogger } from '@fizz/logger';

export type SourceKind = 'fizz-chart-data' | 'url' | 'content';

export type FieldInfo = {
  name: string;
  type: Datatype;
};

type Ok<T> = { result: 'ok' } & T;
type Err<E = string> = { result: 'err'; error: E };
type Result<T, E = string> = Ok<T> | Err<E>;

export type CSVParseResult = Result<{
  data: Record<string, string>[];
  fields: FieldInfo[];
}>;

type ExternalDataResult = Result<{ data: AllSeriesData }>;

/**
 * Parse CSV text into structured data with field information.
 * @param csvText - Raw CSV content
 * @returns Parse result with data and field info, or error
 */
export function parseCSV(csvText: string): CSVParseResult {
  const result = papa.parse<Record<string, string>>(csvText, { header: true });
  
  if (result.errors.length > 0) {
    return {
      result: 'err',
      error: result.errors[0].message
    };
  }
  
  if (result.data.length === 0) {
    return {
      result: 'err',
      error: 'CSV parsing returned no data'
    };
  }
  return {
    result: 'ok',
    data: result.data,
    fields: extractFieldInfo(result.data)
  };
}

/**
 * Fetch and parse a CSV.
 * @param url - CSV URL
 * @returns Parse result with data and field info, or error
 */
async function preloadData(url: string): Promise<CSVParseResult> {
  const csvText = await (await fetch(url)).text();
  return parseCSV(csvText);
}

/**
 * Transform CSV data into series data format.
 * @param csvData - Parsed CSV rows
 * @param seriesKeys - Keys of series to extract
 * @param indepKey - Independent variable key
 * @returns Series data map
 */
function buildSeriesDataFromCSV(
  csvData: Record<string, string>[],
  seriesKeys: string[],
  indepKey: string
): AllSeriesData {
  const data: AllSeriesData = {};
  
  csvData.forEach((row) => {
    Object.entries(row).forEach(([field, val]) => {
      if (seriesKeys.includes(field)) {
        if (!data[field]) {
          data[field] = [];
        }
        data[field].push({
          x: row[indepKey],
          y: val as string
        });
      }
    });
  });
  
  return data;
}

/**
 * Process external data by loading CSV and converting to series format.
 * @param manifest - Manifest with external data source
 * @returns Success with data or error
 */
async function processExternalData(
  manifest: Manifest
): Promise<ExternalDataResult> {
  let csvData: Record<string, string>[] = [];
  
  if (manifest.datasets[0].data.path !== 'para:preload') {
    const parseResult = await preloadData(manifest.datasets[0].data.path!);
    if (parseResult.result === 'err') {
      return { result: 'err', error: parseResult.error };
    }
    csvData = parseResult.data;
  }
  
  const seriesKeys = manifest.datasets[0].series.map(series => series.key);
  const fields = Object.keys(csvData[0]);
  const indepKey = fields.filter(field => !seriesKeys.includes(field))[0];
  const data = buildSeriesDataFromCSV(csvData, seriesKeys, indepKey);
  
  return { result: 'ok', data };
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

type LoadResult = Result<{
  manifest: Manifest;
  data?: AllSeriesData;
}>;

const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';

/**
 * Load manifest from content, URL, or fizz-chart-data module.
 * @param kind - Source type
 * @param manifestInput - Manifest content or path
 * @returns Parse result with manifest or error
 */
async function loadManifest(
  kind: SourceKind,
  manifestInput: string
): Promise<Result<{ manifest: Manifest }>> {
  try {
    if (kind === 'content') {
      const manifest = JSON.parse(manifestInput);
      return { result: 'ok', manifest };
    }
    
    let filePath = '';
    if (kind === 'fizz-chart-data') {
      filePath = CHART_DATA_MODULE_PREFIX;
    }
    filePath += manifestInput;
    const manifestRaw = await fetch(filePath);
    
    if (!manifestRaw.ok) {
      return {
        result: 'err',
        error: `Failed to fetch manifest: ${manifestRaw.status} ${manifestRaw.statusText}`
      };
    }
    
    const manifest = await manifestRaw.json() as Manifest;
    return { result: 'ok', manifest };
  } catch (error) {
    return {
      result: 'err',
      error: `Failed to load manifest: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Apply optional overrides to manifest.
 * @param manifest - Manifest to modify
 * @param chartType - Optional chart type override
 * @param description - Optional description override
 */
function applyManifestOverrides(
  manifest: Manifest,
  chartType?: ChartType,
  description?: string
): void {
  if (chartType) {
    manifest.datasets[0].representation = {
      type: 'chart',
      subtype: chartType
    };
  }
  if (description) {
    manifest.datasets[0].description = description;
  }
}

const log = getLogger('ParaLoader');

export async function load(
  kind: SourceKind,
  manifestInput: string,
  chartType?: ChartType,
  description?: string
): Promise<LoadResult> {
  const manifestResult = await loadManifest(kind, manifestInput);
  if (manifestResult.result === 'err') {
    return manifestResult;
  }
  
  const manifest = manifestResult.manifest;
  let data: AllSeriesData | undefined = undefined;

  if (manifest.datasets[0].data.source === 'external') {
    const result = await processExternalData(manifest);
    if (result.result === 'err') {
      return result;
    }
    data = result.data;
  }

  log.info('manifest loaded');
  applyManifestOverrides(manifest, chartType, description);
  if (chartType) {
    log.info('manifest chart type changed');
  }
  if (description) {
    log.info('manifest description changed');
  }
  return { result: 'ok', manifest, data };
}