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
      .control-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5em;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'ui.isVoicingEnabled',
      label: 'Self-voicing mode',
      parentView: 'controlPanel.tabs.audio.voicing',
    });
    this._store.settingControls.add({
      type: 'slider',
      key: 'ui.speechRate',
      label: 'Speech rate',
      options: {
        min: 0.5,
        max: 2,
        step: 0.1,
        percent: true
      },
      parentView: 'controlPanel.tabs.audio.voicing'
    }); 
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'ui.isAnnouncementEnabled',
      label: 'Announce to screen reader',
      parentView: 'controlPanel.tabs.audio.voicing',
    }); 

    this._store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isSoniEnabled',
      label: 'Sonification mode',
      parentView: 'controlPanel.tabs.audio.sonification',
    });
  }

  render() {
    return html`   
      <div class="tab-content">
        <section id="voicing">
          ${this._store.settingControls.getContent('controlPanel.tabs.audio.voicing')}
        </section>
        <section id="sonification">
          ${this._store.settingControls.getContent('controlPanel.tabs.audio.sonification')}
          <button
            @click=${() => this._soniDialogRef.value?.show()}
          >
            Sonification Controls
          </button>
        </section>
      </div>
      <para-soni-settings-dialog
        ${ref(this._soniDialogRef)}
        id="sonification-settings-dialog"
        .store=${this._store}
      ></para-soni-settings-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-audio-panel': AudioPanel;
  }
}