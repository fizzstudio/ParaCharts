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

import { type AriaLive } from '../components';
import { Logger, getLogger } from '@fizz/logger';
import { PointerEventManager } from './pointermanager';
import { type ParaChart } from '../parachart/parachart';
import { ParaViewController } from '.';
import { ParaComponent } from '../components';
import { ChartType, strToId } from '@fizz/paramanifest';
import { type ViewBox, type Setting, type HotkeyEvent } from '../state';
import { View } from '../view/base_view';
import { DocumentView } from '../view/document_view';
import { PointDatapointView } from '../view/layers';
//import { styles } from './styles';
import { SVGNS } from '../common/constants';
import { fixed, isPointerInbounds } from '../common/utils';
import { loopParaviewRefresh } from '../common';

import { PropertyValueMap, SVGTemplateResult, TemplateResult, css, html, nothing, render, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Unsubscribe } from '@lit-app/state';
import { AvailableActions } from '../state/action_map';

/**
 * Data provided for the on focus callback
 */
export type c2mCallbackType = {
  slice: string;
  index: number;
  //point: SupportedDataPointType;
};

@customElement('para-view')
export class ParaView extends ParaComponent {

  paraChart!: ParaChart;

  @property() type: ChartType = 'bar';
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
  protected _pushedDocumentview: DocumentView | null = null;
  protected _containerRef = createRef<HTMLDivElement>();
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
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
  @state() protected _jim = '';
  @state() protected _isFullscreen = false;
  protected _exitingLowVisionMode = false;
  protected _hotkeyListener: (e: HotkeyEvent) => void;
  protected _storeChangeUnsub!: Unsubscribe;

