import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';

export interface ColorPickerSettingControlOptions {
  instanceID?: string;
}

@customElement('para-color-picker-setting-control')
export class ColorPickerSettingControl extends SettingControl<'colorPicker'> {

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
          type="color"
          id="color-${this.info.instanceID ?? ''}"
          .value=${this.value == '' ? '#FF0000' : this.value}
          @change=${(e: Event) => {
            this._updateSetting(
              this.info.key, (e.target as HTMLInputElement).value, this.info.instanceID);
          }}
        >
        <span>${this.label}</span>
      </label>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-color-picker-setting-control': ColorPickerSettingControl;
  }
}
