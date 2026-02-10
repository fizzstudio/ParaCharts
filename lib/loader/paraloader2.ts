import { ChartType, Manifest, type Datatype, type AllSeriesData } from '@fizz/paramanifest';

import papa from 'papaparse';

import { getLogger } from '@fizz/logger';

export type SourceKind = 'fizz-chart-data' | 'url' | 'content';

export type FieldInfo = {
  name: string;
  type: Datatype;
};

export type CSVParseResult = {
  data: Record<string, string>[];
  fields: FieldInfo[];
};

/**
 * Error thrown by loader functions.
 */
export class LoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoadError';
  }
}

/**
 * Parse CSV text into structured data with field information.
 * @param csvText - Raw CSV content
 * @returns Parse result with data and field info
 * @throws {LoadError} If CSV parsing fails or returns no data
 */
export function parseCSV(csvText: string): CSVParseResult {
  const result = papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  
  // Filter out warnings like "auto-detect delimiter" that aren't fatal
  const fatalErrors = result.errors.filter(e => e.type !== 'Delimiter');
  if (fatalErrors.length > 0) {
    throw new LoadError(`Failed to parse CSV: ${fatalErrors[0].message}`);
  }
  
  if (result.data.length === 0) {
    throw new LoadError('CSV parsing returned no data');
  }
  
  return {
    data: result.data,
    fields: extractFieldInfo(result.data)
  };
}

/**
 * Fetch and parse a CSV.
 * @param url - CSV URL
 * @returns Parsed CSV data and field info
 * @throws {LoadError} If fetch fails or CSV parsing fails
 */
async function preloadData(url: string): Promise<CSVParseResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new LoadError(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
  }
  const csvText = await response.text();
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
 * @returns Series data
 * @throws {LoadError} If data loading or processing fails
 */
