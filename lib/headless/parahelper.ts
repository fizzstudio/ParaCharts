
import { ParaChart } from '../parachart/parachart';
import '../parachart/parachart';
import { ParaApi } from '../api/api';
import { type SourceKind, type FieldInfo } from '../loader/paraloader';

export { FieldInfo };

export { type Manifest } from '@fizz/paramanifest';
const test = `<table>
          <caption>Division of energy in the Universe (Table)</caption>
          <thead>
            <tr>
              <th>Kind of energy</th>
              <th>Proportion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dark Energy</td>
              <td>73%</td>
            </tr>
            <tr>
              <td>Dark Matter</td>
              <td>23%</td>
            </tr>
            <tr>
              <td>Nonluminous Matter</td>
              <td>3.6%</td>
            </tr>
            <tr>
              <td>Luminous Matter</td>
              <td>0.4%</td>
            </tr>
          </tbody>
        </table>
        <script id="some-manifest" type="application/json">
          {
          "datasets": [
            {
              "type": "pie",
              
              
              "data": {
                "source": "inline"
              }
            }
          ]
        }

        </script>
`
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