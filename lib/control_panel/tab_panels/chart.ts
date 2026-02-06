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
        grid-template-columns: 9rem minmax(0, 11rem) 9.5rem 8rem;
        grid-template-rows: 2.5rem 2.5rem;
        padding: 0.25rem;
        column-gap: 0.5rem;
        row-gap: 0.5rem;
        align-items: center;
      }
      #width {
        grid-row: 1;
        grid-column: 1;
        justify-self: end;
      }
      #height {
        grid-row: 2;
        grid-column: 1;
        justify-self: end;
      }
      #min-y {
        grid-row: 1;
        grid-column: 2;
        justify-self: end;
      }
      #max-y {
        grid-row: 2;
        grid-column: 2;
        justify-self: end;
      }
      #chart-content {
        grid-column: 3;
        justify-self: center;
      }
      #popup-content {
        grid-row: 1;
        grid-column: 4;
        justify-self: center;
      }
      #popups {
        grid-row: 2;
        grid-column: 4;
        justify-self: center;
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
    this._paraState.settingControls.add({
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
    const chartContent = this._paraState.settingControls.getContent(`controlPanel.tabs.chart.chart`);
    const popupsContent = this._paraState.settingControls.getContent(`controlPanel.tabs.chart.popups`);
    const fontsContent = this._paraState.settingControls.getContent(`controlPanel.tabs.chart.fonts`);
    return html`
      <section id="panel">
        <div id="columns">
          <div id="width">
            ${this._paraState.settingControls.getContent(`controlPanel.tabs.chart.general.width`)}
          </div>
          <div id="height">
            ${this._paraState.settingControls.getContent(`controlPanel.tabs.chart.general.height`)}
          </div>
          <div id="min-y">
            ${this._paraState.settingControls.getContent(`controlPanel.tabs.chart.general.minY`)}
          </div>
          <div id="max-y">
            ${this._paraState.settingControls.getContent(`controlPanel.tabs.chart.general.maxY`)}
          </div>
          ${chartContent.map(columnContent => html`
            <div id="chart-content">
              ${columnContent}
            </div>
          `)}
          ${popupsContent.map(columnContent => html`
            <div id="popup-content">
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
              .globalState=${this._globalState}
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