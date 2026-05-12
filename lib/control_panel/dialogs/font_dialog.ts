
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-font-settings-dialog')
export class FontSettingsDialog extends SettingControlContainer {

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
    this._paraState.settingControls.insert('chart.fontFamily');
    this._paraState.settingControls.insert('chart.fontScale');
    this._paraState.settingControls.insert('chart.isUseBraille');
    this._paraState.settingControls.insert('chart.isUseBrailleAndPrint');
    this._paraState.settingControls.insert('chart.pageSize');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Font Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.font.dialog')}
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
    'para-font-settings-dialog': FontSettingsDialog;
  }

}