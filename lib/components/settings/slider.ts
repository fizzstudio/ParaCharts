import { SettingControl } from '.';

import { Slider } from '@fizz/ui-components';

import { customElement } from 'lit/decorators.js';
import { html, nothing, css } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { strToId } from '@fizz/chartsignal-internal';

export interface SliderSettingControlOptions {
  min?: number;
  max?: number;
  step?: number;
  lowBound?: number;
  highBound?: number;
  percent?: boolean;
  showValue?: boolean;
  compact?: boolean;
  width?: string;
  instanceID?: string;
}

@customElement('para-slider-setting-control')
export class SliderSettingControl extends SettingControl<'slider'> {

  static styles = [
    //styles,
    css`
      fizz-slider {
        --first-letter-text-transform: capitalize;
      }
    `
  ];

  protected content() {
    const opts = this.info.options;
    const sliderRef = createRef<Slider>();
    const styles = opts?.width
      ? {
        '--width': opts.width
      }
      : {};
    return html`
      <fizz-slider
        ${ref(sliderRef)}
        style=${styleMap(styles)}
        label=${this.label}
        key=${strToId(this.info.key)}
        value=${this._value}
        min=${opts?.min ?? nothing}
        max=${opts?.max ?? nothing}
        step=${opts?.step ?? nothing}
        lowbound=${opts?.lowBound ?? nothing}
        highbound=${opts?.highBound ?? nothing}
        ?percent=${opts?.percent}
        ?showvalue=${opts?.showValue}
        ?compact=${opts?.compact}
        @update=${(e: CustomEvent) => this._updateSetting(
          this.info.key, e.detail, this.info.instanceId)}
      ></fizz-slider>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-slider-setting-control': SliderSettingControl;
  }
}
