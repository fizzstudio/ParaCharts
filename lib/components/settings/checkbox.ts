import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html } from 'lit';

export interface CheckboxSettingControlOptions {

}

@customElement('para-checkbox-setting-control')
export class CheckboxSettingControl extends SettingControl<'checkbox'> {

  protected content() {
    return html`
      <label>
        <input 
          type="checkbox"
          .checked=${!!this._value}
          @change=${(e: Event) => {
            this._updateSetting(
              this.info.key, (e.target as HTMLInputElement).checked)
          }}
        >
          ${this.label} 
      </label>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-checkbox-setting-control': CheckboxSettingControl;
  }
}