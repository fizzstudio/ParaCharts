import { ControlPanelTabPanel } from './tab_panel';

import {
  html, css,
  TemplateResult,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { PopupSettingsDialog } from '../../view/popup';


@customElement('para-chart-panel')
export class ChartPanel extends ControlPanelTabPanel {

  protected _popupDialogRef = createRef<PopupSettingsDialog>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #columns {
        display: grid;
        grid-template-columns: repeat(4, 9rem);
        padding: 0.25rem;
        column-gap: 0.5rem;
        row-gap: 0.5rem;
        align-items: center;
      }
    `
  ];

  render() {
    const generalContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.general`);
    const chartContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.chart`);
    return html`
      <div id="columns">
        ${generalContent.map(columnContent => html`
          <div>
            ${columnContent}
          </div>
        `)}
        ${chartContent.map(columnContent => html`
          <div>
            ${columnContent}
          </div>
        `)}
      </div>
      <section id="advanced">
          <button
            @click=${() => {
              this._popupDialogRef.value?.show()}}
          >
          Popup settings
          </button>
          <para-popup-settings-dialog
            ${ref(this._popupDialogRef)}
            id="popup-settings-dialog"
            .store=${this._store}
          >
          </para-popup-settings-dialog>
        </section>

    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart-panel': ChartPanel;
  }
}