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
import { ParaController } from '../paracontroller';
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

import { html, css, PropertyValues, TemplateResult, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('para-chart')
export class ParaChart extends logging(ParaComponent) {

  @property({ type: Boolean }) headless = false;

  protected _controller: ParaController;
  protected _paraViewRef = createRef<ParaView>();  
  protected _controlPanelRef = createRef<ParaControlPanel>();
  protected _ariaLiveRegionRef = createRef<AriaLive>();

  private inputSettings: SettingsInput = {};
  private data?: AllSeriesData;
  private suppleteSettingsWith?: DeepReadonly<Settings>;

  @property() accessor filename = '';
  @property({type: Object}) accessor config: SettingsInput = {};

  @property() accessor forcecharttype: ChartType | undefined;

  constructor() {
    super();
    this._controller = new ParaController(this);
    // also creates the state controller
    this.store = this._controller.store;
  }

  get paraView() {
    return this._paraViewRef.value!;
  }

  get controlPanel() {
    return this._controlPanelRef.value!;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('filename') && this.filename !== '') {
      this.log(`changed: '${this.filename}`);
      this.dispatchEvent(new CustomEvent('filenamechange', {bubbles: true, composed: true, cancelable: true}));
    }
    if (changedProperties.has('config')) {
      Object.entries(this.config).forEach(([path, value]) =>
        this._store.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
    }
  }

  static styles = [
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

  // XXX temp hack
  ready() {
    this._controlPanelRef.value!.hidden = false;
  }

  clearAriaLive() {
    this._ariaLiveRegionRef.value!.clear();
  }

  showAriaLiveHistory() {
    this._ariaLiveRegionRef.value!.showHistoryDialog();
  }

  render(): TemplateResult {
    this.log('render');
    return html`
      <figure>
        <para-view
          ${ref(this._paraViewRef)}
          .paraChart=${this}
          .store=${this._store}
          colormode=${this._store?.settings.color.colorVisionMode ?? nothing}
        ></para-view>
        ${!this.headless ? html`
          <para-control-panel
            ${ref(this._controlPanelRef)}
            .paraChart=${this}
            .store=${this._store}
            hidden
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
