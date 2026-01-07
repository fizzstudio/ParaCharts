/* ParaCharts: Base Chart Info
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

import {
  type PlotSettings, type DeepReadonly, type Direction, HorizDirection, Setting
} from '../store/settings_types';
import { SettingsManager } from '../store/settings_manager';
import { type AxisInfo } from '../common/axisinfo';
import { type LegendItem } from '../view/legend';
import { NavMap, NavLayer, NavNode, NavNodeType, DatapointNavNodeType } from '../view/layers/data/navigation';
import { Logger, getLogger } from '../common/logger';
import { ParaStore, PointAnnotation, type SparkBrailleInfo, datapointIdToCursor } from '../store';
import { Sonifier } from '../audio/sonifier';
import { type AxisCoord } from '../view/axis';

import { Datapoint } from '@fizz/paramodel';
import { ChartType } from '@fizz/paramanifest';
import { Summarizer, formatBox, Highlight, summarizerFromModel } from '@fizz/parasummary';
import { Interval } from '@fizz/chart-classifier-utils';

import { Unsubscribe } from '@lit-app/state';
import { DocumentView } from '../view/document_view';


/**
 * @public
 */

export type RiffOrder = 'normal' | 'sorted' | 'reversed';

/**
 * Abstract base class for business logic pertaining to any type of chart.
 * @public
 */
export abstract class BaseChartInfo {
  protected log: Logger = getLogger("BaseChartInfo");
  protected _navMap: NavMap | null = null;
  protected _axisInfo: AxisInfo | null = null;
  protected _summarizer!: Summarizer;
  protected _storeChangeUnsub!: Unsubscribe;
  protected _chordPrevSeriesKey = '';
  protected _sonifier!: Sonifier;
  protected _soniInterval: ReturnType<typeof setTimeout> | null = null;
  protected _soniRiffInterval: ReturnType<typeof setTimeout> | null = null;
  protected _prevHighlightNavcode = '';

  constructor(protected _type: ChartType, protected _store: ParaStore) {
    this._init();
    this._addSettingControls();
  }

  protected _addSettingControls() {
    this._store.settingControls.add({
      type: 'textfield',
      key: 'chart.size.width',
      label: 'Width',
      options: {
        inputType: 'number',
        min: 1,
        max: 1000
      },
      parentView: 'controlPanel.tabs.chart.general.width',
    });
    this._store.settingControls.add({
      type: 'textfield',
      key: 'chart.size.height',
      label: 'Height',
      options: {
        inputType: 'number',
        min: 1,
        max: 1000
      },
      parentView: 'controlPanel.tabs.chart.general.height',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'chart.isShowPopups',
      label: 'Show popups',
      parentView: 'controlPanel.tabs.chart.popups',
    });
  }

  protected _init() {
    this._createNavMap();
    this._sonifier = new Sonifier(this, this._store);
    this._storeChangeUnsub = this._store.subscribe(async (key, value) => {
      if (key === 'data' && this._store.type !== 'venn') {
        this._createSummarizer();
      }
    });
    // We initially get created after the data has loaded, so the above
    // callback won't run
	if(this._store.type !== 'venn') {
      this._createSummarizer();
	}	
  }

  protected _createSummarizer(): void {
    this._summarizer = summarizerFromModel(this._store.model!);
  }

  get summarizer(): Summarizer {
    return this._summarizer;
  }

  get managedSettingKeys() {
    return [`type.${this._type}`];
  }

  get settings(): DeepReadonly<PlotSettings> {
    return SettingsManager.getGroupLink(this.managedSettingKeys[0], this._store.settings);
  }

  get navMap() {
    return this._navMap;
  }

  /** Overridden by ScatterChartInfo */
  get navDatapointType(): DatapointNavNodeType {
    return 'datapoint';
  }

  get axisInfo() {
    return this._axisInfo;
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
  }

  async storeDidChange(key: string, value: any) {
  }

