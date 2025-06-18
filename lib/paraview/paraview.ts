/* ParaCharts: ParaView Chart Views
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

import { PointerEventManager } from './pointermanager';
import { type ParaChart } from '../parachart/parachart';
import { ParaViewController } from '.';
import { logging } from '../common/logger';
import { ParaComponent } from '../components';
import { ChartType } from '@fizz/paramanifest';
import { ViewBox } from '../store/settings_types';
import { View } from '../view/base_view';
import { DocumentView } from '../view/document_view';
//import { styles } from './styles';
import { SVGNS } from '../common/constants';
import { fixed } from '../common/utils';
import { Summarizer, PlaneChartSummarizer, PastryChartSummarizer } from '@fizz/parasummary';

import { PropertyValueMap, TemplateResult, css, html, nothing, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * Data provided for the on focus callback
 */
export type c2mCallbackType = {
  slice: string;
  index: number;
  //point: SupportedDataPointType;
};

@customElement('para-view')
export class ParaView extends logging(ParaComponent) {

  paraChart!: ParaChart;
  
  @property() type: ChartType = 'bar';
  @property() chartTitle?: string;
  @property() xAxisLabel?: string;
  @property() yAxisLabel?: string;
  @property() contrastLevel: number = 1;
  @property({type: Boolean}) disableFocus = false;

  protected _controller!: ParaViewController;
  protected _viewBox!: ViewBox;
  protected _prevFocusLeaf?: View;
  protected _rootRef = createRef<SVGSVGElement>();
  protected _defsRef = createRef<SVGDefsElement>();
  protected _frameRef = createRef<SVGRectElement>();
  protected _dataspaceRef = createRef<SVGGElement>();
  protected _documentView?: DocumentView;
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
  @state() private loadingMessageStyles: { [key: string]: any } = {
    display: 'none'
  };
  protected _chartRefs: Map<string, Ref<any>> = new Map();
  protected _fileSavePlaceholderRef = createRef<HTMLElement>();
  protected _summarizer!: Summarizer;
  protected _pointerEventManager = new PointerEventManager(this);
  @state() protected _defs: {[key: string]: TemplateResult} = {};
  isActive: boolean = true;
  static styles = [
    //styles,
    css`
      :host {
        --axisLineColor: hsl(0, 0%, 0%);
        --labelColor: hsl(0, 0%, 0%);
        --tickGridColor: hsl(270, 50%, 50%);
        --backgroundColor: white;
        --themeColor: var(--fizzThemeColor, purple);
        --themeColorLight: var(--fizzThemeColorLight, hsl(275.4, 100%, 88%));
        --themeContrastColor: white;
        --fizzThemeColor: var(--parachartsThemeColor, navy);
        --fizzThemeColorLight: var(--parachartsThemeColorLight, hsl(210.5, 100%, 88%));
        --visitedColor: red;
        --selectedColor: var(--labelColor);
        --datapointCentroid: 50% 50%;
        --focusAnimation: all 0.5s ease-in-out;
        --chartCursor: pointer;
        --dataCursor: cell;

        --focusShadowColor: gray;
        --focusShadow: drop-shadow(0px 0px 4px var(--focusShadowColor));
        display: block;
        font-family: "Trebuchet MS", Helvetica, sans-serif;
        font-size: var(--chart-view-font-size, 1rem);
      }
      #frame {
        fill: var(--backgroundColor);
        stroke: none;
      }
      #frame.pending {
        fill: lightgray;
      }
      .darkmode {
        --axisLineColor: ghostwhite;
        --labelColor: ghostwhite;
        --backgroundColor: black;
      }
      #loading-message {
        fill: black;
      }
      #loading-message text {
        fill: white;
      }
      .grid-horiz {
        stroke: var(--axisLineColor);
        opacity: 0.2;
      }
      .grid-vert {
        stroke: var(--axisLineColor);
        opacity: 0.2;
      }
      .tick-horiz {
        stroke: black;
      }
      .tick-vert {
        stroke: black;
      }
      .label {
        fill: var(--labelColor);
      }
      .tick-label {
        font-size: 13px;
        fill: var(--labelColor);
      }
      .bar-label {
        font-size: 13px;
        fill: white;
      }
      .radial-value-label {
        fill: white;
      }
      .radial-slice {
        stroke: white;
        stroke-width: 2;
      }
      #y-axis-line {
        fill: none;
        stroke: var(--axisLineColor);
        stroke-width: 2px;
        stroke-linecap: round;
      }
      #x-axis-line {
        fill: none;
        stroke: var(--axisLineColor);
        opacity: 1;
        stroke-width: 2px;
        stroke-linecap: round;
      }
      rect#data-backdrop {
        stroke: none;
        fill: none;
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
      .data-line {
        fill: none;
        /*stroke-width: 3px;*/
        stroke-linecap: round;
      }
      .chart-title {
        font-size: 1.25rem;
      }
      .range-highlight {
        fill: purple;
        opacity: 0.3;
      }
    `
  ];

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

