/* ParaCharts: ParaView Chart View
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

import { LitElement, PropertyValueMap, PropertyValues, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';

import { ChartType } from '../common/types';
import { ViewBox } from '../store/settings';
import { View } from './base_view';

type ColorVisionMode = 'normal' | 'deutan' | 'protan' | 'tritan' | 'grayscale';
type DataState = 'initial' | 'pending' | 'complete' | 'error';

@customElement('paraview')
export class ParaView extends LitElement {

  private type: ChartType = 'bar';
  private chartTitle?: string;
  private xAxisLabel?: string;
  private yAxisLabel?: string;
  private darkMode = false;
  private contrastLevel: number = 1;
  private colorMode: ColorVisionMode = 'normal';

  private dataState: DataState = 'initial';
  private dataError?: unknown;

  private _viewBox!: ViewBox;
  private _prevFocusLeaf?: View;
  private _rootRef = createRef<SVGSVGElement>();
  private _defsRef = createRef<SVGDefsElement>();
  private _frameRef = createRef<SVGRectElement>();
  private _dataspaceRef = createRef<SVGGElement>();
  private _documentView?: DocumentView;
  //private _jimerator!: Jimerator;
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
  private loadingMessageStyles: { [key: string]: any } = {
    display: 'none'
  };
  private _isReady = false;
  private chartRefs: Map<string, Ref<any>> = new Map();

  // TEMP
  log(msg: string): void {
    console.log(msg);
  }

  static styles = [
    styles,
    css`
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

  // get activeSeries() {
  //   return this._activeSeries;
  // }

  get documentView() {
    return this._documentView;
  }

  get prevFocusLeaf() {
    return this._prevFocusLeaf;
  }

  set prevFocusLeaf(view: View | undefined) {
    this._prevFocusLeaf = view;
  }

  // set activeSeries(key: string) {
  //   console.log('setting active series to', key);
  //   this._activeSeries = key;
  //   const series = this.controller.model!.data.col(this._activeSeries);
  //   if (series.dtype !== 'number') {
  //     throw new Error('active series must have datatype \'number\'');
  //   }
  //   this.todo.deets!.activeSeriesData = series.data.join(' ');
  //   this.dispatchEvent(new CustomEvent('activeserieschange', { bubbles: true, composed: true }));
  // }

  /*get jim(): Jim {
    return this._jimerator.jim;
  }

  get jimerator() {
    return this._jimerator;
  }*/

  get isReady() {
    return this._isReady;
  }

  set isReady(ready: boolean) {
    if (!this._isReady) {
      this._isReady = ready;
      //this.todo.signalManager.signal('canvasReady');
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this.computeViewBox();
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    // this.todo.signalManager.signal('canvasFirstUpdate');
    this.isReady = true;
  }

  protected updated(changedProperties: PropertyValues) {
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
  }

  ref<T>(key: string): Ref<T> {
    if (!this.chartRefs.has(key)) {
      this.chartRefs.set(key, createRef());
    }
    return this.chartRefs.get(key) as Ref<T>;
  }

  unref(key: string): void {
    if (key.endsWith('*')) {
      // assume key looks like 'foo.*'
      const prefix = key.slice(0, -1);
      for (const refKey of this.chartRefs.keys()) {
        if (refKey.startsWith(prefix)) {
          this.chartRefs.delete(refKey);
        }
      }
    } else if (!this.chartRefs.has(key)) {
      throw new Error(`no ref for key '${key}'`);
    } else {
      this.chartRefs.delete(key);
    }
  }

  createDocumentView() {
    this.log('creating document view', this.type);

    this._jimerator = new Jimerator(this);

    this._documentView?.cleanup();
    this._documentView = new DocumentView(this);

    this._jimerator.render();

    this.computeViewBox();
    //this.activeSeries = this.controller.model!.depVars[0];
    this.dispatchEvent(new CustomEvent('chartcreate', { bubbles: true, composed: true }));
  }

  private computeViewBox() {
    this._viewBox = {
      x: 0,
      y: 0,
      width: this._documentView?.boundingWidth ?? this.controller.settingStore.settings.chart.size.width!,
      height: this._documentView?.boundingHeight ?? this.controller.settingStore.settings.chart.size.height!
    };
    this.log('view box:', this._viewBox.width, 'x', this._viewBox.height);
  }

  updateViewbox(x?: number, y?: number, width?: number, height?: number) {
    this.viewBox.x = x ?? this.viewBox.x;
    this.viewBox.y = y ?? this.viewBox.y;
    this.viewBox.width = width ?? this.viewBox.width;
    this.viewBox.height = height ?? this.viewBox.height;
  }

  /**
   * Wire up the hotkey action event listeners
   */
  private initializeKeyActionMap() {
    //this.keyEventManager = new KeyboardEventManager(this._documentView!.chart);

    /*if (this._info.notes?.length > 0) {
      this._keyEventManager.registerKeyEvent({
        title: this._translator.translate("info-open"),
        caseSensitive: false,
        key: "i",
        callback: this._availableActions.info
      });
    }*/

    /*const hotkeyCallbackWrapper = (cb: (args: c2mCallbackType) => void) => {
      cb({
        slice: this._currentGroupName,
        index: this._pointIndex,
        //point: this.currentPoint
      });
    };*/

    /*this._options.customHotkeys?.forEach((hotkey) => {
      this._keyEventManager.registerKeyEvent({
        ...hotkey,
        key: keyboardEventToString(hotkey.key as KeyboardEvent),
        callback: () => {
          hotkeyCallbackWrapper(hotkey.callback);
        }
      });
    });*/

    //this._cleanUpTasks.push(() => {
    //  this._keyEventManager.cleanup();
    //});
  }

  updateDefs(el: SVGLinearGradientElement) {
    this._defsRef.value!.appendChild(el);
  }

  rootStyle() {
    const style: { [prop: string]: any } = {
      fontFamily: this.controller.settingStore.settings.chart.fontFamily,
      fontWeight: this.controller.settingStore.settings.chart.fontWeight
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
    if (this.todo.darkMode) {
      style['--axisLineColor'] = `hsl(0, 0%, ${50 + contrast}%)`;
      style['--labelColor'] = `hsl(0, 0%, ${50 + contrast}%)`;
      style['--backgroundColor'] = `hsl(0, 0%, ${((100 - contrast) / 5) - 10}%)`;
    } else {
      style['--axisLineColor'] = `hsl(0, 0%, ${50 - contrast}%)`;
      style['--labelColor'] = `hsl(0, 0%, ${50 - contrast}%)`;
    }

    // if (this.colorMode === 'normal') {
    //   Object.assign(style, this.controller.colorsPaletteStyles);
    // }

    return style;
  }

  rootClasses() {
    return {
      darkmode: this.todo.darkMode,
    }
  }

  hotkeyInfo(key: string, action: string, actionReceiver: View): HotkeyInfo {
    return {
      key,
      action,
      actionReceiver,
      visited: this.documentView!.chartLayers.dataLayer.visitedDatapointViews,
      selected: this.documentView!.chartLayers.dataLayer.selectedDatapointViews,
      isChordMode: this.documentView!.chartLayers.dataLayer instanceof XYChart 
        ? this.documentView!.chartLayers.dataLayer.isChordModeEnabled 
        : false 
    };
  }

  /**
   * Dispatch a `TodoEvent` when a hotkey is pressed, and 
   * (if said event isn't cancelled) perform the default action for the hotkey.
   * @param event - keydown event
   */
  handleKeyEvent(event: KeyboardEvent) {    
    const keyId = [ 
      event.altKey ? 'Alt+' : '',
      event.ctrlKey ? 'Ctrl+' : '',
      event.shiftKey ? 'Shift+' : '',
      event.key
    ].join('');
    this.log('KEY', keyId, this.documentView?.focusLeaf);
    const hotkeyInfo = this.documentView?.focusLeaf.hotkeyInfo(keyId);
    if (hotkeyInfo) {
      this.documentView!.focusLeaf.hotkeyActionManager.dispatch(hotkeyInfo);
      event.preventDefault();
    }
  }

  setLowVisionMode(lvm: boolean) {
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
  }

  render() {
    this.log('render');
    return html`
      <svg
        ${ref(this._rootRef)}
        xmlns=${svgns}
        aria-label=${this._documentView ? `${this._documentView.titleText}, Sonified chart` : 'loading...'}
        data-charttype=${this.type}
        role="application"
        tabindex="0"
        height=${fixed`${this._viewBox.height}px`}
        class=${classMap(this.rootClasses())}
        viewBox=${fixed`${this._viewBox.x} ${this._viewBox.y} ${this._viewBox.width} ${this._viewBox.height}`}
        style=${styleMap(this.rootStyle())}
        @fullscreenchange=${() => {
          if (document.fullscreenElement) {
            // entering fullscreen mode
            this.log('entering fullscreen');
          } else {
            // exiting fullscreen mode
            this.log('exiting fullscreen');
            if (this._controller.settingStore.settings.ui.isLowVisionModeEnabled) {
              this._controller.setSetting('ui.isLowVisionModeEnabled', false);
            } else {
              this._controller.settingViews.update('ui.isFullScreenEnabled', false);
            }
          }
        }}
        @focus=${() => {
          this.log('focus');
          this.todo.deets?.onFocus();
          //this.documentView?.chartLayers.dataLayer.visitAndPlayCurrent();
          this.documentView?.chartLayers.dataLayer.chartLandingView.focus();
        }}
        @keydown=${(event: KeyboardEvent) => this.handleKeyEvent(event)}
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
          ${this._jimerator ? JSON.stringify(this.jim, undefined, 2) : ''}
        </metadata>
        <rect 
          ${ref(this._frameRef)}
          id="frame"
          class=${this.dataState === 'pending' ? 'pending' : nothing}
          pointer-events="all"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
        </rect>
        ${this._documentView?.render() ?? ''}
        <g
          id="loading-message"
          style=${styleMap(this.loadingMessageStyles)}
        >
          <rect
            ${ref(this.loadingMessageRectRef)}
          >
          </rect>
          <text
            ${ref(this.loadingMessageTextRef)}
          >
            Loading...
          </text>
        </g>
      </svg>
    `;
  }

}
