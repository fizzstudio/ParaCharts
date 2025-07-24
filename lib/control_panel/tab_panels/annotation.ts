import { ControlPanelTabPanel } from '.';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('para-annotation-panel')
export class AnnotationPanel extends ControlPanelTabPanel {

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
              @click=${(event: Event) => this._selectAnnotation(event)}
            >${item.annotation}</li>
          `)
      }
      </ol>
    `;
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
         <div>
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
            Show Trend Annotations
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-annotation-panel': AnnotationPanel;
  }
}