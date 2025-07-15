//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';

import { 
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


@customElement('para-graphing-panel')
export class GraphingPanel extends ControlPanelTabPanel {

  protected _generalSettingViewsRef = createRef<HTMLDivElement>();
  //protected _chartSettingViewsRef = createRef<HTMLDivElement>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
    .setting-views {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-content: space-between;
        gap: 0.5em;
        margin-bottom: .5em;
      }
    `
  ];

  render() {
    return html`   
      <div class="tab-content stacked">
        <div
          ${ref(this._generalSettingViewsRef)}
          class="setting-views"
        >
          ${this._store.settingControls.getContent('controlPanel.tabs.graphing.general')}
        </div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-graphing-panel': GraphingPanel;
  }
}