import { ParaChart } from '../parachart/parachart';
import { type SourceKind, type FieldInfo, LoadError, LoadErrorCode, parseCSV, type CsvDataType } from '../loader/paraloader';

export { FieldInfo, LoadError, LoadErrorCode, CsvDataType };

export { type Manifest } from '@fizz/paramanifest';

export type LoadManifestSuccess = {
  success: true;
};

export type LoadManifestFailure = {
  success: false;
  errorCode: LoadErrorCode;
  message: string;
};

export type LoadManifestResult = LoadManifestSuccess | LoadManifestFailure;

export class ParaHeadless {

  protected _paraChart!: ParaChart;

  constructor() {
    this._createParaChart();
  }

  async ready() {
    await this._paraChart.ready;
    this._paraChart.paraState.updateSettings(draft => {
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

  async loadManifest(
    input: string,
    type: SourceKind = 'url',
  ): Promise<LoadManifestResult> {
    await this._paraChart.ready;
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
   * @returns Object containing SVG string, description, alt text, and JIM metadata
   */
  async getChartOutput(): Promise<{
    svg: string;
    description: string;
    altText: string;
    jim: string;
  }> {
    await this.jimReady;
    
    const svg = this.api.serializeChart();
    const description = await this.api.getDescription() ?? '';
    const altText = await this.api.getAltText() ?? '';
    const jimObj = this.api.getJIM();
    const jim = jimObj ? JSON.stringify(jimObj) : '';

    return { svg, description, altText, jim };
  }

}
