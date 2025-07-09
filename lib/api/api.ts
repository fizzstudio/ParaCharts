
import { type ParaChart } from '../parachart/parachart';


export class ParaApi {

  constructor(protected _paraChart: ParaChart) {}

  serializeChart() {
    return this._paraChart.paraView.serialize();
  }

  downloadPNG() {
    this._paraChart.paraView.downloadImage();
  }

}