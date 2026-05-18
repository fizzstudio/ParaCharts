/* ParaCharts: ParaState Data Store
Copyright (C) 2025 Fizz Studio

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

import { BaseState, SettingObserver } from './base_state';
import { Logger, getLogger } from '@fizz/logger';
import papa from 'papaparse';
import { State, property } from '@lit-app/state';
import { produceWithPatches, enablePatches, applyPatches, type Patch } from 'immer';
enablePatches();

import {
  dataFromManifest, type AllSeriesData, type ChartType,
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
  HighlightedSummary, type Highlight,
  formatBox
} from '@fizz/parasummary';

import {
  DeepReadonly, FORMAT_CONTEXT_SETTINGS, Settings, SettingsInput, FormatContext,
  type Setting, type SettingGroup,
} from './settings_types';
import { SettingsManager } from './settings_manager';
import { SettingControlManager } from './settings_controls';
import { defaults, chartTypeDefaults } from './settings_defaults';
import { Config } from '../config/config_types';
import { defaultConfig } from '../config/config_defaults';
import { Colors } from '../common/colors';
import { joinStrArray, trendTranslation } from '../common/utils';
import { DataSymbols } from '../view/symbol';
import { SeriesPropertyManager } from './series_properties';
import { actionMap } from './action_map';
import { KeymapManager } from './keymap_manager';
import { SequenceInfo, SeriesAnalysis } from '@fizz/series-analyzer';
import { Popup } from '../view/popup';
import { type DatapointCursor } from '../view/layers/data/navigation';
import { Point } from '@fizz/chart-classifier-utils';
import { PathShape } from '../view/shape';
import { GlobalState } from './global_state';
import { BaseChartInfo, chartInfoClasses, ScatterChartInfo } from '../chart_types';
import { firstDataset, type Manifest } from '../loader/common';
import { clusterObject } from '@fizz/clustering';
import { ClusterShellView } from '../view/layers';

export type DataState = 'initial' | 'pending' | 'complete' | 'error';

export type AnnounceTarget = 'all' | 'sr' | 'sv' | 'voice' | 'explorationbar';

// This mostly exists so that each new announcement will be considered
// distinct, even if the text is the same
export interface Announcement {
  text: string;
  html: string;
  highlights: Highlight[];
  clear?: boolean;
  startFrom: number;
  target: AnnounceTarget;
}

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

export interface HighlightAxisOptions {
  tierIndex: number;
  labelIndex: number;
  orientation: "horiz" | "vert";
}

const synchronizedSettings = [
  'ui.isFullscreenEnabled',
  'ui.isLowVisionModeEnabled',
  'color.isDarkModeEnabled',
  'chart.fontScale',
  'color.colorPalette',
  'grid.isDrawVertLines',
  'chart.width',
  'chart.height',
];

// NB: Must be disallowed in series keys
const DATAPOINT_ID_SEP = '@';

/**
 * Convert a datapoint ID string of format `${seriesKey}@${index}` into a DatapointCursor.
 * @param id - The ID
 * @returns DatapointCursor
 */
export function datapointIdToCursor(id: string): DatapointCursor {
  const [seriesKey, index] = id.split(DATAPOINT_ID_SEP);
  return {
    seriesKey,
    index: parseInt(index)
  };
}

/**
 * Make a datapoint ID string.
 * @param seriesKey - Series key
 * @param index - Datapoint index
 * @returns Datapoint ID string
 */
export function makeDatapointId(seriesKey: string, index: number): string {
  return `${seriesKey}${DATAPOINT_ID_SEP}${index}`;
}

/**
 * Make a sequence ID string.
 * @param seriesKey - Series key
 * @param index1 - Index of first sequence point.
 * @param index2 - Index of second sequence point (not included in sequence).
 * @returns Sequence ID string
 */
export function makeSequenceId(seriesKey: string, index1: number, index2: number): string {
  return `${seriesKey}${DATAPOINT_ID_SEP}${index1}-${index2}`;
}

export class ParaState extends BaseState {
  readonly symbols = new DataSymbols();

