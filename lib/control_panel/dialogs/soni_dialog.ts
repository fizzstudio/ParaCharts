
import { SettingControlContainer } from '../setting_control_container';
import { logging } from '../../common/logger';
import { HERTZ } from '../../common/constants';

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
  `;

  connectedCallback() {
    super.connectedCallback();
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isNotificationEnabled',
      label: 'Notification sounds',
      parentView: 'controlPanel.tabs.audio.sonification.dialog',
    });
    this._store.settingControls.add({
      type: 'slider',
      key: 'sonification.hertzLower',
      label: 'Lower hertz',
      options: {
        min: 0,
        max: HERTZ.length - 1,
        highBound: this._store.settings.sonification.hertzUpper - 1,
        step: 1
      },
      parentView: 'controlPanel.tabs.audio.sonification.dialog'
    });
    this._store.settingControls.add({
      type: 'slider',
      key: 'sonification.hertzUpper',
      label: 'Upper hertz',
      options: {
        min: 0,
        max: HERTZ.length - 1,
        lowBound: this._store.settings.sonification.hertzLower + 1,
        step: 1,
      },
      parentView: 'controlPanel.tabs.audio.sonification.dialog'
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isChordModeEnabled',
      label: 'Chord mode',
      parentView: 'controlPanel.tabs.audio.sonification.dialog',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isRiffEnabled',
      label: 'Series riff enabled',
      parentView: 'controlPanel.tabs.audio.sonification.dialog',
    });
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)} 
        title="Sonification Settings" 
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._store.settingControls.getContent('controlPanel.tabs.audio.sonification.dialog')}
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   */
  async show() {
    await this._dialogRef.value!.show(() => this._dialogRef.value!.button('cancel')!.focus());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-soni-settings-dialog': SoniSettingsDialog;
  }

}