import { ControlPanelTabPanel } from './tab_panel';
import { ColorPrefsDialog, LowVisionModeDialog } from '../dialogs';
import '../dialogs';
import { type CardDescriptor } from '../../components/settings/card_selector';

const SHORT_LABELS: Record<string, string> = {
  'low-vision': 'Low-Vis',
};

function _capitalize(key: string): string {
  return SHORT_LABELS[key] ?? key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

import {
  html, css, svg, nothing
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateController } from '@lit-app/state';
import { createRef, ref } from 'lit/directives/ref.js';

import colorVisionIconNormal from '../../assets/color-vision-normal-icon.svg';
import colorVisionIconDeutan from '../../assets/color-vision-deutan-icon.svg';
import colorVisionIconProtan from '../../assets/color-vision-protan-icon.svg';
import colorVisionIconTritan from '../../assets/color-vision-tritan-icon.svg';
import colorVisionIconGray from '../../assets/color-vision-grayscale-icon.svg';

@customElement('para-colors-panel')
export class ColorsPanel extends ControlPanelTabPanel {
  protected _state!: StateController;
  protected _colorPrefsDialogRef = createRef<ColorPrefsDialog>();
  protected _lowVisionDialogRef = createRef<LowVisionModeDialog>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #setting-colorcontrastlevel {
        --width: 6rem;
      }

      para-card-selector {
        margin-top: 0.6rem;
      }

      .control-column {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        align-items: flex-start;
      }

      .section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        align-items: flex-start;
      }

      .section + .section {
        margin-top: 0.5rem;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    const nonCvdPalettes = this._paraState.colors.palettes.filter(palette => !palette.cvd);
    const colorPaletteLabels = [...nonCvdPalettes.map(p => p.title), 'Custom'];
    const colorPaletteKeys = [...nonCvdPalettes.map(p => p.key), 'custom'];

    this._paraState.settingControls.insert('color.isDarkModeEnabled');
    this._paraState.settingControls.insert('color.contrastLevel');
    this._paraState.settingControls.insert('ui.isLowVisionModeEnabled');
    this._paraState.settingControls.insert('color.colorVisionMode', {
      buttons: {
        normal: {
          label: 'Normal',
          title: 'Trichromat color vision',
          icon: colorVisionIconNormal
        },
        deutan: {
          label: 'Deutan',
          title: 'Green-red color blindness',
          icon: colorVisionIconDeutan
        },
        protan: {
          label: 'Protan',
          title: 'Red-green color blindness',
          icon: colorVisionIconProtan
        },
        tritan: {
          label: 'Tritan',
          title: 'Blue-yellow color blindness',
          icon: colorVisionIconTritan
        },
        grayscale: {
          label: 'Gray',
          title: 'Grayscale printing or achromotopsia',
          icon: colorVisionIconGray
        }
      }
    });
    this._paraState.settingControls.insert('color.colorPalette', {options: colorPaletteLabels, values: colorPaletteKeys});
    this._state = new StateController(this, this._paraState.settingControls);
  }

  private get _palettesAsButtons(): { [key: string]: CardDescriptor } {
    const buttons: { [key: string]: CardDescriptor } = {};
    for (const palette of this._paraState.colors.palettes.filter(p => !p.cvd)) {
      const c4 = palette.colors.slice(0, 4).map(c => c.value);
      if (palette.isPattern) {
        const p = palette.patterns!;
        buttons[palette.key] = {
          label: _capitalize(palette.key),
          title: palette.title,
          svgSwatches: svg`
            <svg viewBox="0 0 62 14" xmlns="http://www.w3.org/2000/svg">
              <defs>
                ${p[0].value}${p[1].value}${p[2].value}${p[3].value}
              </defs>
              <rect x="0"  y="0" width="14" height="14" rx="2" fill="url(#Pattern0)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
              <rect x="16" y="0" width="14" height="14" rx="2" fill="url(#Pattern1)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
              <rect x="32" y="0" width="14" height="14" rx="2" fill="url(#Pattern2)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
              <rect x="48" y="0" width="14" height="14" rx="2" fill="url(#Pattern3)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
            </svg>
          `,
        };
        continue;
      }
      buttons[palette.key] = {
        label: _capitalize(palette.key),
        title: palette.title,
        swatches: c4,
      };
    }
    const cc = this._paraState.config.color;
    const customSwatches = (
      [cc.custom1, cc.custom2, cc.custom3, cc.custom4] as string[]
    ).filter(Boolean);
    const PLACEHOLDER = '#ccc';
    buttons['custom'] = {
      label: 'Custom',
      title: 'Custom palette',
      swatches: customSwatches.length ? customSwatches : [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    };
    return buttons;
  }

  private _onPaletteSelect(e: CustomEvent<string>) {
    this._paraState.updateConfig(draft => { draft.color.colorPalette = e.detail; });
  }

  showColorPrefsDialog() {
    return this._colorPrefsDialogRef.value?.show();
  }

  showLowVisionDialog() {
    return this._lowVisionDialogRef.value?.show();
  }

  render() {
    return html`
      <div class="tab-content">
        <div class="control-column">
          <div class="section">
            ${this._paraState.settingControls.getContent('controlPanel.tabs.color.colorContrast')}
            ${this._paraState.settingControls.getContent('controlPanel.tabs.color.colorContrastSlider')}
          </div>

          <div class="section">
            <button @click=${() => this._colorPrefsDialogRef.value?.show()}>
              Color preferences
            </button>
          </div>

          <div class="section">
            ${this._paraState.settingControls.getContent('controlPanel.tabs.color.lowVision')}
            <button @click=${() => this._lowVisionDialogRef.value?.show()}>
              Customize low vision mode
            </button>
          </div>
        </div>
        <div>
          ${this.controlPanel.config.isCVDControlVisible
            ? this._paraState.settingControls.getContent('controlPanel.tabs.color.colorVision')
            : nothing
          }
          ${this.controlPanel.config.isColorPaletteControlVisible
            ? html`
              <para-card-selector
                .buttons=${this._palettesAsButtons}
                selected=${this._paraState.config.color.colorPalette}
                ?wrap=${true}
                @select=${this._onPaletteSelect}
              >
                <span slot="legend">Color palette</span>
              </para-card-selector>
            `
            : nothing
          }
        </div>
      </div>

      <para-color-prefs-dialog
        ${ref(this._colorPrefsDialogRef)}
        .globalState=${this._globalState}
      ></para-color-prefs-dialog>

      <para-low-vision-dialog
        ${ref(this._lowVisionDialogRef)}
        .globalState=${this._globalState}
      ></para-low-vision-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-colors-panel': ColorsPanel;
  }
}