  @property() dataState: DataState = 'initial';
  @property() settings!: Settings;
  @property() darkMode = false;
  @property() announcement: Announcement = { text: '', html: '', highlights: [], startFrom: 0, target: 'all' };
  @property() annotations: BaseAnnotation[] = [];
  @property() popups: Popup[] = [];
  @property() focusPopups: Popup[] = [];
  @property() selectPopups: Popup[] = [];
  @property() crossHairs: Array<{ id: string, popups: Array<PathShape | Popup> }> = [];
  @property() sparkBrailleInfo: SparkBrailleInfo | null = null;
  @property() seriesAnalyses: Record<string, SeriesAnalysis | null> = {};
  @property() clusterAnalyses: clusterObject[] | null = null;
  @property() frontSeries = '';
  @property() pointerCoords: Point = { x: 0, y: 0 }
  @property() isTitleHighlighted = false;
  @property() isHorizontalAxisHighlighted = false;
  @property() isVerticalAxisHighlighted = false;
  @property() isEastLegendHighlighted = false;
  @property() isWestLegendHighlighted = false;
  @property() isNorthLegendHighlighted = false;
  @property() isSouthLegendHighlighted = false;

  @property() protected _caption: HighlightedSummary = { text: '', html: '' };
  @property() protected _pinnedSeriesKey: string | null = null;
  @property() protected _dimmedSeries: string[] = [];
  @property() protected _hiddenSeries: string[] = [];
  @property() protected data: AllSeriesData | null = null;
  @property() protected focused = 'chart';
  @property() protected selected = null;
  @property() protected queryLevel = 'default';
  /** `${seriesKey}-${index}` */
  @property() protected _visitedDatapoints = new Set<string>();
  protected _prevVisitedDatapoints = new Set<string>();
  protected _everVisitedDatapoints = new Set<string>();
  @property() protected _highlightedDatapoints = new Set<string>();
  @property() protected _lowlightedDatapoints = new Set<string>();
  _prevHighlightedElements = new Set<string>();
  @property() protected _selectedDatapoints = new Set<string>();
  @property() protected _crosshairedDatapoints = new Set<string>();
  @property() protected _prevSelectedDatapoints = new Set<string>();
  @property() protected _dataSpaceCrosshairs = new Set<{ x: string, y: string }>();
  /** `${seriesKey}-${index1}-${index2}` */
  @property() protected _highlightedSequences = new Set<string>();
  @property() protected _highlightedIntersections = new Set<number>();
  @property() protected _highlightedClusters = new Set<number>();
  @property() protected _highlightedAxisLabels = new Set<HighlightAxisOptions>();
  @property() protected _rangeHighlights: RangeHighlight[] = [];
  @property() protected _modelLineBreaks: LineBreak[] = [];
  @property() protected _userLineBreaks: LineBreak[] = [];
  @property() protected _modelTrendLines: TrendLine[] = [];
  @property() protected _userTrendLines: TrendLine[] = [];
  @property() protected _clusterShellViews: ClusterShellView[] = [];

  protected _settingControls = new SettingControlManager(this);
  protected _settingObservers: { [path: string]: SettingObserver[] } = {};
  protected _manifest: Manifest | null = null;
  protected _jimerator: Jimerator | null = null;
  protected _model: Model | null = null;
  protected _facets: FacetSignature[] | null = null;
  protected _type: ChartType = 'line';
  protected _title = '';
  protected _seriesProperties: SeriesPropertyManager;
  protected _colors: Colors;
  protected _keymapManager = new KeymapManager(actionMap);
  //protected _summarizer!: Summarizer;
  protected _seriesAnalyzerConstructor?: SeriesAnalyzerConstructor;
  protected _pairAnalyzerConstructor?: PairAnalyzerConstructor;
  protected _annotID: number = 0;
  protected log: Logger = getLogger("ParaState");
  protected _chartInfo!: BaseChartInfo;

  public idList: Record<string, boolean> = {};

