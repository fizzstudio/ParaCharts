/* ParaCharts: ParaView Chart Views
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

import { PropertyValueMap, SVGTemplateResult, TemplateResult, css, html, nothing, render, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Unsubscribe } from '@lit-app/state';
import { Logger, getLogger } from '@fizz/logger';
import { type ChartType, isPastryType, strToId } from '@fizz/paramanifest';
import { PointerEventManager } from './pointermanager';
import { type ParaChart } from '../parachart/parachart';
import { ParaComponent, type AriaLive } from '../components';
import { type HotkeyEvent } from '../state';
import { AvailableActions } from '../state/action_map';
import { ColorPrefManager } from '../state/preference_manager';
import { ConfigSetting, ViewBox } from '../config/config_types';
import { type View } from '../view/base_view';
import { DocumentView } from '../view/document_view';
import { type ViewContext } from '../view/view_context';
import { loopParaviewRefresh, fixed, SVGNS } from '../common';
import { ParaViewController } from '.';

/**
 * Data provided for the on focus callback
 */
export type c2mCallbackType = {
  slice: string;
  index: number;
  //point: SupportedDataPointType;
};

@customElement('para-view')
export class ParaView extends ParaComponent implements ViewContext {

  paraChart!: ParaChart;

  @property() type: ChartType = 'bar';
  @property({ type: Boolean }) scalable = false;
  @property() chartTitle?: string;
  @property() xAxisLabel?: string;
  @property() yAxisLabel?: string;
  @property() contrastLevel: number = 1;
  @property({ type: Boolean }) disableFocus = false;
  protected _ariaLiveRegionRef = createRef<AriaLive>();
  protected _controller!: ParaViewController;
  protected _viewBox!: ViewBox;
  protected _prevFocusLeaf?: View;
  protected _rootRef = createRef<SVGSVGElement>();
  protected _defsRef = createRef<SVGGElement>();
  protected _frameRef = createRef<SVGRectElement>();
  protected _dataspaceRef = createRef<SVGGElement>();
  protected _documentView?: DocumentView;
  protected _containerRef = createRef<HTMLDivElement>();
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
  protected _registeredPatternKeys: string[] = [];
  protected log: Logger = getLogger("ParaView");
  clipWidth: number = 1

  @state() private loadingMessageStyles: { [key: string]: any } = {
    display: 'none'
  };
  protected _chartRefs: Map<string, Ref<any>> = new Map();
  protected _fileSavePlaceholderRef = createRef<HTMLElement>();
  protected _pointerEventManager: PointerEventManager | null = null;
  // protected _hotkeyActions!: HotkeyActions;
  @state() protected _defs: { [key: string]: TemplateResult } = {};
  @state() protected _isFullscreen = false;
  protected _hotkeyListener: (e: HotkeyEvent) => void;
  protected _storeChangeUnsub!: Unsubscribe;

  protected _modeSaved = new Map<string, any>();
  protected _colorPrefManager!: ColorPrefManager;
  protected _jimReadyPromise: Promise<void>;
  protected _jimReadyResolver!: (() => void);
  protected _jimReadyRejector!: (() => void);


