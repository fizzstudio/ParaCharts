import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';

export interface CheckboxSettingControlOptions {
  instanceID?: string;
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

  protected updated(_changedProps: Map<string, unknown>) {
    if (!this.info) return;
    const id = `checkbox-${this.info.instanceID ?? ''}`;
    const input = this.renderRoot?.querySelector(`#${id}`) as HTMLInputElement | null;
    const desired = !!this.value;
    if (input && input.checked !== desired) {
      input.checked = desired;
    }
  }

  protected content() {
    const id = `checkbox-${this.info.instanceID ?? ''}`
    return html`
      <label>
        <input
          type="checkbox"
          id="${id}"
          .checked=${!!this._value}
          @change=${(e: Event) => {
            this._updateSetting(
              this.info.key, (e.target as HTMLInputElement).checked, this.info.instanceID);
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