  noticePosted(key: string, value: any) {
    if (this._store.settings.ui.isNarrativeHighlightEnabled) {
      if (key === 'utteranceBoundary') {
        const highlight: Highlight = value;
        this._prevHighlightNavcode = this._doHighlight(highlight, this._prevHighlightNavcode);
      } else if (key === 'utteranceEnd') {
        // So that on the initial transition from auto-narration to manual
        // span navigation, we don't remove any highlights added in manual mode
        if (!this._store.paraChart.captionBox.highlightManualOverride) {
          this._store.clearHighlight();
          this._store.clearAllSeriesLowlights();
        }
        // this._highlightIndex = null;
        if (this._prevHighlightNavcode) {
          this.didRemoveHighlight(this._prevHighlightNavcode);
          this._prevHighlightNavcode = '';
        }
      }
    }
  }

  protected _doHighlight(highlight: Highlight, prevNavcode: string) {
    if (highlight.navcode) {
      if (highlight.navcode.startsWith('series')) {
        const segments = highlight.navcode.split(/-/);
        this._store.lowlightOtherSeries(...segments.slice(1));
      } else {
        this._store.clearHighlight();
        this._store.highlight(highlight.navcode);
        if (prevNavcode) {
          this.didRemoveHighlight(prevNavcode);
        }
        this.didAddHighlight(highlight.navcode);
      }
      prevNavcode = highlight.navcode;
    } else {
      this._store.clearHighlight();
      this._store.clearAllSeriesLowlights();
      if (prevNavcode) {
        this.didRemoveHighlight(prevNavcode);
        prevNavcode = '';
      }
    }
    return prevNavcode;
  }

  protected _createNavMap() {
    this._navMap = new NavMap(this._store, this);
    const root = this._navMap.layer('root')!;
    // Chart landing (visits no points)
    const chartLandingNode = new NavNode(root, 'top', {}, this._store);
    root.registerNode(chartLandingNode);
    root.cursor = chartLandingNode;
  }

  didAddHighlight(navcode: string) {
  }

  didRemoveHighlight(navcode: string) {
  }

  legend(): LegendItem[] {
    return [];
  }

  popuplegend() {
    //const seriesKeys = [...this._store.model!.seriesKeys];
    const seriesInNavOrder = this.seriesInNavOrder().map(s => s.key)
    return seriesInNavOrder.map((key, i) => (
      {
        label: '',
        seriesKey: key,
        color: this._store.seriesProperties!.properties(key).color,
        symbol: this._store.seriesProperties!.properties(key).symbol,
      }));
  }

  navToDatapoint(seriesKey: string, index: number) {
    this._navMap!.goTo(this.navDatapointType, { seriesKey, index });
  }

  async move(dir: Direction) {
    await this._navMap!.cursor.move(dir);
    this._store.paraChart.postNotice('move', {dir, options: this._navMap!.cursor.options});
  }

  /**
   * Navigate to the series minimum/maximum datapoint
   * @param isMin - If true, go the the minimum. Otherwise, go to the maximum
   */
  goSeriesMinMax(isMin: boolean) {
    const node = this._navMap!.cursor;
    if (node.isNodeType('top') || node.isNodeType('chord')) {
      this.goChartMinMax(isMin);
    } else if (node.isNodeType(this.navDatapointType)
      || node.isNodeType('series')
      || node.isNodeType('sequence')
      || node.isNodeType('cluster')) {
      let datapoint: Datapoint | null = null;

      const seriesKey = node.options.seriesKey;

      if (node.isNodeType(this.navDatapointType)) {
        datapoint = this._store.model!.atKeyAndIndex(node.options.seriesKey, node.options.index);
      }
      const depKey = this._store.model!.dependentFacetKeys[0]!; // TODO: Assumes exactly 1 dep facet
      const stats = this._store.model!.atKey(seriesKey)!.getFacetStats(depKey)!;
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
      this._navMap!.goTo(this.navDatapointType, {
        seriesKey: seriesMatchArray[0].seriesKey,
        index: seriesMatchArray[0].datapointIndex
      });
      this._store.paraChart.postNotice('goSeriesMinMax', {isMin, options: this._navMap!.cursor.options});
    }
  }

  /**
   * Navigate to (one of) the chart minimum/maximum datapoint(s)
   * @param isMin - If true, go the the minimum. Otherwise, go to the maximum
   */
  goChartMinMax(isMin: boolean) {
    const stats = this._store.model!.getFacetStats('y')!;
    const matchTarget = isMin ? stats.min.value : stats.max.value;
    const matchDatapoint = this._store.model!.allPoints.find(dp =>
      dp.facetValueAsNumber('y') === matchTarget)!;
    this._navMap!.goTo(this.navDatapointType, {
      seriesKey: matchDatapoint?.seriesKey,
      index: matchDatapoint?.datapointIndex
    });
    this._store.paraChart.postNotice('goChartMinMax', {isMin, options: this._navMap!.cursor.options});
  }