  static styles = [
    //styles,
    css`
      #frame {
        fill: var(--background-color);
        stroke: none;
      }
      #frame.pending {
        fill: lightgray;
      }
      #frame.explainer {
        fill: aliceblue;
        stroke: cornflowerblue;
        stroke-width: 40;
      }
      #content {
        fill: white;
      }
      #content.explainer {
        fill: aliceblue;
      }
      .darkmode #frame, .darkmode #content {
        fill: var(--background-color);
      }
      .darkmode {
        --axis-line-color: ghostwhite;
        --label-color: ghostwhite;
        --background-color: black;
      }
      svg.scalable {
        width: 100%;
      }
      #loading-message {
        fill: black;
      }
      #loading-message text {
        fill: white;
      }
      [role="graphics-document"] {
        cursor: var(--chart-cursor);
      }
      #chart-layers {
        cursor: var(--data-cursor);
      }
      .grid-horiz {
        stroke: var(--axis-line-color);
        opacity: 0.2;
      }
      .grid-vert {
        stroke: var(--axis-line-color);
        opacity: 0.2;
      }
      .grid-zero {
        opacity: 0.6;
        stroke-width: 2;
      }
      .tick {
        stroke: var(--label-color);
        stroke-linecap: round;
      }
      .chart-title {
        font-size: calc(var(--chart-title-font-size)*var(--chart-font-scale));
      }
      .chart-subtitle {
        font-size: calc(var(--chart-subtitle-font-size)*var(--chart-font-scale));
      }
      .axis-title-horiz {
        font-size: calc(var(--horiz-axis-title-font-size)*var(--chart-font-scale));
      }
      .axis-title-vert {
        font-size: calc(var(--vert-axis-title-font-size)*var(--chart-font-scale));
      }
      .direct-label {
        font-size: calc(var(--direct-label-font-size)*var(--chart-font-scale));
      }
      .legend-label {
        font-size: calc(var(--legend-label-font-size)*var(--chart-font-scale));
      }
      .label {
        fill: var(--label-color);
        stroke: none;
      }
      .label-bg {
        fill: lightgray;
      }
      .label-highlight {
        stroke: red;
        stroke-width: 2;
        fill: none;
      }
      .view-highlight-fg {
        stroke: burlywood;
        stroke-width: 2;
        fill: none;
      }
      .view-highlight-bg {
        stroke: none;
        fill: cornsilk;
        opacity: 0.5;
      }
      .tick-label-horiz {
        font-size: calc(var(--horiz-axis-tick-label-font-size)*var(--chart-font-scale));
      }
      .tick-label-vert {
        font-size: calc(var(--vert-axis-tick-label-font-size)*var(--chart-font-scale));
      }
      .bar-label {
        font-size: calc(var(--bar-label-font-size)*var(--chart-font-scale));
        fill: white;
      }
      .bar-total-label {
        font-size: calc(var(--bar-label-font-size)*var(--chart-font-scale));
      }
      .column-label {
        font-size: calc(var(--column-label-font-size)*var(--chart-font-scale));
        fill: white;
      }
      .column-total-label {
        font-size: calc(var(--column-label-font-size)*var(--chart-font-scale));
                background-color: red;
      }
      .waterfall-label {
        font-size: calc(var(--waterfall-label-font-size)*var(--chart-font-scale));
      }
      .pastry-inside-label {
      }
      .pastry-outside-label-leader {
        fill: none;
        stroke-width: 2;
      }
      .pastry-slice {
        stroke: white;
        stroke-width: 2;
      }
      .label-leader {
        stroke-width: 2;
      }
      #vert-axis-line {
        fill: none;
        stroke: var(--axis-line-color);
        stroke-width: 2px;
        stroke-linecap: round;
      }
      #horiz-axis-line {
        fill: none;
        stroke: var(--axis-line-color);
        opacity: 1;
        stroke-width: 2px;
        stroke-linecap: round;
      }
      rect#data-backdrop {
        stroke: none;
        fill: none; /*lightgoldenrodyellow;*/
        /*opacity: 0.5;*/
        pointer-events: all;
      }
      /* Palette CSS custom properties — default (diva) values.
       * Overridden at runtime by Colors.paletteVars() injected onto the SVG
       * root element, so any palette (including author-defined) works. */
      :host {
        --color-palette-series-0: hsl(225, 30%, 52%);
        --color-palette-series-1: hsl(12, 69%, 35%);
        --color-palette-series-2: hsl(75, 43%, 45%);
        --color-palette-series-3: hsl(40, 100%, 49%);
        --color-palette-series-4: hsl(215, 37%, 66%);
        --color-palette-series-5: hsl(63, 100%, 23%);
        --color-palette-series-6: hsl(34, 57%, 46%);
        --color-palette-series-7: hsl(51, 56%, 64%);
        --color-palette-series-8: hsl(253, 26%, 43%);
        --color-palette-series-9: hsl(85, 65%, 36%);
        /* Precomputed diva lightened variants (reduced saturation, +25% lightness).
         * Overridden at runtime alongside base vars by Colors.paletteVars(). */
        --color-palette-series-0-light: hsl(225, 20%, 77%);
        --color-palette-series-1-light: hsl(12, 59%, 60%);
        --color-palette-series-2-light: hsl(75, 33%, 70%);
        --color-palette-series-3-light: hsl(40, 90%, 74%);
        --color-palette-series-4-light: hsl(215, 27%, 91%);
        --color-palette-series-5-light: hsl(63, 90%, 48%);
        --color-palette-series-6-light: hsl(34, 47%, 71%);
        --color-palette-series-7-light: hsl(51, 46%, 89%);
        --color-palette-series-8-light: hsl(253, 16%, 68%);
        --color-palette-series-9-light: hsl(85, 55%, 61%);
      }
      /* Series color rules. --series-color-light is a scoped helper var that
       * .symbol.lighten reads so it can vary per series without needing
       * a separate rule per series-N combination. */
      .series-0 { fill: var(--color-palette-series-0); stroke: var(--color-palette-series-0); --series-color-light: var(--color-palette-series-0-light); }
      .series-1 { fill: var(--color-palette-series-1); stroke: var(--color-palette-series-1); --series-color-light: var(--color-palette-series-1-light); }
      .series-2 { fill: var(--color-palette-series-2); stroke: var(--color-palette-series-2); --series-color-light: var(--color-palette-series-2-light); }
      .series-3 { fill: var(--color-palette-series-3); stroke: var(--color-palette-series-3); --series-color-light: var(--color-palette-series-3-light); }
      .series-4 { fill: var(--color-palette-series-4); stroke: var(--color-palette-series-4); --series-color-light: var(--color-palette-series-4-light); }
      .series-5 { fill: var(--color-palette-series-5); stroke: var(--color-palette-series-5); --series-color-light: var(--color-palette-series-5-light); }
      .series-6 { fill: var(--color-palette-series-6); stroke: var(--color-palette-series-6); --series-color-light: var(--color-palette-series-6-light); }
      .series-7 { fill: var(--color-palette-series-7); stroke: var(--color-palette-series-7); --series-color-light: var(--color-palette-series-7-light); }
      .series-8 { fill: var(--color-palette-series-8); stroke: var(--color-palette-series-8); --series-color-light: var(--color-palette-series-8-light); }
      .series-9 { fill: var(--color-palette-series-9); stroke: var(--color-palette-series-9); --series-color-light: var(--color-palette-series-9-light); }
      /* Symbol fill overrides — must appear after .series-N so they win. */
      .symbol.lighten { fill: var(--series-color-light); }
      .symbol.empty   { fill: none; }
      /* Cluster centroid: series color fills, black stroke forces centroid ring. */
      .cluster-centroid { stroke: black; }
      .symbol {
        /*stroke-width: 2;*/
        stroke-linejoin: round;
      }
      .symbol.outline {
        fill: white;
      }
      /* Pastry/leader overrides — same specificity as .series-N, later position wins */
      .pastry-outside-label-leader { fill: none; }
      .pastry-slice { stroke: white; }
      .label-leader path { fill: none; }
      use.visited-mark {
       pointer-events: none;
      }
      .bar {
        stroke-width: 0;
      }
      .data-line {
        fill: none;
        /*stroke-width: 3px;*/
        stroke-linecap: round;
      }
      .range-highlight {
        fill: silver;
        opacity: 0.5;
      }
      .linebreaker-marker {
        fill: hsl(0, 17.30%, 37.50%);
      }
      .user-linebreaker-marker {
        fill: hsl(0, 87%, 48%);
      }
      .trend-line{
        display: inline;
        stroke-width: 8px;
        stroke-linecap: butt;
        stroke-dasharray: 12 12;
        stroke-opacity: 0.8;
      }
      .user-trend-line{
        display: inline;
        stroke-width: 8px;
        stroke-linecap: butt;
        stroke-dasharray: 12 12;
        stroke-opacity: 0.8;
      }
      .datapoint.visited:not(.highlighted) {
        stroke: var(--visited-color, hsl(0, 100%, 50%));
        fill: var(--visited-color, hsl(0, 100%, 50%));
        stroke-width: var(--visited-stroke-width);
      }
      .lowlighted {
        opacity: 0.20;
      }
      .hidden {
        display: none;
      }
      .popup-box {
        filter: drop-shadow(3px 3px 5px #333);
        pointer-events: none;
      }
      .popup-text {
        pointer-events: none;
      }
      .underlay-rect {
        pointer-events: none;
      }
      .control-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5em;
      }
      .debug-grid-territory {
        fill: lightblue;
        stroke: blue;
        stroke-width: 2;
        opacity: 0.5;
      }
      .crosshair {
      stroke-dasharray: 12 12;
      stroke-width: 1.5;
      pointer-events: none;
      }
      /* -----------------------------------------------------------------------
       * forced-colors: active
       * Structural elements defer to system colour keywords; series colours are
       * preserved via forced-color-adjust: none because ParaCharts already
       * provides shape and pattern redundancy for non-colour differentiation.
       * ----------------------------------------------------------------------- */
      @media (forced-colors: active) {
        :host { background-color: Canvas; }
        #vert-axis-line,
        #horiz-axis-line  { stroke: CanvasText; }
        .chart-title,
        .axis-title-horiz,
        .axis-title-vert  { fill: CanvasText; }
        .tick-label-horiz,
        .tick-label-vert  { fill: CanvasText; }
        .tick             { stroke: CanvasText; opacity: 0.25; }
        .datapoint.visited { fill: GrayText; stroke: GrayText; }
        .series-0, .series-1, .series-2, .series-3,
        .series-4, .series-5, .series-6, .series-7,
        .series-8, .series-9 { forced-color-adjust: none; }
      }
      /* -----------------------------------------------------------------------
       * inverted-colors: inverted
       * Strengthen structural differentiation; shape/pattern redundancy is the
       * primary safeguard.
       * ----------------------------------------------------------------------- */
      @media (inverted-colors: inverted) {
        .focus-ring { stroke-width: 3px; }
      }
    `
  ];

