import { ParaChartAi } from './parachart-ai';
export { ParaChartAi } from './parachart-ai';

export * from '../lib/common_exports';

customElements.define('para-chart', ParaChartAi);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChartAi;
  }
}