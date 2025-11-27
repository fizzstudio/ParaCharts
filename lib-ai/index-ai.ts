import { ParaChartAi } from './parachart-ai';
export { ParaChartAi } from './parachart-ai';

customElements.define('para-chart', ParaChartAi);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChartAi;
  }
}