async function processExternalData(
  manifest: Manifest
): Promise<AllSeriesData> {
  let csvData: Record<string, string>[] = [];
  
  if (manifest.datasets[0].data.path !== 'para:preload') {
    const parseResult = await preloadData(manifest.datasets[0].data.path!);
    csvData = parseResult.data;
  }
  
  if (csvData.length === 0) {
    return {};
  }
  
  const seriesKeys = manifest.datasets[0].series.map(series => series.key);
  const fields = Object.keys(csvData[0]);
  const indepKey = fields.filter(field => !seriesKeys.includes(field))[0];
  
  if (!indepKey) {
    throw new LoadError('Unable to determine independent variable from CSV data');
  }
  
  const data = buildSeriesDataFromCSV(csvData, seriesKeys, indepKey);
  return data;
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

export type LoadedData = {
  manifest: Manifest;
  data?: AllSeriesData;
};

const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';

/**
 * Load manifest from content, URL, or fizz-chart-data module.
 * @param kind - Source type
 * @param manifestInput - Manifest content or path
 * @returns Parsed manifest
 * @throws {LoadError} If manifest loading or parsing fails
 */
async function loadManifest(
  kind: SourceKind,
  manifestInput: string
): Promise<Manifest> {
  try {
    if (kind === 'content') {
      return JSON.parse(manifestInput);
    }
    
    let filePath = '';
    if (kind === 'fizz-chart-data') {
      filePath = CHART_DATA_MODULE_PREFIX;
    }
    filePath += manifestInput;
    const manifestRaw = await fetch(filePath);
    
    if (!manifestRaw.ok) {
      throw new LoadError(`Failed to fetch manifest from ${filePath}: ${manifestRaw.status} ${manifestRaw.statusText}`);
    }
    
    return await manifestRaw.json() as Manifest;
  } catch (error) {
    if (error instanceof LoadError) {
      throw error;
    }
    throw new LoadError(`Failed to load manifest: ${error instanceof Error ? error.message : String(error)}`);
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

/**
 * Load and process a chart manifest.
 * @param kind - Source type for manifest
 * @param manifestInput - Manifest content or path
 * @param chartType - Optional chart type override
 * @param description - Optional description override
 * @returns Loaded manifest and optional external data
 * @throws {LoadError} If loading or processing fails
 */
export async function load(
  kind: SourceKind,
  manifestInput: string,
  chartType?: ChartType,
  description?: string
): Promise<LoadedData> {
  const manifest = await loadManifest(kind, manifestInput);
  let data: AllSeriesData | undefined = undefined;

  if (manifest.datasets[0].data.source === 'external') {
    data = await processExternalData(manifest);
  }

  log.info('manifest loaded');
  applyManifestOverrides(manifest, chartType, description);
  if (chartType) {
    log.info('manifest chart type changed');
  }
  if (description) {
    log.info('manifest description changed');
  }
  return { manifest, data };
}

export type CsvDataType = 'string' | 'number' | 'date';

export interface CsvInferredDefaults {
  chartTitle: string;
  xAxis: {
    title: string;
    dataType: CsvDataType;
  };
  yAxis: {
    title: string;
    dataType: CsvDataType;
  };
}

function generateTitleFromFileName(fileName: string): string {
  if (!fileName) return '';
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isDateFormat(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return !isNaN(new Date(trimmed).getTime());
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    return !isNaN(new Date(trimmed).getTime());
  }

  return false;
}

function isFourDigitYear(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // Strip trailing asterisks or other markers (e.g., "2018*")
  const cleaned = value.trim().replace(/\*+$/, '');
  return /^\d{4}$/.test(cleaned);
}

function headerSuggestsYear(header: string): boolean {
  const lower = header.toLowerCase();
  const alphaOnly = lower.replace(/[^a-z]/g, '');
  return lower.includes('year') || lower.includes('date') || alphaOnly === 'yr';
}

function isValidNumber(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = Number(value.trim());
  return !isNaN(num) && isFinite(num);
}

function inferColumnDataType(values: string[], header: string): CsvDataType {
  if (values.length === 0) return 'string';

  if (values.every(isDateFormat)) {
    return 'date';
  }

  if (headerSuggestsYear(header) && values.every(isFourDigitYear)) {
    return 'date';
  }

  if (values.every(isValidNumber)) {
    return 'number';
  }

  return 'string';
}

export function inferDefaultsFromCsvText(csvText: string, fileName?: string): CsvInferredDefaults {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new LoadError('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());

  if (headers.length < 2) {
    throw new LoadError('CSV must have at least two columns');
  }

  const dataRows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));

  const xValues = dataRows.map(row => row[0] || '');
  const yValues = dataRows.map(row => row[1] || '');

  return {
    chartTitle: generateTitleFromFileName(fileName || ''),
    xAxis: {
      title: headers[0],
      dataType: inferColumnDataType(xValues, headers[0]),
    },
    yAxis: {
      title: headers.length === 2 ? headers[1] : '',
      dataType: inferColumnDataType(yValues, headers[1] || ''),
    },
  };
}

// ============================================================================
// Backward compatibility: Result types and ParaLoader class wrapper
// ============================================================================

type LoadSuccess = {
  result: 'success';
  manifest: Manifest;
  data?: AllSeriesData;
};

type LoadFailure = {
  result: 'failure';
  error: string;
};

export type LoadResult = LoadSuccess | LoadFailure;

/**
 * Class-based loader wrapper for backward compatibility.
 * Wraps the functional API with Result-based error handling.
 */
export class ParaLoader {
  private _log = getLogger('ParaLoader');
  private _csvParseResult: CSVParseResult | null = null;

  /**
   * Load and process a chart manifest.
   * @param kind - Source type for manifest
   * @param manifestInput - Manifest content or path
   * @param chartType - Optional chart type override
   * @param description - Optional description override
   * @returns Result object with success/failure status
   */
  async load(
    kind: SourceKind,
    manifestInput: string,
    chartType?: ChartType,
    description?: string
  ): Promise<LoadResult> {
    try {
      const result = await load(kind, manifestInput, chartType, description);
      return {
        result: 'success',
        manifest: result.manifest,
        data: result.data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this._log.error(message);
      return {
        result: 'failure',
        error: message,
      };
    }
  }

  /**
   * Fetch and parse a CSV, storing the parse results.
   * @param url - CSV URL
   * @returns List of FieldInfo records
   */
  async preloadData(url: string): Promise<FieldInfo[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new LoadError(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    this._csvParseResult = parseCSV(csvText);
    return this._csvParseResult.fields;
  }
}