  protected _composePointSelectionAnnouncement(isExtend: boolean) {
    // This method assumes only a single point was visited when the select
    // command was issued (i.e., we know nothing about chord mode here)
    const seriesAndVal = (datapointId: string) => {
      const { seriesKey, index } = datapointIdToCursor(datapointId);
      const dp = this._store.model!.atKeyAndIndex(seriesKey, index)!;
      return `${seriesKey} (${formatBox(dp.facetBox('x')!, this._store.getFormatType('statusBar'))}, ${formatBox(dp.facetBox('y')!, this._store.getFormatType('statusBar'))})`;
    };

    const newTotalSelected = this._store.selectedDatapoints.size;
    const oldTotalSelected = this._store.prevSelectedDatapoints.size;
    const justSelected = this._store.selectedDatapoints.difference(
      this._store.prevSelectedDatapoints);
    const justDeselected = this._store.prevSelectedDatapoints.difference(
      this._store.selectedDatapoints);

    const s = newTotalSelected === 1 ? '' : 's';
    const newTotSel = `${newTotalSelected} point${s} selected.`;

    if (oldTotalSelected === 0) {
      // None were selected; selected 1
      return `Selected ${seriesAndVal(justSelected.values().toArray()[0])}`;
    } else if (oldTotalSelected === 1 && !newTotalSelected) {
      // 1 was selected; it has been deselected
      return `Deselected ${seriesAndVal(justDeselected.values().toArray()[0])}. No points selected.`;
    } else if (!isExtend && justSelected.size && oldTotalSelected) {
      // Selected 1 new, deselected others
      return `Selected ${seriesAndVal(justSelected.values().toArray()[0])}. 1 point selected.`;
    } else if (!isExtend && newTotalSelected && oldTotalSelected) {
      // Kept 1 selected, deselected others
      return `Deselected ${seriesAndVal(justDeselected.values().toArray()[0])}. 1 point selected.`;
    } else if (isExtend && justDeselected.size) {
      // Deselected 1
      return `Deselected ${seriesAndVal(justDeselected.values().toArray()[0])}. ${newTotSel}`;
    } else if (isExtend && justSelected.size) {
      // Selected 1
      return `Selected ${seriesAndVal(justSelected.values().toArray()[0])}. ${newTotSel}`;
    } else {
      return 'ERROR';
    }
  }

  protected _composeSeriesSelectionAnnouncement() {
    // This method assumes only a single series was visited when the select
    // command was issued (i.e., we know nothing about chord mode here)
    const newTotalSelected = this._store.selectedDatapoints.size;
    const oldTotalSelected = this._store.prevSelectedDatapoints.size;
    const justSelected = this._store.selectedDatapoints.values().filter(id => {
      const cursor = datapointIdToCursor(id);
      return !this._store.wasSelected(cursor.seriesKey, cursor.index);
    }).toArray();

    let s = newTotalSelected === 1 ? '' : 's';
    const newTotSelText = `${newTotalSelected} point${s} selected.`;
    s = justSelected.length === 1 ? '' : 's';
    const justSelText = `Selected ${justSelected.length} point${s}.`;

    if (oldTotalSelected === 0) {
      return justSelText;
    } else {
      return `${justSelText} ${newTotSelText}`;
    }
  }

  selectCurrent(isExtend = false) {
    if (isExtend) {
      this._store.extendSelection();
    } else {
      this._store.select();
    }
    const announcement =
      this._navMap!.cursor.isNodeType('datapoint') ? this._composePointSelectionAnnouncement(isExtend) :
        this._navMap!.cursor.isNodeType('series') ? this._composeSeriesSelectionAnnouncement() :
          '';
    if (announcement) {
      this._store.announce(announcement);
    }
    this._store.paraChart.postNotice('select', {isExtend, options: this._navMap!.cursor.options});
  }

