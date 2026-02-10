
import { ParaChart } from '../parachart/parachart';
import { type SourceKind, type FieldInfo, LoadError, LoadErrorCode } from '../loader/paraloader';

export { FieldInfo, LoadError, LoadErrorCode };

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

  loadData(url: string): Promise<FieldInfo[]> {
    return this._paraChart.loader.preloadData(url);
  }

  async loadManifest(
    input: string,
    type: SourceKind = 'url',
  ): Promise<LoadManifestResult> {
    await this._paraChart.ready;
    this._paraChart.manifestType = type;
    await new Promise(resolve => setTimeout(resolve, 0));
    this._paraChart.manifest = input;
    
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

}