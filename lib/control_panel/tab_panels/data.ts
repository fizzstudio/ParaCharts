//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';
import { ParaView } from '../../paraview';
import '../datatable';

import * as sb from '@fizz/sparkbraille-component';
import '@fizz/sparkbraille-component';

import {
  html, css, nothing,
} from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


@customElement('para-data-panel')
export class DataPanel extends ControlPanelTabPanel {

  @property({type: Boolean}) isSparkBrailleVisible = false;

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
    const csv = this._store.getModelCsv();
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
        width: 30rem;
      }

      #data-buttons button {
        width: 8rem;
        max-width: 8rem;
      }
      #sparkbraille {
        background-color: var(--theme-color-light);
        padding: 0.2rem;
      }
    `
  ];

  render() {
    const paraView = this.controlPanel.parentElement!.firstElementChild as ParaView;
    return html`
      <div
        id="data-page"
        class="tab-content"
      >
        <div>
          <p>Source: <span id="source-name">unknown</span></p>
        </div>
        <div id="data-buttons">
          ${this.controlPanel.settings.isSparkBrailleControlVisible
            ? html`
              <button
                @click=${() => {
                  this.isSparkBrailleVisible = !this.isSparkBrailleVisible;
                  // XXX Does this work?
                  paraView.store.updateSettings(draft => {
                    draft.controlPanel.isSparkBrailleVisible = this.isSparkBrailleVisible;
                  })
                  //this.controlPanel.requestUpdate();
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
                      ${JSON.stringify(this._store.jimerator!.jim, undefined, 2)}
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
            Save data
          </button>
          <button
            @click=${() => {
              this.controlPanel.dialog.show('Data table', html`
                <para-datatable
                  .model=${this._store.model}
                >
                </para-datatable>
              `);
            }}
          >
            Data table
          </button>
          <button
            @click=${() => this.controlPanel.dialog.show('Source links')}
          >
            Source Links
          </button>
          <button
            @click=${() => {
              this._saveChart();
            }}
          >
            Save chart
          </button>
        </div>
      </div>
      <div
        ${ref(this._sparkBrailleWrapperRef)}
        id="sparkbraille"
        class=${this.isSparkBrailleVisible ? nothing : 'hidden'}
        ?hidden=${!this.isSparkBrailleVisible}
    >
        <!--
          What should happen when a braille cell is selected?
        -->
        <fizz-sparkbraille
          ${ref(this._sparkBrailleRef)}
          ?bar=${this._store.sparkBrailleInfo?.isBar}
          ?isProp=${this._store.sparkBrailleInfo?.isProportional}
          data=${this._store.sparkBrailleInfo?.isProportional
            ? ''
            : this._store.sparkBrailleInfo?.data ?? ''}
          labeledData=${this._store.sparkBrailleInfo?.isProportional
            ? this._store.sparkBrailleInfo?.data ?? ''
            : ''}
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