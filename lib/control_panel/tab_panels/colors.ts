import { ControlPanelTabPanel } from './tab_panel';
import { ColorPrefsDialog } from '../dialogs';
import '../dialogs';

import {
  html, css, nothing
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

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #setting-colorcontrastlevel {
        --width: 6rem;
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

  render() {
    return html`
      <div class="tab-content">
        <div class="control-column">
          ${this._paraState.settingControls.getContent('controlPanel.tabs.color.colorContrast')}
          ${this._paraState.settingControls.getContent('controlPanel.tabs.color.colorContrastSlider')}

          <button @click=${() => this._colorPrefsDialogRef.value?.show()}>
            System color preferences
          </button>

          ${this.controlPanel.config.isColorPaletteControlVisible
            ? this._paraState.settingControls.getContent('controlPanel.tabs.color.colorPalette')
            : nothing
          }
        </div>
        ${this.controlPanel.config.isCVDControlVisible
          ? html`
            <div>
              ${this._paraState.settingControls.getContent('controlPanel.tabs.color.colorVision')}
            </div>
          `
          : nothing
        }
      </div>

      <para-color-prefs-dialog
        ${ref(this._colorPrefsDialogRef)}
        .globalState=${this._globalState}
      ></para-color-prefs-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-colors-panel': ColorsPanel;
  }
}
