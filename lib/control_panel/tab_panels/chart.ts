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
      #panel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this._store.settingControls.add({
      type: 'slider',
      key: 'chart.fontScale',
      label: 'Font scale',
      options: {
        min: 0.5,
        max: 3,
        step: 0.1,
        showValue: true
      },
      parentView: 'controlPanel.tabs.chart.fonts',
    });
  }

  render() {
    const dimensionContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.general.dimensions`);
    const rangeContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.general.range`);
    const chartContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.chart`);
    const popupsContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.popups`);
    const fontsContent = this._store.settingControls.getContent(`controlPanel.tabs.chart.fonts`);
    return html`
      <section id="panel">
        <div id="columns">
          ${dimensionContent.map(columnContent => html`
            <div>
              ${columnContent}
            </div>
          `)}
          ${rangeContent.map(columnContent => html`
            <div>
              ${columnContent}
            </div>
          `)}
          ${chartContent.map(columnContent => html`
            <div>
              ${columnContent}
            </div>
          `)}
          ${popupsContent.map(columnContent => html`
            <div>
              ${columnContent}
            </div>
          `)}
                
          <section id="popups">
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
        </div>
        <div>
          ${fontsContent}
        </div>
      </section>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart-panel': ChartPanel;
  }
}