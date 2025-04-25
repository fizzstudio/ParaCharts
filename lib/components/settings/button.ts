import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html } from 'lit';

export interface ButtonSettingControlOptions {

}

@customElement('para-button-setting-control')
export class ButtonSettingControl extends SettingControl<'button'> {

  protected content() {
    return html`
      <label>
        <button
          type="button"
          @click=${(e: Event) => {
            this._value = !this._value;
            this._updateSetting(this.info.key, this._value);
          }}
        >
          ${this.label}
        </button> 
      </label>
    `;
  }

}