  constructor() {
    super();
    // Create the listener here so it can be added and removed on connect/disconnect
    this._hotkeyListener = (e: HotkeyEvent) => {
      const handler = this.paraChart.api.actions[e.action as keyof AvailableActions];
      if (handler) {
        handler(e.args);
        //this._documentView!.postNotice(e.action, null);
      } else {
        this.log.warn(`no handler for action '${e.action}'`);
      }
    };
    this._jimReadyPromise = new Promise((resolve, reject) => {
      this._jimReadyResolver = resolve;
      this._jimReadyRejector = reject;
    });
  }

  get ariaLiveRegion() {
    return this._ariaLiveRegionRef.value!;
  }

  clearAriaLive() {
    this._ariaLiveRegionRef.value!.clear();
  }

  showAriaLiveHistory() {
    this._ariaLiveRegionRef.value!.showHistoryDialog();
  }

  get viewBox() {
    return this._viewBox;
  }

  get container() {
    return this._containerRef.value;
  }

  get root() {
    return this._rootRef.value;
  }

  get frame() {
    return this._frameRef.value;
  }

  get dataspace() {
    return this._dataspaceRef.value;
  }

  get documentView() {
    return this._documentView;
  }

  get prevFocusLeaf() {
    return this._prevFocusLeaf;
  }

  set prevFocusLeaf(view: View | undefined) {
    this._prevFocusLeaf = view;
  }

  get fileSavePlaceholder() {
    return this._fileSavePlaceholderRef.value!;
  }

  get defs() {
    return this._defs;
  }

  async jimReady() {
    await this._jimReadyPromise;
    this._jimReadyPromise = new Promise((resolve, reject) => {
      this._jimReadyResolver = resolve;
      this._jimReadyRejector = reject;
    });
  }

  rejectJimReady() {
    this._jimReadyRejector();
  }

  get pointerEventManager() {
    return this._pointerEventManager;
  }

  get paraState() {
    return this._paraState;
  }

