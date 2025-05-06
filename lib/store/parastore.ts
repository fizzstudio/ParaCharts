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

import { dataFromManifest, DisplayType, Facet, type AllSeriesData, type ChartType, type Manifest } from '@fizz/paramanifest';

import { DeepReadonly, Settings, SettingsInput } from './settings_types';
import { SettingsManager } from './settings_manager';
import { SettingControlManager } from './settings_controls';
import { defaults } from './settings_defaults';
import { Colors } from '../common/colors';
import { DataSymbols } from '../view/symbol';
import { SeriesPropertyManager } from './series_properties';
import { keymap } from './keymap';
import { KeymapManager } from './keymap_manager';
import { facetsFromDataset, Model, modelFromAllSeriesData, modelFromManifest } from '@fizz/paramodel';
import { FacetSignature } from './dataframe/dataframe';
import { AxisOrientation } from '../common/types';

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

export interface DataCursor {
  seriesKey: string;
  index: number;
}

export class ParaStore extends State {

  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings: Settings;
  @property() darkMode = false;
  @property() announcement = '';

  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';
  @property() protected _visitedDatapoints: DataCursor[] = [];
  @property() protected _prevVisitedDatapoints: DataCursor[] = [];

  protected _settingControls = new SettingControlManager(this); 
  protected _manifest: Manifest | null = null;
  protected _model: Model | null = null;
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
  protected _prependAnnouncements: string[] = [];
  protected _appendAnnouncements: string[] = [];

  public idList: Record<string, boolean> = {};

  private _displayTypeForFacet: Record<string, DisplayType | undefined> = {}; // FIXME: | undefined
  
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
      this._displayTypeForFacet[key] = facetManifest.displayType;
      this._facetMap[key] = facetManifest;
      if (facetManifest.displayType?.type === 'axis') { // FIXME: remove ?
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
    /*if (this._horizontalAxisFacetKey === null || this._verticalAxisFacetKey === null) {
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
        throw new Error('axis facets cannot be determined'); FIXME: restore
      }
    }*/
    //////////////////////// TEMP //////////////////////////////////////////
    this._displayTypeForFacet['x'] = {type: 'axis', orientation: 'horizontal'};
    this._horizontalAxisFacetKey = 'x';
    this._displayTypeForFacet['y'] = {type: 'axis', orientation: 'vertical'};
    this._verticalAxisFacetKey = 'y';
    ////////////////////////////////////////////////////////////////////////
    //this._xAxisLabel = dataset.facets.x.label;
    //this._yAxisLabel = dataset.facets.y.label;
    //this._xDatatype = dataset.facets.x.datatype;
    if (dataset.data.source === 'inline') {
      this._model = modelFromManifest(manifest);
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this._model = modelFromAllSeriesData(data, this._facets);
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

  announce(msg: string | string[]) {
    /*
    This sends an announcement to the Status Bar.
    If the `msg` argument is an array, it joins the strings together with a
    line-break, for clarity of reading.
    Sometimes you may wish to prepend the next announcement with a message
    (e.g. for navigation orientation); in this case, you call `prependAnnouncement`
    with this message _before_ you call `announce`.
    Sometimes you may also wish to append a message after the next announcement
    (e.g. instructions on using the app); in this case, you call
    `appendAnnouncement` with this message _before_ you call `announce`.
    */

    let announcement = '';
    const linebreak = '\r\n';  // TODO: add option-based flags to enable or disable?

    if (this._prependAnnouncements.length) {
      const prependStr = this._joinStrArray(this._prependAnnouncements, linebreak);
      announcement += prependStr ? `${prependStr} ${linebreak}` : '';
      this._prependAnnouncements = [];
    }

    announcement += (typeof msg === 'string') ? msg : this._joinStrArray(msg, linebreak);

    if (this._appendAnnouncements.length) {
      const appendStr = this._joinStrArray(this._appendAnnouncements, linebreak);
      announcement += appendStr ? `${linebreak} ${appendStr}` : '';
      this._appendAnnouncements = [];
    }

    if (this.settings.ui.isAnnouncementEnabled) {
      console.log('ANNOUNCE:', this.announcement);
      this.announcement = announcement;
    }
  }

  protected _joinStrArray(strArray: string[], linebreak?: string) : string {
    strArray = strArray.filter(line => /\S/.test(line));
    // if the string array only contains blank strings, ignore it
    if (strArray.length) {
      const strArrayLen = strArray.length - 1;
      return strArray.reduce((acc, line, i) => {
        const lineEnd = (i === strArrayLen) ? '.' : '';
        const linebreakstr = (acc) ? ` ${linebreak}` : '';
        const accStr = acc.match(/[.,?:;]$/) ? acc : `${acc}.`;
        return `${accStr} ${linebreakstr}${line}${lineEnd}`;
      });
    }
    return '';
  }

  get visitedDatapoints() {
    return this._visitedDatapoints;
  }

  visit(datapoints: DataCursor[]) {
    this._prevVisitedDatapoints = this._visitedDatapoints;
    this._visitedDatapoints = datapoints;
  }

  isVisited(seriesKey: string, index: number) {
    return !!this._visitedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey && cursor.index === index);
  }

  isVisitedSeries(seriesKey: string) {
    return !!this._visitedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey);
  }

  wasVisited(seriesKey: string, index: number) {
    return !!this._prevVisitedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey && cursor.index === index);
  }

  wasVisitedSeries(seriesKey: string) {
    return !!this._prevVisitedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey);
  }
}
