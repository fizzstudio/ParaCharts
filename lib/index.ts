import { ParaChart } from './parachart/parachart';
export { ParaChart } from './parachart/parachart';

customElements.define('para-chart', ParaChart);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
