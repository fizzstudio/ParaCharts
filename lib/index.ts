import { ParaChart } from './parachart/parachart';
export { ParaChart } from './parachart/parachart';

export * from './common_exports';

customElements.define('para-chart', ParaChart);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
