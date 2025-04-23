//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';

import { 
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


@customElement('para-chart-panel')
export class ChartPanel extends ControlPanelTabPanel {

  protected _generalSettingViewsRef = createRef<HTMLDivElement>();
  protected _chartSettingViewsRef = createRef<HTMLDivElement>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
    `
  ];

  render() {
    return html`   
      <div class="tab-content stacked">
        <div
          ${ref(this._generalSettingViewsRef)}
          class="setting-views"
        >
          ${this._store.settingControls.getContent('general')}
        </div>
        <div
          ${ref(this._chartSettingViewsRef)}
          class="setting-views"
        >
          ${this._store.settingControls.getContent('chart')}
        </div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart-panel': ChartPanel;
  }
}