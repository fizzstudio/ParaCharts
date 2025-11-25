import { ParaChart } from './parachart/parachart';
export { ParaChart } from './parachart/parachart';
export { ParaHeadless } from './headless/paraheadless';

customElements.define('para-chart', ParaChart);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
