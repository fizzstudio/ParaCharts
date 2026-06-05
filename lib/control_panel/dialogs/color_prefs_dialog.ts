import { SettingControlContainer } from '../setting_control_container';
import { hexToOklch, oklchToHex, formatOklch, parseOklch } from '../../common/color_space';

import * as ui from '@fizz/ui-components';

import warningIcon from '../../assets/warning-icon.svg?raw';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

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
    .contrast-warnings {
      margin-top: 0.5rem;
      padding: 0.4rem 0.6rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }
    .contrast-warnings .warning-icon {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.15em;
      margin-right: 0.25em;
      color: orangered;
    }
    .contrast-warnings ul {
      margin: 0.25rem 0 0;
      padding-left: 1.2rem;
    }
    .color-swatch {
      display: inline-block;
      width: 0.9em;
      height: 0.9em;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.3);
      vertical-align: middle;
      margin-right: 0.25rem;
      flex-shrink: 0;
    }
    .series-label {
      display: inline-flex;
      align-items: center;
      gap: 0;
      vertical-align: -0.09em;
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

        ${this._renderContrastWarnings()}
      </fizz-dialog>
    `;
  }

  private _renderContrastWarnings() {
    const warnings = this._paraState.colorContrastWarnings;
    if (!warnings.length) return null;

    const ROLE_LABELS: Record<string, string> = {
      label:    'Text labels',
      axis:     'Axis lines',
      gridline: 'Gridlines',
      series:   'Series colors',
      visited:  'Visited marker',
    };
    const seen = new Set<string>();
    const unique = warnings.filter(w => {
      const key = `${w.role}:${w.fg}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return html`
      <div class="contrast-warnings" role="alert">
        <span class="warning-icon">${unsafeSVG(warningIcon)}</span> Low contrast against this background:
        <ul>
          ${unique.map(w => {
            const dataLabel = w.role === 'series'
              ? this._paraState.model?.series[w.seriesIndex!]?.getLabel()
              : undefined;
            return html`
            <li>
              ${w.role === 'series' ? html`
                <span class="series-label">
                  <span class="color-swatch" style="background-color:${w.fg}"></span>${w.seriesIndex! + 1}${w.seriesName ? html` (${w.seriesName})` : ''}${dataLabel ? html`, ${dataLabel}` : ''}
                </span>
              ` : ROLE_LABELS[w.role] ?? w.role}:
              WCAG ${w.result.wcag.ratio.toFixed(1)}:1
              ${w.result.wcag.AA ? '' : html`<em>(AA fail)</em>`}
            </li>
          `; })}
        </ul>
      </div>
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
