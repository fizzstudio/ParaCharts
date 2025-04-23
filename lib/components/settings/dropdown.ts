import { SettingControl } from '.';

import { customElement } from 'lit/decorators.js';
import { html } from 'lit';

import { Dropdown } from '@fizz/ui-components';
import '@fizz/ui-components';

export interface DropdownSettingControlOptions {
  /** Visible dropdown options; used as setting values if `values` not given. */
  options: string[];
  /** Optional setting values. */
  values?: string[];
}

@customElement('para-dropdown-setting-control')
export class DropdownSettingControl extends SettingControl<'dropdown'> {

  private values!: string[];

  connectedCallback() {
    super.connectedCallback();
    this.values = this.info.options!.values ?? this.info.options!.options;
  }

  protected content() {
    return html`
      <fizz-dropdown 
        label=${this.label} 
        .options=${this.info.options!.options}
        selected=${this.values.indexOf(this._value as string)}
        @select=${(e: CustomEvent) => {
          const idx = (e.target as Dropdown).selectedIndex;
          this._updateSetting(this.info.key, this.values[idx]);
        }}
      ></fizz-dropdown>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-dropdown-setting-control': DropdownSettingControl;
  }
}