import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

const CONTRAST_LABELS: Record<string, string> = {
  system: 'System',
  lower:  'Lower',
  normal: 'Normal',
  higher: 'Higher',
};

type ContrastMode = 'system' | 'lower' | 'normal' | 'higher' | 'custom';
type ThemeMode = 'system' | 'light' | 'dark';

@customElement('para-low-vision-dialog')
export class LowVisionModeDialog extends SettingControlContainer {

  protected _dialogRef = createRef<ui.Dialog>();

  @property() btnText = 'Close';

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
    fieldset {
      border: none;
      padding: 0;
      margin: 0;
    }
    legend {
      padding: 0;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .radio-row,
    .contrast-top {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .contrast-custom {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .contrast-custom input[type="range"] {
      flex: 1;
    }
    .contrast-custom output {
      min-width: 2.5rem;
      text-align: right;
    }
    .font-scale-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .font-scale-row input[type="range"] {
      flex: 1;
    }
    .font-scale-row output {
      min-width: 2rem;
      text-align: right;
    }
    label.radio-label {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
    }
    label.check-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
    }
    .hint {
      font-size: 0.85em;
      color: #666;
      margin: 0 0 0.5rem;
    }
  `;

  render() {
    const cc  = this._paraState.config.color;
    const uic = this._paraState.config.ui;

    const themeDefault    = cc.lowVisionThemeDefault    as ThemeMode;
    const contrastDefault = cc.lowVisionContrastDefault as ContrastMode;
    const contrastLevel   = cc.lowVisionContrastLevel   as number;
    const colorPalette    = cc.lowVisionColorPalette    as boolean;
    const fontScale       = uic.lowVisionFontScale      as number;
    const vertGridlines   = uic.lowVisionIsVertGridlines   as boolean;
    const disableAnim     = uic.lowVisionDisableAnimations as boolean;
    const fullscreen      = uic.lowVisionIsFullscreen      as boolean;

    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Customize Low Vision Mode"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        <p class="hint">These are defaults applied when low-vision mode is enabled. Your explicit preferences always take priority.</p>

        <fieldset>
          <legend>Theme</legend>
          <div class="radio-row">
            ${(['system', 'light', 'dark'] as const).map(key => html`
              <label class="radio-label">
                <input type="radio" name="lv-theme"
                  .checked=${themeDefault === key}
                  @change=${() => this._setThemeDefault(key)}>
                ${key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            `)}
          </div>
        </fieldset>

        <fieldset>
          <legend>Contrast</legend>
          <div class="contrast-top">
            ${(['system', 'lower', 'normal', 'higher'] as const).map(key => html`
              <label class="radio-label">
                <input type="radio" name="lv-contrast"
                  .checked=${contrastDefault === key}
                  @change=${() => this._setContrastDefault(key)}>
                ${CONTRAST_LABELS[key]}
              </label>
            `)}
          </div>
          <div class="contrast-custom">
            <label class="radio-label">
              <input type="radio" name="lv-contrast"
                .checked=${contrastDefault === 'custom'}
                @change=${() => this._setContrastDefault('custom')}>
              Custom
            </label>
            <input type="range" min="0" max="1" step="0.1"
              .value=${String(contrastLevel)}
              ?disabled=${contrastDefault !== 'custom'}
              @input=${(e: Event) => this._setContrastLevel(+(e.target as HTMLInputElement).value)}>
            <output>${Math.round(contrastLevel * 100)}%</output>
          </div>
        </fieldset>

        <fieldset>
          <legend>Color palette</legend>
          <label class="check-label">
            <input type="checkbox"
              .checked=${colorPalette}
              @change=${(e: Event) => this._setColorPalette((e.target as HTMLInputElement).checked)}>
            Use high-contrast (low-vision) color palette
          </label>
        </fieldset>

        <fieldset>
          <legend>Font size</legend>
          <div class="font-scale-row">
            <input type="range" min="1" max="4" step="0.5"
              .value=${String(fontScale)}
              @input=${(e: Event) => this._setFontScale(+(e.target as HTMLInputElement).value)}>
            <output>${fontScale}×</output>
          </div>
        </fieldset>

        <fieldset>
          <legend>Layout &amp; behavior</legend>
          <label class="check-label">
            <input type="checkbox"
              .checked=${vertGridlines}
              @change=${(e: Event) => this._setVertGridlines((e.target as HTMLInputElement).checked)}>
            Show vertical gridlines
          </label>
          <label class="check-label">
            <input type="checkbox"
              .checked=${disableAnim}
              @change=${(e: Event) => this._setDisableAnimations((e.target as HTMLInputElement).checked)}>
            Disable animations
          </label>
          <label class="check-label">
            <input type="checkbox"
              .checked=${fullscreen}
              @change=${(e: Event) => this._setFullscreen((e.target as HTMLInputElement).checked)}>
            Enter fullscreen
          </label>
        </fieldset>
      </fizz-dialog>
    `;
  }

  private _setThemeDefault(mode: ThemeMode) {
    this._paraState.updateConfig(draft => { draft.color.lowVisionThemeDefault = mode; });
  }

  private _setContrastDefault(mode: ContrastMode) {
    this._paraState.updateConfig(draft => { draft.color.lowVisionContrastDefault = mode; });
  }

  private _setContrastLevel(level: number) {
    this._paraState.updateConfig(draft => { draft.color.lowVisionContrastLevel = level; });
  }

  private _setColorPalette(enabled: boolean) {
    this._paraState.updateConfig(draft => { draft.color.lowVisionColorPalette = enabled; });
  }

  private _setFontScale(scale: number) {
    this._paraState.updateConfig(draft => { draft.ui.lowVisionFontScale = scale; });
  }

  private _setVertGridlines(enabled: boolean) {
    this._paraState.updateConfig(draft => { draft.ui.lowVisionIsVertGridlines = enabled; });
  }

  private _setDisableAnimations(enabled: boolean) {
    this._paraState.updateConfig(draft => { draft.ui.lowVisionDisableAnimations = enabled; });
  }

  private _setFullscreen(enabled: boolean) {
    this._paraState.updateConfig(draft => { draft.ui.lowVisionIsFullscreen = enabled; });
  }

  async show() {
    await this._dialogRef.value!.show();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-low-vision-dialog': LowVisionModeDialog;
  }
}
