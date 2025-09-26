
//import { styles } from '../../styles';
import { Summarizer, PlaneChartSummarizer, PastryChartSummarizer } from '@fizz/parasummary';
import { ControlPanelTabPanel } from './tab_panel';
import { type AriaLive } from '../../components';
import '../../components/aria_live';

import { html, css, PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { type Unsubscribe } from '@lit-app/state';
import { PlaneModel } from '@fizz/paramodel';

@customElement('para-description-panel')
export class DescriptionPanel extends ControlPanelTabPanel {

  @property() caption = '';
  @property() visibleStatus = '';

  private _summarizer?: Summarizer;
  protected _storeChangeUnsub!: Unsubscribe;
  //protected _ariaLiveRegionRef = createRef<AriaLive>();
  protected _captionBoxWrapperRef = createRef<HTMLElement>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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

  // get ariaLiveRegion() {
  //   return this._ariaLiveRegionRef.value!;
  // }

  connectedCallback(): void {
    super.connectedCallback();
    this._storeChangeUnsub = this._store.subscribe(this.setCaption.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._storeChangeUnsub();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    if (this._controlPanel.settings.isControlPanelDefaultOpen || !this._controlPanel.settings.caption.isCaptionExternalWhenControlPanelClosed) {
      this.internalizeCaptionBox();
    } else {
      this._controlPanel.externalizeCaptionBox();
    }
  }


  // get speechRate() {
  //   return this._controller.voice.rate;
  // }

  // set speechRate(rate: number) {
  //   this._controller.voice.rate = rate;
  // }

  clearStatusBar() {
    this._controlPanel.paraChart.clearAriaLive();
    // this.clearAriaLive();
  }

  // clearAriaLive() {
  //   this._ariaLiveRegionRef.value!.clear();
  // }

  // protected _showAriaLiveHistory() {
  //   this._ariaLiveRegionRef.value!.showHistoryDialog();
  // }

  private async setCaption(): Promise<void> {
    if (this.controlPanel.dataState === 'complete') {
      if (!this._summarizer) {
        if (this.store.model!.type === 'pie' || this.store.model!.type === 'donut') {
          this._summarizer = new PastryChartSummarizer(this.store.model!);
        } else {
          this._summarizer = new PlaneChartSummarizer(this.store.model as PlaneModel);
        }
      }
      this.caption = (await this._summarizer.getChartSummary()).text;
    }
  }

  internalizeCaptionBox() {
    this.renderRoot.querySelector('#wrapper')!.append(this.controlPanel.paraChart.captionBox);
  }

  render() {
    const styles = {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    };
    return html`
      <div id="wrapper"></div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-description-panel': DescriptionPanel;
  }
}