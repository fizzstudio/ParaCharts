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
import { ParaChart } from './parachart';

@customElement('para-chart-ai')
export class ParaChartAi extends ParaChart {

  constructor() {
    super();
    console.log('AI-enhanced ParaChart created')
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart-ai': ParaChartAi;
  }
}
