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


import { ParaViewController } from '.';
import { logging } from '../common/logger';
import { ParaComponent } from '../paracomponent';
import { ChartType } from '../common/types';
import { ViewBox } from '../store/settings_types';
import { View } from '../view_temp/base_view';
import { DocumentView } from '../view_temp/document_view';
//import { styles } from './styles';
import { SVGNS } from '../common/constants';
import { fixed } from '../common/utils';

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

  @property() type: ChartType = 'bar';
  @property() chartTitle?: string;
  @property() xAxisLabel?: string;
  @property() yAxisLabel?: string;
  @property() contrastLevel: number = 1;

  protected _controller!: ParaViewController;
  protected _viewBox!: ViewBox;
  protected _prevFocusLeaf?: View;
  protected _rootRef = createRef<SVGSVGElement>();
  protected _defsRef = createRef<SVGDefsElement>();
  protected _frameRef = createRef<SVGRectElement>();
  protected _dataspaceRef = createRef<SVGGElement>();
  protected _documentView?: DocumentView;
  //private _jimerator!: Jimerator;
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
  @state() private loadingMessageStyles: { [key: string]: any } = {
    display: 'none'
  };
  protected _chartRefs: Map<string, Ref<any>> = new Map();
  protected _fileSavePlaceholderRef = createRef<HTMLElement>();

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

  connectedCallback() {
    super.connectedCallback();
    // FIXME: create store
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this._controller = new ParaViewController(this._store);
    this._store.subscribe((key, value) => {
      if (key === 'data') {
        this.createDocumentView();
      }
    });

    this._computeViewBox();
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
    this.dispatchEvent(new CustomEvent('paraviewready', {bubbles: true, composed: true, cancelable: true}));
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

    //this._jimerator = new Jimerator(this);

    this._documentView = new DocumentView(this);
    
    //this._jimerator.render();

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

  updateDefs(el: SVGLinearGradientElement) {
    this._defsRef.value!.appendChild(el);
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

    const contrast = this.contrastLevel * 50;
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

  /*setLowVisionMode(lvm: boolean) {
    this.controller.setSetting('color.isDarkModeEnabled', lvm);
    this.controller.setSetting('ui.isFullScreenEnabled', lvm);
    this._documentView!.setLowVisionMode(lvm);
  }
  
  setFullscreen(fullscreen: boolean) {
    if (fullscreen) {
      if (!document.fullscreenElement && this.root && this.root.requestFullscreen) {
        this.root.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      } 
    }
  }*/

  render(): TemplateResult {
    this.log('render');
    return html`
      <svg
        ${ref(this._rootRef)}
        xmlns=${SVGNS}
        aria-label=${this._documentView ? `${this._documentView.titleText}, Sonified chart` : 'loading...'}
        data-charttype=${this.type}
        role="application"
        tabindex="0"
        height=${fixed`${this._viewBox.height}px`}
        class=${classMap(this._rootClasses())}
        viewBox=${fixed`${this._viewBox.x} ${this._viewBox.y} ${this._viewBox.width} ${this._viewBox.height}`}
        style=${styleMap(this._rootStyle())}
        @fullscreenchange=${() => {
          if (document.fullscreenElement) {
            // entering fullscreen mode
            this.log('entering fullscreen');
          } else {
            // exiting fullscreen mode
            this.log('exiting fullscreen');
            /*if (this._controller.settingStore.settings.ui.isLowVisionModeEnabled) {
              this._controller.setSetting('ui.isLowVisionModeEnabled', false);
            } else {
              this._controller.settingViews.update('ui.isFullScreenEnabled', false);
            }*/
          }
        }}
        @focus=${() => {
          this.log('focus');
          //this.todo.deets?.onFocus();
          //this.documentView?.chartLayers.dataLayer.visitAndPlayCurrent();
          this.documentView?.chartLayers.dataLayer.chartLandingView.focus();
        }}
        @keydown=${(event: KeyboardEvent) => this._controller.handleKeyEvent(event)}
      >
        <defs
          ${ref(this._defsRef)}
        >
          ${this._documentView?.horizAxis ? svg`
            <clipPath id="clip-path">
              <rect 
                x=${0} 
                y=${0} 
                width=${this._documentView.chartLayers.physWidth} 
                height=${this._documentView.chartLayers.physHeight}>
              </rect>
            </clipPath>
          ` : ''
      }
        </defs>
        <metadata data-type="text/jim+json">
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
