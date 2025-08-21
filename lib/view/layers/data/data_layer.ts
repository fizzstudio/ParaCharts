/* ParaCharts: Data Layers
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

import { ref } from 'lit/directives/ref.js';

import { ChartLayer } from '..';
import { type ChartLayerManager } from '..';
import { type PlotSettings, type DeepReadonly, type Direction, HorizDirection } from '../../../store/settings_types';
import { Sonifier } from '../../../audio/sonifier';
//import { type Model, type DatapointReference } from '../data/model';
//import { type ActionRegistration } from '../input';
//import { keymaps } from '../input';
//import { hotkeyActions, type TodoEventType } from '../input/defaultactions';
//import { type Actions } from '../input/actions';
import { ParaView } from '../../../paraview';
import { SettingsManager } from '../../../store/settings_manager';
import { type AxisInfo } from '../../../common/axisinfo';
import { ChartLandingView, DatapointView, SeriesView, type DataView } from '../../data';
import { type LegendItem } from '../../legend';
import { queryMessages } from '../../../store/query_utils';
import { NavMap, NavLayer, NavNode, NavNodeType, SequenceNavNodeOptions } from './navigation';

import { interpolate } from '@fizz/templum';
import { StyleInfo } from 'lit/directives/style-map.js';
import { Datapoint } from '@fizz/paramodel';
import { SparkBrailleInfo } from '../../../store';
import { bboxOfBboxes } from '../../../common/utils';

/**
 * @public
 */
export type LandingView = ChartLandingView | DataView;

export type RiffOrder = 'normal' | 'sorted' | 'reversed';


// Soni Constants
export const SONI_PLAY_SPEEDS = [1000, 250, 100, 50, 25];
export const SONI_RIFF_SPEEDS = [450, 300, 150, 100, 75];

/**
 * Abstract base class for a data layer view where chart datapoints are rendered.
 * @public
 */
export abstract class DataLayer extends ChartLayer {

  declare protected _parent: ChartLayerManager;

  soniNoteIndex = 0;
  soniSequenceIndex = 0;

  protected _navMap: NavMap | null = null;
  protected _sonifier!: Sonifier;
  protected visibleSeries!: string[];
  protected _chartLandingView!: ChartLandingView;
  protected _playInterval: ReturnType<typeof setTimeout> | null = null;
  protected _speedRateIndex = 1;
  protected _axisInfo: AxisInfo | null = null;

  // soni variables
  protected _soniInterval: ReturnType<typeof setTimeout> | null = null;
  protected _soniRiffInterval: ReturnType<typeof setTimeout> | null = null;
  protected _soniSpeedRateIndex = 1;
  protected _soniRiffSpeedRateIndex = 1;

  protected _chordPrevSeriesKey = '';

  constructor(paraview: ParaView, public readonly dataLayerIndex: number) {
    super(paraview);
  }

  protected _createId() {
    return super._createId('data');
  }

  protected _addedToParent() {
    super._addedToParent();
    this._sonifier = new Sonifier(this, this.paraview.store);
    //this.visibleSeries = Array.from(this._model.depVars);
    this._chartLandingView = new ChartLandingView(this.paraview);
    this.append(this._chartLandingView);
  }

  get managedSettingKeys() {
    return [`type.${this._parent.docView.type}`];
  }

  get settings(): DeepReadonly<PlotSettings> {
    return SettingsManager.getGroupLink(this.managedSettingKeys[0], this.paraview.store.settings);
  }

  get navMap() {
    return this._navMap;
  }

  get sonifier() {
    return this._sonifier;
  }

  get chartLandingView() {
    return this._chartLandingView;
  }

  get datapointViews() {
    return this._chartLandingView.datapointViews;
  }

  get visitedDatapointViews() {
    return this.datapointViews.filter(v =>
      this.paraview.store.isVisited(v.seriesKey, v.index)
    );
  }

