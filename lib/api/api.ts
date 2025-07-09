
import { type ParaChart } from '../parachart/parachart';


export class ParaApi {

  constructor(protected _paraChart: ParaChart) {}

  serializeChart() {
    return this._paraChart.paraView.serialize();
  }

  downloadSVG() {
    this._paraChart.paraView.downloadSVG();
  }

  downloadPNG() {
    this._paraChart.paraView.downloadPNG();
  }

}