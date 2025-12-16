
import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, nothing } from 'lit';

export interface TextfieldSettingControlOptions {
  inputType: 'number' | 'text';
  min?: number;
  max?: number;
  size?: number;
}

@customElement('para-textfield-setting-control')
export class TextfieldSettingControl extends SettingControl<'textfield'> {

  protected content() {
    const opts = this.info.options;
    return html`
      <label>
        ${this.label}
        <input 
          type=${opts?.inputType ?? 'text'}
          .value=${this._value as string} 
          min=${opts?.inputType === 'number' ? opts.min : nothing}
          max=${opts?.inputType === 'number' ? opts.max : nothing}
          size=${opts?.size ?? '8'}
          style="max-width: 60px;"
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            const value = opts?.inputType === 'number' ? parseFloat(input.value) : input.value;
            if (this._validateInput(value, input)) {
              this._value = value;
              this._updateSetting(this.info.key, value);
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