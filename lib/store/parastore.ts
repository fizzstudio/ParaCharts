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

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

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

  readonly colors = new Colors();
  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings: Settings;
  @property() darkMode = false;

  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';

  protected _manifest: Manifest | null = null;
  protected _model: Model2D<Datatype> | null = null;
  protected _type: ChartType = 'line';
  protected _title = '';
  protected _xAxisLabel = '';
  protected _yAxisLabel = '';
  protected _seriesProperties: SeriesPropertyManager | null = null;
  protected _xDatatype: Datatype = 'date';

  public idList: Record<string, boolean> = {};
  
  constructor(
    inputSettings: SettingsInput, 
    suppleteSettingsWith?: DeepReadonly<Settings>
  ) {
    super();
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, suppleteSettingsWith ?? defaults);
    this.settings = hydratedSettings as Settings;
    this.subscribe((key, value) => this._propertyChanged(key, value));
  }

  get type() {
    return this._type;
  }

  get model() {
    return this._model;
  }

  get title() {
    return this._title;
  }

  get xAxisLabel() {
    return this._xAxisLabel;
  }

  get yAxisLabel() {
    return this._yAxisLabel;
  }

  get seriesProperties() {
    return this._seriesProperties;
  }

  setManifest(manifest: Manifest, data?: AllSeriesData) {
    this._manifest = manifest;
    const dataset = this._manifest.datasets[0];
    this._type = dataset.type;
    this._title = dataset.title;
    this._xAxisLabel = dataset.facets.x.label;
    this._yAxisLabel = dataset.facets.y.label;
    this._xDatatype = dataset.facets.x.datatype;
    if (dataset.data.source === 'inline') {
      this._model = modelFromManifest(manifest, this._xDatatype);
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this._model = modelFromAllSeriesData(data, this._xDatatype, this._type);
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = data;
    } else {
      throw new Error('store lacks external or inline chart data');
    }
  }

  protected _propertyChanged(key: string, value: any) {
    if (key === 'dataState') {
      if (value === 'pending') {

      }
    }
  }

}