  constructor(
    protected _globalState: GlobalState,
    protected _inputSettings: SettingsInput,
    // suppleteSettingsWith?: DeepReadonly<Settings>,
    seriesAnalyzerConstructor?: SeriesAnalyzerConstructor,
    pairAnalyzerConstructor?: PairAnalyzerConstructor
  ) {
    super();
    this._createSettings(_inputSettings);
    this._colors = new Colors(this);
    this._seriesProperties = new SeriesPropertyManager(this);
    this._seriesAnalyzerConstructor = seriesAnalyzerConstructor;
    this._pairAnalyzerConstructor = pairAnalyzerConstructor;
    //this._getUrlAnnotations();
  }

  get globalState() {
    return this._globalState;
  }

  get settingControls() {
    return this._settingControls;
  }

  get type() {
    return this._type;
  }

  get manifest() {
    return this._manifest;
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

  get clusterShellViews() {
    return this._clusterShellViews;
  }

  set clusterShellViews(views: ClusterShellView[]) {
    this._clusterShellViews = views;
  }

  get caption() {
    return this._caption;
  }

  async setCaption(summary?: HighlightedSummary): Promise<void> {
    if (this.dataState === 'complete') {
      if (summary !== undefined) {
        this._caption = summary;
      } else {
        const shouldGetConcise = this.config.description.captionFormat === 'concise';
        const generatedSummary = await (shouldGetConcise
          ? this._chartInfo.summarizer.getConciseSummary()
          : this._chartInfo.summarizer.getChartSummary()
        );
        if (generatedSummary !== undefined) {
          this._caption = generatedSummary;
        } else {
          this._caption = { text: '', html: '' };
        }
      }
    }
  }

  nextAnnotID(): number {
    return this._annotID++;
  }

  get index(): number {
    return this._globalState.paraStates.indexOf(this);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  createChartInfo() {
    // @ts-ignore
    this._chartInfo = new chartInfoClasses[this.type](this.type, this);
  }

  private _configResetCallbacks = new Set<() => void>();

  onConfigReset(cb: () => void): () => void {
    this._configResetCallbacks.add(cb);
    return () => this._configResetCallbacks.delete(cb);
  }

  protected _createSettings(inputSettings: SettingsInput) {
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, defaults);
    this.settings = hydratedSettings as Settings;
    const hydratedConfig = SettingsManager.hydrateInput(inputSettings) as Partial<Config>;
    SettingsManager.suppleteSettings(hydratedConfig, defaultConfig);
    this.config = hydratedConfig as Config;
    SettingsManager.suppleteSettings(this.settings, this.config as unknown as Settings);
    this._configResetCallbacks.forEach(cb => cb());
  }

  protected _syncPatchesToManifest(patches: Patch[]) {
    if (!this._manifest) return;
    this._manifest.extensions ??= {};
    this._manifest.extensions.paracharts ??= {};
    this._manifest.extensions.paracharts.settings ??= {};
    const extSettings = this._manifest.extensions.paracharts.settings;
    for (const patch of patches) {
      if (patch.op === 'replace') {
        extSettings[patch.path.join('.')] = patch.value as string | number | boolean;
      }
    }
  }

  updateSettings(updater: (draft: Settings) => void, ignoreObservers = false) {
    const [newSettings, patches, inversePatches] = produceWithPatches(this.settings, updater);
    this.settings = newSettings;
    const filtered = patches.filter(p => synchronizedSettings.includes(p.path.join('.')));
    const counterpart = this._globalState.paraStates[1 - this.index];
    if (counterpart) {
      counterpart.settings = applyPatches(counterpart.settings, filtered);
    }
    if (ignoreObservers) {
      return patches;
    }
    this._syncPatchesToManifest(patches);
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
      this.settingDidChange(path, values.oldValue, values.newValue);
    }
    return patches;
  }

  updateConfig(updater: (draft: Config) => void, ignoreObservers = false) {
    const [newConfig, patches, inversePatches] = produceWithPatches(this.config, updater);
    this.config = newConfig;
    // const filtered = patches.filter(p => synchronizedSettings.includes(p.path.join('.')));
    // const counterpart = this._globalState.paraStates[1 - this.index];
    // if (counterpart) {
    //   counterpart.config = applyPatches(counterpart.config, filtered);
    // }
    if (ignoreObservers) {
      return patches;
    }
    this._syncPatchesToManifest(patches);
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
      this.settingDidChange(path, values.oldValue, values.newValue);
    }
    return patches;
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

