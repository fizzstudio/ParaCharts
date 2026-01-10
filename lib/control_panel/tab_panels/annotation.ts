import { ControlPanelTabPanel } from '.';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { datapointIdToCursor, type PointAnnotation } from '../../store/parastore';
import { formatXYDatapointX } from '@fizz/parasummary';
import { type PlaneDatapoint } from '@fizz/paramodel';

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

  async addAnnotation() {
    const newAnnotationList: PointAnnotation[] = [];
    for (const dpId of this.store.visitedDatapoints) {
      const { seriesKey, index } = datapointIdToCursor(dpId);
      const series = this.store.model!.atKey(seriesKey)!.getLabel();
      const recordLabel = formatXYDatapointX(
        this.store.model!.atKeyAndIndex(seriesKey, index) as PlaneDatapoint,
        'raw'
      );
      let result = await this.controlPanel.showAnnotDialog(dpId);
      if (result[0] == 'cancel'){
        continue;
      }
      const annotationText = result[1];
      if (annotationText) {
      newAnnotationList.push({
        type: "datapoint",
        seriesKey,
        index,
        annotation: `${series}, ${recordLabel}: ${annotationText}`,
        text: annotationText,
        id: `${series}-${recordLabel}-${this.store.annotID}`,
        isSelected: this.store.settings.ui.isLowVisionModeEnabled ? false : true,
      });
      this.store.incrementAnnotID();
      }
    }
    this.store.annotations = [...this.store.annotations, ...newAnnotationList];
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
              this.addAnnotation();
            }}
          >
            Add Annotation
          </button>
        </div>
        <div> 
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
         <div>
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