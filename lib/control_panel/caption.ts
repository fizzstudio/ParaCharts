
import { ParaComponent } from '../components';
import { logging } from '../common/logger';

//import { styles } from '../../styles';
import { Summarizer, PlaneChartSummarizer, PastryChartSummarizer, HighlightedSummary } from '@fizz/parasummary';

import { html, css, TemplateResult, PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { type Unsubscribe } from '@lit-app/state';
import { PlaneModel } from '@fizz/paramodel';
import { ParaChart } from '../parachart/parachart';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { NarrativeHighlightHotkeyActions } from '../paraview/hotkey_actions';

type HoverListener = (event: PointerEvent) => void;

@customElement('para-caption-box')
export class ParaCaptionBox extends logging(ParaComponent) {

  @property({attribute: false}) parachart!: ParaChart;

  @state() protected _caption: HighlightedSummary = { text: '', html: '' };

  private _summarizer?: Summarizer;
  protected _storeChangeUnsub!: Unsubscribe;
  protected _spans: HTMLSpanElement[] = [];

  static styles = [
    css`
      figcaption.external {
        border: var(--caption-border);
      }
      #description {
        display: grid;
        grid-template-columns: var(--caption-grid-template-columns);
      }
      #caption {
        padding: 0.25rem;
      }
      #exploration-bar {
        background-color: var(--theme-color-light);
        padding: 0.2rem;
        display: var(--exploration-bar-display);
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
      }
      #exploration-bar-text {
        align-self: flex-start;
      }
      #caption span.highlight {
        background-color: var(--theme-color-light);
      }
      #exploration-bar span.highlight {
        background-color: white;
      }
    `
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.setCaption();
    this._storeChangeUnsub = this._store.subscribe(this.setCaption.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._storeChangeUnsub();
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (this._store.paraChart.paraView.hotkeyActions instanceof NarrativeHighlightHotkeyActions)
      return;
    const spans = this.getSpans();
    this._spans = this._spans.filter(span => spans.includes(span));
    let prevNavcode = '';
    for (const span of spans) {
      // Only add the listeners once
      if (!this._spans.includes(span)) {
        this._spans.push(span);
        span.addEventListener('pointerenter', (e: PointerEvent) => {
          if (this._store.paraChart.paraView.hotkeyActions instanceof NarrativeHighlightHotkeyActions)
            return;
          if (span.dataset.navcode) {
            if (span.dataset.navcode.startsWith('series')) {
              const segments = span.dataset.navcode.split(/-/);
              this._store.soloSeries = segments.slice(1).join('\t');
            } else {
              this._store.highlight(span.dataset.navcode);
              if (prevNavcode) {
                this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
              }
              this._store.paraChart.paraView.documentView!.chartInfo.didAddHighlight(span.dataset.navcode);
            }
            prevNavcode = span.dataset.navcode;
          }
          span.classList.add('highlight');
        });
        span.addEventListener('pointerleave', (e: PointerEvent) => {
          if (this._store.paraChart.paraView.hotkeyActions instanceof NarrativeHighlightHotkeyActions)
            return;
          this._store.soloSeries = '';
          this._store.clearHighlight();
          span.classList.remove('highlight');
          if (prevNavcode) {
            this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
          }
        });
      }
    }
  }

  clearStatusBar() {
    this.parachart.clearAriaLive();
  }

  private async setCaption(): Promise<void> {
    if (this._store.dataState === 'complete') {
      if (!this._summarizer) {
        if (this.store.model!.type === 'pie' || this.store.model!.type === 'donut') {
          this._summarizer = new PastryChartSummarizer(this.store.model!);
        } else {
          this._summarizer = new PlaneChartSummarizer(this.store.model as PlaneModel);
        }
      }
      this._caption = await this._summarizer.getChartSummary();
    }
  }

  renderSummary(summary: HighlightedSummary | string, idPrefix: string): TemplateResult {
    if (typeof summary === 'string') {
      summary = { text: summary, html: summary };
    }
    return html`
      <article>
        ${unsafeHTML(summary.html)}
      </article>
    `
  }

  getSpans() {
    return Array.from(this.renderRoot.querySelectorAll('span'));
  }

  render() {
    return html`
      <figcaption class=${this.parachart.isControlPanelOpen ? '' : 'external'}>
        <div id="description">
          <div
            id="caption"
            ?hidden=${!this._store.settings.controlPanel.isCaptionVisible}
          >
            ${this.renderSummary(this._caption, 'caption')}
          </div>
          <div
            id="exploration-bar"
            ?hidden=${!this._store.settings.controlPanel.isExplorationBarVisible}
          >
            <div
              id="exploration-bar-text"
              aria-hidden="true"
            >
              ${this._store.announcement.text === this._caption.text
                ? ''
                :  this.renderSummary(this._store.announcement, 'statusbar')}
            </div>
            ${!this._store.settings.controlPanel.caption.isCaptionExternalWhenControlPanelClosed
              || this.parachart.isControlPanelOpen
              ? html`
                <button
                  @click=${() => this.parachart.showAriaLiveHistory()}
                >
                  History
                </button>`
              : ''
            }
          </div>
        </div>
      </figcaption>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-caption-box': ParaCaptionBox;
  }
}