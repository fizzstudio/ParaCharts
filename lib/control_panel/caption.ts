
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
        border: solid 2px var(--theme-color);
      }
      #description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      #caption {
        padding: 0.25rem;
      }
      #desc-footer {
        background-color: var(--theme-color-light);
        padding: 0.2rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-direction: row;
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
    const styles = {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    };
    return html`
      <figcaption class=${this.parachart.isControlPanelOpen ? '' : 'external'}>
        <div id="description" style=${styleMap(styles)}>
          <div
            id="caption"
            ?hidden=${!this._store.settings.controlPanel.isCaptionVisible}
          >
            ${this._caption}
          </div>
          <div id="desc-footer">
            <div id="status_split">
              <div id="statusbar"
                aria-hidden="true"
                ?hidden=${!this._store.settings.controlPanel.isStatusBarVisible}
              >
                ${this._store.announcement.text}
              </div>
            </div>
            <button
              @click=${() => this.parachart.showAriaLiveHistory()}
            >
              History
            </button>
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