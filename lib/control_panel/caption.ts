
import { ParaComponent } from '../components';
import { logging } from '../common/logger';

//import { styles } from '../../styles';
import { Summarizer, PlaneChartSummarizer, PastryChartSummarizer } from '@fizz/parasummary';

import { html, css } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { type Unsubscribe } from '@lit-app/state';
import { PlaneModel } from '@fizz/paramodel';
import { ParaChart } from '../parachart/parachart';

@customElement('para-caption-box')
export class ParaCaptionBox extends logging(ParaComponent) {

  @property({attribute: false}) parachart!: ParaChart;

  @state() protected _caption = '';

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

  render() {
    return html`
      <figcaption class=${this.parachart.isControlPanelOpen ? '' : 'external'}>
        <div id="description">
          <div
            id="caption"
            ?hidden=${!this._store.settings.controlPanel.isCaptionVisible}
          >
            ${this._caption}
          </div>
          <div
            id="desc-footer"
            ?hidden=${!this._store.settings.controlPanel.isStatusBarVisible}
          >
            <div id="status_split">
              <div id="statusbar"
                aria-hidden="true"
              >
                ${this._store.announcement.text}
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