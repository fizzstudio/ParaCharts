
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
// FONT UNIFICATION (Plan A): defaults for the Reset button
import { defaultConfig } from '../../config/config_defaults';



/**
 * @public
 */
@customElement('para-font-settings-dialog')
export class FontSettingsDialog extends SettingControlContainer {

  protected _dialogRef = createRef<ui.Dialog>();

  /**
   * Close button text.
   */
  @property() btnText = 'OK';

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
    /* FONT UNIFICATION (Plan A): Reset button, matching the Caption Settings dialog */
    .reset {
      align-self: flex-start;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.insert('chart.fontFamily');
    this._paraState.settingControls.insert('chart.fontScale');
  }

  render() {
    // FONT UNIFICATION (Plan A): title localized (was the literal
    // "Font Settings"), and a Reset button added. btnText stays unlocalized ('OK'), as in
    // the other dialogs; localizing it is a separate, cross-dialog change.
    const l10n = this._globalState.l10n;
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title=${l10n.localize('cpanel.tabs.chart.font_dialog.title')}
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.font.dialog')}
        <button class="reset" @click=${() => this._resetToDefaults()}>
          ${l10n.localize('cpanel.tabs.chart.font_dialog.reset')}
        </button>
      </fizz-dialog>
    `;
  }

  // FONT UNIFICATION (Plan A): back to the defaults. At the default family,
  // --chart-font-family hands control back to page CSS
  // (--paracharts-chart-font-family; see parachart.ts).
  protected _resetToDefaults() {
    this._paraState.updateConfig(draft => {
      draft.chart.fontFamily = defaultConfig.chart.fontFamily;
      draft.chart.fontScale = defaultConfig.chart.fontScale;
    });
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