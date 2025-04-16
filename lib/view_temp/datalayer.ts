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

import { type TemplateResult } from 'lit';
import { svg, StaticValue } from 'lit/static-html.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap, type StyleInfo } from 'lit/directives/style-map.js';
import { classMap, type ClassInfo } from 'lit/directives/class-map.js';

import { View, Container } from './base_view';
import { ChartLayer } from './chartlayer';
import { type ChartLayerManager } from './chartlayermanager';
import { type Setting, type PlotSettings, type DeepReadonly } from '../store/settings_types';
import { type AxisOrientation, type Axis } from './axis';
import { type TickLabelTier } from './ticklabeltier';
//import { Sonifier } from '../audio/sonifier';
//import { type Model, type DatapointReference } from '../data/model';
//import { type ActionRegistration } from '../input';
//import { keymaps } from '../input';
//import { hotkeyActions, type TodoEventType } from '../input/defaultactions';
//import { type Actions } from '../input/actions';
//import { utils } from '../utilities';
import { DataSymbol } from './symbol';
import { ParaView } from './paraview';
import { Datapoint2D, Series2D } from '../store/model2D';
import { strToId } from '../common/utils';
import { SettingsManager } from '../store/settings_manager';
import { SeriesProperties } from '../store/series_properties';
import { Datatype } from '../common/types';

import { type clusterObject } from '@fizz/clustering';

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

  //protected _model!: Model;
  //protected _sonifier!: Sonifier;
  protected _settings!: DeepReadonly<PlotSettings>;
  protected visibleSeries!: string[];
  protected _chartLandingView!: ChartLandingView;
  protected _playInterval: ReturnType<typeof setTimeout> | null = null;
  protected _speedRateIndex = 1;

  // soni variables
  protected _soniInterval: ReturnType<typeof setTimeout> | null = null;
  protected _soniRiffInterval: ReturnType<typeof setTimeout> | null = null;
  protected _soniSpeedRateIndex = 1;
  protected _soniRiffSpeedRateIndex = 1;

  //private _currentSeries?: string;
  // Series of previously-visited datapoint.
  //private _prevDatapointSeries?: string;
  //private _currentRecord = 0;

  protected _isClustering: boolean = false;
  protected _clustering?: clusterObject[];

  constructor(public readonly dataLayerIndex: number, paraview: ParaView) {
    super(paraview);
  }

  protected _createId() {
    return super._createId('data');
  }

  protected _addedToParent() {
    super._addedToParent();
    //this._model = todo().controller.model!;
    this._settings = SettingsManager.getGroupLink(this.managedSettingKeys[0], this.paraview.store.settings);
    //this._sonifier = new Sonifier(this);
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

  /*get model() {
    return this._model;
  }
  
  get sonifier() {
    return this._sonifier;
  }*/

  get chartLandingView() {
    return this._chartLandingView;
  }

  /*get keymap() {
    return keymaps.chart;
  }

  protected get _hotkeyActions() {
    return hotkeyActions.chart;
  }*/

  get datapointViews() {
    return this._chartLandingView.datapointViews;
  }

  get isClustering(){
    return this._isClustering;
  }
  get clustering(){
    return this._clustering;
  }

  get visitedDatapointViews() {
    return this.datapointViews.filter(v =>
      v.isVisited
    );
  }

  get selectedDatapointViews() {
    return this.datapointViews.filter(v =>
      v.isSelected
    );
  }

  get dataset() {
    return this.paraview.ref<SVGGElement>(`dataset${this.index}`).value!;
  }
  
  init() {
    this._createComponents();
    this._layoutComponents();
  }

  abstract settingDidChange(key: string, value: Setting | undefined): boolean;

  protected abstract _createComponents(): void;
  protected abstract _layoutComponents(): void;
    
  abstract getXTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<any>[];
  abstract getYTickLabelTiers<T extends AxisOrientation>(axis: Axis<T>): TickLabelTier<any>[];

  getDatapointView(seriesName: string, recordLabel: string) {
    return this.chartLandingView.getSeriesView(seriesName)?.getDatapointViewForLabel(recordLabel);
  }

  datapointViewForId(id: string) {
    return this.datapointViews.find(dp => dp.id === id);
  }

  /**
   * Move focus to the navpoint to the right, if there is one
   */
  abstract moveRight(): void; 

  /**
   * Move focus to the navpoint to the left, if there is one
   */
  abstract moveLeft(): void;
  abstract moveUp(): void;
  abstract moveDown(): void;

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
  abstract playRight(): void;

  /**
   * Play all datapoints to the left, if there are any
   */
  abstract playLeft(): void;

  abstract queryData(): void;

  abstract clearDatapointSelection(): void;

  abstract playSeriesRiff(): void;

  abstract selectCurrent(extend: boolean): void;

  cleanup() {

  }

  abstract setLowVisionMode(lvm: boolean): void; 

  protected _layoutSymbols() {
    for (const datapointView of this.datapointViews) {
      datapointView.layoutSymbol();
    }
  }

  render(content?: TemplateResult) {
    return super.render(svg`
      <g
        ${ref(this.paraview.ref<SVGGElement>(`dataset${this.index}`))}
        role="dataset"
      >
        ${content ?? this.renderChildren()}
      </g>
    `);
  }

}

