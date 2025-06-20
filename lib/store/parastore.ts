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

import papa from 'papaparse';
import { State, property } from '@lit-app/state';
import { produceWithPatches, enablePatches } from 'immer';
enablePatches();

import {
  dataFromManifest, type AllSeriesData, type ChartType, type Manifest,
  Jimerator
} from '@fizz/paramanifest';
import {
  facetsFromDataset, Model, modelFromExternalData, modelFromInlineData,
  FacetSignature, SeriesAnalyzerConstructor, XYDatapoint 
} from '@fizz/paramodel';
import { Summarizer, FormatType, formatXYDatapointX, formatXYDatapointY } from '@fizz/parasummary';

import {
  DeepReadonly, FORMAT_CONTEXT_SETTINGS, Settings, SettingsInput, FormatContext,
  type Setting,
} from './settings_types';
import { SettingsManager } from './settings_manager';
import { SettingControlManager } from './settings_controls';
import { defaults, chartTypeDefaults } from './settings_defaults';
import { Colors } from '../common/colors';
import { DataSymbols } from '../view/symbol';
import { SeriesPropertyManager } from './series_properties';
import { keymap } from './keymap';
import { KeymapManager } from './keymap_manager';
import { type ParaChart } from '../parachart/parachart';

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

export type SettingObserver = (oldValue?: Setting, newValue?: Setting) => void;

export interface Annotation {
  seriesKey: string;
  index: number;
  annotation: string;
  timestamp?: Date;
}

export interface RangeHighlight {
  startPortion: number;
  endPortion: number;
}


export class ParaStore extends State {

  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings: Settings;
  @property() darkMode = false;
  @property() announcement: Announcement = { text: '' };
  @property() annotations: Annotation[] = [];
  @property()  _sparkBrailleData: string = ''

  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';
  @property() protected _visitedDatapoints: DataCursor[] = [];
  @property() protected _prevVisitedDatapoints: DataCursor[] = [];
  @property() protected _selectedDatapoints: DataCursor[] = [];
  @property() protected _prevSelectedDatapoints: DataCursor[] = [];
  @property() protected _rangeHighlights: RangeHighlight[] = [];

  protected _settingControls = new SettingControlManager(this); 
  protected _settingObservers: { [path: string]: SettingObserver[] } = {};
  protected _manifest: Manifest | null = null;
  protected _jimerator: Jimerator | null = null;
  protected _model: Model | null = null;
  protected _facets: FacetSignature[] | null = null;
  protected _type: ChartType = 'line';
  protected _title = '';
  protected _seriesProperties: SeriesPropertyManager | null = null;
  protected _colors: Colors;
  protected _keymapManager = new KeymapManager(keymap);
  protected _prependAnnouncements: string[] = [];
  protected _appendAnnouncements: string[] = [];
  protected _summarizer!: Summarizer; 
  protected _seriesAnalyzerConstructor?: SeriesAnalyzerConstructor;

  public idList: Record<string, boolean> = {};

  constructor(
    protected _paraChart: ParaChart,
    inputSettings: SettingsInput, 
    suppleteSettingsWith?: DeepReadonly<Settings>,
    seriesAnalyzerConstructor?: SeriesAnalyzerConstructor
  ) {
    super();
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, suppleteSettingsWith ?? defaults);
    this.settings = hydratedSettings as Settings;
    this.subscribe((key, value) => this._propertyChanged(key, value));
    this._colors = new Colors(this);
    this._seriesAnalyzerConstructor = seriesAnalyzerConstructor;
    this._getUrlAnnotations();
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

