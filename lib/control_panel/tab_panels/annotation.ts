import { ControlPanelTabPanel } from '.';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { datapointIdToCursor } from '../../state/parastate';
import { formatXYDatapointX } from '@fizz/parasummary';
import { AxisAnnotation, BaseAnnotation, DatapointAnnotation, type PlaneDatapoint } from '@fizz/chartsignal-internal';
import { LineBreakControlsDialog } from '../dialogs/line_break_controls_dialog';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('para-annotation-panel')
export class AnnotationPanel extends ControlPanelTabPanel {

  protected _lineBreakControlsDialogRef = createRef<LineBreakControlsDialog>();

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
      button::first-letter {
        text-transform: capitalize;
      }
    `
  ];

  constructor() {
    super();
  }

  showAnnotations() {
    if (!this._paraState.model) {
      return;
    }
    return html`
      <ol class="annotations">
        ${this._paraState.model.annotations.map(item => html`
            <li
              id="${item.id}"
              data-series="${(item as DatapointAnnotation).seriesIndex}"
              data-index="${(item as DatapointAnnotation).datapointIndex}"
              @click=${(event: Event) => {
                this._selectAnnotation(event);
                }}
              @contextmenu=${(event: Event) => {
                event.preventDefault()
                this.editAnnotation(event)
                }}
            >${this.getAnnotationMessage(item)}</li>
          `)
      }
      </ol>
    `;
  }


  getAnnotationMessage(annot: BaseAnnotation) {
    if (annot.type == 'datapoint-annotation') {
      const datapointAnnot = annot as DatapointAnnotation;
      const seriesLabel = this._paraState.model?.series[datapointAnnot.seriesIndex].label
      return `${seriesLabel}, datapoint ${datapointAnnot.datapointIndex}: ${datapointAnnot.text}`
    }
    else if (annot.type == 'axis-annotation') {
      const axisAnnot = annot as AxisAnnotation;
      const cap = axisAnnot.axis == 'y' ? "Y" : "X"
      const isThreshold = axisAnnot.kind == 'threshold' ? "Threshold" : ""
      return `${isThreshold} ${cap} - ${axisAnnot.value}: ${axisAnnot.text}`
    }
    return annot.text;
  }

  protected _selectAnnotation(event: Event) {
    const target = (event?.target as HTMLElement);
    if (target) {
      this._highlightAnnotation(target);
      if (this._paraState._selectedAnnotations.includes(target.id)) {
        this._paraState.removeSelectedAnnotation(target.id);
      }
      else {
        this._paraState._selectedAnnotations.push(target.id);
      }
      if (target.dataset.series && target.dataset.index!) {
        const seriesKey = this._paraState.model!.seriesKeys[parseInt(target.dataset.series!)];
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
    const newAnnotationList: DatapointAnnotation[] = [];
    for (const dpId of this._paraState.visitedDatapoints) {
      const { seriesKey, index } = datapointIdToCursor(dpId);
      const seriesIndex = this._paraState.model!.seriesKeys.indexOf(seriesKey);
      const series = this._paraState.model!.atKey(seriesKey)!.label;
      const recordLabel = formatXYDatapointX(
        this._paraState.model!.atKeyAndIndex(seriesKey, index) as PlaneDatapoint,
        'raw'
      );
      const { result, text } = await this.showAddAnnotDialog(dpId);
      if (result == 'cancel') {
        continue;
      }
      const annotationText = text;
      const id = `${series}-${recordLabel}-${this._paraState.model?.nextAnnotID(seriesKey, index, annotationText)}`;
      if (annotationText) {
        newAnnotationList.push({
          type: "datapoint-annotation",
          datasetIndex: 0,
          seriesIndex,
          datapointIndex: index,
          text: annotationText,
          id: id,
        });
      }
      this._paraState._selectedAnnotations.push(id);
    }
    for (let annot of newAnnotationList) {
      this._paraState.model?.addAnnotation(annot);
    }
    this._paraState.refreshParaView();
  }

  async editAnnotation(event: Event) {
    const target = (event?.target as HTMLElement);
    if (target) {
      const annot = this._paraState.model!.annotations.filter(p => (p.id == target.id))[0] as BaseAnnotation;
      if (!annot) {
        return;
      }
      const { result, text } = await this.showEditAnnotDialog(annot);
      if (result == 'cancel') {
        return;
      }
      if (result == 'remove') {
        this._paraState.model!.removeAnnotation(target.id);
        this._paraState.refreshParaView();
        return;
      }
      else {
        this._paraState.model?.editAnnotation(annot.id, text);
        this._paraState.refreshParaView();
      }
    }
  }

  async showAddAnnotDialog(dpId: string) {
    return await this.controlPanel.annotationDialog.show('Add Annotation', this._addAnnot(dpId), { showRemove: false });
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

  async showEditAnnotDialog(annot: BaseAnnotation) {
    return await this.controlPanel.annotationDialog.show('Edit Annotation', this._editAnnotDialogContent(annot), { showRemove: true });
  }

  protected _editAnnotDialogContent(annot: BaseAnnotation) {
    if (annot.type == 'datapoint') {
      const datapointAnnot = annot as DatapointAnnotation
      const seriesKey = this._paraState.model!.seriesKeys[datapointAnnot.seriesIndex];
      const index = datapointAnnot.datapointIndex;
      const series = this._paraState.model!.atKey(seriesKey)!.label;
      return html`
      <div id="annotDialog">
        <div>Datapoint: ${series}, ${index}</div><br>
        <div>Current text: ${datapointAnnot.text}</div><br>
        <label for="annot">New text:</label><br>
        <input type="text" id="annot" name="annot">
        <br><br>
      </div>
    `;
    }
    else {
      return html`
      <div id="annotDialog">
        <div>Current text: ${annot.text}</div><br>
        <label for="annot">New text:</label><br>
        <input type="text" id="annot" name="annot">
        <br><br>
      </div>
    `;
    }
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
            ${this._globalState.l10n.localize('cpanel.tabs.annotations.add_annotation')}
          </button>
        </div>
        <div>
            <button
              @click=${() => this._lineBreakControlsDialogRef.value?.show()}
            >
              Line-break controls
            </button>
          </div>
        <para-line-break-controls-dialog
          ${ref(this._lineBreakControlsDialogRef)}
          id="line-break-controls-dialog"
          .globalState=${this._globalState}
        ></para-line-break-controls-dialog>  
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-annotation-panel': AnnotationPanel;
  }
}