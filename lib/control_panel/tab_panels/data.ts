//import { styles } from '../../styles';
//import { FileIO } from '../../data/fileio';
import { ControlPanelTabPanel } from './tab_panel';

import * as sb from '@fizz/sparkbraille-component';
import '@fizz/sparkbraille-component';

import { 
  html, css, nothing, 
} from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


@customElement('para-data-panel')
export class DataPanel extends ControlPanelTabPanel {

  @property() sparkBrailleData!: string;
  @property({type: Boolean}) isSparkBrailleVisible = true;

  // protected _fileio = new FileIO();
  protected _sparkBrailleRef = createRef<sb.SparkBraille>();
  protected _sparkBrailleWrapperRef = createRef<HTMLDivElement>();

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
        background-color: var(--themeColorLight);
        margin: -0.19rem -0.25rem 0px;
        padding: 0.2rem;
      }
    `
  ];

  render() {
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
                  this._store.settings.controlPanel.isSparkBrailleVisible = this.isSparkBrailleVisible;
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
                // this.controlPanel.dialog.show(
                //   'JSON Image Metadata', 
                //   html`
                //     <pre>
                //       <code>
                //         ${JSON.stringify(this.controlPanel.todo.canvas.jim, undefined, 2)}
                //       </code>
                //     </pre>`
                // );
              }
            }
          >
            JIM
          </button>
          <button 
            @click=${() => this.controlPanel.dialog.show('Save data')}
          >
            Save data
          </button>
          <button 
            @click=${() => {
              // this.controlPanel.dialog.show('Data table', html`
              //   <todo-datatable
              //     .model=${this.controller.model}
              //   >
              //   </todo-datatable>
              // `);
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
              // this._fileio.saveChart(
              //   this.controlPanel.todo.canvas.documentView!.titleText, 
              //   this.controlPanel.todo.canvas.root);
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
      >
        <!-- 
          What should happen when a braille cell is selected?
        -->
        <fizz-sparkbraille
          ${ref(this._sparkBrailleRef)}
          data=${this.sparkBrailleData}
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