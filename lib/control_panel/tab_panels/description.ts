
//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';

import { html, css } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('para-description-panel')
export class DescriptionPanel extends ControlPanelTabPanel {

  @state() caption = '';
  @property() visibleStatus = '';

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      #desc-footer {
        background-color: var(--themeColorLight);
        margin: -0.19rem -0.25rem 0px;
        padding: 0.2rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-direction: row;
        justify-content: space-between;
      }
    `
  ];

  // get speechRate() {
  //   return this._controller.voice.rate;
  // }

  // set speechRate(rate: number) {
  //   this._controller.voice.rate = rate;
  // }

  clearStatusBar() {
    this._controlPanel.paraChart.clearAriaLive();
  }

  render() {
    const styles = {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    };
    if (this.controlPanel.dataState === 'complete') {
      this.caption = this._store.summarizer.getChartSummary();
    }
    return html`
      <figcaption>
        <div id="description" style=${styleMap(styles)}>
          <div 
            id="caption" 
            ?hidden=${!this.controlPanel.settings.isCaptionVisible}
          >
            ${this.caption}
          </div>
          <div id="desc-footer">
            <div id="status_split">
              <div id="visiblestatus">${this.visibleStatus}</div>
              <div id="statusbar"
                aria-hidden="true"
                ?hidden=${!this.controlPanel.settings.isStatusBarVisible}
              >
                ${this._store.announcement.text}
              </div>
            </div>
            <button
              @click=${() => this._controlPanel.paraChart.showAriaLiveHistory()}
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
    'para-description-panel': DescriptionPanel;
  }
}