  clearDatapointSelection(quiet = false) {
    this._store.clearSelected();
    if (!quiet) {
      this._store.announce('No items selected.');
    }
    this._store.paraChart.postNotice('clearSelection', null);
  }

  // NOTE: This should be overriden in subclasses
  queryData(): void {
    const queryType = this._navMap!.cursor.type;
    this._store.announce(
      `[ParaChart/Internal] Error: DataLayer.queryData should be overriden. Query Type: ${queryType}`);
  }

  navFirst() {
    const type = this._navMap!.cursor.type;
    if ([this.navDatapointType, 'chord', 'series'].includes(type)) {
      const dir: Partial<Record<NavNodeType, Direction>> = {
        datapoint: 'left',
        chord: 'left',
        series: 'up'
      };
      this._navMap!.cursor.allNodes(dir[type]!, type).at(-1)?.go();
      this._store.paraChart.postNotice('goFirst', {options: this._navMap!.cursor.options});
    }
  }

  navLast() {
    const type = this._navMap!.cursor.type;
    if ([this.navDatapointType, 'chord', 'series'].includes(type)) {
      const dir: Partial<Record<NavNodeType, Direction>> = {
        datapoint: 'right',
        chord: 'right',
        series: 'down'
      };
      this._navMap!.cursor.allNodes(dir[type]!, type).at(-1)?.go();
      this._store.paraChart.postNotice('goLast', {options: this._navMap!.cursor.options});
    }
  }

  navToChordLanding() {
    //Add to this list when adding chord support for additional chart types
    if (['line', 'bar', 'column'].includes(this._store.type) && this._store.model!.series.length > 1) {
      if (this._navMap!.cursor.isNodeType(this.navDatapointType)) {
        const seriesKey = this._navMap!.cursor.options.seriesKey;
        this._navMap!.cursor.layer.goTo('chord', this._navMap!.cursor.options.index);
        this._chordPrevSeriesKey = seriesKey;
        this._store.paraChart.postNotice('enterChordMode', {options: this._navMap!.cursor.options});
      } else if (this._navMap!.cursor.isNodeType('chord')) {
        this._navMap!.cursor.layer.goTo(
          this.navDatapointType, {
          seriesKey: this._chordPrevSeriesKey,
          index: this._navMap!.cursor.options.index
        });
        this._store.paraChart.postNotice('exitChordMode', {options: this._navMap!.cursor.options});
      }
    }
    else {
      this.log.info('Chord mode not supported for this chart type');
    }
  }

  async navRunDidStart(cursor: NavNode) {
    if (cursor.isNodeType('series') || cursor.isNodeType(this.navDatapointType)) {
      this._store.frontSeries = cursor.options.seriesKey;
    }
  }

  async navRunDidEnd(cursor: NavNode) {
    //const seriesKey = cursor.options.seriesKey ?? '';
    if (cursor.isNodeType('top')) {
      this._store.announce(await this._summarizer.getChartSummary());
    } else if (cursor.isNodeType('series')) {
      this._store.announce(
        await this._summarizer.getSeriesSummary(cursor.options.seriesKey));
      this._playCurrentRiff();
      this._store.sparkBrailleInfo = this._sparkBrailleInfo();
    } else if (cursor.isNodeType(this.navDatapointType)) {
      // NOTE: this needs to be done before the datapoint is visited, to check whether the series has
      //   ever been visited before this point
      const seriesPreviouslyVisited = this._store.everVisitedSeries(cursor.options.seriesKey);
      const datapoint = this._store.model!.atKeyAndIndex(cursor.options.seriesKey, cursor.options.index)!;
      const announcements = [this._summarizer.getDatapointSummary(datapoint, 'statusBar')];
      const annotations = this._store.annotations.filter(
        (a) => a.type === 'datapoint' && a.seriesKey === datapoint.seriesKey && a.index === datapoint.datapointIndex
      ) as PointAnnotation[];
      if (annotations.length > 0) {
        const annotationsText = annotations.map((a) => a.text).join(', ');
        announcements.push(`Annotation${annotations.length > 1 ? 's' : ''}: ${annotationsText}`);
      }
      const isSeriesChange = !this._store.wasVisitedSeries(cursor.options.seriesKey);
      if (isSeriesChange) {
        announcements[0] = `${this._store.model!.atKey(cursor.options.seriesKey)!.getLabel()}: ${announcements[0]}`;
        if (!seriesPreviouslyVisited) {
          const seriesSummary = await this._summarizer.getSeriesSummary(cursor.options.seriesKey);
          announcements.push(seriesSummary.text);
        }
      }

      this._store.announce(announcements);
      if (this._store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
        this.playDatapoints([datapoint]);
      }
      this._store.sparkBrailleInfo = this._sparkBrailleInfo();

      // this._store.highlight(`datapoint-${cursor.options.seriesKey}-${cursor.options.index}`);

    } else if (cursor.isNodeType('chord')) {
      if (this._store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
        if (this._store.settings.sonification.isArpeggiateChords) {
          this._playCurrentRiff(this._chordRiffOrder(), true);
        } else {
          const datapoints = cursor.datapoints.map(dp =>
            this._store.model!.atKeyAndIndex(dp.seriesKey, dp.datapointIndex)!);
          this.playDatapoints(datapoints);
        }
      }
    } else if (cursor.isNodeType('sequence')) {
      this._store.announce(
        await this._summarizer.getSequenceSummary({
          seriesKey: cursor.options.seriesKey,
          start: cursor.options.start,
          end:cursor.options.end
        })
      );
      this._playCurrentRiff();

      // this._store.highlight(
      //   `sequence-${cursor.options.seriesKey}-${cursor.options.start}-${cursor.options.end}`);

    }
  }