  get summarizer() {
    return this._summarizer;
  }

  get defs() {
    return this._defs;
  }

  connectedCallback() {
    super.connectedCallback();
    // FIXME: create store
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this._controller = new ParaViewController(this._store);
    this._store.subscribe((key, value) => {
      if (key === 'data') {
        this.dataUpdated();
      }
    });
    this._computeViewBox();
  }

  // Anything that needs to be done when data is updated, do here
  private dataUpdated(): void {
    this.createDocumentView();
    this._summarizer = (this.store.type === 'pie' || this.store.type === 'donut')
      ? new PastryChartSummarizer(this._store.model!)
      : new PlaneChartSummarizer(this._store.model!);
  }

  protected willUpdate(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    this.log('will update');
    for (const [k, v] of changedProperties.entries()) {
      // @ts-ignore
      this.log(`- ${k.toString()}:`, v, '->', this[k]);
    }
    if (changedProperties.has('width')) {
      this._computeViewBox();
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
    this.log('ready');
    
    this._store.observeSetting('ui.isFullscreenEnabled', (_oldVal, newVal) => {
      if (this.isActive){
        if (newVal && !document.fullscreenElement) {
          try {
            this.root!.requestFullscreen();
          } catch {
            console.error('failed to enter fullscreen');
            this._store.updateSettings(draft => {
              draft.ui.isFullscreenEnabled = false;
            }, true);
          }
        } else if (!newVal && document.fullscreenElement) {
          try {
            document.exitFullscreen();
          } catch {
            console.error('failed to exit fullscreen');
            this._store.updateSettings(draft => {
              draft.ui.isFullscreenEnabled = true;
            }, true);
          }
        }
      }
    });
    this._store.observeSetting('ui.isLowVisionModeEnabled', (_oldVal: boolean, newVal: boolean) => {
      this._store.updateSettings(draft => {
        this._store.announce(`Low vision mode ${newVal ? 'enabled' : 'disabled'}`);
        draft.color.isDarkModeEnabled = newVal;
        draft.ui.isFullscreenEnabled = newVal;
      });
    });
    this.dispatchEvent(new CustomEvent('paraviewready', {bubbles: true, composed: true, cancelable: true}));
  }

  protected _onFullscreenChange() {
    if (document.fullscreenElement) {
      if (!this._store.settings.ui.isFullscreenEnabled) {
        // fullscreen was entered manually
        this._store.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    } else {
      if (this._store.settings.ui.isLowVisionModeEnabled) {
        this._store.updateSettings(draft => {
          draft.ui.isLowVisionModeEnabled = false;
        });
      } else if (this._store.settings.ui.isFullscreenEnabled) {
        // fullscreen was exited manually
        this._store.updateSettings(draft => {
          draft.ui.isFullscreenEnabled = false;
        }, true);
      }
    }
  }

  /*protected updated(changedProperties: PropertyValues) {
    this.log('canvas updated');
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

  createDocumentView(contentWidth?: number) {
    this.log('creating document view', this.type);

    this._documentView?.cleanup();
    this._documentView = new DocumentView(this);
    
    this._computeViewBox();
  }

  protected _computeViewBox() {
    this._viewBox = {
      x: 0,
      y: 0,
      width: this._documentView?.boundingWidth ?? this._store.settings.chart.size.width!,
      height: this._documentView?.boundingHeight ?? this._store.settings.chart.size.height!
    };
    this.log('view box:', this._viewBox.width, 'x', this._viewBox.height);
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

  serialize() {
    const svg = this.root!.cloneNode(true) as SVGSVGElement;
    svg.id = 'para' + (window.crypto.randomUUID?.() ?? '');

    const styles = this._extractStyles(svg.id);
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

    svg.removeAttribute('role');

    // XXX Also remove visited styling (not just the layer)
    
    return new XMLSerializer().serializeToString(svg)
      .split('\n')
      .filter(line => !line.match(/^\s*$/))
      .join('\n');
  }

  protected _extractStyles(id: string) {
    const stylesheets = this.shadowRoot!.adoptedStyleSheets;
    const out: string[] = [];
    for (const stylesheet of stylesheets) {
      const rules = stylesheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules.item(i) as CSSRule;
        out.push(rule.cssText.replace(/^:host/, `#${id}`));
      }
    }
    return out.join('\n');
  }

  addDef(key: string, template: TemplateResult) {
    if (this._defs[key]) {
      throw new Error('view already in defs');
    }
    console.log('ADDING DEF', key);
    this._defs = {...this._defs, [key]: template};
    this.requestUpdate();
  }

  protected _rootStyle() {
    const style: { [prop: string]: any } = {
      fontFamily: this._store.settings.chart.fontFamily,
      fontWeight: this._store.settings.chart.fontWeight
    };
    if (document.fullscreenElement === this.root) {
      const vbWidth = Math.round(this._viewBox.width);
      const vbHeight = Math.round(this._viewBox.height);
      const vbRatio = (Math.min(vbWidth, vbHeight) / Math.max(vbWidth, vbHeight)) * 100;
      if (vbWidth > vbHeight) {
        style.width = '100vw';
        style.height = `${vbRatio}vh`;
      } else {
        style.width = `${vbRatio}vw`;
        style.height = '100vh';
      }
    }

    const contrast = this.store.settings.color.contrastLevel * 50;
    if (this._store.settings.color.isDarkModeEnabled) {
      style['--axisLineColor'] = `hsl(0, 0%, ${50 + contrast}%)`;
      style['--labelColor'] = `hsl(0, 0%, ${50 + contrast}%)`;
      style['--backgroundColor'] = `hsl(0, 0%, ${((100 - contrast) / 5) - 10}%)`;
    } else {
      style['--axisLineColor'] = `hsl(0, 0%, ${50 - contrast}%)`;
      style['--labelColor'] = `hsl(0, 0%, ${50 - contrast}%)`;
    }
    return style;
  }

  protected _rootClasses() {
    return {
      darkmode: this._store.settings.color.isDarkModeEnabled
    }
  }
  
  focusDatapoint(seriesKey: string, index: number) {
    this._documentView!.chartLayers.dataLayer.focusDatapoint(seriesKey, index);
  }

  cleanup() {
    this.isActive = false;
  }

  render(): TemplateResult {
    this.log('render');
    return html`
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
        @fullscreenchange=${() => this._onFullscreenChange()}
        @focus=${() => {
          this.log('focus');
          //this.todo.deets?.onFocus();
          //this.documentView?.chartLayers.dataLayer.visitAndPlayCurrent();
          this.documentView?.chartLayers.dataLayer.chartLandingView.focus(true);
        }}
        @keydown=${(event: KeyboardEvent) => this._controller.handleKeyEvent(event)}
        @pointerdown=${(ev: PointerEvent) => this._pointerEventManager.handleStart(ev)}
        @pointerup=${(ev: PointerEvent) => this._pointerEventManager.handleEnd(ev)}
        @pointercancel=${(ev: PointerEvent) => this._pointerEventManager.handleCancel(ev)}
        @pointermove=${(ev: PointerEvent) => this._pointerEventManager.handleMove(ev)}
        @click=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager.handleClick(ev)}
        @dblclick=${(ev: PointerEvent | MouseEvent) => this._pointerEventManager.handleDoubleClick(ev)}
      >
        <defs
          ${ref(this._defsRef)}
        >
          ${Object.entries(this._defs).map(([key, template]) => template)}
          ${this._documentView?.horizAxis ? svg`
            <clipPath id="clip-path">
              <rect 
                x=${0} 
                y=${0} 
                width=${this._documentView.chartLayers.width} 
                height=${this._documentView.chartLayers.height}>
              </rect>
            </clipPath>
          ` : ''
      }
        </defs>
        <metadata data-type="text/jim+json">
          ${this._store.jimerator ? JSON.stringify(this._store.jimerator.jim, undefined, 2) : ''}
        </metadata>
        <rect 
          ${ref(this._frameRef)}
          id="frame"
          class=${nothing}
          pointer-events="all"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
        </rect>
        ${this._documentView?.render() ?? ''}
      </svg>
      <div
        ${ref(this._fileSavePlaceholderRef)}
        hidden
      ></div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-view': ParaView;
  }
}