  get selectedDatapointViews() {
    return this.datapointViews.filter(v =>
      this.paraview.store.isSelected(v.seriesKey, v.index)
    );
  }

  get dataset() {
    return this.paraview.ref<SVGGElement>(`dataset${this.index}`).value!;
  }

  get axisInfo() {
    return this._axisInfo;
  }

  get role() {
    return 'dataset';
  }

  get ref() {
    return ref(this.paraview.ref<SVGGElement>(`dataset${this.index}`));
  }

  init() {
    // At this point, we're fully connected to the root of the view tree,
    // so we can safely observe
    this._observeStore();
    this._layoutDatapoints();
    this._createNavMap();
  }

  protected _createNavMap() {
    this._navMap = new NavMap(this.paraview.store, this);
    const root = this._navMap.layer('root')!;
    // Chart landing (visits no points)
    const chartLandingNode = new NavNode(root, 'top', {});
    root.registerNode(chartLandingNode);
    root.cursor = chartLandingNode;
  }

  /**
   * Stroke width for visited datapoints. Can be overridden.
   */
  get visitedStrokeWidth(): number {
    const visitedScale = this.paraview.store.settings.chart.strokeHighlightScale;
    return this.paraview.store.settings.chart.strokeWidth*visitedScale;
  }

  /**
   * Mutate `styleInfo` with any custom series styles.
   * @param styleInfo
   */
  updateSeriesStyle(_styleInfo: StyleInfo) {
  }

  protected abstract _createDatapoints(): void;

  protected _beginDatapointLayout() {
    this._createDatapoints();
    for (const datapointView of this.datapointViews) {
      datapointView.computeLocation();
    }
  }

  protected _completeDatapointLayout() {
    for (const datapointView of this.datapointViews) {
      datapointView.completeLayout();
    }
  }

  protected _layoutDatapoints() {
    this._beginDatapointLayout();
    this._completeDatapointLayout();
  }

  // protected _layoutComponents() {
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.computeLocation();
  //   }
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.completeLayout();
  //   }
  //   //this._layoutSymbols();
  // }

  protected _newDatapointView(seriesView: SeriesView, ..._rest: any[]): DatapointView {
    return new DatapointView(seriesView);
  }

  protected _newSeriesView(seriesKey: string, isStyleEnabled?: boolean, ..._rest: any[]): SeriesView {
    return new SeriesView(this, seriesKey, isStyleEnabled);
  }

  legend(): LegendItem[] {
    return [];
  }

  datapointView(seriesKey: string, index: number) {
    return this.datapointViews.find(view =>
      view.seriesKey === seriesKey && view.index === index);
  }

  datapointViewForId(id: string) {
    return this.datapointViews.find(dp => dp.id === id);
  }

  navToDatapoint(seriesKey: string, index: number) {
    this._navMap!.goTo('datapoint', {seriesKey, index});
  }

  async move(dir: Direction) {
    await this._navMap!.cursor!.move(dir);
  }

  /**
   * Navigate to the series minimum/maximum datapoint
   * @param isMin - If true, go the the minimum. Otherwise, go to the maximum
   */
  goSeriesMinMax(isMin: boolean) {
    const node = this._navMap!.cursor;
    if (node.type === 'top' || node.type === 'chord') {
      this.goChartMinMax(isMin);
    } else {
      let datapoint: Datapoint | null = null;

      const seriesKey = node.at(0)!.seriesKey;

      if (node.type === 'datapoint') {
        datapoint = node.at(0)!.datapoint;
      }
      const depKey = this.paraview.store.model!.dependentFacetKeys[0]!; // TODO: Assumes exactly 1 dep facet
      const stats = this.paraview.store.model!.atKey(seriesKey)!.getFacetStats(depKey)!;
      let seriesMatchArray = isMin
        ? stats.min.datapoints
        : stats.max.datapoints;
      if (datapoint && seriesMatchArray.length > 1) {
        // TODO: If there is more than one datapoint that has the same series minimum value,
        //       find the next one to nav to:
        //       Find the current x label, if it matches one in `seriesMins`,
        //       remove all entries up to and including that point,
        //       and use the next item on the list.
        //       But also cycle around if it's the last item in the list
        const currentRecordIndex = seriesMatchArray.findIndex(dp => dp === datapoint);
        if (currentRecordIndex !== -1 && currentRecordIndex !== seriesMatchArray.length + 1) {
          seriesMatchArray = seriesMatchArray.toSpliced(0, currentRecordIndex);
        }
      }
      this._navMap!.goTo('datapoint', {
        seriesKey: seriesMatchArray[0].seriesKey,
        index: seriesMatchArray[0].datapointIndex
      });
    }
  }

