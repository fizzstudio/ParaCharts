/* ParaCharts: Accessible Charts
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { logging } from '../common/logger';
import { ParaComponent } from '../components';
import { AllSeriesData, ChartType } from '@fizz/paramanifest'
import { DeepReadonly, Settings, SettingsInput } from "../store/settings_types";
import { SettingsManager } from '../store';
import "../paraview";
import "../control_panel";
import { exhaustive } from "../common/utils";
import { type ParaView } from '../paraview';
import { type ParaControlPanel } from '../control_panel';
import { type AriaLive } from '../components';
import '../components/aria_live';
import { ParaStore } from '../store';
import { ParaLoader, type SourceKind } from '../loader/paraloader';
import { styles } from '../view/styles';

import { Manifest } from '@fizz/paramanifest';

import { html, css, PropertyValues, TemplateResult, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('para-chart')
export class ParaChart extends logging(ParaComponent) {

  @property({ type: Boolean }) headless = false;
  @property() accessor manifest = '';
  @property() manifestType: SourceKind = 'url';
  @property({type: Object}) accessor config: SettingsInput = {};
  @property() accessor forcecharttype: ChartType | undefined;

  protected _paraViewRef = createRef<ParaView>();  
  protected _controlPanelRef = createRef<ParaControlPanel>();
  protected _ariaLiveRegionRef = createRef<AriaLive>();
  protected _manifest?: Manifest;
  protected _loader = new ParaLoader();

  protected _inputSettings: SettingsInput = {};
  private data?: AllSeriesData;
  protected _suppleteSettingsWith?: DeepReadonly<Settings>;
  protected _readyPromise: Promise<void>;
  protected _loaderPromise: Promise<void> | null = null;

  constructor() {
    super();
    // also creates the state controller
    this.store = new ParaStore(this._inputSettings, this._suppleteSettingsWith);
    this._readyPromise = new Promise((resolve) => {
      this.addEventListener('paraviewready', async () => {
        resolve();
        // It's now safe to load a manifest
        if (this.manifest) {
          this._loaderPromise = this._runLoader(this.manifest, this.manifestType).then(() =>
            this.log('ParaCharts will now commence the raising of the roof and/or the dead'));
        }
      });
    });    
  }

  get paraView() {
    return this._paraViewRef.value!;
  }

  get controlPanel() {
    return this._controlPanelRef.value!;
  }

  get ready() {
    return this._readyPromise;
  }

  get loaded() {
    return this._loaderPromise;
  }

  get loader() {
    return this._loader;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('manifest') && this.manifest !== '') {
      this.log(`manifest changed: '${this.manifestType === 'content' ? '<content>' : this.manifest}`);
      this._loaderPromise = this._runLoader(this.manifest, this.manifestType);
      this.dispatchEvent(new CustomEvent('manifestchange', {bubbles: true, composed: true, cancelable: true}));
    }
    if (changedProperties.has('config')) {
      Object.entries(this.config).forEach(([path, value]) =>
        this._store.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
    }
  }

  static styles = [
    styles,
    css`
      :host {
        --summary-marker-size: 1.1rem;
      }
      figure {
        display: inline-block;
        margin: 0;
      }
    `
  ];

  protected async _runLoader(manifestInput: string, manifestType: SourceKind): Promise<void> {
    this.log(`loading manifest: '${manifestType === 'content' ? '<content>' : manifestInput}'`);
    this._store.dataState = 'pending';
    const loadresult = await this._loader.load(
      this.manifestType, manifestInput, 
      this.forcecharttype);
    this.log('loaded manifest')
    if (loadresult.result === 'success') {
      this._manifest = loadresult.manifest;
      this._store.setManifest(loadresult.manifest, loadresult.data);
      this._store.dataState = 'complete';
    } else {
      console.error(loadresult.error);
      this._store.dataState = 'error';
    }
  }

  clearAriaLive() {
    this._ariaLiveRegionRef.value!.clear();
  }

  showAriaLiveHistory() {
    this._ariaLiveRegionRef.value!.showHistoryDialog();
  }

  render(): TemplateResult {
    this.log('render');
    // We can't truly hide the para-chart, or labels don't get a proper size,
    // so we fall back on sr-only
    const classes = {
      'sr-only': this.headless
    };
    return html`
      <figure
        class=${classMap(classes)}
        aria-hidden=${this.headless ? 'true' : 'false'}
      >
        <para-view
          ${ref(this._paraViewRef)}
          .paraChart=${this}
          .store=${this._store}
          colormode=${this._store?.settings.color.colorVisionMode ?? nothing}
          ?disableFocus=${this.headless}
        ></para-view>
        ${!this.headless ? html`
          <para-control-panel
            ${ref(this._controlPanelRef)}
            .paraChart=${this}
            .store=${this._store}
          ></para-control-panel>` : ''
        }
        <para-aria-live-region
          ${ref(this._ariaLiveRegionRef)}
          .store=${this._store}
          .announcement=${this._store.announcement}
        ></para-aria-live-region>
      </figure>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
