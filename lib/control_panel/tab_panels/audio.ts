//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';
import { SoniSettingsDialog } from '../dialogs';
import '../dialogs';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

@customElement('para-audio-panel')
export class AudioPanel extends ControlPanelTabPanel {

  protected _soniDialogRef = createRef<SoniSettingsDialog>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #voicing,
      #sonification,
      #narrative,
      .control-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        align-items: center;
        gap: 0.5em;
      }
      button::first-letter {
        text-transform: capitalize;
      }

    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.insert('ui.isVoicingEnabled');
    this._paraState.settingControls.insert('ui.speechRate');
    this._paraState.settingControls.insert('ui.isAnnouncementEnabled');
    this._paraState.settingControls.insert('sonification.isSonificationEnabled');
    this._paraState.settingControls.insert('ui.isTourGuideEnabled');
    this._paraState.settingControls.insert('ui.isTourGuidePaused');
  }

  render() {
    return html`
      <div class="tab-content">
        <section id="voicing">
          ${this._paraState.settingControls.getContent('controlPanel.tabs.audio.voicing')}
        </section>
        <section id="narrative">
          ${this._paraState.settingControls.getContent('controlPanel.tabs.audio.narrative')}
        </section>
        <section id="sonification">
          ${this._paraState.settingControls.getContent('controlPanel.tabs.audio.sonification')}
          <button
            @click=${() => this._soniDialogRef.value?.show()}
          >
            ${this._globalState.l10n.localize('cpanel.tabs.audio.sonification_controls')}
          </button>
        </section>
      </div>
      <para-soni-settings-dialog
        ${ref(this._soniDialogRef)}
        id="sonification-settings-dialog"
        .globalState=${this._globalState}
      ></para-soni-settings-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-audio-panel': AudioPanel;
  }
}