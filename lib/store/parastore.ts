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

import { dataFromManifest, type AllSeriesData, type ChartType, type Manifest } from '@fizz/paramanifest';
import { facetsFromDataset, Model, modelFromExternalData, modelFromInlineData, FacetSignature 
  } from '@fizz/paramodel';
import { FormatType } from '@fizz/parasummary';
import { BasicXYChartSummarizer } from '@fizz/parasummary';

import { DeepReadonly, FORMAT_CONTEXT_SETTINGS, Settings, SettingsInput, FormatContext } from './settings_types';
import { SettingsManager } from './settings_manager';
import { SettingControlManager } from './settings_controls';
import { defaults } from './settings_defaults';
import { Colors } from '../common/colors';
import { DataSymbols } from '../view/symbol';
import { SeriesPropertyManager } from './series_properties';
import { keymap } from './keymap';
import { KeymapManager } from './keymap_manager';

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

export interface DataCursor {
  seriesKey: string;
  index: number;
}

// This mostly exists so that each new announcement will be considered
// distinct, even if the text is the same
export interface Announcement {
  text: string;
  clear?: boolean;
}

export class ParaStore extends State {

  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings: Settings;
  @property() darkMode = false;
  @property() announcement: Announcement = { text: '' };

  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';
  @property() protected _visitedDatapoints: DataCursor[] = [];
  @property() protected _prevVisitedDatapoints: DataCursor[] = [];
  @property() protected _selectedDatapoints: DataCursor[] = [];
  @property() protected _prevSelectedDatapoints: DataCursor[] = [];

  protected _settingControls = new SettingControlManager(this); 
  protected _manifest: Manifest | null = null;
  protected _model: Model | null = null;
  protected _facets: FacetSignature[] | null = null;
  protected _type: ChartType = 'line';
  protected _title = '';
  protected _seriesProperties: SeriesPropertyManager | null = null;
  protected _colors: Colors;
  protected _keymapManager = new KeymapManager(keymap);
  protected _prependAnnouncements: string[] = [];
  protected _appendAnnouncements: string[] = [];
  protected _summarizer!: BasicXYChartSummarizer; 
  

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

  get summarizer() {
    return this._summarizer;
  }

  setManifest(manifest: Manifest, data?: AllSeriesData) {
    this._manifest = manifest;
    const dataset = this._manifest.datasets[0];

    if (dataset.settings) {
      Object.entries(dataset.settings).forEach(([path, value]) =>
        this.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
      if (this.settings.color.colorMap) {
        this._colors.setColorMap(...this.settings.color.colorMap.split(',').map(c => c.trim()));
      }
    }

    this._type = dataset.type;
    this._title = dataset.title;
    this._facets = facetsFromDataset(dataset);
    if (dataset.data.source === 'inline') {
      this._model = modelFromInlineData(manifest);
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this._model = modelFromExternalData(data, manifest);
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = data;
    } else {
      throw new Error('store lacks external or inline chart data');
    }
    this._summarizer = new BasicXYChartSummarizer(this._model);
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

  prependAnnouncement(msg: string) {
    this._prependAnnouncements.push(msg);
  }

  appendAnnouncement(msg: string) {
    this._appendAnnouncements.push(msg);
  }

  announce(msg: string | string[], clearAriaLive = false) {
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
      this.announcement = { text: announcement, clear: clearAriaLive };
      console.log('ANNOUNCE:', this.announcement.text);
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

  get prevVisitedDatapoints() {
    return this._prevVisitedDatapoints;
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

  get selectedDatapoints() {
    return this._selectedDatapoints;
  }

  get prevSelectedDatapoints() {
    return this._prevSelectedDatapoints;
  }

  select(datapoints: DataCursor[]) {
    let newSelection: DataCursor[] = [];
    if (datapoints.length === 1) {
      if (!this.isSelected(datapoints[0].seriesKey, datapoints[0].index) 
        || this._selectedDatapoints.length > 1) {
        newSelection.push(datapoints[0]);
      }
    } else {
      newSelection = datapoints;
    }
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = newSelection;
  }

  extendSelection(datapoints: DataCursor[]) {
    const newSelection: DataCursor[] = [...this._selectedDatapoints];
    for (const dp of datapoints) {
      const alreadySelected = this.isSelected(dp.seriesKey, dp.index);
      if (alreadySelected) {
        newSelection.splice(newSelection.findIndex(newDP =>
          newDP.seriesKey === dp.seriesKey && newDP.index === dp.index ), 1);
      } else {
        newSelection.push(dp);
      }  
    } 
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = newSelection;
  }

  isSelected(seriesKey: string, index: number) {
    return !!this._selectedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey && cursor.index === index);
  }

  isSelectedSeries(seriesKey: string) {
    return !!this._selectedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey);
  }

  wasSelected(seriesKey: string, index: number) {
    return !!this._prevSelectedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey && cursor.index === index);
  }

  wasSelectedSeries(seriesKey: string) {
    return !!this._prevSelectedDatapoints.find(cursor =>
      cursor.seriesKey === seriesKey);
  }

  getFormatType(context: FormatContext): FormatType {
    return context === 'domId' ? 'domId' 
      : SettingsManager.get(FORMAT_CONTEXT_SETTINGS[context], this.settings) as FormatType;
  }
}
