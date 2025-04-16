/* ParaCharts: ParaStore Data Store
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

import { State, property } from "@lit-app/state";

import type { Manifest } from "@fizz/paramanifest";

import { Model2D, modelFromAllSeriesData, modelFromManifest } from "./model2D";
import { AllSeriesData, ChartType, Datatype } from "../common/types";
import { DeepReadonly, Settings, SettingsInput } from "./settings_types";
import { SettingsManager } from "./settings_manager";
import { defaults } from "./settings_defaults";
import { Colors } from "../view_temp/colors";
import { DataSymbols } from "../view_temp/symbol";
import { SeriesPropertyManager } from "./series_properties";

function dataFromManifest(manifest: Manifest): AllSeriesData {
  const dataset = manifest.datasets[0];
  if (dataset.data.source !== 'inline') {
    throw new Error('only manifests with inline data can use this function.');
  }
  const data: AllSeriesData = {};
  for (const series of dataset.series) {
    data[series.key] = series.records!;
  }
  return data;
}

export class ParaStore extends State {

  @property()
  private manifest: Manifest;
  @property()
  public settings: Settings;
  @property()
  private focused = 'chart';
  @property()
  private selected = null;
  @property()
  private queryLevel = 'default';
  @property()
  private data: AllSeriesData;
  @property()
  public darkMode = false;

  public readonly model: Model2D<Datatype>;
  public readonly type: ChartType;
  public readonly title: string;
  public readonly xAxisLabel: string;
  public readonly yAxisLabel: string;
  public readonly colors = new Colors();
  public readonly symbols = new DataSymbols();
  public readonly seriesProperties: SeriesPropertyManager;
  private readonly xDatatype: Datatype;

  public idList: Record<string, boolean> = {};
  
  constructor(
    manifest: Manifest, 
    inputSettings: SettingsInput, 
    data?: AllSeriesData,
    suppleteSettingsWith?: DeepReadonly<Settings>
  ) {
    super();
    this.manifest = manifest;
    const dataset = this.manifest.datasets[0];
    this.type = dataset.type;
    this.title = dataset.title;
    this.xAxisLabel = dataset.facets.x.label;
    this.yAxisLabel = dataset.facets.y.label;
    this.xDatatype = dataset.facets.x.datatype;
    if (dataset.data.source === 'inline') {
      this.model = modelFromManifest(manifest, this.xDatatype);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this.model = modelFromAllSeriesData(data, this.xDatatype, this.type);
      this.data = data;
    } else {
      throw new Error('store lacks external or inline chart data')
    }
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, suppleteSettingsWith ?? defaults);
    this.settings = hydratedSettings as Settings;
    this.seriesProperties = new SeriesPropertyManager(this);
  }
}
