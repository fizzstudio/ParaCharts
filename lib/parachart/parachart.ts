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

import { html, LitElement, PropertyValues, TemplateResult } from "lit";

import { Manifest } from "@fizz/paramanifest";

import { ParaStore } from "../store/parastore";
import { AllSeriesData } from "../common/types";
import { StateController } from "@lit-app/state";
import { DeepReadonly, Settings, SettingsInput } from "../store/settings_types";
import { customElement, property, state } from "lit/decorators.js";
import { ParaLoader } from "../loader/paraloader";
import { ParaView } from "../view_temp/paraview";
import { exhaustive } from "../common/utils";

@customElement('para-chart')
export class ParaChart extends LitElement {
  private manifest?: Manifest;
  private inputSettings: SettingsInput = {};
  private data?: AllSeriesData;
  private suppleteSettingsWith?: DeepReadonly<Settings>;

  private store?: ParaStore;
  private state?: StateController<ParaStore>;

  private loader = new ParaLoader();
  private error = '';

  @property()
  accessor filename = '';

  @state()
  dataState: 'initial' | 'pending' | 'complete' | 'error' = 'initial';

  constructor() {
    super();
    if (this.filename !== '') {
      this.runloader();
    }
  }

  async runloader(): Promise<void> {
    console.log(`Loading filename: '${this.filename}'`);
    this.dataState = 'pending';
    const loadresult = await this.loader.load('fizz-chart-data', this.filename);
    console.log('Loaded manifest')
    if (loadresult.result === 'success') {
      this.setManifest(loadresult.manifest);
      this.dataState = 'complete';
    } else {
      this.error = loadresult.error;
      this.dataState = 'error';
    }
    //this.requestUpdate();
  }

  setManifest(manifest: Manifest): void {
    this.manifest = manifest;
    this.store = new ParaStore(this.manifest, this.inputSettings, this.data, this.suppleteSettingsWith);
    this.state = new StateController(this, this.store);
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('filename') && this.filename !== '') {
      console.log(`Changed: '${this.filename}`);
      this.runloader();
    }
  }

  render(): TemplateResult {
    if (this.dataState === 'initial') {
      return html`Waiting for manifest input`;
    }
    if (this.dataState === 'pending') {
      return html`Loading manifest`;
    }
    if (this.dataState === 'error') {
      return html`Error loading manifest: ${this.error}`;
    }
    if (this.dataState === 'complete') {
      return html`<para-view .store=${this.store}></para-view>`;
    }
    return exhaustive();
  }

}