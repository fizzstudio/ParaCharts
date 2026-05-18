import { SettingControlContainer } from '../setting_control_container';
import { hexToOklch, oklchToHex, formatOklch, parseOklch } from '../../common/color_space';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

const THEME_VIEW = 'controlPanel.tabs.color.colorPrefs.dialog';

const CONTRAST_LABELS: Record<string, string> = {
  system: 'System',
  lower:  'Lower',
  normal: 'Normal',
  higher: 'Higher',
};

type ContrastMode = 'system' | 'lower' | 'normal' | 'higher' | 'custom';

@customElement('para-color-prefs-dialog')
export class ColorPrefsDialog extends SettingControlContainer {

  protected _dialogRef = createRef<ui.Dialog>();

  @property() btnText = 'Okay';

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
      margin-bottom: 0.5rem;
    }
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
    label.contrast-radio {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
    }
    label.bg-color-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.insert('color.themeMode', {
      buttons: {
        system: { label: 'System', title: 'Follow the system color scheme' },
        light:  { label: 'Light',  title: 'Always use the light theme' },
        dark:   { label: 'Dark',   title: 'Always use the dark theme' },
      }
    });
  }

  render() {
    const { contrastMode, contrastLevel } = this._paraState.config.color;
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Color Preference Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent(THEME_VIEW)}

        <fieldset>
          <legend>Contrast preference</legend>
          <div class="contrast-top">
            ${(['system', 'lower', 'normal', 'higher'] as const).map(key => html`
              <label class="contrast-radio">
                <input type="radio" name="color-contrast-mode"
                  .checked=${contrastMode === key}
                  @change=${() => this._setContrastMode(key)}>
                ${CONTRAST_LABELS[key]}
              </label>
            `)}
          </div>
          <div class="contrast-custom">
            <label class="contrast-radio">
              <input type="radio" name="color-contrast-mode"
                .checked=${contrastMode === 'custom'}
                @change=${() => this._setContrastMode('custom')}>
              Custom
            </label>
            <input type="range" min="0" max="1" step="0.1"
              .value=${String(contrastLevel)}
              ?disabled=${contrastMode !== 'custom'}
              @input=${(e: Event) => this._setContrastLevel(+(e.target as HTMLInputElement).value)}>
            <output>${Math.round(contrastLevel * 100)}%</output>
          </div>
        </fieldset>

        <label class="bg-color-label">
          Background color
          <input type="color"
            .value=${this._bgHex()}
            @input=${(e: Event) => this._setBackgroundColor((e.target as HTMLInputElement).value)}>
        </label>
      </fizz-dialog>
    `;
  }

  private _bgHex(): string {
    const oklch = parseOklch(this._paraState.config.color.backgroundColor);
    return oklch ? oklchToHex(oklch) : '#ffffff';
  }

  private _setBackgroundColor(hex: string) {
    const oklch = formatOklch(hexToOklch(hex));
    this._paraState.updateConfig(draft => {
      if (this._paraState.config.color.isDarkModeEnabled) {
        draft.color.backgroundColorDark = oklch;
      } else {
        draft.color.backgroundColorLight = oklch;
      }
    });
  }

  private _setContrastMode(mode: ContrastMode) {
    this._paraState.updateConfig(draft => { draft.color.contrastMode = mode; });
  }

  private _setContrastLevel(level: number) {
    this._paraState.updateConfig(draft => { draft.color.contrastLevel = level; });
  }

  async show() {
    await this._dialogRef.value!.show();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-color-prefs-dialog': ColorPrefsDialog;
  }
}
