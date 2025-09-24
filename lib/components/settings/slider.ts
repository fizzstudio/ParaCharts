import { SettingControl } from '.';

import { Slider } from '@fizz/ui-components';

import { customElement } from 'lit/decorators.js';
import { html, nothing } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { strToId } from '@fizz/paramanifest';

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
}

@customElement('para-slider-setting-control')
export class SliderSettingControl extends SettingControl<'slider'> {

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
          this.info.key, e.detail)}
      ></fizz-slider>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-slider-setting-control': SliderSettingControl;
  }
}