  /**
   * Navigate to (one of) the chart minimum/maximum datapoint(s)
   * @param isMin - If true, go the the minimum. Otherwise, go to the maximum
   */
  goChartMinMax(isMin: boolean) {
    const stats = this.paraview.store.model!.getFacetStats('y')!;
    const matchTarget = isMin ? stats.min.value : stats.max.value;
    const matchDatapoint = this.paraview.store.model!.allPoints.find(dp =>
      dp.facetValueAsNumber('y') === matchTarget)!;
    this._navMap!.goTo('datapoint', {
      seriesKey: matchDatapoint?.seriesKey,
      index: matchDatapoint?.datapointIndex
    });
  }

  /**
   * Clear outstanding play intervals/timeouts
   */
  clearPlay() {
    clearInterval(this._soniInterval!);
    clearInterval(this._soniRiffInterval!);

    // stop self-voicing of current passage
    //todo().controller.voice.shutUp();
  }

  /**
   * Play all datapoints in the given direction.
   */
  abstract playDir(dir: HorizDirection): void;

  /** Play a riff for the current nav node */
  protected abstract _playRiff(order?: RiffOrder): void;

  protected _chordRiffOrder(): RiffOrder {
    return 'normal';
  }

  protected abstract _playDatapoints(datapoints: Datapoint[]): void;

  selectCurrent(extend = false) {
    const cursor = this._navMap!.cursor;
    if (cursor.type === 'series') {
      cursor.at(0)!.parent.select(extend);
    }
    else if (cursor.type === 'sequence') {
      //Replace this with dedicated select() method at some point
      if (extend) {
        this.paraview.store.extendSelection(this.paraview.store.visitedDatapoints);
      } else {
        this.paraview.store.select(this.paraview.store.visitedDatapoints);
      }
    }
    else if (cursor.type === 'cluster') {
      //Replace this with dedicated select() method at some point
      if (extend) {
        this.paraview.store.extendSelection(this.paraview.store.visitedDatapoints);
      } else {
        this.paraview.store.select(this.paraview.store.visitedDatapoints);
      }
    }
    else {
      cursor.at(0)!.select(extend);
    }
  }

  clearDatapointSelection(quiet = false) {
    this.paraview.store.select([]);
    if (!quiet) {
      this.paraview.store.announce('No items selected.');
    }
  }

  // protected _layoutSymbols() {
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.layoutSymbol();
  //   }
  // }

  // NOTE: This should be overriden in subclasses
  queryData(): void {
    const queryType = this._navMap!.cursor.type;
    this.paraview.store.announce(`[ParaChart/Internal] Error: DataLayer.queryData should be overriden. Query Type: ${queryType}`);
  }

  protected _raiseSeries(_series: string) {
  }

  protected abstract _sparkBrailleInfo(): SparkBrailleInfo | null;

  async navRunDidStart(cursor: NavNode) {
    if (cursor.type === 'series' || cursor.type === 'datapoint') {
    const seriesKey = cursor.at(0)?.seriesKey ?? '';
      this._raiseSeries(seriesKey);
    }
  }

