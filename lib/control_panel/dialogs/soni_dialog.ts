
import { SettingControlContainer } from '../setting_control_container';
import { HERTZ } from '../../common/constants';
import { SONI_RIFF_SPEEDS } from '../../chart_types';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-soni-settings-dialog')
export class SoniSettingsDialog extends SettingControlContainer {

  protected _dialogRef = createRef<ui.Dialog>();

  /**
   * Close button text.
   */
  @property() btnText = 'Okay';

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.insert('sonification.isNotificationEnabled');
    this._paraState.settingControls.insert('sonification.hertzLower');
    this._paraState.settingControls.insert('sonification.hertzUpper');
    this._paraState.settingControls.insert('sonification.isRiffEnabled');
    this._paraState.settingControls.insert('sonification.isArpeggiateChords');
    this._paraState.settingControls.insert('sonification.riffSpeedIndex');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Sonification Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.audio.sonification.dialog')}
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   */
  async show() {
    await this._dialogRef.value!.show();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-soni-settings-dialog': SoniSettingsDialog;
  }

}