  /** Can be overridden by subclasses. */
  seriesInNavOrder() {
    return this._store.model!.series;
  }

  /** Nav map layer from which to interpret selectors */
  get selectorLayer(): string {
    return 'root';
  }

  datapointsForSelector(selector: string): readonly Datapoint[] {
    return this._navMap!.datapointsForSelector(this.selectorLayer, selector);
  }

  isHighlighted(seriesKey: string, index: number): boolean {
    if (this._store.highlightedSelector) {
      const datapoints = this.datapointsForSelector(this._store.highlightedSelector);
      for (const datapoint of datapoints) {
        if (datapoint.seriesKey === seriesKey && datapoint.datapointIndex === index) {
          return true;
        }
      }
    }
    return false;
  }

  get shouldDrawFocusRing() {
    return this._navMap!.cursor.type !== 'top';
  }

  /** Play a riff for the current nav node */
  protected _playCurrentRiff(order?: RiffOrder, isChord = false) {
    if (this._store.settings.sonification.isSoniEnabled
      && this._store.settings.sonification.isRiffEnabled) {
      this.playRiff(this._navMap!.cursor.datapoints, order, isChord);
    }
  }

  abstract playRiff(datapoints: Datapoint[], order?: RiffOrder, isChord?: boolean): void;

  protected _chordRiffOrder(): RiffOrder {
    return 'normal';
  }

  abstract playDatapoints(datapoints: Datapoint[]): void;

  /**
   * Play all datapoints in the given direction.
   */
  abstract playDir(dir: HorizDirection): void;

  /**
   * Clear outstanding play intervals/timeouts
   */
  clearPlay() {
    clearInterval(this._soniInterval!);
    clearInterval(this._soniRiffInterval!);
    // stop self-voicing of current passage
    //todo().controller.voice.shutUp();
  }

  protected abstract _sparkBrailleInfo(): SparkBrailleInfo | null;

  getXAxisInterval(): Interval {
    let xs: number[] = [];
    if (this._store.model!.getFacet('x')!.datatype === 'number'
      || this._store.model!.getFacet('x')!.datatype === 'date'
    ) {
      xs = this._store.model!.allFacetValues('x')!.map((box) => box.asNumber()!);
    } else {
      throw new Error('axis must be of type number or date to take interval');
    }
    return { start: Math.min(...xs), end: Math.max(...xs) };
  }


  getYAxisInterval(): Interval {
    if (!this.axisInfo) {
      throw new Error('chart is missing `axisInfo` object');
    }
    return {
      start: this.axisInfo.yLabelInfo.min!,
      end: this.axisInfo.yLabelInfo.max!
    };
  }

  getAxisInterval(coord: AxisCoord): Interval | undefined {
    if (coord === 'x') {
      return this.getXAxisInterval();
    } else {
      return this.getYAxisInterval();
    }
  }
}
