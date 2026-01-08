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

import { Logger, getLogger } from '../common/logger';
import papa from 'papaparse';
import { State, property } from '@lit-app/state';
import { produceWithPatches, enablePatches } from 'immer';
enablePatches();

import {
  dataFromManifest, type AllSeriesData, type ChartType, type Manifest,
  isPastryType,
  isVennType
} from '@fizz/paramanifest';
import { Jimerator } from '@fizz/jimerator';
import {
  facetsFromDataset, Model, modelFromExternalData, modelFromInlineData,
  FacetSignature, SeriesAnalyzerConstructor, PairAnalyzerConstructor,
  PlaneDatapoint,
  planeModelFromInlineData,
  planeModelFromExternalData,
  PlaneModel,
  Datapoint
} from '@fizz/paramodel';
import {
  Summarizer, FormatType, formatXYDatapointX, formatXYDatapointY,
  HighlightedSummary, Highlight
} from '@fizz/parasummary';

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
import { actionMap } from './action_map';
import { KeymapManager } from './keymap_manager';
import { SequenceInfo, SeriesAnalysis } from '@fizz/series-analyzer';
import { type ParaChart } from '../parachart/parachart';
import { DatapointView } from '../view/data';
import { Popup } from '../view/popup';
import { type DatapointCursor } from '../view/layers/data/navigation';
import { Point } from '@fizz/chart-classifier-utils';
import { loopParaviewRefresh } from '../common';
import { PointDatapointView } from '../view/layers';

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

// This mostly exists so that each new announcement will be considered
// distinct, even if the text is the same
export interface Announcement {
  text: string;
  html: string;
  highlights: Highlight[];
  clear?: boolean;
  startFrom: number;
}

export type SettingObserver = (oldValue?: Setting, newValue?: Setting) => void;

export interface BaseAnnotation {
  type: string;
  annotation: string;
  id: string;
  seriesKey?: string;
  index?: number;
  isSelected?: boolean;
}

export interface PointAnnotation extends BaseAnnotation {
  type: "datapoint";
  seriesKey: string;
  index: number;
  annotation: string;
  text: string;
  timestamp?: Date;
}

export interface MDRAnnotation extends BaseAnnotation {
  annotation: string;
}

export interface RangeHighlight {
  startPortion: number;
  endPortion: number;
}

export interface LineBreak {
  startPortion: number;
  index: number;
  seriesKey: string;
}

export interface TrendLine {
  startPortion: number;
  endPortion: number;
  startIndex: number;
  endIndex: number;
  seriesKey: string;
}

export interface SparkBrailleInfo {
  data: string;
  isProportional?: boolean;
  isBar?: boolean;
}

/**
 * Convert a datapoint ID string of format `${seriesKey}-${index}` into a DatapointCursor.
 * @param id - The ID
 * @returns DatapointCursor
 */
export function datapointIdToCursor(id: string): DatapointCursor {
  const [seriesKey, index] = id.split('-');
  return {
    seriesKey,
    index: parseInt(index)
  };
}

export class ParaStore extends State {

  readonly symbols = new DataSymbols();


  @property() dataState: DataState = 'initial';
  @property() settings!: Settings;
  @property() darkMode = false;
  @property() announcement: Announcement = { text: '', html: '', highlights: [], startFrom: 0 };
  @property() annotations: BaseAnnotation[] = [];
  @property() popups: Popup[] = [];
  @property() sparkBrailleInfo: SparkBrailleInfo | null = null;
  @property() seriesAnalyses: Record<string, SeriesAnalysis | null> = {};
  @property() frontSeries = '';
  @property() pointerCoords: Point = { x: 0, y: 0 }

