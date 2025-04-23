//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';
//import { TodoDialog } from '../dialog';


import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


// interface Annotation {
//   seriesKey: string,
//   recordLabel: string,
//   annotation: string
// }

@customElement('para-annotation-panel')
export class AnnotationPanel extends ControlPanelTabPanel {

  //private dialogRef = createRef<TodoDialog>();

  /**
   * Annotation UI.
   */
  // @property({ type: Array })
  // public annotationList: Annotation[] = [];
  // Note: Sample annotations for multi-line chart Item 57
  // @property({ type: Array })
  // public annotationList: Annotation[] = [
  //   {
  //     'seriesKey': 'Industry',
  //     'recordLabel': '2016',
  //     'annotation': 'Industry, 2016: Low value for Industry'
  //   },
  //   {
  //     'seriesKey': 'Industry',
  //     'recordLabel': '2012',
  //     'annotation': 'Industry, 2012: Intersection between Industry and Services '
  //   },
  //   {
  //     'seriesKey': 'Services',
  //     'recordLabel': '2013',
  //     'annotation': 'Services, 2013: Point where Services overtakes Industry'
  //   },
  //   {
  //     'seriesKey': 'Services',
  //     'recordLabel': '2018',
  //     'annotation': 'Services, 2018: High point of chart'
  //   },
  //   {
  //     'seriesKey': 'Agriculture',
  //     'recordLabel': '2018',
  //     'annotation': 'Agriculture, 2018: Low point of chart'
  //   }
  // ];

  // @state()
  // public annotationList: Annotation[] = [];
  //   {
  //     'seriesKey': 'Industry',
  //     'recordLabel': '2012',
  //     'annotation': 'Industry, 2012: Intersection between Industry and Services '
  //   }    
  // ];


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
        background-color: var(--themeColorLight);
      }
    `
  ];

  constructor() {
    super();
    // this.getUrlAnnotations();
  }

  showAnnotations() {
    // const annotationList = 
    //   todo().canvas.documentView?.chartLayers.foregroundAnnotationLayer.annotationList ?? [];
    return html``/*html`
      <ol class="annotations">
        ${annotationList.map(item => html`
            <li
              data-series="${item.seriesKey}"
              data-record="${item.recordLabel}"
              @click=${(event: Event) => this.selectAnnotation(event)}
            >${item.annotation}</li>
          `)
      }
      </ol>
    `;*/
  }

  selectAnnotation(event: Event) {
    const target = (event?.target as HTMLElement);
    if (target) {
      this.highlightAnnotation(target);
      const seriesKey = (target.dataset.series as string);
      const recordLabel = (target.dataset.record as string);
      this.goToAnnotation(seriesKey, recordLabel);
    }
  }

  highlightAnnotation(annotationEl: HTMLElement) {
    // TODO: highlight annotations when the target element is visited
    // ArrayFrom(annotationEl.parentElement?.children).forEach( (annotation) => {
    //   (annotation as HTMLElement).classList.remove('selected');
    // })

    for (const annotation of annotationEl.parentElement?.children!) {
      annotation.classList.remove('selected');
    }
    annotationEl.classList.add('selected');
    annotationEl.scrollIntoView(false);
  }

  goToAnnotation(seriesName: string, recordLabel: string) {
    // const datapointView = todo().dataLayer.getDatapointView(seriesName, recordLabel);
    // datapointView?.focus();
  }

  render() {
    return html`   
      <div id="annotation-tab" class="tab-content">
        <section id="annotations">
          ${this.showAnnotations()}
        </section>
        <div>
          <button
            @click=${
              () => {} //todo().canvas.documentView!.chartLayers.foregroundAnnotationLayer.addAnnotation()
            }
          >
            Add Annotation
          </button>
        </div>
      </div>
      <!--
      <todo-annotation-settings-dialog
        ${ref(this.dialogRef)}
        id="annotation-settings-dialog"
        .controller=${this.controller}
      ></todo-annotation-settings-dialog>
          -->
    `;
  }
  // <!-- 
  // <section id="advanced">
  //   <button 
  //     @click=${() => this.controlPanel.dialog.show('Annotations', this.showAnnotations())}
  //   >
  //     Annotations
  //   </button>
  // </section> 
  // -->
}

declare global {
  interface HTMLElementTagNameMap {
    'para-annotation-panel': AnnotationPanel;
  }
}