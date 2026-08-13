import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';

export interface CheckboxSettingControlOptions {

}

@customElement('para-checkbox-setting-control')
export class CheckboxSettingControl extends SettingControl<'checkbox'> {

  static styles = [
    //styles,
    css`
      span {
        display: inline-block;
      }
      /* ::first-letter only applies to block containers */
      span::first-letter {
        text-transform: uppercase;
      }
    `
  ];

  protected content() {
    return html`
      <label>
        <input
          type="checkbox"
          id="checkbox"
          .checked=${!!this._value}
          @change=${(e: Event) => {
            this._updateSetting(
              this.info.key, (e.target as HTMLInputElement).checked)
          }}
        >
        <span>${this.label}</span>
      </label>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-checkbox-setting-control': CheckboxSettingControl;
  }
}
