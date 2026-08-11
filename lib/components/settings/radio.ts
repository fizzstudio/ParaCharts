import { SettingControl } from '.';

import { ButtonDescriptor } from '@fizz/ui-components';

import { customElement } from 'lit/decorators.js';
import { html, css, nothing } from 'lit';

export interface RadioSettingControlOptions {
  buttons: {[key: string]: ButtonDescriptor};
  layout?: 'horiz' | 'compress' | 'vert';
  wrap?: boolean;
}

@customElement('para-radio-setting-control')
export class RadioSettingControl extends SettingControl<'radio'> {

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
    return html`
      <fizz-radiogroup
        .buttons=${opts!.buttons}
        selected=${this._value}
        layout=${opts!.layout ?? nothing}
        ?wrap=${opts!.wrap}
        @select=${(e: CustomEvent) => this._updateSetting(
          this.info.key, e.detail)}
      >
        <span slot="legend">${this.label}</span>
      </fizz-radiogroup>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-radio-setting-control': RadioSettingControl;
  }
}
