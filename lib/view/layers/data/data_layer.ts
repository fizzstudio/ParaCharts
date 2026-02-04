/* ParaCharts: Data Layers
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

import { ref } from 'lit/directives/ref.js';

import { PlotLayer } from '..';
import { type PlotLayerManager } from '..';
import { type PlotSettings, type DeepReadonly, type Direction, HorizDirection, Setting } from '../../../state/settings_types';
import { ParaView } from '../../../paraview';
import { SettingsManager } from '../../../state/settings_manager';
import { ChartLandingView, DatapointView, SeriesView, type DataView } from '../../data';

import { StyleInfo } from 'lit/directives/style-map.js';
import { bboxOfBboxes } from '../../../common/utils';
import { BaseChartInfo } from '../../../chart_types';
import { Bezier, loopParaviewRefresh } from '../../../common';

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
  protected _currentAnimationFrame: number | null = null;
  protected _animateRevealComplete = false;

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
    return [`type.${this._parent.parent.type}`];
  }

  get settings(): DeepReadonly<PlotSettings> {
    return SettingsManager.getGroupLink(this.managedSettingKeys[0], this.paraview.paraState.settings);
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
    console.log("hopefully", this._chartLandingView.datapointViews);
    console.error("it will", this._chartLandingView.datapointViews);
    return this._chartLandingView.datapointViews;
  }

  get visitedDatapointViews() {
    return this.datapointViews.filter(v =>
      this.paraview.paraState.isVisited(v.seriesKey, v.index)
    );
  }

  get selectedDatapointViews() {
    return this.datapointViews.filter(v =>
      this.paraview.paraState.isSelected(v.seriesKey, v.index)
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

  get animateRevealComplete(): boolean {
    return this._animateRevealComplete;
  }

  init() {
    this._layoutDatapoints();
    if (this.paraview.paraState.settings.animation.isAnimationEnabled) {
      this._animateReveal();
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['ui.isLowVisionModeEnabled'].includes(path)) {
      if (!oldValue) {
        this.paraview.paraState.updateSettings(draft => {
          draft.popup.activation = 'onSelect'
        });
      }
    }
    if (['popup.activation'].includes(path)) {
      if (oldValue === "onSelect" || oldValue === "onFocus") {
        this.paraview.paraState.popups.splice(0, this.paraview.paraState.popups.length)
        this.paraview.paraState.userLineBreaks.splice(0, this.paraview.paraState.userLineBreaks.length)
      }
    }
    if (['chart.isShowPopups'].includes(path)) {
      this.paraview.paraState.popups.splice(0, this.paraview.paraState.popups.length)
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  /**
   * Stroke width for visited datapoints. Can be overridden.
   */
  get visitedStrokeWidth(): number {
    const visitedScale = this.paraview.paraState.settings.chart.strokeHighlightScale;
    return this.paraview.paraState.settings.chart.strokeWidth * visitedScale;
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
    if (this.paraview.paraState.settings.animation.isAnimationEnabled
      && this.paraview.paraState.settings.animation.animationType == 'xAxis') {
      this.datapointViews.map(d => d.baseSymbolScale = 0)
    }
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

  protected _animateReveal() {
    let start = -1;
    const bez = new Bezier(0.2, 0.9, 0.5, 1, 10);
    const linear = new Bezier(0, 0, 1, 1, 10);
    const step = (timestamp: number) => {
      if (start === -1) {
        start = timestamp;
      }
      const elapsed = timestamp - start;
      // We can't really disable the animation, but setting the reveal time to 0
      // will result in an imperceptibly short animation duration
      const revealTime = Math.max(1, this.paraview.paraState.settings.animation.animateRevealTimeMs);
      const t = Math.min(elapsed/revealTime, 1);
      const bezT = bez.eval(t)!;
      const linearT = linear.eval(t)!;
      this._animStep(bezT, linearT);
      this.paraview.paraChart.postNotice('animRevealStep', bezT);
      this.paraview.requestUpdate();
      if (elapsed < revealTime) {
        this._currentAnimationFrame = requestAnimationFrame(step);
      } else {
        this._animEnd();
      }
    };
    this._currentAnimationFrame = requestAnimationFrame(step);
    if (this.paraview.paraState.settings.animation.animationType == 'xAxis'){
          loopParaviewRefresh(this.paraview, 500 + this.paraview.paraState.settings.animation.popInAnimateRevealTimeMs
        + this.paraview.paraState.settings.animation.animateRevealTimeMs, 50);
    }
  }

  protected _animStep(bezT: number, linearT: number) {
    if (this.paraview.paraState.settings.animation.animationType == 'xAxis') {
      this.paraview.clipWidth = linearT
    }
    for (const datapointView of this.datapointViews) {
      datapointView.beginAnimStep(bezT, linearT);
    }
    for (const datapointView of this.datapointViews) {
      datapointView.endAnimStep(bezT, linearT);
    }
  }

  protected _animEnd() {
    this.paraview.paraChart.postNotice('animRevealEnd', null);
    this._currentAnimationFrame = null;
    this._animateRevealComplete = true;
  }

  stopAnimation() {
    if (this._currentAnimationFrame !== null) {
      cancelAnimationFrame(this._currentAnimationFrame);
      this._animStep(1, 1);
      this.paraview.paraChart.postNotice('animRevealStep', 1);
      this.paraview.requestUpdate();
      this._animEnd();
    }
  }

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
    const chartInfo = this._parent.parent.chartInfo;
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