  setManifest(manifest: Manifest, data?: AllSeriesData, resetSettings = true) {
    this._manifest = manifest;
    const dataset = firstDataset(this._manifest);

    if (resetSettings) {
      this._createSettings(this._inputSettings);
    }

    if (chartTypeDefaults[dataset.representation.subtype]) {
      Object.entries(chartTypeDefaults[dataset.representation.subtype]!).forEach(([path, value]) => {
        // this.updateSettings(draft => {
        //   SettingsManager.set(path, value, draft);
        // }, true);
        this.updateConfig(draft => {
          SettingsManager.set(path, value, draft);
        }, true);
      });
    }

    const extSettings = manifest.extensions?.paracharts?.settings;
    if (extSettings) {
      this.updateSettings(draft => {
        SettingsManager.applySettings(extSettings as SettingGroup, draft);
      }, true);
      this.updateConfig(draft => {
        SettingsManager.applySettings(extSettings as SettingGroup, draft);
      }, true);
      if (this.config.color.colorMap) {
        this._colors.setColorMap(...this.config.color.colorMap.split(',').map(c => c.trim()));
      }
    }

    this._jimerator = new Jimerator(this._manifest, data);

    this.seriesAnalyses = {};

    this._type = dataset.representation.subtype;
    this._title = dataset.title;
    this._facets = facetsFromDataset(dataset);

    if (!dataset.href) {
      if (isPastryType(this._type) || isVennType(this._type)) {
        this._model = modelFromInlineData(manifest);
      } else {
        this._model = planeModelFromInlineData(
          manifest,
          this._seriesAnalyzerConstructor,
          this._pairAnalyzerConstructor
        );
      }
      this.createChartInfo();
      // `data` is the subscribed property that causes the paraview
      // to create the doc view; if the series prop manager is null
      // at that point, the chart won't init properly
      //this._seriesProperties = new SeriesPropertyManager(this);
      this._seriesProperties.reset();
      this.data = dataFromManifest(manifest);
    } else if (data) {
      if (isPastryType(this._type) || isVennType(this._type)) {
        this._model = modelFromExternalData(data, manifest);
      } else {
        this._model = planeModelFromExternalData(
          data,
          manifest,
          this._seriesAnalyzerConstructor,
          this._pairAnalyzerConstructor
        );
      }
      this.createChartInfo();
      //this._seriesProperties = new SeriesPropertyManager(this);
      this._seriesProperties.reset();
      this.data = data;
    } else {
      throw new Error('store lacks external or inline chart data');
    }
    const maxError = this.config.chart.maxError;
    const maxSegments = this.config.chart.maxSegments;
    const extremumWeight = this.config.chart.extremumWeight;
    if (this._model instanceof PlaneModel) {
      this._model.seriesKeys.forEach(async (seriesKey) => {
        this.seriesAnalyses = {
          [seriesKey]: await (this._model as PlaneModel).getSeriesAnalysis(seriesKey, { maxError: maxError, maxSegments: maxSegments, extremumWeight: extremumWeight }),
          ...this.seriesAnalyses
        };
      });
    }
    this.postNotice('paranotice', { key: 'manifestSet' });
    this.dispatchEvent(
      new CustomEvent('manifestSet')
    );
  }

