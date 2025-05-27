
import { ParaChart } from '../parachart/parachart';
import '../parachart/parachart';
import { ParaApi } from '../api/api';

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

  loadManifest(url: string) {
    this._paraChart.setAttribute('filename', url);
    return new Promise<void>((resolve) => {
      this._paraChart.addEventListener('filenamechange', async () => {
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