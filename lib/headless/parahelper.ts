
import { ParaChart } from '../parachart/parachart';
import '../parachart/parachart';
import { ParaApi } from '../api/api';
import { type SourceKind, type FieldInfo } from '../loader/paraloader';

export class ParaHelper {

  protected _paraChart!: ParaChart;
  protected _api: ParaApi;

  constructor() {
    this._createParaChart();
    this._api = new ParaApi(this._paraChart);
  }

  get ready() {
    return this._paraChart.ready;
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

  serializeChart() {
    return this._api.serializeChart();
  }

}