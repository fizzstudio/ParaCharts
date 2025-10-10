
//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';
import { type AriaLive } from '../../components';
import '../../components/aria_live';

import { html, css, PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { PlaneModel } from '@fizz/paramodel';

@customElement('para-description-panel')
export class DescriptionPanel extends ControlPanelTabPanel {

  @property() caption = '';
  @property() visibleStatus = '';

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