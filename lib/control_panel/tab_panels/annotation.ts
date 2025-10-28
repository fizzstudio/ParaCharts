import { ControlPanelTabPanel } from '.';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { Candidate} from '@fizz/chart-message-candidates'

@customElement('para-annotation-panel')
export class AnnotationPanel extends ControlPanelTabPanel {
  supp1: string = '';
  supp2: string = '';

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      :host {
        --zebraStripe: hsl(0, 0%, 85%);
      }

      ol.annotations {
        padding-inline-start: 1.5rem;
        max-height: 6rem;
        overflow-y: scroll;
      }

      ol.annotations li {
        cursor: pointer;
        padding: 4px;
      }

      ol.annotations li:nth-child(even) {
        background-color: var(--zebraStripe);
      }

      ol.annotations li.selected {
        font-weight: bold;
        background-color: var(--theme-color-light);
      }
    `
  ];

  constructor() {
    super();
  }

  showAnnotations() {
    return html`
      <ol class="annotations">
        ${this._store.annotations.map(item => html`
            <li
              data-series="${item.seriesKey}"
              data-index="${item.index}"
              @click=${(event: Event) => {
                item.isSelected = !item.isSelected;
                this._selectAnnotation(event);
                }}
              @dblclick=${(event: Event) => {
                this._store.annotations = this._store.annotations.filter(p => !(p.id == item.id))
                }}
            >${item.annotation}</li>
          `)
      }
      </ol>
    `;
  }

  showCandidates() {
    return html`
        <div>
        ${this._store.userCandidates.sort().map(item => html`
          <div
           @mouseover=${(event: Event) => {
              let length = this.store.model!.series[0].length - 1;
              this.store.highlightRange(item.params[0] / length, (item.params[item.params.length - 1]! - 1) / length )
            }}
            @mouseleave=${(event: Event) => {
              let length = this.store.model!.series[0].length - 1;
              this.store.unhighlightRange(item.params[0] / length, (item.params[item.params.length - 1]! - 1) / length )
            }}
           @click=${(event: Event) => {
              this._controlPanel.requestUpdate();
            }}>
            <input type="radio" name="cand" id="${item.toString()}" value="${item}"/>
            <label for="${item.toString()}">${item.category}</label>
          </div>
          `)
      }
    </div>`;
  }

  showSupplementalQuestions(cand: Candidate | undefined) {
   if (!cand){return}
   let message1 = html``
   if (['Rise','Fall'].includes(cand.category)){
    message1 = html`
          <div>
            <div>
              Would you describe this as a big ${cand.category}?
              <input type="radio" name="supp1" id="supp1Yes" value="true"/>
              <label for="supp1Yes">Yes</label>
              <input type="radio" name="supp1" id="supp1No" value="false" />
              <label for="supp1No">No</label>
            </div>
          </div>
    `
    const radioButtons = this.shadowRoot!.querySelectorAll('input[name="supp1"]')
    let selectedCandString = '';
    for (const radioButton of radioButtons) {
      if ((radioButton as HTMLInputElement).checked) {
        selectedCandString = (radioButton as HTMLInputElement).value;
        break;
      }
    }
    this.supp1 = selectedCandString;
   }

   let message2 = html``
   if (cand.params[cand.params.length - 1]! === this.store.model!.series[0].length){
    message2 = html`
          <div>
            <div>
              Would you describe this as a possible ${cand.category}?
              <input type="radio" name="supp2" id="supp1Yes" value="true"/>
              <label for="supp1Yes">Yes</label>
              <input type="radio" name="supp2" id="supp1No" value="false"/>
              <label for="supp1No">No</label>
            </div>
          </div>
    `
    const radioButtons = this.shadowRoot!.querySelectorAll('input[name="supp2"]')
    let selectedCandString = '';
    for (const radioButton of radioButtons) {
      if ((radioButton as HTMLInputElement).checked) {
        selectedCandString = (radioButton as HTMLInputElement).value;
        break;
      }
    }
    this.supp2 = selectedCandString;
   }

    return html`${message1}<div></div>${message2}`
  }

  getSelectedCat(){
    if (this._store.userCandidates.length === 0){return}
    const radioButtons = this.shadowRoot!.querySelectorAll('input[name="cand"]')
    let selectedCandString = '';
    for (const radioButton of radioButtons) {
      if ((radioButton as HTMLInputElement).checked) {
        selectedCandString = (radioButton as HTMLInputElement).value;
        break;
      }
    }
    let selectedCand = this.store.userCandidates.filter(c => c.toString() == selectedCandString)[0]
    return selectedCand
  }

  protected _selectAnnotation(event: Event) {
    const target = (event?.target as HTMLElement);
    if (target) {
      this._highlightAnnotation(target);
      if (target.dataset.series && target.dataset.index!) {
        const seriesKey = target.dataset.series!;
        const index = parseInt(target.dataset.index!);
        this._navToAnnotation(seriesKey, index);
      }
    }
  }

  protected _highlightAnnotation(annotationEl: HTMLElement) {
    // TODO: highlight annotations when the target element is visited
    for (const annotation of annotationEl.parentElement?.children!) {
      annotation.classList.remove('selected');
    }
    annotationEl.classList.add('selected');
    annotationEl.scrollIntoView(false);
  }

  protected _navToAnnotation(seriesKey: string, index: number) {
    this._controlPanel.paraChart.paraView.navToDatapoint(seriesKey, index);
  }

  render() {
    const isLine = this._store.type === 'line' ? true : false
    return html`
      <div id="annotation-tab" class="tab-content">
        <section id="annotations">
          ${this.showAnnotations()}
        </section>
        <div>
          <button
            @click=${() => {
              this._store.addAnnotation();
            }}
          >
            Add Annotation
          </button>
        </div>
        <div ?hidden=${!isLine}> 
          <button
            @click=${
              () => {
                this._store.addUserLineBreaks()
              }
            }
          >
            Add Line breaks
          </button>
        </div>
         <div ?hidden=${!isLine}>
          <button
            @click=${
              () => {
                this._store.clearUserLineBreaks()
                this._store.clearUserTrendLines()
              }
            }
          >
            Remove added line breaks
          </button>
        </div>
         <div ?hidden=${!isLine}>
          <button
            @click=${
              () => {
                this._store.updateSettings(draft => {
                  draft.controlPanel.isMDRAnnotationsVisible = !this._store.settings.controlPanel.isMDRAnnotationsVisible;
                });
                this._store.showMDRAnnotations()
              }
            }
          >
            ${this._store.settings.controlPanel.isMDRAnnotationsVisible ? "Remove Trend Annotations" : "Show Trend Annotations"}
          </button>
        </div>
        <div ?hidden=${!isLine || !this._controlPanel.paraChart.train}>
          <button
            @click=${
              () => {
                this._store.showTrends()
              }
            }
          >
            Show Trend Candidates
          </button>
        </div>
      </div>
        <div id="candidates">
          ${this.showCandidates()}
        </div>
        <div id="supplementQuestions">
            ${this.showSupplementalQuestions(this.getSelectedCat())}
        </div>
        <div id="candidateSubmission" ?hidden=${this.store.userCandidates.length == 0}>
          <button
            @click=${
              () => {
                let selectedCand = this.getSelectedCat()
                this.showSupplementalQuestions(selectedCand)
                if (selectedCand){
                  this.store.submitTrend(selectedCand, this.supp1, this.supp2);
                }
              }
            }
          >
            Submit trend candidate
          </button>
        </div>

    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-annotation-panel': AnnotationPanel;
  }
}