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

import { State, property } from '@lit-app/state';
import { produce } from 'immer';

import { dataFromManifest, DisplayType, Facet, type AllSeriesData, type ChartType, type Datatype, type Manifest } from '@fizz/paramanifest';

import { Model2D, modelFromAllSeriesData, modelFromManifest } from './model2D';
import { DeepReadonly, Settings, SettingsInput } from './settings_types';
import { SettingsManager } from './settings_manager';
import { SettingControlManager } from './settings_controls';
import { defaults } from './settings_defaults';
import { Colors } from '../common/colors';
import { DataSymbols } from '../view_temp/symbol';
import { SeriesPropertyManager } from './series_properties';
import { keymap } from './keymap';
import { KeymapManager } from './keymap_manager';
import { facetsFromDataset, ModelDF, modelDFFromAllSeriesData, modelDFFromManifest } from './modelDF';
import { FacetSignature } from './dataframe/dataframe';
import { AxisOrientation } from '../common/types';

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

export class ParaStore extends State {

  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings: Settings;
  @property() darkMode = false;
  @property() visitedDatapoints: string[] = [];

  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';

  protected _settingControls = new SettingControlManager(this); 
  protected _manifest: Manifest | null = null;
  protected _model: ModelDF | null = null;
  protected _facets: FacetSignature[] | null = null;
  protected _type: ChartType = 'line';
  protected _title = '';
  protected _facetKeys: string[] = [];
  protected _facetMap: Record<string, Facet> = {};
  protected _axisFacetKeys: string[] = [];
  protected _horizontalAxisFacetKey: string | null = null;
  protected _verticalAxisFacetKey: string | null = null;
  protected _seriesProperties: SeriesPropertyManager | null = null;
  protected _colors: Colors;
  protected _keymapManager = new KeymapManager(keymap);

  public idList: Record<string, boolean> = {};

  private _displayTypeForFacet: Record<string, DisplayType> = {};
  
  constructor(
    inputSettings: SettingsInput, 
    suppleteSettingsWith?: DeepReadonly<Settings>
  ) {
    super();
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, suppleteSettingsWith ?? defaults);
    this.settings = hydratedSettings as Settings;
    this.subscribe((key, value) => this._propertyChanged(key, value));
    this._colors = new Colors(this);
  }

  get settingControls() {
    return this._settingControls;
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

  get seriesProperties() {
    return this._seriesProperties;
  }

  get colors() {
    return this._colors;
  }

  get keymapManager() {
    return this._keymapManager;
  }

  setManifest(manifest: Manifest, data?: AllSeriesData) {
    this._manifest = manifest;
    const dataset = this._manifest.datasets[0];
    this._type = dataset.type;
    this._title = dataset.title;
    this._facets = facetsFromDataset(dataset);
    this._facetKeys = Object.keys(dataset.facets);
    this._facetKeys.forEach((key) => {
      const facetManifest = dataset.facets[key];
      this._displayTypeForFacet[key] = facetManifest.displayType!; // FIXME: remove !
      this._facetMap[key] = facetManifest;
      if (facetManifest.displayType!.type === 'axis') {
        this._axisFacetKeys.push(key);
        if (facetManifest.displayType!.orientation === 'horizontal') {
          if (this._horizontalAxisFacetKey === null) {
            this._horizontalAxisFacetKey = key;
          } else {
            throw new Error('only one horizontal axis per chart');
          }
        } else {
          if (this._verticalAxisFacetKey === null) {
            this._verticalAxisFacetKey = key;
          } else {
            throw new Error('only one vertical axis per chart');
          }
        }
      }
    });
    if (this._axisFacetKeys.length !== 0 && this._axisFacetKeys.length !== 2) {
      throw new Error('charts must either have 2 or 0 axes')
    }
    if (this._horizontalAxisFacetKey === null || this._verticalAxisFacetKey === null) {
      const independentAxes = this._axisFacetKeys.filter(
        (key) => dataset.facets[key].variableType === 'independent'
      );
      const dependentAxes = this._axisFacetKeys.filter(
        (key) => dataset.facets[key].variableType === 'dependent'
      );
      if (
        independentAxes.length === 1 && 
        dependentAxes.length === 1 &&
        (this._horizontalAxisFacetKey === null || this._horizontalAxisFacetKey === independentAxes[0]) &&
        (this._verticalAxisFacetKey === null || this._verticalAxisFacetKey === dependentAxes[0]) 
      ) {
        // NOTE: One (but not both) of these might be rewriting the axis facet key to the same thing
        this._horizontalAxisFacetKey = independentAxes[0];
        this._verticalAxisFacetKey = dependentAxes[0];
      } else if (
        this._facetKeys.includes('x') 
        && this._facetKeys.includes('y')
        && this._displayTypeForFacet['x'].type === 'axis'
        && this._displayTypeForFacet['y'].type === 'axis'
        && (this._horizontalAxisFacetKey === null || this._horizontalAxisFacetKey === 'x')
        && (this._verticalAxisFacetKey === null || this._verticalAxisFacetKey === 'y') ) {
          // NOTE: One (but not both) of these might be rewriting the axis facet key to the same thing
          this._horizontalAxisFacetKey === 'x';
          this._verticalAxisFacetKey === 'y';
      } else {
        throw new Error('axis facets cannot be determined');
      }
    }
    //this._xAxisLabel = dataset.facets.x.label;
    //this._yAxisLabel = dataset.facets.y.label;
    //this._xDatatype = dataset.facets.x.datatype;
    if (dataset.data.source === 'inline') {
      this._model = modelDFFromManifest(manifest);
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this._model = modelDFFromAllSeriesData(data, this._facets);
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

  updateSettings(updater: (draft: Settings) => void) {
    this.settings = produce(this.settings, updater);
  }

  getAxisFacet(orientation: AxisOrientation): Facet | null {
    if (orientation === 'horiz') {
      return this._horizontalAxisFacetKey ? this._facetMap[this._horizontalAxisFacetKey] : null;
    }
    return this._verticalAxisFacetKey ? this._facetMap[this._verticalAxisFacetKey] : null;
  }

  getFacet(key: string): Facet | null {
    return this._facetMap[key] ?? null;
  }

}
