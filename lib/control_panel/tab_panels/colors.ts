//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';

import { 
  html, css, nothing
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateController } from '@lit-app/state';

import colorVisionIconNormal from '../../assets/color-vision-normal-icon.svg';
import colorVisionIconDeutan from '../../assets/color-vision-deutan-icon.svg';
import colorVisionIconProtan from '../../assets/color-vision-protan-icon.svg';
import colorVisionIconTritan from '../../assets/color-vision-tritan-icon.svg';
import colorVisionIconGray from '../../assets/color-vision-grayscale-icon.svg';

@customElement('para-colors-panel')
export class ColorsPanel extends ControlPanelTabPanel {
  protected _state!: StateController;
  

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #setting-colorcontrastlevel {
        --width: 6rem;
      }
      .control-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5em;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    const colorPalettes = this._store.colors.palettes
      .filter(palette => !palette.cvd)
      .map(palette => palette.key);

    this._store.settingControls.add({
      type: 'checkbox',
      key: 'color.isDarkModeEnabled',
      label: 'Dark mode',
      parentView: 'controlPanel.tabs.color.colorContrast',
    });
    this._store.settingControls.add({
      type: 'slider',
      key: 'color.contrastLevel',
      label: 'Contrast',
      options: {
        min: 0,
        max: 1,
        step: 0.1,
        percent: true,
        compact: true,
      },
      parentView: 'controlPanel.tabs.color.colorContrast'
    });
    this._store.settingControls.add({
      type: 'radio',
      key: 'color.colorVisionMode',
      label: 'Chart colors for CVD (color blindness)',
      options: {
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
        },
      },
      parentView: 'controlPanel.tabs.color.colorVision'
    });
    this._store.settingControls.add({
      type: 'dropdown',
      key: 'color.colorPalette',
      label: 'Color palette:',
      options: {options: colorPalettes},
      parentView: 'controlPanel.tabs.color.colorPalette'
    });  
    this._state = new StateController(this, this._store.settingControls);
  }

  render() {
    return html`   
      <div class="tab-content">
        <div class="control-column">
          ${this._store.settingControls.getContent('controlPanel.tabs.color.colorContrast')}

          ${this.controlPanel.settings.isColorPaletteControlVisible
            ? this._store.settingControls.getContent('controlPanel.tabs.color.colorPalette')
            : nothing
          }
        </div>
        ${this.controlPanel.settings.isCVDControlVisible
          ? html`
            <div>
              ${this._store.settingControls.getContent('controlPanel.tabs.color.colorVision')}
            </div>
          `
          : nothing
        }
      </div>  
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-colors-panel': ColorsPanel;
  }
}