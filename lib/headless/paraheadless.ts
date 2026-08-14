import { ParaChart } from '../parachart/parachart';
import { type SourceKind, type FieldInfo, LoadError, LoadErrorCode, parseCSV, type CsvDataType } from '../loader/paraloader';
import { type SettingsInput } from '../config/config_types';

/** @public */
export { FieldInfo, LoadError, LoadErrorCode, CsvDataType };

/** @public */
export { type Manifest } from '@fizz/chartsignal-internal';

/** @public */
export type LoadManifestSuccess = {
  success: true;
};

/** @public */
export type LoadManifestFailure = {
  success: false;
  errorCode: LoadErrorCode;
  message: string;
};

/** @public */
export type LoadManifestResult = LoadManifestSuccess | LoadManifestFailure;

/** Physical page sizes supported by headless chart rendering. @public */
export type HeadlessPageSize =
  | 'auto'
  | 'letter_portrait'
  | 'letter_landscape'
  | 'tractor_us_standard'
  | 'tractor_us_rotated'
  | 'tractor_de_standard'
  | 'tractor_de_rotated'
  | 'a4_portrait'
  | 'a4_landscape'
  | 'tabloid_portrait'
  | 'tabloid_landscape'
  | 'monarch_portrait'
  | 'monarch_landscape';

/** Presentation options applied before a headless chart is laid out. @public */
export interface HeadlessRenderOptions {
  /** Render labels with tactile layout. */
  isTactileEnabled?: boolean;
  /** Size the serialized SVG for a physical page, or use chart dimensions for `auto`. */
  pageSize?: HeadlessPageSize;
  /** Braille grade used for translated tactile labels. */
  tactileBrailleGrade?: 1 | 2;
  /** Select which forms of tactile labels are visible. */
  tactileLabelMode?: 'Braille' | 'Latin' | 'Both' | 'None';
}

/** @public */
export class ParaHeadless {

  protected _paraChart!: ParaChart;

  constructor() {
    this._createParaChart();
  }

  async ready() {
    await this._paraChart.ready;
    this._paraChart.paraState.updateConfig(draft => {
      // XXX something is overriding this ...
      draft.animation.isAnimationEnabled = false;
    });
  }

  protected _createParaChart() {
    this._paraChart = document.createElement('para-chart');
    this._paraChart.setAttribute('headless', '');
    document.body.append(this._paraChart);
  }

  /**
   * Fetch and parse CSV data from a URL.
   * Returns the field information (column names and types).
   * @param url - CSV file URL
   * @returns Field information from the CSV
   */
  async loadData(url: string): Promise<FieldInfo[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new LoadError(
        LoadErrorCode.NETWORK_ERROR,
        `Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`
      );
    }
    const csvText = await response.text();
    const result = parseCSV(csvText);
    return result.fields;
  }

  /**
   * Load and render a chart manifest.
   * @param input - Manifest URL or serialized manifest content.
   * @param type - How to interpret `input`.
   * @param options - Presentation options applied before chart layout.
   */
  async loadManifest(
    input: string,
    type: SourceKind = 'url',
    options: HeadlessRenderOptions = {},
  ): Promise<LoadManifestResult> {
    await this._paraChart.ready;
    const settings: SettingsInput = {
      'animation.isAnimationEnabled': false,
    };
    if (options.isTactileEnabled !== undefined) {
      settings['chart.isTactileEnabled'] = options.isTactileEnabled;
    }
    if (options.pageSize !== undefined) {
      settings['chart.pageSize'] = options.pageSize;
    }
    if (options.tactileBrailleGrade !== undefined) {
      settings['chart.tactileBrailleGrade'] = options.tactileBrailleGrade;
    }
    if (options.tactileLabelMode !== undefined) {
      settings['chart.tactileLabelMode'] = options.tactileLabelMode;
    }
    this._paraChart.config = settings;
    this._paraChart.manifestType = type;
    this._paraChart.manifest = input;
    // Wait for Lit's update cycle to run willUpdate and create the new loader promise
    await this._paraChart.updateComplete;

    try {
      await this._paraChart.loaded;
      return { success: true };
    } catch (error) {
      if (error instanceof LoadError) {
        return {
          success: false,
          errorCode: error.code,
          message: error.message,
        };
      }
      return {
        success: false,
        errorCode: LoadErrorCode.UNKNOWN,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  get jimReady() {
    return this._paraChart.paraView.jimReady();
  }

  get api() {
    return this._paraChart.api;
  }

  /**
   * Generate chart and return SVG with accessibility metadata.
   * Must be called after loadManifest() completes successfully.
   * @returns Object containing SVG string, description, alt text, short description, and JIM metadata
   */
  async getChartOutput(): Promise<{
    svg: string;
    description: string;
    altText: string;
    shortDescription: string;
    jim: string;
  }> {
    await this.jimReady;

    const svg = this.api.serializeChart();
    const description = await this.api.getDescription() ?? '';
    const altText = await this.api.getAltText() ?? '';
    const shortDescription = await this.api.getShortDescription() ?? '';
    const jimObj = this.api.getJIM();
    const jim = jimObj ? JSON.stringify(jimObj) : '';

    return { svg, description, altText, shortDescription, jim };
  }

}