/**
 * Contains all chart series views.
 * @public
 */
export class ChartLandingView extends View {

  declare protected _parent: DataLayer;
  declare protected _children: SeriesView[];

  protected _createId() {
    return 'chart-landing';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: DataLayer) {
    super.parent = parent;
  }

  get children(): readonly SeriesView[] {
    return this._children;
  }

  get datapointViews() {
    // This assumes that our immediate children are
    // series views, and their children are datapoint views
    return this._children.flatMap(kid => kid.children) as any as DatapointView[];
  }

  /*protected get _eventActions(): Actions<this> {
    //let count = 1;
    return {
      chart_focused: function() {
        //this.controller.setVisibleStatus(`This is a test (${count++})`);
        todo().controller.announce(this.chartSummary());
      },
      selection_cleared: function() {
        todo().controller.announce('No items selected.');
      },
    };
  }*/

  get focusLeaf() {
    return super.focusLeaf as DataView;
  }

  onFocus() {
    console.log('CHART LANDING FOCUS');
    // Set browser focus on our SVG group
    this.parent.dataset.focus();
    //this.eventActionManager!.dispatch('chart_focused');
  }

  getSeriesView(seriesName: string) {
    return this._children.find(view => view.series.key === seriesName);
  }
  
  chartSummary() {
    return 'At top level.'
  }

  render() {
    return svg`${this.children.map(kid => kid.render())}`;
  }

}

/**
 * Abstract base class for datapoint and series views.
 * @public
 */
export class DataView extends View {
  declare protected _children: DataView[];
  declare protected _prev: this | null;
  declare protected _next: this | null;
  declare protected _currFocus: DataView | null;
  declare protected _prevFocus?: DataView;

  protected _series!: Series2D<Datatype>;

  constructor(
    public readonly chart: DataLayer, 
    public readonly seriesKey: string,
  ) {
    super(chart.paraview);
  }

  protected _addedToParent() {
    super._addedToParent();
    this._series = this.chart.paraview.store.model.atKey(this.seriesKey)!;
  }

  get series() {
    return this._series;
  }

  get seriesProps(): SeriesProperties {
    return this.chart.paraview.store.seriesProperties.properties(this.seriesKey);
  }

  get children(): readonly DataView[] {
    return this._children;
  }

  get siblings(): readonly this[] {
    return super.siblings.filter(sib => sib instanceof DataView) as this[];
  }

  get withSiblings(): this[] {
    return super.withSiblings.filter(sib => sib instanceof DataView) as this[];
  }

  get prev() {
    return super.prev as this | null; 
  }

  get next()  {
    return super.next as this | null; 
  }

  get currFocus() {
    return this._currFocus;
  }

  set currFocus(view: View | null) {
    super.currFocus = view;
  }

  get prevFocus() {
    return this._prevFocus;
  }

  onFocus() {
    this.chart.visitedDatapointViews.forEach(p => {
      p.isVisited = false;
    });
  }

  select(_extend: boolean) {}

}

/**
 * Abstract base class for a view representing an entire series.
 * @public
 */
export class SeriesView extends Container(DataView) {

  declare protected _parent: ChartLandingView;
  declare protected _children: DatapointView[];

  constructor(chart: DataLayer, seriesKey: string) {
    super(chart, seriesKey);
  }

  protected _createId() {
    return `series-${strToId(this.seriesKey)}`;
  }

  protected _seriesRef(series: string) {
    return this.chart.paraview.ref<SVGGElement>(`series.${series}`);
  }

  get ref() {
    return ref(this._seriesRef(this._series.key));
  }

  get class() {
    return 'series';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: ChartLandingView) {
    super.parent = parent;
  }

  // @ts-ignore
  get children(): readonly DatapointView[] { 
    return this._children;
  }

  nextSeriesLanding() {
    return this._next;    
  }

  prevSeriesLanding() {
    return this._prev;
  }

  onFocus() {
    console.log('SERIES FOCUS');
    super.onFocus();
  }

  render(content?: TemplateResult) {
    return super.render(content);
  }

  getDatapointViewForLabel(label: string) {
    return this._children.find(view => 
      view.datapoint.x === label
    );
  }

}

/**
 * Abstract base class for views representing datapoint values
 * (e.g., bar chart bars, pie slices, etc.).
 * @public
 */
export class DatapointView extends DataView {

  declare protected _parent: SeriesView;

