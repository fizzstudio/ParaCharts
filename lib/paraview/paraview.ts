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

import { PointerEventManager } from "./pointermanager";
import { type ParaChart } from "../parachart/parachart";
import { ParaViewController } from ".";
import { logging } from "../common/logger";
import { ParaComponent } from "../components";
import { ChartType } from "@fizz/paramanifest";
import { type ViewBox, type Setting, type HotkeyEvent } from "../store";
import { View } from "../view/base_view";
import { DocumentView } from "../view/document_view";
//import { styles } from './styles';
import { SVGNS } from "../common/constants";
import { fixed, isPointerInbounds } from "../common/utils";
import {
  HotkeyActions,
  NarrativeHighlightHotkeyActions,
  NormalHotkeyActions,
} from "./hotkey_actions";

import { PropertyValueMap, TemplateResult, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { type Ref, ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { Unsubscribe } from "@lit-app/state";

/**
 * Data provided for the on focus callback
 */
export type c2mCallbackType = {
  slice: string;
  index: number;
  //point: SupportedDataPointType;
};

@customElement("para-view")
export class ParaView extends logging(ParaComponent) {
  paraChart!: ParaChart;

  @property() type: ChartType = "bar";
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
  protected _containerRef = createRef<HTMLDivElement>();
  protected _defsRef = createRef<SVGDefsElement>();
  protected _frameRef = createRef<SVGRectElement>();
  protected _dataspaceRef = createRef<SVGGElement>();
  protected _documentView?: DocumentView;
  private loadingMessageRectRef = createRef<SVGTextElement>();
  private loadingMessageTextRef = createRef<SVGTextElement>();
  @state() private loadingMessageStyles: { [key: string]: any } = {
    display: "none",
  };
  protected _chartRefs: Map<string, Ref<any>> = new Map();
  protected _fileSavePlaceholderRef = createRef<HTMLElement>();
  protected _pointerEventManager: PointerEventManager | null = null;
  protected _hotkeyActions!: HotkeyActions;
  @state() protected _defs: { [key: string]: TemplateResult } = {};

  protected _hotkeyListener: (e: HotkeyEvent) => void;
  protected _storeChangeUnsub!: Unsubscribe;

  protected _lowVisionModeSaved = new Map<string, any>();

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
        font-size: calc(var(--chart-title-font-size) * var(--chart-font-scale));
      }
      .axis-title-horiz {
        font-size: calc(
          var(--horiz-axis-title-font-size) * var(--chart-font-scale)
        );
      }
      .axis-title-vert {
        font-size: calc(
          var(--vert-axis-title-font-size) * var(--chart-font-scale)
        );
      }
      .direct-label {
        font-size: calc(
          var(--direct-label-font-size) * var(--chart-font-scale)
        );
      }
      .legend-label {
        font-size: calc(
          var(--legend-label-font-size) * var(--chart-font-scale)
        );
      }
      .label {
        fill: var(--label-color);
        stroke: none;
      }
      .label-bg {
        fill: lightgray;
      }
      .tick-label-horiz {
        font-size: calc(
          var(--horiz-axis-tick-label-font-size) * var(--chart-font-scale)
        );
      }
      .tick-label-vert {
        font-size: calc(
          var(--vert-axis-tick-label-font-size) * var(--chart-font-scale)
        );
      }
      .bar-label {
        font-size: calc(var(--bar-label-font-size) * var(--chart-font-scale));
        fill: white;
      }
      .bar-total-label {
        font-size: calc(var(--bar-label-font-size) * var(--chart-font-scale));
      }
      .column-label {
        font-size: calc(
          var(--column-label-font-size) * var(--chart-font-scale)
        );
        fill: white;
      }
      .column-total-label {
        font-size: calc(
          var(--column-label-font-size) * var(--chart-font-scale)
        );
        background-color: red;
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
        fill: hsl(0, 17.3%, 37.5%);
      }
      .user-linebreaker-marker {
        fill: hsl(0, 87%, 48%);
      }
      .trend-line {
        display: inline;
        stroke-width: 8px;
        stroke-linecap: butt;
        stroke-dasharray: 12 12;
        stroke-opacity: 0.8;
      }
      .user-trend-line {
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
        opacity: 0.2;
      }
      .hidden {
        display: none;
      }
      .invis {
        opacity: 0;
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
    `,
  ];

  constructor() {
    super();
    // Create the listener here so it can be added and removed on connect/disconnect
    this._hotkeyListener = (e: HotkeyEvent) => {
      const handler =
        this._hotkeyActions.actions[e.action as keyof HotkeyActions["actions"]];
      if (handler) {
        handler();
        //this._documentView!.postNotice(e.action, null);
      } else {
        console.warn(`no handler for hotkey action '${e.action}'`);
      }
    };
  }
  get ariaLiveRegion() {
    return this._ariaLiveRegionRef.value!;
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

  get pointerEventManager() {
    return this._pointerEventManager;
  }

  get hotkeyActions() {
    return this._hotkeyActions;
  }

  set hotkeyActions(actions: HotkeyActions) {
    this._hotkeyActions = actions;
  }

  connectedCallback() {
    super.connectedCallback();
    // create a default view box so the SVG element can have a size
    // while any data is loading
    this._controller ??= new ParaViewController(this._store);
    this._storeChangeUnsub = this._store.subscribe(async (key, value) => {
      if (key === "data") {
        this.dataUpdated();
      }
      await this._documentView?.storeDidChange(key, value);
    });
    this.computeViewBox();
    this._hotkeyActions ??= new NormalHotkeyActions(this);
    this._store.keymapManager.addEventListener(
      "hotkeypress",
      this._hotkeyListener
    );
    if (!this._store.settings.chart.isStatic) {
      this._pointerEventManager = new PointerEventManager(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._storeChangeUnsub();
    this._store.keymapManager.removeEventListener(
      "hotkeyPress",
      this._hotkeyListener
    );
  }

  // Anything that needs to be done when data is updated, do here
  private dataUpdated(): void {
    this.createDocumentView();
  }

  protected willUpdate(
    changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ) {
    //this.log('will update');
    for (const [k, v] of changedProperties.entries()) {
      // @ts-ignore
      this.log(`- ${k.toString()}:`, v, "->", this[k]);
    }
    if (changedProperties.has("width")) {
      this.computeViewBox();
    }
    if (changedProperties.has("chartTitle") && this.documentView) {
      this.documentView.setTitleText(this.chartTitle);
    }
    if (changedProperties.has("xAxisLabel") && this.documentView) {
      this.documentView.xAxis!.setAxisLabelText(this.xAxisLabel);
    }
    if (changedProperties.has("yAxisLabel") && this.documentView) {
      this.documentView.yAxis!.setAxisLabelText(this.yAxisLabel);
    }
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ) {
    this.log("ready");
    this.dispatchEvent(
      new CustomEvent("paraviewready", {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this._documentView?.settingDidChange(path, oldValue, newValue);
    if (path === "ui.isFullscreenEnabled") {
      if (newValue && !document.fullscreenElement) {
        try {
          this._containerRef.value?.requestFullscreen();
        } catch {
          console.error("failed to enter fullscreen");
          this._store.updateSettings((draft) => {
            draft.ui.isFullscreenEnabled = false;
          }, true);
        }
      } else if (!newValue && document.fullscreenElement) {
        try {
          document.exitFullscreen();
        } catch {
          console.error("failed to exit fullscreen");
          this._store.updateSettings((draft) => {
            draft.ui.isFullscreenEnabled = true;
          }, true);
        }
      }
    } else if (path === "ui.isLowVisionModeEnabled") {
      if (newValue) {
        this._store.colors.selectPaletteWithKey("low-vision");
      } else {
        if (this._store.colors.prevSelectedColor.length > 0) {
          this._store.colors.selectPaletteWithKey(
            this._store.colors.prevSelectedColor
          );
        }
      }
      this._store.updateSettings((draft) => {
        this._store.announce(
          `Low vision mode ${newValue ? "enabled" : "disabled"}`
        );
        draft.color.isDarkModeEnabled = !!newValue;
        draft.ui.isFullscreenEnabled = !!newValue;
        if (newValue) {
          this._lowVisionModeSaved.set(
            "chart.fontScale",
            draft.chart.fontScale
          );
          this._lowVisionModeSaved.set(
            "grid.isDrawVertLines",
            draft.grid.isDrawVertLines
          );
          draft.chart.fontScale = 2;
          draft.grid.isDrawVertLines = true;
        } else {
          draft.chart.fontScale =
            this._lowVisionModeSaved.get("chart.fontScale");
          draft.grid.isDrawVertLines = this._lowVisionModeSaved.get(
            "grid.isDrawVertLines"
          );
          this._lowVisionModeSaved.clear();
        }
      });
    } else if (path === "ui.isVoicingEnabled") {
      if (this._store.settings.ui.isVoicingEnabled) {
        if (this._hotkeyActions instanceof NormalHotkeyActions) {
          const msg = ["Self-voicing enabled."];
          const lastAnnouncement =
            this.ariaLiveRegion.lastAnnouncement;
          if (lastAnnouncement) {
            msg.push(lastAnnouncement);
          }
          this._store.announce(msg);
        } else {
          // XXX Would be nice to prefix this with "Narrative Highlight Mode enabled".
          // That would require being able to join a simple text announcement with
          // a HighlightedSummary
          (async () => {
            this._store.announce(
              await this._documentView!.chartInfo.summarizer.getChartSummary()
            );
          })();
        }
      } else {
        this.ariaLiveRegion.voicing.shutUp();
        // Voicing is disabled at this point, so manually push this message through
        this.ariaLiveRegion.voicing.speak(
          "Self-voicing disabled.",
          []
        );
      }
    } else if (path === "ui.isNarrativeHighlightEnabled") {
      if (this._store.settings.ui.isNarrativeHighlightEnabled) {
        if (this._store.settings.ui.isVoicingEnabled) {
          this.startNarrativeHighlightMode();
          const lastAnnouncement =
            this.ariaLiveRegion.lastAnnouncement;
          const msg = ["Narrative Highlights Mode enabled."];
          if (lastAnnouncement) msg.push(lastAnnouncement);
          this._store.announce(msg);
          (async () => {
            this._store.announce(
              await this._documentView!.chartInfo.summarizer.getChartSummary()
            );
          })();
        } else {
          this._store.updateSettings((draft) => {
            draft.ui.isVoicingEnabled = true;
          });
          this.startNarrativeHighlightMode();
          const lastAnnouncement =
            this.ariaLiveRegion.lastAnnouncement;
          const msg = ["Narrative Highlights Mode enabled."];
          if (lastAnnouncement) msg.push(lastAnnouncement);
          this._store.announce(msg);
          (async () => {
            this._store.announce(
              await this._documentView!.chartInfo.summarizer.getChartSummary()
            );
          })();
        }
      } else {
        // Narrative highlights turned OFF
        this.endNarrativeHighlightMode();

        // Disable self-voicing as well
        this._store.updateSettings((draft) => {
          draft.ui.isVoicingEnabled = false;
        });

        this._store.announce(["Narrative Highlight Mode disabled."]);
      }
    } else if (path === "ui.isNarrativeHighlightPaused") {
      this.ariaLiveRegion.voicing.togglePaused();
    }
  }

  protected _onFullscreenChange() {
    if (document.fullscreenElement) {
      if (!this._store.settings.ui.isFullscreenEnabled) {
        // fullscreen was entered manually
        this._store.updateSettings((draft) => {
          draft.ui.isFullscreenEnabled = true;
        }, true);
      }
    } else {
      if (this._store.settings.ui.isLowVisionModeEnabled) {
        this._store.updateSettings((draft) => {
          draft.ui.isLowVisionModeEnabled = false;
        });
      } else if (this._store.settings.ui.isFullscreenEnabled) {
        // fullscreen was exited manually
        this._store.updateSettings((draft) => {
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
    if (key.endsWith("*")) {
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

  startNarrativeHighlightMode() {
    this._hotkeyActions = new NarrativeHighlightHotkeyActions(this);
    this._store.updateSettings((draft) => {
      draft.ui.isVoicingEnabled = true;
    });
    this._store.updateSettings((draft) => {
      draft.chart.showPopups = true;
    });
  }

  endNarrativeHighlightMode() {
    this._store.updateSettings((draft) => {
      draft.ui.isVoicingEnabled = false;
    });
    this._store.updateSettings((draft) => {
      draft.chart.showPopups = false;
    });
    this._hotkeyActions = new NormalHotkeyActions(this);
  }

  createDocumentView() {
    this.log("creating document view", this.type);
    this._documentView = new DocumentView(this);
    this.computeViewBox();
    // The style manager may get declaration values from chart objects
    this.paraChart.styleManager.update();
  }

  computeViewBox() {
    this._viewBox = {
      x: 0,
      y: 0,
      width: this._store.settings.chart.size.width,
      height: this._store.settings.chart.size.height,
    };
    this.log("view box:", this._viewBox.width, "x", this._viewBox.height);
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
    svg.id = "para" + (window.crypto.randomUUID?.() ?? "");

    const styles =
      this.paraChart.extractStyles(svg.id) + "\n" + this.extractStyles(svg.id);
    const styleEl = document.createElementNS(SVGNS, "style");
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
    toPrune.forEach((c) => c.remove());

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.removeAttribute("role");

    // XXX Also remove visited styling (not just the layer)

    return new XMLSerializer()
      .serializeToString(svg)
      .split("\n")
      .filter((line) => !line.match(/^\s*$/))
      .join("\n");
  }

  downloadSVG() {
    const data = this.serialize();
    const svgBlob = new Blob([data], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgURL = URL.createObjectURL(svgBlob);
    this.downloadContent(svgURL, "svg");
    URL.revokeObjectURL(svgURL);
  }

  downloadPNG() {
    // hat tip: https://takuti.me/note/javascript-save-svg-as-image/
    const data = this.serialize();
    const svgBlob = new Blob([data], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgURL = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.addEventListener("load", () => {
      const bbox = this._rootRef.value!.getBBox();
      const canvas = document.createElement("canvas");
      canvas.width = bbox.width;
      canvas.height = bbox.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0, bbox.width, bbox.height);
      URL.revokeObjectURL(svgURL);
      canvas.toBlob((canvasBlob) => {
        if (canvasBlob) {
          const blobURL = URL.createObjectURL(canvasBlob);
          this.downloadContent(blobURL, "png");
          URL.revokeObjectURL(blobURL);
        } else {
          throw new Error("failed to create image download blob");
        }
      });
    });
    img.src = svgURL;
  }

  downloadContent(url: string, extension: string) {
    const downloadLinkEl = document.createElement("a");
    this.fileSavePlaceholder.appendChild(downloadLinkEl);
    const title = this._documentView!.titleText || "parachart";
    downloadLinkEl.download = `${title.replace(/\W/g, "_")}.${extension}`;
    downloadLinkEl.href = url;
    downloadLinkEl.click();
    downloadLinkEl.remove();
  }

  addDef(key: string, template: TemplateResult) {
    if (this._defs[key]) {
      throw new Error("view already in defs");
    }
    console.log("ADDING DEF", key);
    this._defs = { ...this._defs, [key]: template };
    this.requestUpdate();
  }

  protected _rootStyle() {
    const style: { [prop: string]: any } = {
      fontFamily: this._store.settings.chart.fontFamily,
      fontWeight: this._store.settings.chart.fontWeight,
    };
    if (document.fullscreenElement === this.root) {
      const vbWidth = Math.round(this._viewBox.width);
      const vbHeight = Math.round(this._viewBox.height);
      const vbRatio =
        (Math.min(vbWidth, vbHeight) / Math.max(vbWidth, vbHeight)) * 100;
      if (vbWidth > vbHeight) {
        style.width = "100vw";
        style.height = `${vbRatio}vh`;
      } else {
        style.width = `${vbRatio}vw`;
        style.height = "100vh";
      }
    }

    const contrast = this.store.settings.color.contrastLevel * 50;
    if (this._store.settings.color.isDarkModeEnabled) {
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
      darkmode: this._store.settings.color.isDarkModeEnabled,
    };
  }

  navToDatapoint(seriesKey: string, index: number) {
    this._documentView!.chartInfo.navToDatapoint(seriesKey, index);
  }

  render(): TemplateResult {
    this.log("render");
    return html`
      <div ${ref(this._containerRef)}>
        <svg
          role="application"
          tabindex=${this.disableFocus ? -1 : 0}
          aria-label=${this._documentView
        ? `${this._documentView.titleText}, accessible chart`
        : "loading..."}
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
        if (!this._store.settings.chart.isStatic) {
          //this.log('focus');
          //this.todo.deets?.onFocus();
          //this.documentView?.chartInfo.navMap?.visitDatapoints();
        }
      }}
          @keydown=${(event: KeyboardEvent) =>
        this._controller.handleKeyEvent(event)}
          @pointerdown=${(ev: PointerEvent) =>
        this._pointerEventManager?.handleStart(ev)}
          @pointerup=${(ev: PointerEvent) =>
        this._pointerEventManager?.handleEnd(ev)}
          @pointercancel=${(ev: PointerEvent) =>
        this._pointerEventManager?.handleCancel(ev)}
          @pointermove=${(ev: PointerEvent) =>
        this._pointerEventManager?.handleMove(ev)}
          @pointerleave=${(ev: PointerEvent) =>
        !isPointerInbounds(this, ev) ? this.requestUpdate() : undefined}
          @click=${(ev: PointerEvent | MouseEvent) =>
        this._pointerEventManager?.handleClick(ev)}
          @dblclick=${(ev: PointerEvent | MouseEvent) =>
        this._pointerEventManager?.handleDoubleClick(ev)}
        >
          <defs ${ref(this._defsRef)}>
            ${Object.entries(this._defs).map(([key, template]) => template)}
            ${this._documentView?.horizAxis
        ? svg`
              <clipPath id="clip-path">
                <rect
                  x=${0}
                  y=${0}
                  width=${this._documentView.chartLayers.width}
                  height=${this._documentView.chartLayers.height}>
                </rect>
              </clipPath>
            `
        : ""}
          </defs>
          <metadata data-type="text/jim+json">
            ${this._store.jimerator
        ? JSON.stringify(this._store.jimerator.jim, undefined, 2)
        : ""}
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
          ></rect>
          ${this._documentView?.render() ?? ""}
        </svg>
        <div ${ref(this._fileSavePlaceholderRef)} hidden></div>
      <para-aria-live-region
          ${ref(this._ariaLiveRegionRef)}
          .store=${this._store}
          .announcement=${this._store.announcement}
        ></para-aria-live-region>
	  </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "para-view": ParaView;
  }
}