  protected _modeSaved = new Map<string, any>();
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
        fill: floralwhite;
        stroke: burlywood;
        stroke-width: 2;
      }
      .darkmode {
        --axis-line-color: ghostwhite;
        --label-color: ghostwhite;
        --background-color: black;
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
      #grid-zero {
        opacity: 0.6;
        stroke-width: 2;
      }
      .tick {
        stroke: var(--label-color);
      }
      .chart-title {
        font-size: calc(var(--chart-title-font-size)*var(--chart-font-scale));
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
      .view-highlight {
        stroke: red;
        stroke-width: 2;
        fill: none;
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
      .symbol {
        /*stroke-width: 2;*/
        stroke-linejoin: round;
      }
      .symbol.outline {
        fill: white;
      }
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
        stroke: var(--visited-color);
        fill: var(--visited-color);
        stroke-width: var(--visited-stroke-width);
      }
      .datapoint.highlighted {
/*        stroke: var(--highlighted-color);
        fill: var(--highlighted-color);
        stroke-width: var(--visited-stroke-width); */
      }
      .lowlight {
        opacity: 0.20;
      }
      .hidden {
        display: none;
      }
      .invis {
        opacity: 0;
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

  get pointerEventManager() {
    return this._pointerEventManager;
  }

  get paraState() {
    return this._paraState;
  }

  connectedCallback() {
    super.connectedCallback();
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this._controller ??= new ParaViewController(this._paraState);
    this._storeChangeUnsub = this._paraState.subscribe(async (key, value) => {
      if (key === 'data') {
        await this.dataUpdated();
      }
      await this._documentView?.storeDidChange(key, value);
    });
    this.computeViewBox();
    // this._hotkeyActions ??= new NormalHotkeyActions(this);
    this._paraState.keymapManager.addEventListener('hotkeypress', this._hotkeyListener);
    if (!this._paraState.settings.chart.isStatic) {
      this._pointerEventManager = new PointerEventManager(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._storeChangeUnsub();
    this._paraState.keymapManager.removeEventListener('hotkeyPress', this._hotkeyListener);
  }

  // Anything that needs to be done when data is updated, do here
  private async dataUpdated(): Promise<void> {
    try {
      this.createDocumentView();
      if (this.paraChart.headless) {
        await this.addJIMSeriesSummaries();
      }
      this._jim = this._paraState.jimerator ? JSON.stringify(this._paraState.jimerator.jim, undefined, 2) : '';
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

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
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
      case 'ui.isNarrativeHighlightEnabled':
        this._handleNarrativeHighlight();
        break;
      case 'ui.isNarrativeHighlightPaused':
        this._handleNarrativeHighlightPaused();
        break;
      default:
        break;
    }
  }

  protected _handleFullscreen(newValue?: Setting) {
    if (newValue && !document.fullscreenElement) {
      try {
        this._containerRef.value!.requestFullscreen();
      } catch {
        this.log.error('failed to enter fullscreen');
        this._paraState.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = false;
        }, true);
      }
    } else if (!newValue && document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch {
        this.log.error('failed to exit fullscreen');
        this._paraState.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    }
  }

  protected _onFullscreenChange() {
    if (document.fullscreenElement) {
      this._isFullscreen = true;
      if (!this._paraState.settings.ui.isFullscreenEnabled) {
        // fullscreen was entered manually
        this._paraState.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    } else {
      this._isFullscreen = false;
      if (this._paraState.settings.ui.isLowVisionModeEnabled) {
        this._paraState.updateSettings(draft => {
          draft.ui.isLowVisionModeEnabled = false;
        });
      } else if (this._paraState.settings.ui.isFullscreenEnabled) {
        // fullscreen was exited manually
        this._paraState.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = false;
        }, true);
      }
    }
  }

  protected _handleLowVisionMode(newValue?: Setting) {
    if (newValue) {
      this._paraState.colors.selectPaletteWithKey("low-vision")
    } else {
      if (this._paraState.colors.prevSelectedColor.length > 0) {
        this._paraState.colors.selectPaletteWithKey(this._paraState.colors.prevSelectedColor);
      }
    }
    this._paraState.updateSettings(draft => {
      this._paraState.announce(`Low vision mode ${newValue ? 'enabled' : 'disabled'}`);
      draft.color.isDarkModeEnabled = !!newValue;
      draft.ui.isFullscreenEnabled = !!newValue;
      if (newValue) {
        this._modeSaved.set('animation.isAnimationEnabled', draft.animation.isAnimationEnabled);
        this._modeSaved.set('chart.fontScale', draft.chart.fontScale);
        this._modeSaved.set('grid.isDrawVertLines', draft.grid.isDrawVertLines);
        // end any in-progress animation here
        this._documentView!.chartLayers.dataLayer.stopAnimation();
        draft.animation.isAnimationEnabled = false;
        draft.chart.fontScale = 2;
        draft.grid.isDrawVertLines = true;
      } else {
        this._exitingLowVisionMode = true;
        draft.animation.isAnimationEnabled = this._modeSaved.get('animation.isAnimationEnabled');
        draft.grid.isDrawVertLines = this._modeSaved.get('grid.isDrawVertLines');
        this._modeSaved.delete('animation.isAnimationEnabled');
        this._modeSaved.delete('chart.fontScale');
        this._modeSaved.delete('grid.isDrawVertLines');
      }
    });
    if (this._exitingLowVisionMode) {
      queueMicrotask(() => {
        this._paraState.updateSettings(draft => {
          draft.chart.fontScale = this._modeSaved.get('chart.fontScale');
        });
        this._exitingLowVisionMode = false;
      });
    }
  }

  protected _handleVoicing() {
    if (this._paraState.settings.ui.isVoicingEnabled) {
      this.ariaLiveRegion.voicing.speak('Self-voicing enabled.', []);
    } else {
      this.ariaLiveRegion.voicing.speak('Self-voicing disabled.', []);
      //this.ariaLiveRegion.voicing.shutUp();
      if (this._paraState.settings.ui.isNarrativeHighlightEnabled) {
        this._paraState.updateSettings(draft => {
          draft.ui.isNarrativeHighlightEnabled = false;
        });
      }
    }
  }

  protected _handleNarrativeHighlight() {
    if (this._paraState.settings.ui.isNarrativeHighlightEnabled) {
      this.ariaLiveRegion.voicing.speak('Tour guide enabled.', []);
      if (!this._paraState.settings.ui.isVoicingEnabled) {
        this._paraState.updateSettings(draft => {
          draft.ui.isVoicingEnabled = true;
        });
      }
      this._paraState.announce(this.paraChart.captionBox.getHighlightedSummary());
    } else {
      this.ariaLiveRegion.voicing.speak('Tour guide disabled.', []);
      this.paraChart.captionBox.clearSpanHighlights();
      this._paraState.clearAllHighlights();
      this._paraState.clearPopups();
      this._paraState.updateSettings(draft => {
        draft.ui.isVoicingEnabled = false;
      });
    }
  }

  protected _handleNarrativeHighlightPaused() {
    this.ariaLiveRegion.voicing.togglePaused();
  }

  startNarrativeHighlightMode() {
    this._paraState.updateSettings(draft => {
      draft.ui.isNarrativeHighlightEnabled = true;
    });
  }

  endNarrativeHighlightMode() {
    this._paraState.updateSettings(draft => {
      draft.ui.isNarrativeHighlightEnabled = false;
    });
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
  }

  destroyDocumentView() {
    this._documentView = undefined;
  }

  pushDocumentView() {
    if (this._pushedDocumentview) throw new Error('doc view already pushed');
    this._pushedDocumentview = this._documentView!;
    this._documentView = undefined;
  }

  popDocumentView() {
    if (!this._pushedDocumentview) throw new Error('no doc view pushed');
    this._documentView = this._pushedDocumentview;
    this._pushedDocumentview = null;
    this.requestUpdate();
  }

  computeViewBox() {
    this._viewBox = {
      x: 0,
      y: 0,
      width: this._paraState.settings.chart.size.width,
      height: this._paraState.settings.chart.size.height
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
    if (!this._documentView?.chartInfo?.summarizer) {
      this.log.warn('Cannot add JIM series summaries: documentView or summarizer not available');
      return;
    }
    const summarizer = this._documentView.chartInfo.summarizer;
    const seriesKeys = this._paraState.model?.originalSeriesKeys || [];
    for (const seriesKey of seriesKeys) {
      const summary = await summarizer.getSeriesSummary(strToId(seriesKey));
      const summaryText = typeof summary === 'string' ? summary : summary.text;
      this._paraState.jimerator?.addSeriesSummary(seriesKey, summaryText);
    }
  }

  serialize() {
    const svg = this.root!.cloneNode(true) as SVGSVGElement;
    svg.id = 'para' + (window.crypto.randomUUID?.() ?? '');

    const styles = this.paraChart.extractStyles(svg.id) + '\n' + this.extractStyles(svg.id);
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

  protected _rootStyle() {
    const style: { [prop: string]: any } = {
      fontFamily: this._paraState.settings.chart.fontFamily,
      fontWeight: this._paraState.settings.chart.fontWeight
    };
    if (this._isFullscreen) {
      const vbWidth = Math.round(this._viewBox.width);
      const vbHeight = Math.round(this._viewBox.height);
      const vbRatio =
        (Math.min(vbWidth, vbHeight) / Math.max(vbWidth, vbHeight)) * 100;
      style.width = "100vw";
      style.height = "100vh";
    }
    const contrast = this._paraState.settings.color.contrastLevel * 50;
    if (this._paraState.settings.color.isDarkModeEnabled) {
      style["--axis-line-color"] = `hsl(0, 0%, ${50 + contrast}%)`;
      style["--label-color"] = `hsl(0, 0%, ${50 + contrast}%)`;
      style["--background-color"] = `hsl(0, 0%, ${(100 - contrast) / 5 - 10}%)`;
    } else {
      style["--axis-line-color"] = `hsl(0, 0%, ${50 - contrast}%)`;
      style["--label-color"] = `hsl(0, 0%, ${50 - contrast}%)`;
    }
    return style;
  }

  protected _rootClasses() {
    return {
      darkmode: this._paraState.settings.color.isDarkModeEnabled
    }
  }

  navToDatapoint(seriesKey: string, index: number) {
    this._documentView!.chartInfo.navToDatapoint(seriesKey, index);
  }


  clipTo(seriesKey: string, index: number) {
    const fraction = this.documentView!.chartLayers.dataLayer.datapointView(seriesKey.toLowerCase(), index)!.x / this.documentView!.chartLayers.width;
    const oldWidth = this.clipWidth;
    this.clipWidth = Number(fraction);
    for (let dpView of this.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView as PointDatapointView;
      dpView.completeLayout();
      pointDpView.stopAnimation();
    }
    for (let dpView of this.documentView!.chartLayers.dataLayer.datapointViews) {
      const pointDpView = dpView as PointDatapointView;
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
      this._paraState.settings.animation.popInAnimateRevealTimeMs,
      50
    );
  }

  render(): TemplateResult {
    return html`
    <div ${ref(this._containerRef)} @fullscreenchange=${() => this._onFullscreenChange()}>
    <svg
        role="application"
        tabindex=${this.disableFocus ? -1 : 0}
        aria-label=${this._documentView ? `${this._documentView.titleText}, accessible chart` : 'loading...'}
        ${ref(this._rootRef)}
        xmlns=${SVGNS}
        data-charttype=${this.paraChart.type ?? this.type}
        width=${fixed`${this._viewBox.width}px`}
        height=${fixed`${this._viewBox.height}px`}
        class=${classMap(this._rootClasses())}
        viewBox=${fixed`${this._viewBox.x} ${this._viewBox.y} ${this._viewBox.width} ${this._viewBox.height}`}
        style=${styleMap(this._rootStyle())}
        @focus=${() => {
        if (!this._paraState.settings.chart.isStatic) {
          //this.log.info('focus');
          //this.todo.deets?.onFocus();
          //this.documentView?.chartInfo.navMap?.visitDatapoints();
        }
      }}
        @keydown=${(event: KeyboardEvent) => this._controller.handleKeyEvent(event)}
        @pointerdown=${(ev: PointerEvent) => this._pointerEventManager?.handleStart(ev)}
        @pointerup=${(ev: PointerEvent) => this._pointerEventManager?.handleEnd(ev)}
        @pointercancel=${(ev: PointerEvent) => this._pointerEventManager?.handleCancel(ev)}
        @pointermove=${(ev: PointerEvent) => this._pointerEventManager?.handleMove(ev)}
        @pointerleave=${(ev: PointerEvent) => !isPointerInbounds(this, ev) ? this.requestUpdate() : undefined}
        @click=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager?.handleClick(ev)}
        @dblclick=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager?.handleDoubleClick(ev)}
      >
        <defs>
          <g ${ref(this._defsRef)}>
          </g>
          ${this._documentView?.horizAxis ? svg`
            <clipPath id="clip-path">
              <rect
                x=${0}
                y=${0}
                width=${this.clipWidth * this._documentView.chartLayers.width}
                height=${this._documentView.chartLayers.height}>
              </rect>
            </clipPath>
          ` : ''
      }
        </defs>
        <metadata data-type="application/jim+json">
          ${this._jim}
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
          @pointerleave=${(ev: PointerEvent) => {this.paraState.clearPopups()}}
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
