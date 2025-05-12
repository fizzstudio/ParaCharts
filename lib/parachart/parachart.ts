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
import "../paraview";
import "../control_panel";
import { exhaustive } from "../common/utils";

import { html, css, PropertyValues, TemplateResult, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('para-chart')
export class ParaChart extends logging(ParaComponent) {

  @property({ type: Boolean }) headless = false;

  protected _controller: ParaController;
  
  private inputSettings: SettingsInput = {};
  private data?: AllSeriesData;
  private suppleteSettingsWith?: DeepReadonly<Settings>;

  @property() accessor filename = '';

  @property() accessor forcecharttype: ChartType | undefined;

  constructor() {
    super();
    this._controller = new ParaController(this, this.forcecharttype);
    // also creates the state controller
    this.store = this._controller.store;
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
  }

  static styles = [
    css`
      figure {
        display: inline-block;
      }
    `
  ];

  render(): TemplateResult {
    this.log('render');
    return html`
      <figure>
        <para-view
          .store=${this._store}
          colormode=${this._store?.settings.color.colorVisionMode ?? nothing}
        ></para-view>
        ${!this.headless ? html`
          <para-control-panel
            .summary=${this.summary}
            .store=${this._store}
          ></para-control-panel>` : ''
        }
      </figure>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
