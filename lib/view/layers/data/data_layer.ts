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
import { type Setting, type PlotSettings, type DeepReadonly } from '../../../store/settings_types';
import { defaults } from '../../../store/settings_defaults';
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

import { interpolate } from '@fizz/templum';
import { StyleInfo } from 'lit/directives/style-map.js';

/**
 * @public
 */
export type LandingView = ChartLandingView | DataView;


// Soni Constants
export const SONI_PLAY_SPEEDS = [1000, 250, 100, 50, 25];
export const SONI_RIFF_SPEEDS = [200, 150, 100];

/**
 * Abstract base class for a data layer view where chart datapoints are rendered.
 * @public
 */
export abstract class DataLayer extends ChartLayer {

  declare protected _parent: ChartLayerManager;

  soniNoteIndex = 0;
  soniSequenceIndex = 0;

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
    this._beginLayout();
    this._completeLayout();
    //this._layoutComponents();
  }

  /**
   * Mutate `styleInfo` with any custom series styles.
   * @param styleInfo 
   */
  updateSeriesStyle(_styleInfo: StyleInfo) {
  }

  protected abstract _createDatapoints(): void;

  protected _beginLayout() {
    this._createDatapoints();
    for (const datapointView of this.datapointViews) {
      datapointView.computeLocation();
    }
    for (const datapointView of this.datapointViews) {
      datapointView.completeLayout();
    }
  }

  protected _completeLayout() { }

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

  getDatapointView(seriesName: string, recordLabel: string) {
    return this.chartLandingView.getSeriesView(seriesName)?.getDatapointViewForLabel(recordLabel);
  }

  datapointViewForId(id: string) {
    return this.datapointViews.find(dp => dp.id === id);
  }

  focusDatapoint(seriesKey: string, index: number, isNewComponentFocus = false) {
    this.datapointView(seriesKey, index)!.focus(isNewComponentFocus);
  }

  /**
   * Move focus to the navpoint to the right, if there is one
   */
  abstract moveRight(): Promise<void>;

  /**
   * Move focus to the navpoint to the left, if there is one
   */
  abstract moveLeft(): Promise<void>;
  abstract moveUp(): Promise<void>;
  abstract moveDown(): Promise<void>;

  abstract goSeriesMinMax(isMin: boolean): Promise<void>;
  abstract goChartMinMax(isMin: boolean): Promise<void>;

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
   * Play all datapoints to the right, if there are any
   */
  abstract playRight(): Promise<void>;

  /**
   * Play all datapoints to the left, if there are any
   */
  abstract playLeft(): Promise<void>;

  abstract playSeriesRiff(): void;

  selectCurrent(extend = false) {
    this._chartLandingView.focusLeaf.select(extend);
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

  queryData(): void {
    const targetView = this.chartLandingView.focusLeaf
    // TODO: localize this text output
    // focused view: e.options!.focus
    // all visited datapoint views: e.options!.visited
    // const focusedDatapoint = e.targetView;
    let msgArray: string[] = [];
    let seriesLengths = [];
    for (let series of this.paraview.store.model!.series) {
      seriesLengths.push(series.rawData.length)
    }
    if (targetView instanceof ChartLandingView) {
      this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
      return
    }
    else if (targetView instanceof SeriesView) {
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
      ));
    }
    else if (targetView instanceof DatapointView) {
      const selectedDatapoints = this.paraview.store.selectedDatapoints;
      const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
      msgArray.push(interpolate(
        queryMessages.datapointKeyLength,
        {
          seriesKey: targetView.seriesKey,
          datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
          datapointIndex: targetView.index + 1,
          datapointCount: targetView.series.length
        }
      ));
    }
    this.paraview.store.announce(msgArray);
  }
}
