
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


/**
 * @public
 */
@customElement('para-sparkbraille-settings-dialog')
export class SparkBrailleSettingsDialog extends SettingControlContainer {

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
    this._paraState.settingControls.insert('controlPanel.isSparkBrailleCompact');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="SparkBraille Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.sparkbraille.dialog')}
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
    'para-sparkbraille-settings-dialog': SparkBrailleSettingsDialog;
  }

}