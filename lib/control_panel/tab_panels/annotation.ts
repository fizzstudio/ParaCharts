import { ControlPanelTabPanel } from '.';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { datapointIdToCursor, type PointAnnotation } from '../../state/parastate';
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
        ${this._paraState.annotations.map(item => html`
            <li
              id="${item.id}"
              data-series="${item.seriesKey}"
              data-index="${item.index}"
              @click=${(event: Event) => {
                item.isSelected = !item.isSelected;
                this._selectAnnotation(event);
                }}
              @contextmenu=${(event: Event) => {
                event.preventDefault()
                this.editAnnotation(event)
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
    for (const dpId of this._paraState.visitedDatapoints) {
      const { seriesKey, index } = datapointIdToCursor(dpId);
      const series = this._paraState.model!.atKey(seriesKey)!.getLabel();
      const recordLabel = formatXYDatapointX(
        this._paraState.model!.atKeyAndIndex(seriesKey, index) as PlaneDatapoint,
        'raw'
      );
      const { result, text } = await this.showAddAnnotDialog(dpId);
      if (result == 'cancel') {
        continue;
      }
      const annotationText = text;
      if (annotationText) {
        newAnnotationList.push({
          type: "datapoint",
          seriesKey,
          index,
          annotation: `${series}, ${recordLabel}: ${annotationText}`,
          text: annotationText,
          id: `${series}-${recordLabel}-${this._paraState.nextAnnotID()}`,
          isSelected: this._paraState.settings.ui.isLowVisionModeEnabled ? false : true,
        });
      }
    }
    this._paraState.annotations = [...this._paraState.annotations, ...newAnnotationList];
  }

  async editAnnotation(event: Event) {
    const target = (event?.target as HTMLElement);
    if (target) {
      const annot = this._paraState.annotations.filter(p => (p.id == target.id))[0] as PointAnnotation;
      if (!annot){
        return;
      }
      const { result, text } = await this.showEditAnnotDialog(annot);
      if (result == 'cancel') {
        return;
      }
      if (result == 'remove') {
        this._paraState.annotations = this._paraState.annotations.filter(p => !(p.id == target.id));
        return;
      }
      else {
        annot.text = text;
        this._paraState.requestUpdate();
      }
    }
  }

  async showAddAnnotDialog(dpId: string) {
    return await this.controlPanel.annotationDialog.show('Add Annotation', this._addAnnot(dpId), {showRemove: false});
  }

  protected _addAnnot(dpId: string) {
    const { seriesKey, index } = datapointIdToCursor(dpId);
    const series = this._paraState.model!.atKey(seriesKey)!.getLabel();
    return html`
          <div id="annotDialog">
            <div>Datapoint: ${series}, ${index}</div><br>
            <label for="annot">Text:</label><br>
            <input type="text" id="annot" name="annot">
            <br><br>
          </div>
        `;
  }

  async showEditAnnotDialog(annot: PointAnnotation) {
    return await this.controlPanel.annotationDialog.show('Edit Annotation', this._editAnnot(annot), {showRemove: true});
  }

  protected _editAnnot(annot: PointAnnotation) {
    const seriesKey = annot.seriesKey;
    const index = annot.index;
    const series = this._paraState.model!.atKey(seriesKey)!.getLabel();
    return html`
          <div id="annotDialog">
            <div>Datapoint: ${series}, ${index}</div><br>
            <div>Current text: ${annot.text}</div><br>
            <label for="annot">New text:</label><br>
            <input type="text" id="annot" name="annot">
            <br><br>
          </div>
        `;
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
            @click=${() => {
                this._paraState.addUserLineBreaks()
              }
            }
          >
            Add Line breaks
          </button>
        </div>
         <div>
          <button
            @click=${() => {
                this._paraState.clearUserLineBreaks()
                this._paraState.clearUserTrendLines()
              }
            }
          >
            Remove added line breaks
          </button>
        </div>
         <div>
          <button
            @click=${() => {
                this._paraState.updateSettings(draft => {
                  draft.controlPanel.isMDRAnnotationsVisible = !this._paraState.settings.controlPanel.isMDRAnnotationsVisible;
                });
                this._paraState.showMDRAnnotations()
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