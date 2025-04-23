//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';

import { 
  html, css,
} from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';


@customElement('para-analysis-panel')
export class AnalysisPanel extends ControlPanelTabPanel {

  static styles = [
    //styles,
    css`
    `
  ];

  render() {
    return html`   
      <div class="tab-content">
        <div
          class="setting-views"
        >
          <slot name="settings">
            <span id="settings"> </span>
          </slot>
        </div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
      'para-analysis-panel': AnalysisPanel;
  }
}