  async navRunDidEnd(cursor: NavNode) {
    const seriesKey = cursor.at(0)?.seriesKey ?? '';
    if (cursor.type === 'top') {
      await this.paraview.store.asyncAnnounce(this.paraview.summarizer.getChartSummary());
    } else if (cursor.type === 'series') {
      this.paraview.store.announce(
        await this.paraview.summarizer.getSeriesSummary(seriesKey));
      this._playRiff();
      this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
    } else if (cursor.type === 'datapoint') {
      // NOTE: this needs to be done before the datapoint is visited, to check whether the series has
      //   ever been visited before this point
      const seriesPreviouslyVisited = this.paraview.store.everVisitedSeries(seriesKey);
      const announcements = [this.paraview.summarizer.getDatapointSummary(cursor.at(0)!.datapoint, 'statusBar')];
      const isSeriesChange = !this.paraview.store.wasVisitedSeries(seriesKey);
      if (isSeriesChange) {
        announcements[0] = `${seriesKey}: ${announcements[0]}`;
        if (!seriesPreviouslyVisited) {
          const seriesSummary = await this.paraview.summarizer.getSeriesSummary(seriesKey);
          announcements.push(seriesSummary);
        }
      }
      this.paraview.store.announce(announcements);
      if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
        this._playDatapoints([cursor.at(0)!.datapoint]);
      }
      this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
    } else if (cursor.type === 'chord') {
      if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
        if (this.paraview.store.settings.sonification.isArpeggiateChords) {
          this._playRiff(this._chordRiffOrder());
        } else {
          this._playDatapoints(cursor.datapointViews.map(view => view.datapoint));
        }
      }
    } else if (cursor.type === 'sequence') {
      this.paraview.store.announce(this.paraview.summarizer.getSequenceSummary(cursor.options as SequenceNavNodeOptions));
      this._playRiff();
    }
  }

  navFirst() {
    const type = this._navMap!.cursor.type;
    if (['datapoint', 'chord', 'series'].includes(type)) {
      const dir: Partial<Record<NavNodeType, Direction>> = {
        datapoint: 'left',
        chord: 'left',
        series: 'up'
      };
      this._navMap!.cursor.allNodes(dir[type]!, type).at(-1)?.go();
    }
  }

  navLast() {
    const type = this._navMap!.cursor.type;
    if (['datapoint', 'chord', 'series'].includes(type)) {
      const dir: Partial<Record<NavNodeType, Direction>> = {
        datapoint: 'right',
        chord: 'right',
        series: 'down'
      };
      this._navMap!.cursor.allNodes(dir[type]!, type).at(-1)?.go();
    }
  }

  navToChordLanding() {
    //Add to this list when adding chord support for additional chart types
    if (['line', 'bar', 'column'].includes(this.paraview.store.type) && this.paraview.store.model!.series.length > 1) {
      if (this._navMap!.cursor.isNodeType('datapoint')) {
        const seriesKey = this._navMap!.cursor.options.seriesKey;
        this._navMap!.cursor.layer.goTo('chord', this._navMap!.cursor.options.index);
        this._chordPrevSeriesKey = seriesKey;
      } else if (this._navMap!.cursor.isNodeType('chord')) {
        this._navMap!.cursor.layer.goTo(
          'datapoint', {
          seriesKey: this._chordPrevSeriesKey,
          index: this._navMap!.cursor.options.index
        });
      }
    }
    else {
      console.log("Chord mode not supported for this chart type")
    }
  }

  get shouldDrawFocusRing() {
    return this._navMap!.cursor.type !== 'top';
  }

  focusRingBbox() {
    if (['series', 'chord', 'datapoint', 'sequence'].includes(this._navMap!.cursor.type)) {
      return bboxOfBboxes(...this._navMap!.cursor.datapointViews.map(view => view.outerBbox));
    }
    return null;
  }

  handlePan(startX: number, startY: number, endX: number, endY: number){}

  handleZoom(x: number, y: number){}
}