  getActionChains() {
    const chains: string[] = [];
    if (this.isTitleHighlighted) {
      chains.push('getTitle().highlight()');
    }
    if (this.isHorizontalAxisHighlighted) {
      chains.push('getHorizontalAxis().highlight()');
    }
    if (this.isVerticalAxisHighlighted) {
      chains.push('getVerticalAxis().highlight()');
    }
    if (this.isEastLegendHighlighted) {
      chains.push('getLegend(east).highlight()');
    }
    if (this.isWestLegendHighlighted) {
      chains.push('getLegend(west).highlight()');
    }
    if (this.isNorthLegendHighlighted) {
      chains.push('getLegend(north).highlight()');
    }
    if (this.isSouthLegendHighlighted) {
      chains.push('getLegend(south).highlight()');
    }
    this._rangeHighlights.forEach(highlight => {
      chains.push(`getRange(${highlight.startPortion}, ${highlight.endPortion}).highlight()`);
    });
    this._highlightedIntersections.forEach(index => {
      chains.push(`getIntersection(${index}).highlight()`);
    });
    this._dimmedSeries.forEach(series => {
      chains.push(`getSeries(${series}).dim()`);
    });
    this._hiddenSeries.forEach(series => {
      chains.push(`getSeries(${series}).hide()`);
    });
    this._visitedDatapoints.forEach(id => {
      const cursor = datapointIdToCursor(id);
      chains.push(`getSeries(${cursor.seriesKey}).getPoint(${cursor.index}).visit()`);
    });
    this._selectedDatapoints.forEach(id => {
      const cursor = datapointIdToCursor(id);
      chains.push(`getSeries(${cursor.seriesKey}).getPoint(${cursor.index}).select()`);
    });
    this._highlightedDatapoints.forEach(id => {
      const cursor = datapointIdToCursor(id);
      chains.push(`getSeries(${cursor.seriesKey}).getPoint(${cursor.index}).highlight()`);
    });
    return chains;
  }

  startTourGuide() {
    this.clearSelected();
    this.clearAllHighlights();
    this.clearPopups();
    this._chartInfo.navMap!.root.goTo('top', {}, true);
  }

  endTourGuide() {
    this.clearSelected();
    this.clearAllHighlights();
    this.clearPopups();
    this.chartInfo.navMap!.root.goTo('top', {}, true);
  }

  dimSeries(seriesKey: string) {
    if (!this._dimmedSeries.includes(seriesKey)) {
      this._dimmedSeries = [...this._dimmedSeries, seriesKey];
    }
  }

  clearSeriesDimming(seriesKey: string) {
    if (this._dimmedSeries.includes(seriesKey)) {
      this._dimmedSeries = this._dimmedSeries.filter(el => el !== seriesKey);
    }
  }

  isSeriesDimmed(seriesKey: string): boolean {
    return this._dimmedSeries.includes(seriesKey);
  }

  dimOtherSeries(...seriesKeys: string[]) {
    this._dimmedSeries = this._model!.seriesKeys.filter(key => !seriesKeys.includes(key));
  }

  dimOtherCluster(seriesKey: string, index: number) {
    const chartInfo = this.chartInfo as ScatterChartInfo;
    const otherDatapoints = chartInfo._clustering!.filter(c => c.id !== index).map(
      c => { return [...c.dataPointIDs, ...c.outlierIDs] }).flat();
    otherDatapoints.map(id => this.lowlightDatapoint(seriesKey, id))
  }

  clearAllSeriesDimming() {
    this._dimmedSeries = [];
  }

  clearAllPointsDimming() {
    this._lowlightedDatapoints = new Set();
  }

  get pinnedSeriesKey(): string | null {
    return this._pinnedSeriesKey;
  }

  pinSeries(seriesKey: string) {
    this._pinnedSeriesKey = seriesKey;
    this.dimOtherSeries(seriesKey);
  }

  unpinSeries() {
    this._pinnedSeriesKey = null;
    this.clearAllSeriesDimming();
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
    startFrom = 0,
    target: AnnounceTarget = 'all'
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
      announcement = joinStrArray(msg, linebreak);
      html = announcement;
    } else {
      announcement = msg.text;
      html = msg.html;
      highlights = msg.highlights ?? [];
    }