  get jimerator() {
    return this._jimerator;
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

  get rangeHighlights() {
    return this._rangeHighlights;
  }

  setManifest(manifest: Manifest, data?: AllSeriesData) {
    this._manifest = manifest;
    const dataset = this._manifest.datasets[0];

    if (chartTypeDefaults[dataset.type]) {
      Object.entries(chartTypeDefaults[dataset.type]!).forEach(([path, value]) =>
        this.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
    }

    if (dataset.settings) {
      Object.entries(dataset.settings).forEach(([path, value]) =>
        this.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
      if (this.settings.color.colorMap) {
        this._colors.setColorMap(...this.settings.color.colorMap.split(',').map(c => c.trim()));
      }
    }
    // XXX doesn't work in Storybook, since the element is inside an iframe
    // let paraChart = document.getElementsByTagName("para-chart")[0]
    // if (paraChart.type){
    //   this._type = paraChart.type
    // }

    this._jimerator = new Jimerator(this._manifest, data);
    this._jimerator.render();

    this._type = dataset.type;
    this._title = dataset.title;
    this._facets = facetsFromDataset(dataset);
    if (dataset.data.source === 'inline') {
      this._model = modelFromInlineData(manifest, this._seriesAnalyzerConstructor);
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      this._model = modelFromExternalData(data, manifest, this._seriesAnalyzerConstructor);
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

  updateSettings(updater: (draft: Settings) => void, ignoreObservers = false) {
    const [newSettings, patches, inversePatches] = produceWithPatches(this.settings, updater);
    this.settings = newSettings;
    if (ignoreObservers) {
      return;
    }
    const observed: { [path: string]: Partial<{oldValue: Setting, newValue: Setting}> } = {};
    for (const patch of patches) {
      if (patch.op !== 'replace') {
        console.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')] = {newValue: patch.value};
    }
    for (const patch of inversePatches) {
      if (patch.op !== 'replace') {
        console.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')].oldValue = patch.value;
    }
    for (const [path, values] of Object.entries(observed)) {
      this._settingObservers[path]?.forEach(observer =>
        observer(values.oldValue, values.newValue)
      );
      this._paraChart.paraView?.settingDidChange(path, values.oldValue, values.newValue);
    }
  }

  observeSetting(path: string, observer: (oldValue: Setting, newValue: Setting) => void) {
    if (!this._settingObservers[path]) {
      this._settingObservers[path] = [];
    }
    if (this._settingObservers[path].includes(observer)) {
      throw new Error(`observer already registered for setting '${path}'`);
    }
    this._settingObservers[path].push(observer);
  }

  observeSettings(paths: string[], observer: (oldValue: Setting, newValue: Setting) => void){
    for (let path of paths){
      this.observeSetting(path, observer);
    }
  }

  unobserveSetting(path: string, observer: (oldValue: Setting, newValue: Setting) => void) {
    if (!this._settingObservers[path]) {
      throw new Error(`no observers for setting '${path}'`);
    }
    const idx = this._settingObservers[path].indexOf(observer);
    if (idx === -1) {
      throw new Error(`observer not registered for setting '${path}'`);
    }
    this._settingObservers[path].splice(idx, 1);
    if (this._settingObservers[path].length === 0) {
      delete this._settingObservers[path];
    }
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

  public async asyncAnnounce(msgPromise: Promise<string | string[]>): Promise<void> {
    const msg = await msgPromise;
    this.announce(msg);
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

  clearVisited() {
    this._visitedDatapoints = []
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

  clearSelected() {
    this._selectedDatapoints = []
  }

  getFormatType(context: FormatContext): FormatType {
    return context === 'domId' ? 'domId' 
      : SettingsManager.get(FORMAT_CONTEXT_SETTINGS[context], this.settings) as FormatType;
  }

  addAnnotation() {
    let newAnnotationList: Annotation[] = [...this.annotations];

    this._selectedDatapoints.forEach((dp) => {
      const recordLabel = formatXYDatapointX(
        this._model!.atKeyAndIndex(dp.seriesKey, dp.index) as XYDatapoint, 'raw');
      let annotationText = prompt('Annotation:') as string;
      if (annotationText) {
        newAnnotationList.push({
          seriesKey: dp.seriesKey,
          index: dp.index,
          annotation: `${dp.seriesKey}, ${recordLabel}: ${annotationText}`
        });
      }
    });
    this.annotations = newAnnotationList;
  }

  protected _getUrlAnnotations() {
    const trimText = (textStr: string) => 
      textStr.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ').trim();

    let location = window.location;
    let page_url = location.hostname + location.pathname;
    let page_title = document.title;

    let isAnnotation = false;
    let query = location.search;
    if (query) {
      var url_params = new URLSearchParams(query);
      let searchStr = url_params.get('text');
      let note_str = url_params.get('note');

      if (searchStr) {
        isAnnotation = false;
        searchStr = trimText(searchStr);
        // find_text_nodes();
      }
    }
  }

  highlightRange(startPortion: number, endPortion: number) {
    if (this._rangeHighlights.find(rhl =>
      rhl.startPortion === startPortion && rhl.endPortion === endPortion)) {
      throw new Error('range already highlighted');
    }
    this._rangeHighlights = [...this._rangeHighlights, {startPortion, endPortion}];
  }

  unhighlightRange(startPortion: number, endPortion: number) {
    const index = this._rangeHighlights.findIndex(rhl =>
      rhl.startPortion === startPortion && rhl.endPortion === endPortion);
    if (index === -1) {
      throw new Error('range not highlighted');
    }
    this._rangeHighlights = this._rangeHighlights.toSpliced(index, 1);
  }

  getModelCsv() {
    const xLabel = this.model!.independentFacet!.label;
    return papa.unparse(this.model!.series[0].datapoints.map((dp, i) => ({
      [xLabel]: formatXYDatapointX(dp as XYDatapoint, 'raw'),
      ...Object.fromEntries(this.model!.series.map(s =>
        [s.key, formatXYDatapointY(s[i] as XYDatapoint, 'value')]))
    })));
  }

}
