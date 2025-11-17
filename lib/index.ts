import { ParaChart } from './parachart/parachart';
export { ParaChart } from './parachart/parachart';
export * from './headless/paraheadless';
export * from './scrollyteller/scrollyteller';
export * from './audio/index';
export * from './common/index';
export * from './components/index';
export * from './store/index';
export * from './control_panel/dialogs/index';
export * from './control_panel/index';
export * from './paraview/index';
export * from './store/index';
export * from './view/axis/index';
export * from './view/data/index';
export * from './view/layers/index';
export * from './view/shape/index';

customElements.define('para-chart', ParaChart);

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