  @property() protected _lowlightedSeries: string[] = [];
  @property() protected _hiddenSeries: string[] = [];
  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';
  /** `${seriesKey}-${index}` */
  protected _visitedDatapoints = new Set<string>();
  protected _prevVisitedDatapoints = new Set<string>();
  protected _everVisitedDatapoints = new Set<string>();
  @property() protected _highlightedSelector = '';
  @property() protected _selectedDatapoints = new Set<string>();
  @property() protected _prevSelectedDatapoints = new Set<string>();
  @property() protected _rangeHighlights: RangeHighlight[] = [];
  @property() protected _modelLineBreaks: LineBreak[] = [];
  @property() protected _userLineBreaks: LineBreak[] = [];
  @property() protected _modelTrendLines: TrendLine[] = [];
  @property() protected _userTrendLines: TrendLine[] = [];

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
  protected _keymapManager = new KeymapManager(actionMap);
  protected _summarizer!: Summarizer;
  protected _seriesAnalyzerConstructor?: SeriesAnalyzerConstructor;
  protected _pairAnalyzerConstructor?: PairAnalyzerConstructor;
  protected annotID: number = 0;
  protected log: Logger = getLogger("ParaStore");

  public idList: Record<string, boolean> = {};

  constructor(
    public paraChart: ParaChart,
    protected _inputSettings: SettingsInput,
    // suppleteSettingsWith?: DeepReadonly<Settings>,
    seriesAnalyzerConstructor?: SeriesAnalyzerConstructor,
    pairAnalyzerConstructor?: PairAnalyzerConstructor
  ) {
    super();
    this._createSettings();
    this.subscribe((key, value) => this._propertyChanged(key, value));
    this._colors = new Colors(this);
    this._seriesAnalyzerConstructor = seriesAnalyzerConstructor;
    this._pairAnalyzerConstructor = pairAnalyzerConstructor;
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

  get modelLineBreaks() {
    return this._modelLineBreaks;
  }

  get userLineBreaks() {
    return this._userLineBreaks;
  }

  get modelTrendLines() {
    return this._modelTrendLines;
  }

  get userTrendLines() {
    return this._userTrendLines;
  }

  protected _createSettings() {
    const hydratedSettings = SettingsManager.hydrateInput(this._inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, defaults);
    this.settings = hydratedSettings as Settings;
  }

  setManifest(manifest: Manifest, data?: AllSeriesData) {
    this._manifest = manifest;
    const dataset = this._manifest.datasets[0];

    this._createSettings();

    if (chartTypeDefaults[dataset.type]) {
      Object.entries(chartTypeDefaults[dataset.type]!).forEach(([path, value]) =>
        this.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
    }

    if (dataset.settings) {
      Object.entries(dataset.settings).forEach(([path, value]) =>
        this.updateSettings(draft => {
          SettingsManager.set(path, value as Setting | undefined, draft);
        }));
      if (this.settings.color.colorMap) {
        this._colors.setColorMap(...this.settings.color.colorMap.split(',').map(c => c.trim()));
      }
    }

    this._jimerator = new Jimerator(this._manifest, data);
    this._jimerator.render();

    this.seriesAnalyses = {};

    this._type = dataset.type;
    this._title = dataset.title;
    this._facets = facetsFromDataset(dataset);
    if (dataset.data.source === 'inline') {
      if (isPastryType(dataset.type) || isVennType(dataset.type)) {
        this._model = modelFromInlineData(manifest);
      } else {
        this._model = planeModelFromInlineData(
          manifest,
          this._seriesAnalyzerConstructor,
          this._pairAnalyzerConstructor
        );
      }
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = dataFromManifest(manifest);
    } else if (data) {
      if (isPastryType(dataset.type) || isVennType(dataset.type)) {
        this._model = modelFromExternalData(data, manifest);
      } else {
        this._model = planeModelFromExternalData(
          data,
          manifest,
          this._seriesAnalyzerConstructor,
          this._pairAnalyzerConstructor
        );
      }
      this._seriesProperties = new SeriesPropertyManager(this);
      this.data = data;
    } else {
      throw new Error('store lacks external or inline chart data');
    }
    if (this._model instanceof PlaneModel) {
      this._model.seriesKeys.forEach(async (seriesKey) => {
        this.seriesAnalyses = {
          [seriesKey]: await (this._model as PlaneModel).getSeriesAnalysis(seriesKey),
          ...this.seriesAnalyses
        };
      });
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
    const observed: { [path: string]: Partial<{ oldValue: Setting, newValue: Setting }> } = {};
    for (const patch of patches) {
      if (patch.op !== 'replace') {
        this.log.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')] = { newValue: patch.value };
    }
    for (const patch of inversePatches) {
      if (patch.op !== 'replace') {
        this.log.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')].oldValue = patch.value;
    }
    for (const [path, values] of Object.entries(observed)) {
      this._settingObservers[path]?.forEach(observer =>
        observer(values.oldValue, values.newValue)
      );
      this.paraChart.settingDidChange(path, values.oldValue, values.newValue);
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

  observeSettings(paths: string[], observer: (oldValue: Setting, newValue: Setting) => void) {
    for (let path of paths) {
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

  lowlightSeries(seriesKey: string) {
    if (!this._lowlightedSeries.includes(seriesKey)) {
      this._lowlightedSeries = [...this._lowlightedSeries, seriesKey];
    }
  }

  clearSeriesLowlight(seriesKey: string) {
    if (this._lowlightedSeries.includes(seriesKey)) {
      this._lowlightedSeries = this._lowlightedSeries.filter(el => el !== seriesKey);
    }
  }

  isSeriesLowlighted(seriesKey: string): boolean {
    return this._lowlightedSeries.includes(seriesKey);
  }

  lowlightOtherSeries(...seriesKeys: string[]) {
    this._lowlightedSeries = this._model!.seriesKeys.filter(key => !seriesKeys.includes(key));
  }

  clearAllSeriesLowlights() {
    this._lowlightedSeries = [];
  }

  hideSeries(seriesKey: string) {
    if (this._hiddenSeries.includes(seriesKey)) return;
    this._hiddenSeries = [...this._hiddenSeries, seriesKey];
  }

  unhideSeries(seriesKey: string) {
    if (this._hiddenSeries.includes(seriesKey)) {
      this._hiddenSeries = this._hiddenSeries.filter(el => el !== seriesKey);
    }
  }

  isSeriesHidden(seriesKey: string): boolean {
    return this._hiddenSeries.includes(seriesKey);
  }

  hideOtherSeries(...seriesKeys: string[]) {
    this._hiddenSeries = this._model!.seriesKeys.filter(key => !seriesKeys.includes(key));
  }

  hideAllSeries() {
    this._hiddenSeries = [...this._model!.seriesKeys];
  }

  unhideAllSeries() {
    this._hiddenSeries = [];
  }

  announce(
    msg: string | string[] | HighlightedSummary,
    clearAriaLive = false,
    startFrom = 0
  ): void {
    /*
    This sends an announcement to the Status Bar.
    If the `msg` argument is an array, it joins the strings together with a
    line-break, for clarity of reading.
    */

    let announcement = '';
    let html = '';
    const linebreak = '\r\n';  // TODO: add option-based flags to enable or disable?
    let highlights: Highlight[] = [];

    if (typeof msg === 'string') {
      announcement = msg;
      html = msg;
    } else if (Array.isArray(msg)) {
      announcement = this._joinStrArray(msg, linebreak);
      html = announcement;
    } else {
      announcement = msg.text;
      html = msg.html;
      highlights = msg.highlights ?? [];
    }

    if (this.settings.ui.isAnnouncementEnabled) {
      this.announcement = { text: announcement, html, highlights, clear: clearAriaLive, startFrom };
      this.log.info('ANNOUNCE:', this.announcement.text);
    }
  }

  protected _joinStrArray(strArray: string[], linebreak?: string): string {
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

  get everVisitedDatapoints() {
    return this._everVisitedDatapoints;
  }

  visit(datapoints: Datapoint[]) {
    this._prevVisitedDatapoints = this._visitedDatapoints;
    this._visitedDatapoints = new Set();
    datapoints.forEach(datapoint => {
      this._visitedDatapoints.add(`${datapoint.seriesKey}-${datapoint.datapointIndex}`);
    });
    for (const datapoint of datapoints) {
      this._everVisitedDatapoints.add(`${datapoint.seriesKey}-${datapoint.datapointIndex}`);
    }
    if (this.settings.controlPanel.isMDRAnnotationsVisible) {
      this.removeMDRAnnotations(this._prevVisitedDatapoints);
      this.showMDRAnnotations();
    }
    // NB: Making _visitedDatapoints a lit-app/state property proved
    // problematic for performance
    this.paraChart.paraView.requestUpdate();
  }

  protected _datapointSetHas(
    seriesKey: string, index: number, collection: Set<string>
  ): boolean {
    return collection.has(`${seriesKey}-${index}`);
  }

  isVisited(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._visitedDatapoints);
  }

  isVisitedSeries(seriesKey: string) {
    return this._visitedDatapoints.values().some(value => value.startsWith(seriesKey));
  }

  wasVisited(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._prevVisitedDatapoints);
  }

  wasVisitedSeries(seriesKey: string) {
    return this._prevVisitedDatapoints.values().some(value => value.startsWith(seriesKey));
  }

  everVisited(seriesKey: string, index: number): boolean {
    return this._datapointSetHas(seriesKey, index, this._everVisitedDatapoints);
  }

  everVisitedSeries(seriesKey: string): boolean {
    return this._everVisitedDatapoints.values().some(value => value.startsWith(seriesKey));
  }

  clearVisited() {
    this._prevVisitedDatapoints = this._visitedDatapoints;
    this._visitedDatapoints = new Set();
  }

  get highlightedSelector() {
    return this._highlightedSelector;
  }

  highlight(selector: string) {
    this._highlightedSelector = selector;
  }

  clearHighlight() {
    this.popups.splice(0, this.popups.length)
    this._highlightedSelector = '';
  }

  get selectedDatapoints() {
    return this._selectedDatapoints;
  }

  get prevSelectedDatapoints() {
    return this._prevSelectedDatapoints;
  }

  select() {
    let newSelection = new Set<string>();
    if (this._visitedDatapoints.size === 1) {
      const datapointId = [...this._visitedDatapoints.values()][0];
      const { seriesKey, index } = datapointIdToCursor(datapointId);
      if (!this.isSelected(seriesKey, index)
        || this._selectedDatapoints.size > 1) {
        newSelection.add(datapointId);
      }
    } else {
      for (const datapointId of this._visitedDatapoints) {
        const { seriesKey, index } = datapointIdToCursor(datapointId);
        if (!this.isSelected(seriesKey, index)) {
          newSelection.add(datapointId);
        }
      }
    }
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = newSelection;
  }

  extendSelection() {
    const newSelection = new Set(this._selectedDatapoints);
    for (const datapointId of this._visitedDatapoints) {
      const { seriesKey, index } = datapointIdToCursor(datapointId);
      if (this.isSelected(seriesKey, index)) {
        newSelection.delete(datapointId);
      } else {
        newSelection.add(datapointId);
      }
    }
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = newSelection;
  }

  isSelected(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._selectedDatapoints);
  }

  isSelectedSeries(seriesKey: string) {
    return this._selectedDatapoints.values().some(value => value.startsWith(seriesKey));
  }

  wasSelected(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._prevSelectedDatapoints);
  }

  wasSelectedSeries(seriesKey: string) {
    return this._prevSelectedDatapoints.values().some(value => value.startsWith(seriesKey));
  }

  clearSelected() {
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = new Set();
  }

  getFormatType(context: FormatContext): FormatType {
    return context === 'domId' ? 'domId'
      : SettingsManager.get(FORMAT_CONTEXT_SETTINGS[context], this.settings) as FormatType;
  }

  async addAnnotation() {
    const newAnnotationList: PointAnnotation[] = [];
    for (const dpId of this._visitedDatapoints) {
      const { seriesKey, index } = datapointIdToCursor(dpId);
      const series = this.model!.atKey(seriesKey)!.getLabel();
      const recordLabel = formatXYDatapointX(
        this._model!.atKeyAndIndex(seriesKey, index) as PlaneDatapoint, 'raw');
      let result = await this.paraChart.controlPanel.showAnnotDialog(dpId)
      if (result[0] == 'cancel'){
        continue
      }
      const annotationText = result[1]
      if (annotationText) {
      newAnnotationList.push({
        type: "datapoint",
        seriesKey,
        index,
        annotation: `${series}, ${recordLabel}: ${annotationText}`,
        text: annotationText,
        id: `${series}-${recordLabel}-${this.annotID}`,
        isSelected: this.settings.ui.isLowVisionModeEnabled ? false : true,
      });
      this.annotID += 1;
      }
    }
    this.annotations = [...this.annotations, ...newAnnotationList];
  }

  annotatePoint(seriesKey: string, index: number, text: string) {
    if (this.annotations.find((annot: PointAnnotation) =>
      annot.seriesKey === seriesKey && annot.index === index && annot.text === text)) {
      return;
    }
    const recordLabel = formatXYDatapointX(
      this._model!.atKeyAndIndex(seriesKey, index) as PlaneDatapoint, 'raw');
    this.annotations = [...this.annotations, {
      type: 'datapoint',
      seriesKey,
      index,
      annotation: `${seriesKey}, ${recordLabel}: ${text}`,
      text,
      id: `${seriesKey}-${recordLabel}-${this.annotID}`
    } as PointAnnotation];
    this.annotID++;
  }

  async showMDRAnnotations() {
    if (this.type === 'line') {
      if (this.settings.controlPanel.isMDRAnnotationsVisible) {
        let seriesAnalysis;
        let seriesKey: string;
        if (this.visitedDatapoints.size > 0) {
          seriesKey = datapointIdToCursor(this.visitedDatapoints.keys()!.toArray()[0]).seriesKey;
          seriesAnalysis = this.model
            ? await (this.model as PlaneModel).getSeriesAnalysis(seriesKey)
            : undefined;
        } else {
          seriesKey = this.model!.series[0][0].seriesKey;
          seriesAnalysis = this.model
            ? await (this.model as PlaneModel).getSeriesAnalysis(seriesKey)
            : undefined;
        };
        if (!seriesAnalysis) {
          this.log.info("This chart does not support AI trend annotations")
          this.updateSettings(draft => {
            draft.controlPanel.isMDRAnnotationsVisible = !this.settings.controlPanel.isMDRAnnotationsVisible;
          });
          return;
        };
        const length = this.model!.series[0].length - 1;
        let relevantSequences = seriesAnalysis?.messageSeqs.map(i => seriesAnalysis.sequences[i]);
        for (let sequence of relevantSequences!) {
          this.highlightRange(sequence.start / length, (sequence.end - 1) / length);
        };

        this.addModelLineBreaks(seriesAnalysis!.sequences, seriesKey);
        this.addModelTrendLines(seriesAnalysis!.sequences, seriesKey);

        let message = `Detected trend: ${seriesAnalysis?.message}, consisting of ${seriesAnalysis?.messageSeqs.length} datapoint sequences from`;
        for (let seq of relevantSequences!) {
          message += ` ${this.model!.allPoints[seq.start].facetValueNumericized("x")} to ${this.model!.allPoints[seq.end - 1].facetValueNumericized("x")} (${seq.message}),`;
        }
        if (this.annotations.some(a => a.id == "trend-analysis-annotation")) {
          const index = this.annotations.findIndex(a => a.id == "trend-analysis-annotation");
          this.annotations.splice(index, 1);
        }
        this.annotations.push({
          type: 'trend',
          annotation: message,
          id: `trend-analysis-annotation`
        });
      } else {
        this.removeMDRAnnotations();
      }
    } else {
      this.log.info("Trend annotations not currently supported for this chart type");
      this.updateSettings(draft => {
        draft.controlPanel.isMDRAnnotationsVisible = !this.settings.controlPanel.isMDRAnnotationsVisible;
      });
    }
  }

  async removeMDRAnnotations(visitedDatapoints?: Set<string>) {
    let seriesAnalysis: SeriesAnalysis | null = null;
    let seriesKey: string | null = null;
    if (!visitedDatapoints) {
      visitedDatapoints = this.visitedDatapoints;
    }
    if (this.type !== 'line') {
      // No MDR annotations need to be removed
    } else if (visitedDatapoints.size > 0) {
      seriesKey = datapointIdToCursor(this.visitedDatapoints.keys()!.toArray()[0]).seriesKey;
      seriesAnalysis = this.model
        ? await (this.model as PlaneModel).getSeriesAnalysis(seriesKey)
        : null;
    } else {
      seriesKey = this.model!.series[0][0].seriesKey;
      seriesAnalysis = this.model
        ? await (this.model as PlaneModel).getSeriesAnalysis(seriesKey)
        : null;
    }
    const length = this.model!.series[0].length - 1;
    let relevantSequences = seriesAnalysis?.messageSeqs.map(i => seriesAnalysis.sequences[i]);
    for (let sequence of relevantSequences!) {
      this.unhighlightRange(sequence.start / length, (sequence.end - 1) / length);
    }

    if (seriesKey !== null) {
      this.removeModelLineBreaks(seriesAnalysis!.sequences, seriesKey);
      this.removeModelTrendLines(seriesAnalysis!.sequences, seriesKey);
    }

    if (this.annotations.some(a => a.id == "trend-analysis-annotation")) {
      const index = this.annotations.findIndex(a => a.id == "trend-analysis-annotation");
      this.annotations.splice(index, 1);
    }
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
    this._rangeHighlights = [...this._rangeHighlights, { startPortion, endPortion }];
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
    const xLabel = this._model!.getFacet(this.model!.independentFacetKeys[0])!.label; // TODO: Assumes exactly 1 indep facet
    return papa.unparse(this.model!.series[0].datapoints.map((dp, i) => ({
      [xLabel]: formatXYDatapointX(dp as PlaneDatapoint, 'raw'),
      ...Object.fromEntries(this.model!.series.map(s =>
        [s.key, formatXYDatapointY(s[i] as PlaneDatapoint, 'value')]))
    })));
  }

  addModelLineBreaks(sequences: SequenceInfo[], seriesKey: string) {
    const series = this.model!.series.filter(s => s[0].seriesKey == seriesKey)[0]
    const length = series.length - 1
    for (let seq of sequences) {
      this.addLineBreak(seq.start / length, seq.start, seriesKey, true)
    }
    this.addLineBreak((sequences[sequences.length - 1].end - 1) / length, sequences[sequences.length - 1].end - 1, seriesKey, true)

  }

  removeModelLineBreaks(sequences: SequenceInfo[], seriesKey: string) {
    const series = this.model!.series.filter(s => s[0].seriesKey == seriesKey)[0]
    const length = series.length - 1
    for (let seq of sequences) {
      const index = this._modelLineBreaks.findIndex(lb =>
        lb.startPortion === seq.start / length);
      if (index === -1) {
        //throw new Error('range not highlighted');
      }
      else {
        this._modelLineBreaks = this._modelLineBreaks.toSpliced(index, 1);
      }
    }
    const index = this._modelLineBreaks.findIndex(lb =>
      lb.startPortion === (sequences[sequences.length - 1].end - 1) / length);
    if (index === -1) {
      //throw new Error('range not highlighted');
    }
    else {
      this._modelLineBreaks = this._modelLineBreaks.toSpliced(index, 1);
    }
  }

  addLineBreak(startPortion: number, index: number, seriesKey: string, forModel: boolean) {
    if (forModel) {
      if (this._modelLineBreaks.find(lb =>
        lb.startPortion === startPortion)) {
        //throw new Error('range already highlighted');
      }
      else {
        this._modelLineBreaks = [...this._modelLineBreaks, { startPortion: startPortion, seriesKey: seriesKey, index: index }];
      }
    }
    else {
      if (this._userLineBreaks.find(lb =>
        lb.startPortion === startPortion && lb.seriesKey === seriesKey)) {
        //throw new Error('range already highlighted');
      }
      else {
        this._userLineBreaks.push({ startPortion: startPortion, seriesKey: seriesKey, index: index })
      }
    }
  }

  addUserLineBreaks() {
    for (const datapointId of this.selectedDatapoints) {
      //const [seriesKey, index] = keyIdx.split('-');
      const { seriesKey, index } = datapointIdToCursor(datapointId);
      const series = this.model!.series.filter(s => s[0].seriesKey === seriesKey)[0];
      const length = series.length - 1;
      this.addLineBreak(index / length, index, seriesKey, false)
      this.annotations.push({
        type: "lineBreak",
        seriesKey,
        index,
        annotation: `${series.key}, ${series.rawData[index].x}: Added line break`,
        id: `line-break-${index}`
      })
      this.paraChart.postNotice('addLineBreak', { seriesKey, index });
    }
    if (this.userLineBreaks.length) {
      this.clearUserTrendLines();
      for (let seriesKey of new Set(this.userLineBreaks.map(a => { return a.seriesKey }))) {
        let lbs = this.userLineBreaks.filter(a => a.seriesKey === seriesKey).sort((a, b) => a.index - b.index)
        this.addTrendLine(0, lbs[0].startPortion, 0, lbs[0].index + 1, seriesKey, false)
        for (let i = 0; i < lbs.length - 1; i++) {
          this.addTrendLine(lbs[i].startPortion, lbs[i + 1].startPortion, lbs[i].index, lbs[i + 1].index + 1, seriesKey, false)
        }
        const series = this.model!.series.filter(s => s[0].seriesKey == seriesKey)[0]
        const length = series.length - 1
        this.addTrendLine(lbs[lbs.length - 1].startPortion, 1, lbs[lbs.length - 1].index, length + 1, seriesKey, false)
      }
    }
  }


  addModelTrendLines(sequences: SequenceInfo[], seriesKey: string) {
    const series = this.model!.series.filter(s => s[0].seriesKey == seriesKey)[0]
    const length = series.length - 1
    for (let seq of sequences) {
      this.addTrendLine(seq.start / length, (seq.end - 1) / length, seq.start, seq.end, seriesKey, true)
    }
  }

  addTrendLine(startPortion: number, endPortion: number, startIndex: number, endIndex: number, seriesKey: string, forModel: boolean) {
    if (forModel) {
      if (this._modelTrendLines.find(tl =>
        tl.startPortion === startPortion && tl.endPortion === endPortion)) {
        //throw new Error('range already highlighted');
      }
      else {
        this._modelTrendLines = [...this._modelTrendLines, { startPortion: startPortion, endPortion: endPortion, startIndex: startIndex, endIndex: endIndex, seriesKey: seriesKey }];
      }
    }
    else {
      if (this._userTrendLines.find(tl =>
        tl.startPortion === startPortion && tl.endPortion === endPortion && tl.seriesKey === seriesKey)) {
        //throw new Error('range already highlighted');
      }
      else {
        this._userTrendLines = [...this._userTrendLines, { startPortion: startPortion, endPortion: endPortion, startIndex: startIndex, endIndex: endIndex, seriesKey: seriesKey }];
      }
    }
  }

  removeModelTrendLines(sequences: SequenceInfo[], seriesKey: string) {
    const series = this.model!.series.filter(s => s[0].seriesKey == seriesKey)[0]
    const length = series.length - 1
    for (let seq of sequences) {
      const index = this._modelTrendLines.findIndex(tl =>
        tl.startPortion === seq.start / length && tl.endPortion === (seq.end - 1) / length);
      if (index === -1) {
        //throw new Error('range not highlighted');
      }
      else {
        this._modelTrendLines = this._modelTrendLines.toSpliced(index, 1);
      }
    }
  }

  clearUserLineBreaks() {
    this._userLineBreaks = [];
    this.annotations = this.annotations.filter(a => !/line-break/.test(a.id));
    this.paraChart.postNotice('clearLineBreaks', null);
  }

  clearUserTrendLines() {
    this._userTrendLines = [];
  }

  removePopup(id: string) {
    this.popups.splice(this.popups.findIndex(p => p.id === id), 1)
    this.paraChart.paraView.requestUpdate()
  }

  clearPopups() {
    this.popups.splice(0, this.popups.length)
  }

  clipTo(seriesKey: string, index: number) {
    const fraction = this.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey.toLowerCase(), index)!.x / this.paraChart.paraView.documentView!.chartLayers.width
    const oldWidth = this.paraChart.paraView.clipWidth;
    this.paraChart.paraView.clipWidth = Number(fraction)
    for (let dpView of this.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView as PointDatapointView
      dpView.completeLayout();
      pointDpView.stopAnimation()
    }
    for (let dpView of this.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView as PointDatapointView
      pointDpView.alwaysClip = true;
      if (pointDpView.x - 1 <= Number(fraction) * this.paraChart.paraView.documentView!.chartLayers.width
        && pointDpView.x - 1 > oldWidth * this.paraChart.paraView.documentView!.chartLayers.width
      ) {
        pointDpView.popInAnimation()
      }
      else if (pointDpView.x - 1 > Number(fraction) * this.paraChart.paraView.documentView!.chartLayers.width) {
        pointDpView.baseSymbolScale = 0;
      }
      loopParaviewRefresh(this.paraChart.paraView,
        this.paraChart.paraView.store.settings.animation.popInAnimateRevealTimeMs
        , 50);
    }
  }

}
