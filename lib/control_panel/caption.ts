
import { ParaComponent } from '../components';
import { logging } from '../common/logger';

//import { styles } from '../../styles';
import { Summarizer, PlaneChartSummarizer, PastryChartSummarizer, HighlightedSummary } from '@fizz/parasummary';

import { html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { type Unsubscribe } from '@lit-app/state';
import { PlaneModel } from '@fizz/paramodel';
import { ParaChart } from '../parachart/parachart';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

@customElement('para-caption-box')
export class ParaCaptionBox extends logging(ParaComponent) {

  @property({attribute: false}) parachart!: ParaChart;

  @state() protected _caption: HighlightedSummary = { text: '', html: '' };

  private _summarizer?: Summarizer;
  protected _storeChangeUnsub!: Unsubscribe;

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
      #desc-footer {
        background-color: var(--theme-color-light);
        padding: 0.2rem;
        display: var(--exploration-bar-display);
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
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
        ${unsafeHTML(summary.html.replaceAll('$summary$', idPrefix))}
        <ul>
          ${(summary.highlights ?? []).map((highlight) => {
            return html`<li>${highlight.id}</li>`;
          })}
        </ul>
      </article>
    `
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
            id="desc-footer"
            ?hidden=${!this._store.settings.controlPanel.isStatusBarVisible}
          >
            <div id="status_split">
              <div id="statusbar"
                aria-hidden="true"
              >
                ${this.renderSummary(this._store.announcement, 'statusbar')}
              </div>
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