    if (this.config.ui.isAnnouncementEnabled) {
      this.announcement = { text: announcement, html, highlights, clear: clearAriaLive, startFrom, target };
    }
  }

  getDatapoint(datapointId: string): Datapoint {
    const cursor = datapointIdToCursor(datapointId);
    const datapoint = this._model!.atKeyAndIndex(cursor.seriesKey, cursor.index);
    if (!datapoint) throw new Error(`no datapoint with ID '${datapointId}'`);
    return datapoint;
  }

  get visitedDatapoints() {
    return this._visitedDatapoints;
  }

  get prevVisitedDatapoints() {
    return this._prevVisitedDatapoints;
  }

  get prevHighlightedElements() {
    return this._prevHighlightedElements;
  }

  get everVisitedDatapoints() {
    return this._everVisitedDatapoints;
  }

  visit(datapoints: Datapoint[]) {
    this._prevVisitedDatapoints = this._visitedDatapoints;
    this._visitedDatapoints = new Set();
    datapoints.forEach(datapoint => {
      this._visitedDatapoints.add(makeDatapointId(datapoint.seriesKey, datapoint.datapointIndex));
    });
    for (const datapoint of datapoints) {
      this._everVisitedDatapoints.add(makeDatapointId(datapoint.seriesKey, datapoint.datapointIndex));
    }
    if (this.config.controlPanel.isMDRAnnotationsVisible) {
      if (this._prevVisitedDatapoints.size > 0) {
        this.removeMDRAnnotations(this._prevVisitedDatapoints);
      }
      this.showMDRAnnotations();
    }
    // NB: Making _visitedDatapoints a lit-app/state property proved
    // problematic for performance
    //this.requestUpdate();
  }

  protected _datapointSetHas(
    seriesKey: string, index: number, collection: Set<string>
  ): boolean {
    return collection.has(`${seriesKey}${DATAPOINT_ID_SEP}${index}`);
  }

  isVisited(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._visitedDatapoints);
  }

  isVisitedSeries(seriesKey: string) {
    return this._visitedDatapoints.values().some(value => value.startsWith(seriesKey + DATAPOINT_ID_SEP));
  }

  wasVisited(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._prevVisitedDatapoints);
  }

  wasVisitedSeries(seriesKey: string) {
    return this._prevVisitedDatapoints.values().some(value => value.startsWith(seriesKey + DATAPOINT_ID_SEP));
  }

  everVisited(seriesKey: string, index: number): boolean {
    return this._datapointSetHas(seriesKey, index, this._everVisitedDatapoints);
  }

  everVisitedSeries(seriesKey: string): boolean {
    return this._everVisitedDatapoints.values().some(value => value.startsWith(seriesKey + DATAPOINT_ID_SEP));
  }

  clearVisited() {
    this._prevVisitedDatapoints = this._visitedDatapoints;
    this._visitedDatapoints = new Set();
  }

  get highlightedDatapoints() {
    return this._highlightedDatapoints;
  }

  get lowlightedDatapoints() {
    return this._lowlightedDatapoints;
  }

  highlightDatapoint(seriesKey: string, index: number) {
    this._highlightedDatapoints = new Set([
      ...this._highlightedDatapoints.values(),
      makeDatapointId(seriesKey, index)
    ]);
  }

  clearDatapointHighlight(seriesKey: string, index: number) {
    this._highlightedDatapoints = new Set(
      [...this._highlightedDatapoints.values()].filter(id => id !== makeDatapointId(seriesKey, index))
    );
  }

  get crosshairedDatapoints() {
    return this._crosshairedDatapoints;
  }

  get dataSpaceCrosshairs() {
    return this._dataSpaceCrosshairs;
  }

  addDatapointCrosshair(seriesKey: string, index: number) {
    this._crosshairedDatapoints = new Set([
      ...this._crosshairedDatapoints.values(),
      makeDatapointId(seriesKey, index)
    ]);
  }

  clearDatapointCrosshair(seriesKey: string, index: number) {
    this._crosshairedDatapoints = new Set(
      [...this._crosshairedDatapoints.values()].filter(id => id !== makeDatapointId(seriesKey, index))
    );
  }

  addDataSpaceCrosshair(x: string, y: string) {
    this._dataSpaceCrosshairs = new Set([
      ...this._dataSpaceCrosshairs.values(),
      { x: x, y: y }
    ]);
  }

  clearDataSpaceCrosshair(x: string, y: string) {
    this._dataSpaceCrosshairs = new Set(
      [...this._dataSpaceCrosshairs.values()].filter(ch => ch.x !== x || ch.y !== y)
    );
  }

  isDatapointHighlighted(seriesKey: string, index: number): boolean {
    return this._highlightedDatapoints.has(makeDatapointId(seriesKey, index));
  }

  isDatapointLowlighted(seriesKey: string, index: number): boolean {
    return this._lowlightedDatapoints.has(makeDatapointId(seriesKey, index));
  }

  lowlightDatapoint(seriesKey: string, index: number) {
    this._lowlightedDatapoints.add(
      makeDatapointId(seriesKey, index)
    );
  }

  clearDatapointLowlight(seriesKey: string, index: number) {
    this._lowlightedDatapoints = new Set(
      [...this._lowlightedDatapoints.values()].filter(id => id !== makeDatapointId(seriesKey, index))
    );
  }


  clearAllDatapointHighlights() {
    this._highlightedDatapoints = new Set();
  }

  get highlightedSequences() {
    return this._highlightedSequences;
  }

  highlightSequence(seriesKey: string, index1: number, index2: number) {
    this._highlightedSequences = new Set([
      ...this._highlightedSequences.values(),
      makeSequenceId(seriesKey, index1, index2)
    ]);
  }

  clearSequenceHighlight(seriesKey: string, index1: number, index2: number) {
    this._highlightedSequences = new Set(
      [...this._highlightedSequences.values()].filter(id => id !== makeSequenceId(seriesKey, index1, index2))
    );
  }

  clearAllSequenceHighlights() {
    this._highlightedSequences = new Set();
  }

  get highlightedIntersections(): Set<number> {
    return this._highlightedIntersections;
  }

  highlightIntersection(index: number) {
    this._highlightedIntersections = new Set([
      ...this._highlightedIntersections.values(),
      index
    ]);
  }

  highlightCluster(index: number) {
    this._highlightedClusters = new Set([
      ...this._highlightedClusters.values(),
      index
    ]);
  }

  get highlightedClusters() {
    return this._highlightedClusters;
  }

  clearIntersectionHighlight(index: number) {
    for (let intersection of Array.from(this._highlightedIntersections)) {
      this.removeCrosshair(`intersection-${intersection}`)
    }
    this._highlightedIntersections = new Set(
      [...this._highlightedIntersections.values()].filter(idx => idx !== index)
    );
  }

  clearAllAxisLabelHighlights() {
    this._highlightedAxisLabels = new Set();
  }

  get highlightedAxisLabels(): Set<HighlightAxisOptions> {
    return this._highlightedAxisLabels;
  }

  highlightAxisLabel(options: HighlightAxisOptions) {
    this._highlightedAxisLabels = new Set([
      ...this._highlightedAxisLabels.values(),
      { tierIndex: options.tierIndex, labelIndex: options.labelIndex, orientation: options.orientation }
    ]);
  }

  clearAxisLabelHighlight(options: HighlightAxisOptions) {
    this._highlightedAxisLabels = new Set(
      [...this._highlightedAxisLabels.values()].filter(l => (l.labelIndex !== options.labelIndex
        || l.tierIndex !== options.tierIndex
        || l.orientation !== options.orientation))
    );
  }

  clearAllIntersectionHighlights() {
    this._highlightedIntersections = new Set();
  }

  clearAllHighlights() {
    this.clearAllDatapointHighlights();
    this.clearAllSequenceHighlights();
    this.clearAllIntersectionHighlights();
    this.clearAllRangeHighlights();
    this.clearAllSeriesDimming();
    this.clearAllAxisLabelHighlights();
    this._highlightedClusters = new Set();
    this._clusterShellViews = [];
    this.isTitleHighlighted = false;
    this.isHorizontalAxisHighlighted = false;
    this.isVerticalAxisHighlighted = false;
    this.isEastLegendHighlighted = false;
    this.isWestLegendHighlighted = false;
    this.isNorthLegendHighlighted = false;
    this.isSouthLegendHighlighted = false;
    this.updateConfig(draft => {
      draft.type.scatter.isShowTrendLine = false
    });
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
    return this._selectedDatapoints.values().some(value => value.startsWith(seriesKey + DATAPOINT_ID_SEP));
  }

  wasSelected(seriesKey: string, index: number) {
    return this._datapointSetHas(seriesKey, index, this._prevSelectedDatapoints);
  }

  wasSelectedSeries(seriesKey: string) {
    return this._prevSelectedDatapoints.values().some(value => value.startsWith(seriesKey + DATAPOINT_ID_SEP));
  }

  clearSelected() {
    this._prevSelectedDatapoints = this._selectedDatapoints;
    this._selectedDatapoints = new Set();
  }

  getFormatType(context: FormatContext): FormatType {
    return context === 'domId' ? 'domId'
      : SettingsManager.get(FORMAT_CONTEXT_SETTINGS[context], this.settings) as FormatType;
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
      id: `${seriesKey}-${recordLabel}-${this._annotID}`,
      isSelected: true
    } as PointAnnotation];
    this._annotID++;
  }

  async showMDRAnnotations() {
    if (this.type === 'line') {
      if (this.config.controlPanel.isMDRAnnotationsVisible) {
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
          this.updateConfig(draft => {
            draft.controlPanel.isMDRAnnotationsVisible = !this.config.controlPanel.isMDRAnnotationsVisible;
          });
          return;
        };
        const length = this.model!.series[0].length - 1;
        let relevantSequences = seriesAnalysis?.sequences
        for (let sequence of relevantSequences!) {
          this.highlightRange(sequence.start / length, (sequence.end - 1) / length);
        };

        this.addModelLineBreaks(seriesAnalysis!.sequences, seriesKey);
        this.addModelTrendLines(seriesAnalysis!.sequences, seriesKey);

        let message = `Detected trend: ${seriesAnalysis?.sequences.length} datapoint sequences from`;
        for (let seq of relevantSequences!) {
          const start = formatBox(this.model!.allPoints[seq.start].facetBox("x")!, this.getFormatType('horizTick'));
          const end = formatBox(this.model!.allPoints[seq.end - 1].facetBox("x")!, this.getFormatType('horizTick'));
          message += ` ${start} to ${end} (${trendTranslation[seq.slopeInfo.classes[0]]}),`;
        }
        message = message.slice(0, -1) + ".";
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
      this.updateConfig(draft => {
        draft.controlPanel.isMDRAnnotationsVisible = !this.config.controlPanel.isMDRAnnotationsVisible;
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
      seriesKey = datapointIdToCursor(visitedDatapoints.keys()!.toArray()[0]).seriesKey;
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
    let relevantSequences = seriesAnalysis?.sequences;
    for (let sequence of relevantSequences!) {
      this.clearRangeHighlight(sequence.start / length, (sequence.end - 1) / length);
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
      this.log.warn(`attempting to highlight already highlighted range: ${[startPortion, endPortion]}`);
      return;
    }
    this._rangeHighlights = [...this._rangeHighlights, { startPortion, endPortion }];
  }

  clearRangeHighlight(startPortion: number, endPortion: number) {
    const index = this._rangeHighlights.findIndex(rhl =>
      rhl.startPortion === startPortion && rhl.endPortion === endPortion);
    if (index === -1) {
      this.log.warn(`attempting to unhighlight unhighlighted already range: ${[startPortion, endPortion]}`);
      return;
    }
    this._rangeHighlights = this._rangeHighlights.toSpliced(index, 1);
  }

  clearAllRangeHighlights() {
    this._rangeHighlights = [];
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
      this.postNotice('addLineBreak', { seriesKey, index });
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
    this.postNotice('clearLineBreaks', null);
  }

  clearUserTrendLines() {
    this._userTrendLines = [];
  }

  removePopup(id: string) {
    this.popups.splice(this.popups.findIndex(p => p.id === id), 1);
    this.requestUpdate();
  }

  removeCrosshair(id: string) {
    this.crossHairs.splice(this.crossHairs.findIndex(p => p.id === id), 1);
    this.requestUpdate();
  }

  clearPopups() {
    this.popups.splice(0, this.popups.length);
    this.focusPopups.splice(0, this.focusPopups.length);
    this.selectPopups.splice(0, this.selectPopups.length);
    this.crossHairs.splice(0, this.crossHairs.length);
  }

  async shortDescription(): Promise<HighlightedSummary> {
    return this.chartInfo.summarizer.getRequestedSummaries(['$.datasets[0]._short']);
  }

}