  protected _isVisited = false; 
  private _isSelected = false;
  protected extraAttrs: {attr: StaticValue, value: any}[] = [];
  protected symbol?: DataSymbol;
  protected _datapoint?: Datapoint2D<Datatype>;
  private _selectedMarker: SelectedDatapointMarker | null = null;

  constructor(seriesView: SeriesView) {
    super(seriesView.chart, seriesView.series.key);
  }

  protected _addedToParent() {
    super._addedToParent();
    this._createSymbol();
    this._createDatapoint();
  }
  
  protected _createDatapoint(){
    this._datapoint = this.paraview.store.model.atKeyAndIndex(this.series.key, this.index)!;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: SeriesView) {
    super.parent = parent;
  }

  get sameIndexers() {
    return super.sameIndexers as this[]; 
  }

  get withSameIndexers() {
    return super.withSameIndexers as this[];
  }

  get nextSeriesLanding() {
    return this._parent.next;
  }

  get prevSeriesLanding() {
    return this._parent.prev;
  }

  get datapoint(): Datapoint2D<Datatype> {
    return this.series[this.index];
  }

  get isVisited() {
    return this._isVisited;
  }

  set isVisited(visited: boolean) {
    this._isVisited = visited;
    if (visited) {
      this.chart.parent.highlightsLayer.activateMark(this.el.id);
    } else {
      this.chart.parent.highlightsLayer.deactivateMark(this.el.id);
    }
    this.paraview.requestUpdate();
  }

  get isSelected() {
    return this._isSelected;
  }

  set isSelected(selected: boolean) {
    this._isSelected = selected;
    if (!selected && this._selectedMarker) {
      this._selectedMarker.remove();
      this._selectedMarker = null;
    } else if (selected && !this._selectedMarker) {
      this._selectedMarker = new SelectedDatapointMarker(this, this._selectedMarkerX, this._selectedMarkerY);
      this.chart.parent.selectionLayer.append(this._selectedMarker);
    } else {
      return;
    }
    this.paraview.requestUpdate();
  }

  protected get _visitedTransform() {
    return '';
  }

  get selectedMarker() {
    return this._selectedMarker;
  }

  protected get _selectedMarkerX() {
    return 0;
  }

  protected get _selectedMarkerY() {
    return 0;
  }

  get classes(): ClassInfo {
    return {
      visited: this._isVisited,
      selected: this._isSelected
    };
  }

  get styles(): StyleInfo {
    const styles: StyleInfo = {};
    let colorValue = this.chart.paraview.store.colors.colorValueAt(this.seriesProps.color);
    if (this._isVisited) {
      styles.transform = this._visitedTransform;
      colorValue = this.chart.paraview.store.colors.colorValue('bright red');
    }
    styles.fill = colorValue;
    styles.stroke = colorValue;
    return styles;
  }

  get ref() {
    return this.chart.paraview.ref<SVGGElement>(this.id);
  }

  get el() {
    return this.ref.value!;
  }

  computeLayout() {}

  //// Symbols

  protected _createSymbol() {
    const series = this.seriesProps;
    const symbolType = series.symbol;
    this.symbol = DataSymbol.fromType(
      this.chart.paraview,
      symbolType, 
      this.chart.paraview.store.settings.chart.symbolStrokeWidth,
      this.chart.paraview.store.colors,
      series.color
    );
    this.append(this.symbol);
  }

  layoutSymbol() {
    if (this.symbol) {
      this.symbol.x = this._x - this.symbol.width/2;
      this.symbol.y = this._y - this.symbol.height/2;
    }
  }

  protected _renderSymbol() {
    return this.symbol?.render() ?? svg``;
  }

  // end symbols

  render(content?: TemplateResult) {
    // on g: aria-labelledby="${this.params.labelId}"
    // originally came from: xAxis.tickLabelIds[j]
    return svg`
      <g
        ${ref(this.ref)}
        id=${this.id}
        style=${styleMap(this.styles)}
        class="datapoint ${classMap(this.classes)}"
        role="datapoint"
        ${this.extraAttrs.map(attrInfo => svg`
          ${attrInfo.attr}=${attrInfo.value}
        `)}
      >
        ${content ?? ''}
        ${this.chart.settings.isDrawSymbols 
          ? this._renderSymbol() 
          : ''}
      </g>
    `;
  }

}

/**
 * Visual indication of selected state for datapoints.
 */
export class SelectedDatapointMarker extends View {

  constructor(private datapointView: DatapointView, x: number, y: number) {
    super(datapointView.paraview);
    this._x = x;
    this._y = y;
  }

  protected _createId(..._args: any[]): string {
    return `select-${this.datapointView.id}`;
  }

  get width() {
    return this.datapointView.width;
  }

  get height() {
    return Math.max(this.datapointView.height, 20);
  }

  render() {
    return svg`
      <rect
        x=${this._x}
        y=${this._y}
        width=${this.width}
        height=${this.height}
      />
    `;
  }

}