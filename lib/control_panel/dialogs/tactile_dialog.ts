
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-tactile-settings-dialog')
export class TactileSettingsDialog extends SettingControlContainer {

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
    this._paraState.settingControls.insert('chart.isTactileEnabled');
    this._paraState.settingControls.insert('chart.tactileBrailleGrade');
    this._paraState.settingControls.insert('chart.tactileLabelMode');
    this._paraState.settingControls.insert('chart.pageSize');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Tactile Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.tactile.dialog')}
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
    'para-tactile-settings-dialog': TactileSettingsDialog;
  }

}