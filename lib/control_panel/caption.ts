
import { ParaComponent } from '../components';
import { Logger, getLogger } from '../common/logger';
import { Highlight } from '@fizz/parasummary';

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

type HoverListener = (event: PointerEvent) => void;

@customElement('para-caption-box')
export class ParaCaptionBox extends ParaComponent {
  private log: Logger = getLogger("ParaCaptionBox");
  protected _lastSpans = new Set<HTMLElement>();
  protected _prevSpanIdx = 0;
  protected _highlightManualOverride = false;

  @property({ attribute: false }) parachart!: ParaChart;

  @state() protected _caption: HighlightedSummary = { text: '', html: '' };

  private _summarizer?: Summarizer;
  protected _storeChangeUnsub!: Unsubscribe;
  protected _spans: HTMLSpanElement[] = [];
  protected _isEBarVisible = false;

  static styles = [
    css`
      figcaption.external {
        border: var(--caption-border);
      }
      #caption-box {
        display: grid;
        grid-template-columns: var(--caption-grid-template-columns);
      }
      #caption {
        padding: 0.25rem;
      }
      #caption.solo {
        grid-column: 1 / 3
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
      #exploration-bar.hidden {
        /* Using this rather than 'hidden' attr to override flex display */
        display: none;
      }
    `
  ];

  get highlightManualOverride() {
    return this._highlightManualOverride;
  }

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
    if (!this._store.settings.ui.isNarrativeHighlightEnabled) return;
    const spans = this.getSpans();
    this._spans = this._spans.filter(span => spans.includes(span));
    spans.forEach((span, i) => {
      // Only add the listeners once
      if (!this._spans.includes(span)) {
        this._spans.push(span);
        span.addEventListener('pointerenter', (e: PointerEvent) => {
          if (!this._store.settings.ui.isNarrativeHighlightEnabled
            || this._store.paraChart.ariaLiveRegion.voicing.isSpeaking) return;
          // NB: this requires there be an announcement, so it only works
          // in NH mode
          const highlight = this._store.announcement.highlights[i];
          this._store.paraChart.postNotice('utteranceBoundary', highlight);
        });
        // span.addEventListener('pointerleave', (e: PointerEvent) => {
        //   if (!this._store.settings.ui.isNarrativeHighlightEnabled) return;
        // });
      }
    });
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

  noticePosted(key: string, value: any) {
    if (this._store.settings.ui.isNarrativeHighlightEnabled) {
      if (key === 'utteranceBoundary') {
        const highlight: Highlight = value;
        for (const span of this.getSpans()) {
          if (span.dataset.phrasecode === `${highlight.phrasecode}`) {
            span.classList.add('highlight');
            this._lastSpans.add(span);
          } else {
            span.classList.remove('highlight');
            this._lastSpans.delete(span);
          }
        }
      } else if (key === 'utteranceEnd') {
        if (!this._highlightManualOverride) {
          for (const span of this._lastSpans) {
            span.classList.remove('highlight');
          }
        }
      }
    }
  }

  highlightSpan(next = true) {
    const getMsg = (idx: number) => {
      const div = document.createElement('div');
      div.innerHTML = this._store.announcement.html;
      return (div.children[idx] as HTMLElement).innerText;
    };

    const voicing = this._store.paraChart.ariaLiveRegion.voicing;
    let idx = this._prevSpanIdx;
    if (!this._highlightManualOverride) {
      idx = voicing.highlightIndex!;
      this._highlightManualOverride = true;
    }
    idx = Math.min(
      this._store.announcement.highlights.length - 1,
      Math.max(0, idx + (next ? 1 : -1)));

    this._prevSpanIdx = idx;

    const msg = getMsg(idx);
    const highlight = this._store.announcement.highlights[idx];
    voicing.shutUp();
    voicing.speakText(msg);
    this._store.paraChart.postNotice('utteranceBoundary', highlight);
  }

  clearSpanHighlights() {
    for (const span of this.getSpans()) {
      span.classList.remove('highlight');
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
    this._isEBarVisible = !!this.store.announcement.text
      && this._store.announcement.text !== this._caption.text;
    const isCaptionSolo = !this._isEBarVisible || !this._store.settings.controlPanel.isExplorationBarVisible;
    return html`
      <figcaption class=${this.parachart.isControlPanelOpen ? '' : 'external'}>
        <div id="caption-box">
          <div
            id="caption"
            class=${isCaptionSolo ? 'solo' : ''}
            ?hidden=${!this._store.settings.controlPanel.isCaptionVisible}
          >
            ${this.renderSummary(this._caption, 'caption')}
          </div>
          <div
            id="exploration-bar"
            class=${isCaptionSolo ? 'hidden' : ''}
          >
            <div
              id="exploration-bar-text"
              aria-hidden="true"
            >
              ${this._store.announcement.text === this._caption.text
                ? ''
                : this.renderSummary(this._store.announcement, 'statusbar')}
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