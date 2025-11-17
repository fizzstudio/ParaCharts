import { ParaChartAi } from './parachart-ai';
export { ParaChartAi } from './parachart-ai';
export * from '../lib/headless/paraheadless';
export * from '../lib/scrollyteller/scrollyteller';
export * from '../lib/audio/index';
export * from '../lib/common/index';
export * from '../lib/components/index';
export * from '../lib/store/index';
export * from '../lib/control_panel/dialogs/index';
export * from '../lib/control_panel/index';
export * from '../lib/paraview/index';
export * from '../lib/store/index';
export * from '../lib/view/axis/index';
export * from '../lib/view/data/index';
export * from '../lib/view/layers/index';
export * from '../lib/view/shape/index';

customElements.define('para-chart', ParaChartAi);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChartAi;
  }
}