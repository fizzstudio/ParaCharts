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

import { PlotLayer } from '..';
import { type PlotLayerManager } from '..';
import { type PlotSettings, type DeepReadonly, type Direction, HorizDirection, Setting } from '../../../store/settings_types';
//import { type Model, type DatapointReference } from '../data/model';
//import { type ActionRegistration } from '../input';
//import { keymaps } from '../input';
//import { hotkeyActions, type TodoEventType } from '../input/defaultactions';
//import { type Actions } from '../input/actions';
import { ParaView } from '../../../paraview';
import { SettingsManager } from '../../../store/settings_manager';
import { ChartLandingView, DatapointView, SeriesView, type DataView } from '../../data';

import { StyleInfo } from 'lit/directives/style-map.js';
import { bboxOfBboxes } from '../../../common/utils';
import { BaseChartInfo } from '../../../chart_types';

/**
 * @public
 */
export type LandingView = ChartLandingView | DataView;


/**
 * Abstract base class for a data layer view where chart datapoints are rendered.
 * @public
 */
export abstract class DataLayer extends PlotLayer {

  declare protected _parent: PlotLayerManager;

  protected visibleSeries!: string[];
  protected _chartLandingView!: ChartLandingView;
  //protected _playInterval: ReturnType<typeof setTimeout> | null = null;
  //protected _speedRateIndex = 1;
  //protected _soniRiffSpeedRateIndex = 1;
  /** DatapointId to DOM ID */
  protected _datapointDomIds = new Map<string, string>();

  constructor(
    paraview: ParaView,
    width: number,
    height: number,
    public readonly dataLayerIndex: number,
    protected _chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId('data');
  }

  protected _addedToParent() {
    super._addedToParent();
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

  get chartInfo(): BaseChartInfo {
    return this._chartInfo;
  }

  resize(width: number, height: number) {
    super.resize(width, height);
    this._layoutDatapoints();
  }

  // get sonifier() {
  //   return this._sonifier;
  // }

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

  registerDatapoint(datapointView: DatapointView) {
    const key = `${datapointView.seriesKey}-${datapointView.index}`;
    this._datapointDomIds.set(key, datapointView.id);
  }

  unregisterDatapoint(datapointView: DatapointView) {
    this._datapointDomIds.delete(`${datapointView.seriesKey}-${datapointView.index}`);
  }

  get datapointDomIds(): ReadonlyMap<string, string> {
    return this._datapointDomIds;
  }

  get dataset() {
    return this.paraview.ref<SVGGElement>(`dataset${this.index}`).value!;
  }

  get role() {
    return 'dataset';
  }

  get ref() {
    return ref(this.paraview.ref<SVGGElement>(`dataset${this.index}`));
  }

  init() {
    this._layoutDatapoints();
  }


  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['ui.isLowVisionModeEnabled'].includes(path)) {
      if (!oldValue) {
        this.paraview.store.updateSettings(draft => {
          draft.popup.activation = 'onSelect'
        });
      }

    }
    super.settingDidChange(path, oldValue, newValue);
  }

  /**
   * Stroke width for visited datapoints. Can be overridden.
   */
  get visitedStrokeWidth(): number {
    const visitedScale = this.paraview.store.settings.chart.strokeHighlightScale;
    return this.paraview.store.settings.chart.strokeWidth * visitedScale;
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
    this._chartLandingView.clearChildren();
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

  datapointView(seriesKey: string, index: number) {
    return this.datapointViews.find(view =>
      view.seriesKey === seriesKey && view.index === index);
  }

  datapointViewForId(id: string) {
    return this.datapointViews.find(dp => dp.id === id);
  }

  // protected _layoutSymbols() {
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.layoutSymbol();
  //   }
  // }

  focusRingBbox() {
    const chartInfo = this._parent.docView.chartInfo;
    const cursor = chartInfo.navMap!.cursor;
    if (['series', 'chord', 'datapoint', 'sequence'].includes(cursor.type)) {
      return bboxOfBboxes(...cursor.datapoints.map(dp =>
        this.datapointView(dp.seriesKey, dp.datapointIndex)!.outerBbox));
    }
    return null;
  }

  handlePan(startX: number, startY: number, endX: number, endY: number) { }

  handleZoom(x: number, y: number) { }
}
