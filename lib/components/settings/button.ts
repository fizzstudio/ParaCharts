import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';

export interface ButtonSettingControlOptions {
  instanceID?: string;
}

@customElement('para-button-setting-control')
export class ButtonSettingControl extends SettingControl<'button'> {

  static styles = [
    //styles,
    css`
      button::first-letter {
        text-transform: uppercase;
      }
    `
  ];

  protected content() {
    return html`
      <label>
        <button
          type="button"
          @click=${(e: Event) => {
            this._value = !this._value;
            this._updateSetting(this.info.key, this._value, this.info.instanceID);
          }}
        >
          ${this.label}
        </button>
      </label>
    `;
  }

}
