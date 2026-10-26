import {
  html, css, nothing,
} from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import * as sb from '../../components/sparkbraille';
import '../../components/sparkbraille';
import { ControlPanelTabPanel } from './tab_panel';
import { type ParaView } from '../../paraview';
import '../datatable';

@customElement('para-data-panel')
export class DataPanel extends ControlPanelTabPanel {

  @property({type: Boolean}) isSparkBrailleVisible = false;

  protected _sparkBrailleButtonRef = createRef<HTMLButtonElement>();
  protected _sparkBrailleRef = createRef<sb.SparkBraille>();
  protected _sparkBrailleWrapperRef = createRef<HTMLDivElement>();

  protected _saveChart() {
    const serialized = this.controlPanel.paraChart.paraView.serialize();
    const blob = new Blob([serialized], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    this._controlPanel.paraChart.paraView.downloadContent(url, 'svg');
    URL.revokeObjectURL(url);
  }

  protected _saveData() {
    const csv = this._paraState.getModelCsv();
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    this._controlPanel.paraChart.paraView.downloadContent(url, 'csv');
    URL.revokeObjectURL(url);
  }

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #data-page {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        align-content: center;
        flex-grow: 1;
      }
      #data-page p {
        white-space: nowrap;
      }
      #data-buttons {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        align-content: center;
        flex-wrap: wrap;
      }

      #data-buttons button {
        width: 8rem;
        max-width: 8rem;
      }
      #data-buttons button::first-letter {
        text-transform: capitalize;
      }
      #sparkbraille {
        background-color: var(--theme-color-light);
        padding: 0.2rem;
      }
    `
  ];

  toggleSparkBraille() {
    this._sparkBrailleButtonRef.value!.click();
  }

  render() {
    const paraView = this.controlPanel.parentElement!.firstElementChild as ParaView;
    return html`
      <div
        id="data-page"
        class="tab-content"
      >
        <div>
          <p>
            ${this._globalState.l10n.localize('cpanel.tabs.data.source')}:
            <span id="source-name">${this._globalState.l10n.localize('cpanel.tabs.data.unknown')}</span>
          </p>
        </div>
        <div id="data-buttons">
          ${this.controlPanel.config.isSparkBrailleControlVisible
            ? html`
              <button
                ${ref(this._sparkBrailleButtonRef)}
                @click=${() => {
                  this.isSparkBrailleVisible = !this.isSparkBrailleVisible;
                  // XXX Does this work?
                  paraView.paraState.updateConfig(draft => {
                    draft.controlPanel.isSparkBrailleVisible = this.isSparkBrailleVisible;
                  })
                  // In order to set focus on the sparkbraille element, it needs to
                  // be currently visible, which is why we remove the hidden attribute
                  // here rather than letting Lit do so on a re-render.
                  if (this._sparkBrailleWrapperRef.value!.hasAttribute('hidden')) {
                    this._sparkBrailleWrapperRef.value!.removeAttribute('hidden');
                  } else {
                    this._sparkBrailleWrapperRef.value!.setAttribute('hidden', '');
                  }
                  this._sparkBrailleRef.value!.focus();
                }}
              >
                SparkBraille
              </button>
            `
            : nothing
          }
          <button
            @click=${() => {
              this.controlPanel.dialog.show(
                'JSON Image Metadata',
                html`
                  <pre>
                    <code>
                      ${JSON.stringify(this._paraState.model!.manifest, undefined, 2)}
                    </code>
                  </pre>`
              )}
            }
          >
            JIM
          </button>
          <button
            @click=${() => this._saveData()}
          >
            ${this._globalState.l10n.localize('cpanel.tabs.data.save_data')}
          </button>
          <button
            @click=${() => {
              this._controlPanel.paraChart.isDataTableVisible = ! this._controlPanel.paraChart.isDataTableVisible;
            }}
          >
            ${this._globalState.l10n.localize('cpanel.tabs.data.data_table')}
          </button>
          <button
            @click=${() => this.controlPanel.dialog.show('Source links')}
          >
            ${this._globalState.l10n.localize('cpanel.tabs.data.source_links')}
          </button>
          <button
            @click=${() => {
              this._saveChart();
            }}
          >
            ${this._globalState.l10n.localize('cpanel.tabs.data.save_chart')}
          </button>
        </div>
      </div>
      <div
        ${ref(this._sparkBrailleWrapperRef)}
        id="sparkbraille"
        hidden
      >
        <!--
          What should happen when a braille cell is selected?
        -->
        <fizz-sparkbraille
          ${ref(this._sparkBrailleRef)}
          .globalState=${this._controlPanel.paraChart.globalState}
          ?bar=${this._paraState.sparkBrailleInfo?.isBar}
          ?isProp=${this._paraState.sparkBrailleInfo?.isProportional}
          data=${this._paraState.sparkBrailleInfo?.isProportional
            ? ''
            : this._paraState.sparkBrailleInfo?.data ?? ''}
          labeledData=${this._paraState.sparkBrailleInfo?.isProportional
            ? this._paraState.sparkBrailleInfo?.data ?? ''
            : ''}
          currentSeries=${this._paraState.sparkBrailleInfo?.currentSeries ?? ''}
          ?compact=${this._paraState.config.controlPanel.isSparkBrailleCompact}
          @select=${(e: CustomEvent) => {
            const index = e.detail*2;
            //chart.hiliteSegmentRangeById('series', `${index}`, `${index + 1}`);
          }}
        >
        </fizz-sparkbraille>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-data-panel': DataPanel;
  }
}