
import { ParaChart } from '../parachart/parachart';
import '../parachart/parachart';
import { type SourceKind, type FieldInfo } from '../loader/paraloader';

export { FieldInfo };

export { type Manifest } from '@fizz/paramanifest';

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

  loadManifest(
    input: string,
    type: SourceKind = 'url',
    // format: SourceFormat = 'manifest',
    // templateOptions?: TemplateOptions
  ): Promise<void> {
    this._paraChart.manifest = input;
    this._paraChart.manifestType = type;
    return new Promise<void>((resolve) => {
      this._paraChart.addEventListener('manifestchange', async () => {
        // Once the filename has been set, we can wait for the load to complete
        await this._paraChart.loaded;
        resolve();
      }, {once: true});
    });
  }

  get jimReady() {
    return this._paraChart.paraView.jimReady();
  }

  get api() {
    return this._paraChart.api;
  }

}