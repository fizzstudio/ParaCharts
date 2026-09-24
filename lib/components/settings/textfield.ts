
import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, css, nothing } from 'lit';

export interface TextfieldSettingControlOptions {
  inputType: 'number' | 'text' | 'color';
  min?: number;
  max?: number;
  size?: number;
  instanceID?: string;
}

@customElement('para-textfield-setting-control')
export class TextfieldSettingControl extends SettingControl<'textfield'> {

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
    const opts = this.info.options;
    const isNumber = opts?.inputType === 'number';
    const isColor = opts?.inputType === 'color';
    return html`
      <label>
        <span>${this.label}</span>
        <input
          type=${opts?.inputType ?? 'text'}
          .value=${this._value as string}
          min=${isNumber ? opts!.min : nothing}
          max=${isNumber ? opts!.max : nothing}
          size=${isColor ? nothing : (opts?.size ?? '8')}
          style=${isColor ? nothing : 'max-width: 60px;'}
          @input=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            const value = isNumber ? parseFloat(input.value) : input.value;
            if (this._validateInput(value, input)) {
              this._value = value;
              this._updateSetting(this.info.key, value, this.info.instanceID);
            } else {
              input.value = this._value!.toString();
            }
          }}
        />
      </label>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-textfield-setting-control': TextfieldSettingControl;
  }
}