  connectedCallback() {
    super.connectedCallback();
    this._colorPrefManager = new ColorPrefManager(this._paraState);
    this._colorPrefManager.init();
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this._controller ??= new ParaViewController(this._paraState);
    this._storeChangeUnsub = this._paraState.subscribe(async (key, value) => {
      if (key === 'data') {
        await this._dataUpdated();
      }
      await this._documentView?.storeDidChange(key, value);
      await this._paraState.chartInfo?.storeDidChange(key, value);
    });
    this.computeViewBox();
    // this._hotkeyActions ??= new NormalHotkeyActions(this);
    this._paraState.keymapManager.addEventListener('hotkeypress', this._hotkeyListener);
    if (!this._paraState.config.chart.isStatic) {
      this._pointerEventManager = new PointerEventManager(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._colorPrefManager?.destroy();
    this._storeChangeUnsub();
    this._paraState.keymapManager.removeEventListener('hotkeyPress', this._hotkeyListener);
  }

  // Anything that needs to be done when data is updated, do here
  protected async _dataUpdated(): Promise<void> {
    try {
      this._paraState.chartInfo.setParaView(this);
      this.createDocumentView();
      if (this.paraChart.headless) {
        await this.addJIMSeriesSummaries();
      }
      this._jimReadyResolver();
    } catch (error) {
      this.log.error('dataUpdated error:', error);
      this._jimReadyRejector();
    }
  }

  protected willUpdate(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    //this.log.info('will update');
    // for (const [k, v] of changedProperties.entries()) {
    //   // @ts-ignore
    //   this.log.info(`- ${k.toString()}:`, v, '->', this[k]);
    // }
    if (changedProperties.has('width')) {
      this.computeViewBox();
    }
    if (changedProperties.has('chartTitle') && this.documentView) {
      this.documentView.setTitleText(this.chartTitle);
    }
    if (changedProperties.has('xAxisLabel') && this.documentView) {
      this.documentView.xAxis!.setAxisLabelText(this.xAxisLabel);
    }
    if (changedProperties.has('yAxisLabel') && this.documentView) {
      this.documentView.yAxis!.setAxisLabelText(this.yAxisLabel);
    }
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    this.log.info('ready');
    this.dispatchEvent(new CustomEvent('paraviewready', { bubbles: true, composed: true, cancelable: true }));
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting) {
    this._documentView?.settingDidChange(path, oldValue, newValue);
    switch (path) {
      case 'ui.isFullscreenEnabled':
        this._handleFullscreen(newValue);
        break;
      case 'ui.isLowVisionModeEnabled':
        this._handleLowVisionMode(newValue);
        break;
      case 'ui.isVoicingEnabled':
        this._handleVoicing();
        break;
      case 'ui.isTourGuideEnabled':
        this._handleTourGuide();
        break;
      case 'ui.isTourGuidePaused':
        this._handleTourGuidePaused();
        break;
      default:
        break;
    }
  }

  protected _handleFullscreen(newValue?: ConfigSetting) {
    if (newValue && !document.fullscreenElement) {
      try {
        this._containerRef.value!.requestFullscreen();
      } catch {
        this.log.error('failed to enter fullscreen');
        this._paraState.updateConfig(draft => {
          draft.ui.isFullscreenEnabled = false;
        }, true);
      }
    } else if (!newValue && document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch {
        this.log.error('failed to exit fullscreen');
        this._paraState.updateConfig(draft => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    }
  }

  protected _onFullscreenChange() {
    if (document.fullscreenElement) {
      this._isFullscreen = true;
      if (!this._paraState.config.ui.isFullscreenEnabled) {
        // fullscreen was entered manually
        this._paraState.updateConfig(draft => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    } else {
      this._isFullscreen = false;
      if (this._paraState.config.ui.isLowVisionModeEnabled) {
        this._paraState.updateConfig(draft => {
          draft.ui.isLowVisionModeEnabled = false;
        });
      } else if (this._paraState.config.ui.isFullscreenEnabled) {
        // fullscreen was exited manually
        this._paraState.updateConfig(draft => {
          draft.ui.isFullscreenEnabled = false;
        }, true);
      }
    }
    if (this.documentView) {
      const delayedUpdate = () => {
        setTimeout(() => {
          const newWidth = (window.innerWidth / window.innerHeight) * this._paraState.config.chart.height;
          if (this._isFullscreen) {
            this._paraState.updateConfig(draft => {
              this._modeSaved.set('chart.width', draft.chart.width);
              draft.chart.width = newWidth;
            }, true);
          } else {
            this._paraState.updateConfig(draft => {
              draft.chart.width = this._modeSaved.get('chart.width');
              this._modeSaved.delete('chart.width');
            }, true);
          }
          this.paraChart.styleManager.update();
          this.createDocumentView();
        }, 40);
      };
      delayedUpdate();
    }
  }

  protected _handleLowVisionMode(newValue?: ConfigSetting) {
    const cc = this._paraState.config.color;
    const ui = this._paraState.config.ui;
    this._paraState.announce(`Low vision mode ${newValue ? 'enabled' : 'disabled'}`);
    if (newValue) {
      const themeDefault = cc.lowVisionThemeDefault as 'system' | 'light' | 'dark';
      if (themeDefault !== 'system') {
        this._modeSaved.set('color.themeMode', cc.themeMode);
        this._modeSaved.set('color.themeSource', cc.themeSource);
        this._colorPrefManager.setModeDefault('themeMode', themeDefault, true);
      }
      const contrastDefault = cc.lowVisionContrastDefault as 'system' | 'lower' | 'normal' | 'higher' | 'custom';
      if (contrastDefault !== 'system') {
        this._modeSaved.set('color.contrastMode', cc.contrastMode);
        this._modeSaved.set('color.contrastLevel', cc.contrastLevel);
        this._modeSaved.set('color.contrastSource', cc.contrastSource);
        this._colorPrefManager.setContrastModeDefault(contrastDefault, cc.lowVisionContrastLevel as number, true);
      }
    } else {
      if (this._modeSaved.has('color.themeMode')) {
        this._colorPrefManager.restoreTheme(
          this._modeSaved.get('color.themeMode') as 'auto' | 'light' | 'dark',
          this._modeSaved.get('color.themeSource') as any,
        );
        this._modeSaved.delete('color.themeMode');
        this._modeSaved.delete('color.themeSource');
      } else {
        this._colorPrefManager.clearModeDefault('themeMode');
      }
      if (this._modeSaved.has('color.contrastMode')) {
        this._colorPrefManager.restoreContrast(
          this._modeSaved.get('color.contrastMode') as any,
          this._modeSaved.get('color.contrastLevel') as number,
          this._modeSaved.get('color.contrastSource') as any,
        );
        this._modeSaved.delete('color.contrastMode');
        this._modeSaved.delete('color.contrastLevel');
        this._modeSaved.delete('color.contrastSource');
      } else {
        this._colorPrefManager.clearContrastModeDefault();
      }
    }

    // --- Config (updateConfig path: palette, font scale, gridlines, fullscreen) ---
    this._paraState.updateConfig(draft => {
      if (newValue) {
        if (ui.lowVisionDisableAnimations) {
          this._modeSaved.set('animation.isAnimationEnabled', draft.animation.isAnimationEnabled);
          this._documentView!.chartLayers.dataLayer.stopAnimation();
          draft.animation.isAnimationEnabled = false;
        }
        if (ui.lowVisionIsFullscreen) {
          this._modeSaved.set('ui.isFullscreenEnabled', draft.ui.isFullscreenEnabled);
          draft.ui.isFullscreenEnabled = true;
        }
        if (cc.lowVisionColorPalette) {
          this._modeSaved.set('color.colorPalette', draft.color.colorPalette);
          draft.color.colorPalette = 'low-vision';
        }
        if (ui.lowVisionFontScale !== 1) {
          this._modeSaved.set('chart.fontScale', draft.chart.fontScale);
          draft.chart.fontScale = ui.lowVisionFontScale as number;
        }
        if (ui.lowVisionIsVertGridlines) {
          this._modeSaved.set('grid.isDrawVertLines', draft.grid.isDrawVertLines);
          draft.grid.isDrawVertLines = true;
        }
      } else {
        if (this._modeSaved.has('animation.isAnimationEnabled')) {
          draft.animation.isAnimationEnabled = this._modeSaved.get('animation.isAnimationEnabled');
          this._modeSaved.delete('animation.isAnimationEnabled');
        }
        if (this._modeSaved.has('ui.isFullscreenEnabled')) {
          draft.ui.isFullscreenEnabled = this._modeSaved.get('ui.isFullscreenEnabled');
          this._modeSaved.delete('ui.isFullscreenEnabled');
        }
        if (this._modeSaved.has('color.colorPalette')) {
          draft.color.colorPalette = this._modeSaved.get('color.colorPalette');
          this._modeSaved.delete('color.colorPalette');
        }
        if (this._modeSaved.has('chart.fontScale')) {
          draft.chart.fontScale = this._modeSaved.get('chart.fontScale');
          this._modeSaved.delete('chart.fontScale');
        }
        if (this._modeSaved.has('grid.isDrawVertLines')) {
          draft.grid.isDrawVertLines = this._modeSaved.get('grid.isDrawVertLines');
          this._modeSaved.delete('grid.isDrawVertLines');
        }
      }
    });
  }

  protected _handleVoicing() {
    if (this._paraState.config.ui.isVoicingEnabled) {
      if (this._paraState.config.ui.isTourGuideEnabled) {
        this.ariaLiveRegion.voicing.speak('Tour guide enabled.', []);
      }
      else {
        this.ariaLiveRegion.voicing.speak('Self-voicing enabled.', []);
      }
    } else {
      if (this._paraState.config.ui.isTourGuideEnabled) {
        this.ariaLiveRegion.voicing.speak('Tour guide disabled.', []);
      }
      else {
        this.ariaLiveRegion.voicing.speak('Self-voicing disabled.', []);
      }
      //this.ariaLiveRegion.voicing.shutUp();
      // if (this._paraState.settings.ui.isNarrativeHighlightEnabled) {
      //   this._paraState.updateSettings(draft => {
      //     draft.ui.isNarrativeHighlightEnabled = false;
      //   });
      // }
    }
  }

  protected _handleTourGuide() {
    if (this._paraState.config.ui.isTourGuideEnabled) {
      // if (this._paraState.settings.ui.isVoicingEnabled) {
      //   this.ariaLiveRegion.voicing.speak('Tour guide enabled.', []);
      // }
      if (this._paraState.config.ui.isVoicingEnabled) {
        this.ariaLiveRegion.voicing.speak('Tour guide enabled.', []);
        this._paraState.announce(this.paraChart.paraState.caption);
      } else {
        this._paraState.announce('Tour guide enabled.');
      }
      this._paraState.startTourGuide();
      this.paraChart.api.enableTourGuideActions();
    } else {
      // if (this._paraState.settings.ui.isVoicingEnabled) {
      //   this.ariaLiveRegion.voicing.speak('Tour guide disabled.', []);
      // }
      this._paraState.announce('Tour guide disabled.');
      this._paraState.endTourGuide();
      this.paraChart.captionBox.clearSpanHighlights();
      this.paraChart.api.disableTourGuideActions();
    }
  }

  protected _handleTourGuidePaused() {
    this.ariaLiveRegion.voicing.togglePaused();
  }

  /*protected updated(changedProperties: PropertyValues) {
    this.log.info('canvas updated');
    if (changedProperties.has('dataState')) {
      if (this.dataState === 'pending') {
        const bbox = this._rootRef.value!.getBoundingClientRect();
        const textLength = bbox.width / 3;
        const fontSize = 20;
        const rectHPadding = 5;
        const rectVPadding = 3;
        const rectWidth = textLength + rectHPadding * 2;
        const rectHeight = fontSize + rectVPadding * 2;
        this.loadingMessageRectRef.value!.setAttribute('x', `${bbox.width / 2 - rectWidth / 2}`);
        this.loadingMessageRectRef.value!.setAttribute('y', `${bbox.height / 2}`);
        this.loadingMessageRectRef.value!.setAttribute('width', `${rectWidth}`);
        this.loadingMessageRectRef.value!.setAttribute('height', `${rectHeight}`);
        this.loadingMessageTextRef.value!.setAttribute('x', `${bbox.width / 2 - textLength / 2}`);
        this.loadingMessageTextRef.value!.setAttribute('y', `${bbox.height / 2 + fontSize}`);
        this.loadingMessageTextRef.value!.setAttribute('textLength', `${textLength}`);
        this.loadingMessageStyles = {
          'font-size': `${fontSize}px`,
          color: 'black'
        };
      } else if (this.dataState === 'complete') {
        this.loadingMessageStyles = {
          display: 'none'
        };
        //this.todo.signalManager.signal('canvasDataLoadComplete');
        // this.isReady = true;
      }
    }
  }*/

  ref<T>(key: string): Ref<T> {
    if (!this._chartRefs.has(key)) {
      this._chartRefs.set(key, createRef());
    }
    return this._chartRefs.get(key) as Ref<T>;
  }

  unref(key: string): void {
    if (key.endsWith('*')) {
      // assume key looks like 'foo.*'
      const prefix = key.slice(0, -1);
      for (const refKey of this._chartRefs.keys()) {
        if (refKey.startsWith(prefix)) {
          this._chartRefs.delete(refKey);
        }
      }
    } else if (!this._chartRefs.has(key)) {
      throw new Error(`no ref for key '${key}'`);
    } else {
      this._chartRefs.delete(key);
    }
  }

  createDocumentView() {
    this._documentView = new DocumentView(this);
    this._documentView.init();
    this.computeViewBox();
    // The style manager may get declaration values from chart objects
    this.paraChart.styleManager.update();
    // Ensure defs container is present before adding defs
    // register/remove pattern defs based on current palette
    if (this._paraState.colors.palette?.isPattern) {
      this._registerPatternDefs();
    } else {
      this._removePatternDefs();
    }
  }

  destroyDocumentView() {
    this._removePatternDefs();
    this._documentView = undefined;
  }

  computeViewBox() {
    this._viewBox = {
      x: 0,
      y: 0,
      width: this._paraState.config.chart.width,
      height: this._paraState.config.chart.height
    };
    this.log.info('view box:', this._viewBox.width, 'x', this._viewBox.height);
  }

  updateViewbox(x?: number, y?: number, width?: number, height?: number) {
    this.viewBox.x = x ?? this.viewBox.x;
    this.viewBox.y = y ?? this.viewBox.y;
    this.viewBox.width = width ?? this.viewBox.width;
    this.viewBox.height = height ?? this.viewBox.height;
  }

  // updateDefs(el: SVGLinearGradientElement) {
  //   this._defsRef.value!.appendChild(el);
  // }

  async addJIMSeriesSummaries() {
    if (isPastryType(this._paraState.type)) {
      this._addJIMSliceSummaries();
      return;
    }
    if (!this._paraState.chartInfo.summarizer) {
      this.log.warn('Cannot add JIM series summaries: documentView or summarizer not available');
      return;
    }
    const summarizer = this._paraState.chartInfo.summarizer;
    const seriesKeys = this._paraState.model?.originalSeriesKeys || [];
    for (const seriesKey of seriesKeys) {
      const summary = await summarizer.getSeriesSummary(strToId(seriesKey));
      const summaryText = typeof summary === 'string' ? summary : summary.text;
      this._paraState.jimerator?.addSeriesSummary(seriesKey, summaryText);
    }
    this.requestUpdate();
  }

  private _addJIMSliceSummaries() {
    const model = this._paraState.model;
    if (!model) {
      this.log.warn('Cannot add JIM slice summaries: model not available');
      return;
    }
    const series = model.series[0];
    const datapoints = series.datapoints;
    const totalValue = datapoints.reduce(
      (sum, dp) => sum + (dp.facetValueNumericized('y') ?? 0), 0
    );
    datapoints.forEach((dp, index) => {
      const value = dp.facetValueNumericized('y') ?? 0;
      const pct = totalValue > 0 ? Math.round(value / totalValue * 100) : 0;
      const description = `${dp.facetValue('x')}, ${pct}%`;
      this._paraState.jimerator?.addSliceSummary(index, description);
    });
    this.requestUpdate();
  }

  serialize() {
    const svg = this.root!.cloneNode(true) as SVGSVGElement;
    svg.id = 'para' + (window.crypto.randomUUID?.() ?? '');

    // Build a #svgId { } rule from the canonical palette state and append it after the
    // extracted shadow DOM styles so it wins the cascade over the diva fallback values
    // in the rewritten :host block. Reading from the model (paletteVars()) rather than
    // back from the DOM avoids coupling this code to the naming conventions used by
    // _rootStyle().
    const paletteVars = this._paraState.colors.paletteVars();
    const paletteRule = Object.keys(paletteVars).length
      ? `#${svg.id} {\n${Object.entries(paletteVars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`
      : '';
    // Remove palette vars from the cloned element's inline style — they now live in <style>.
    for (const key of Object.keys(paletteVars)) {
      svg.style.removeProperty(key);
    }

    // Generate id-scoped series rules so exported SVG contains enough .series-N selectors
    const baseKeys = Object.keys(paletteVars).filter(k => /^--color-palette-series-\d+$/.test(k));
    let seriesRule = '';
    if (baseKeys.length) {
      const indices = baseKeys.map(k => Number(k.replace('--color-palette-series-', '')));
      const maxIndex = Math.max(...indices);
      const cap = Math.min(maxIndex, 255);
      for (let i = 0; i <= cap; i++) {
        seriesRule += `#${svg.id} .series-${i} { fill: var(--color-palette-series-${i}); stroke: var(--color-palette-series-${i}); --series-color-light: var(--color-palette-series-${i}-light); }\n`;
      }
    }

    const styles = this.paraChart.extractStyles(svg.id) + '\n' + this.extractStyles(svg.id) + '\n' + paletteRule + '\n' + seriesRule;
    const styleEl = document.createElementNS(SVGNS, 'style');
    styleEl.textContent = styles;
    svg.prepend(styleEl);

    const toPrune: Comment[] = [];
    const pruneComments = (nodes: NodeList) => {
      for (const node of nodes) {
        if (node instanceof Comment) {
          toPrune.push(node);
        } else if (node.childNodes.length) {
          pruneComments(node.childNodes);
        }
      }
    };
    pruneComments(svg.childNodes);
    toPrune.forEach(c => c.remove());

    // Remove the selection layer
    svg.lastElementChild!.lastElementChild!.children[5].remove();

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('role');

    // XXX Also remove visited styling (not just the layer)

    return new XMLSerializer().serializeToString(svg)
      .split('\n')
      .filter(line => !line.match(/^\s*$/))
      .join('\n');
  }

  downloadSVG() {
    const data = this.serialize();
    const svgBlob = new Blob([data], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const svgURL = URL.createObjectURL(svgBlob);
    this.downloadContent(svgURL, 'svg');
    URL.revokeObjectURL(svgURL);
  }

  downloadPNG() {
    // hat tip: https://takuti.me/note/javascript-save-svg-as-image/
    const data = this.serialize();
    const svgBlob = new Blob([data], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const svgURL = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.addEventListener('load', () => {
      const bbox = this._rootRef.value!.getBBox();
      const canvas = document.createElement('canvas');
      canvas.width = bbox.width;
      canvas.height = bbox.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(img, 0, 0, bbox.width, bbox.height);
      URL.revokeObjectURL(svgURL);
      canvas.toBlob(canvasBlob => {
        if (canvasBlob) {
          const blobURL = URL.createObjectURL(canvasBlob);
          this.downloadContent(blobURL, 'png');
          URL.revokeObjectURL(blobURL);
        } else {
          throw new Error('failed to create image download blob');
        }
      });
    });
    img.src = svgURL;
  }

  downloadContent(url: string, extension: string) {
    const downloadLinkEl = document.createElement('a');
    this.fileSavePlaceholder.appendChild(downloadLinkEl);
    const title = this._documentView!.titleText || 'parachart';
    downloadLinkEl.download = `${title.replace(/\W/g, '_')}.${extension}`;
    downloadLinkEl.href = url;
    downloadLinkEl.click();
    downloadLinkEl.remove();
  }

  addDef(key: string, template: SVGTemplateResult) {
    if (this._defs[key]) {
      throw new Error('view already in defs');
    }
    this.log.info('ADDING DEF', key);
    this._defs = { ...this._defs, [key]: template };
    // this.requestUpdate();
    render(template, this._defsRef.value as unknown as HTMLElement, {
      renderBefore: this._defsRef.value!.firstChild
    });
  }

  protected _registerPatternDefs() {
    const palette = this._paraState.colors.palette;
    if (!palette || !palette.isPattern || !palette.patterns) return;
    for (let i = 0; i < palette.patterns.length; i++) {
      const key = `Pattern${i}`;
      if (!this._defs[key]) {
        try {
          this.addDef(key, palette.patterns[i].value as SVGTemplateResult);
          this._registeredPatternKeys.push(key);
        } catch {
          // ignore if addDef failed (def already present)
        }
      }
    }
  }

  protected _removePatternDefs() {
    if (!this._registeredPatternKeys.length) return;
    // remove entries from this._defs and from DOM
    const remaining = { ...this._defs };
    for (const key of this._registeredPatternKeys) {
      if (remaining[key]) {
        delete remaining[key];
        // also attempt DOM removal for safety (defs rendered under _defsRef)
        try {
          const node = this._defsRef.value?.querySelector ? this._defsRef.value.querySelector(`#${key}`) : null;
          if (node && node.parentNode) node.parentNode.removeChild(node);
        } catch {
          // ignore DOM removal errors
        }
      }
    }
    this._defs = remaining;
    this._registeredPatternKeys = [];
  }

  protected _rootStyle() {
    const fontFamilyClasses: Record<string, string> = {
      'Helvetica': 'sans-serif',
      'Verdana': 'sans-serif',
      'Tahoma': 'sans-serif',
      'Times New Roman': 'serif',
      'Georgia': 'serif'
    };
    const style: { [prop: string]: any } = {
      fontFamily: this._paraState.config.chart.fontFamily
        + ',' + fontFamilyClasses[this._paraState.config.chart.fontFamily],
      fontWeight: this._paraState.config.chart.fontWeight
    };
    if (this._paraState.config.chart.isUseBraille) {
      style.fontFamily = 'braille36';
    }
    if (this._isFullscreen) {
      const vbWidth = Math.round(this._viewBox.width);
      const vbHeight = Math.round(this._viewBox.height);
      const vbRatio =
        (Math.min(vbWidth, vbHeight) / Math.max(vbWidth, vbHeight)) * 100;
      style.width = "100vw";
      style.height = "100vh";
    }
    const contrast = this._paraState.config.color.contrastLevel * 50;
    if (this._paraState.config.color.isDarkModeEnabled) {
      style["--axis-line-color"] = `hsl(0, 0%, ${50 + contrast}%)`;
      style["--label-color"] = `hsl(0, 0%, ${50 + contrast}%)`;
    } else {
      style["--axis-line-color"] = `hsl(0, 0%, ${50 - contrast}%)`;
      style["--label-color"] = `hsl(0, 0%, ${50 - contrast}%)`;
    }
    // backgroundColor is always set by ColorPrefManager._resolve() to the
    // theme-appropriate default (white / computed dark) unless the user has
    // explicitly chosen a custom color, in which case their choice wins.
    style["--background-color"] = this._paraState.config.color.backgroundColor || '#ffffff';
    // Inject per-palette CSS custom properties so .series-N rules resolve
    // correctly for any palette, including author-defined ones.
    Object.assign(style, this._paraState.colors.paletteVars());
    return style;
  }

  protected _seriesCss(): string {
    try {
      const paletteVars = this._paraState.colors.paletteVars();
      // collect base series keys like --color-palette-series-0 (ignore -light variants)
      const baseKeys = Object.keys(paletteVars).filter(k => /^--color-palette-series-\d+$/.test(k));
      if (!baseKeys.length) return '';
      // determine max index so we generate contiguous rules up to the highest index
      const indices = baseKeys.map(k => Number(k.replace('--color-palette-series-', '')));
      const maxIndex = Math.max(...indices);
      // safety cap to avoid massive generation
      const cap = Math.min(maxIndex, 255);
      let css = '';
      for (let i = 0; i <= cap; i++) {
        css += `.series-${i} { fill: var(--color-palette-series-${i}); stroke: var(--color-palette-series-${i}); --series-color-light: var(--color-palette-series-${i}-light); }\n`;
      }
      return css;
    } catch (err) {
      this.log.error('failed to build series css', err);
      return '';
    }
  }

  protected _rootClasses() {
    const sys = this._colorPrefManager?.getSystemState();
    return {
      darkmode: this._paraState.config.color.isDarkModeEnabled,
      // These JS classes mirror the @media (forced-colors: active) and
      // @media (inverted-colors: inverted) blocks in static styles. The @media blocks
      // handle standard browser support. These classes exist as the fallback hook for
      // -para- prefixed custom media queries (e.g. (-para-forced-colors: active)) that
      // browsers won't detect natively — _colorPrefManager detects those via JS and
      // surfaces them here so static styles can target .forced-colors and
      // .inverted-colors as selectors alongside the standard @media blocks.
      // When -para- query detection is implemented, add matching CSS rules for
      // .forced-colors { ... } and .inverted-colors { ... } in static styles.
      'forced-colors': sys?.forcedColorsActive ?? false,
      'inverted-colors': sys?.invertedColorsActive ?? false,
    };
  }

  navToDatapoint(seriesKey: string, index: number) {
    this._paraState.chartInfo.navToDatapoint(seriesKey, index);
  }


  clipTo(seriesKey: string, index: number) {
    const fraction = this.documentView!.chartLayers.dataLayer.datapointView(seriesKey.toLowerCase(), index)!.x / this.documentView!.chartLayers.width;
    const oldWidth = this.clipWidth;
    this.clipWidth = Number(fraction);
    for (let dpView of this.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView;
      dpView.completeLayout();
      pointDpView.stopAnimation();
    }
    for (let dpView of this.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView;
      pointDpView.alwaysClip = true;
      if (pointDpView.x - 1 <= Number(fraction) * this.documentView!.chartLayers.width
        && pointDpView.x - 1 > oldWidth * this.documentView!.chartLayers.width
      ) {
        pointDpView.popInAnimation();
      }
      else if (pointDpView.x - 1 > Number(fraction) * this.documentView!.chartLayers.width) {
        pointDpView.baseSymbolScale = 0;
      }
    }
    loopParaviewRefresh(
      this,
      this._paraState.config.animation.popInAnimateRevealTimeMs,
      50
    );
  }

  render(): TemplateResult {
    return html`
    <svg role="img"
    aria-label= "Press tab to interact with ParaChart"
    height="1"
    width="1"
    viewBox="0 0 1 1"
    xmlns=${SVGNS}
      <rect x="0" y="0" width="1" height="1" fill="none" stroke="none" />
    </svg>
    <div ${ref(this._containerRef)} @fullscreenchange=${() => this._onFullscreenChange()}>
    <svg
        role="application"
        tabindex=${this.disableFocus ? -1 : 0}
        aria-label=${this._documentView ? `${this._documentView.titleText}, accessible chart` : 'loading...'}
        ${ref(this._rootRef)}
        xmlns=${SVGNS}
        data-charttype=${this.paraChart.type ?? this.type}
        width=${this.scalable ? '100%' : fixed`${this._viewBox.width}px`}
        height=${this.scalable ? '100%' : fixed`${this._viewBox.height}px`}
        class=${classMap(this._rootClasses())}
        viewBox=${fixed`${this._viewBox.x} ${this._viewBox.y} ${this._viewBox.width} ${this._viewBox.height}`}
        style=${styleMap(this._rootStyle())}
        @focus=${() => {
        if (!this._paraState.config.chart.isStatic) {
          //this.log.info('focus');
          //this.todo.deets?.onFocus();
          //this._paraState.chartInfo.navMap?.visitDatapoints();
        }
      }}
        @keydown=${(event: KeyboardEvent) => this._controller.handleKeyEvent(event)}
        @pointerdown=${(ev: PointerEvent) => this._pointerEventManager?.handleStart(ev)}
        @pointerup=${(ev: PointerEvent) => this._pointerEventManager?.handleEnd(ev)}
        @pointercancel=${(ev: PointerEvent) => this._pointerEventManager?.handleCancel(ev)}
        @pointermove=${(ev: PointerEvent) => this._pointerEventManager?.handleMove(ev)}
        @pointerleave=${(ev: PointerEvent) => this.requestUpdate()}
        @click=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager?.handleClick(ev)}
        @dblclick=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager?.handleDoubleClick(ev)}
      >
        <defs>
          <g ${ref(this._defsRef)}>
          </g>
          ${svg`${this._seriesCss() ? svg`<style>${this._seriesCss()}</style>` : ''}`}
          ${this._documentView?.horizAxis ? svg`
            <clipPath id="clip-path">
              <rect
                x=${0}
                y=${0}
                width=${this._documentView.chartLayers ? this.clipWidth * this._documentView.chartLayers.width : 0}
                height=${this._documentView.chartLayers ? this._documentView.chartLayers.height : 0}>
              </rect>
            </clipPath>
          ` : ''
      }
        </defs>
        <metadata data-type="application/jim+json">
          ${this._paraState.jimerator ? JSON.stringify(this._paraState.jimerator.manifest, undefined, 2) : ''}
        </metadata>
        <rect
          ${ref(this._frameRef)}
          id="frame"
          class=${this._paraState.index === 0 ? 'explainer' : nothing}
          pointer-events="all"
          x="0"
          y="0"
          width="100%"
          height="100%"
          @pointerleave=${(ev: PointerEvent) => { this.paraState.clearPopups() }}
        >
        </rect>
        ${this._paraState.model ? (this._documentView?.render() ?? '') : ''}
      </svg>
      <para-aria-live-region
        ${ref(this._ariaLiveRegionRef)}
        .globalState=${this._globalState}
        .announcement=${this._paraState.announcement}
      ></para-aria-live-region>
      <div
        ${ref(this._fileSavePlaceholderRef)}
        hidden
      ></div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-view': ParaView;
  }
}
