
import { ParaChart } from '../parachart/parachart';
import '../parachart/parachart';

export class ParaHelper {

  protected _paraChart!: ParaChart;

  constructor() {
    this._createParaChart();
  }

  protected _createParaChart() {
    this._paraChart = document.createElement('para-chart');
    this._paraChart.setAttribute('headless', '');
    this._paraChart.hidden = true;
    document.body.append(this._paraChart);
  }

}