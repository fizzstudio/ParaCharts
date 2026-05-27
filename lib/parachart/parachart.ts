/* ParaCharts: Accessible Charts
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

import { Logger, getLogger } from '@fizz/logger';
import { ParaComponent } from '../components';
import { ChartType } from '@fizz/paramanifest'
import { DeepReadonly, Settings, SettingsInput, type Setting } from '../state/settings_types';
import { SettingsManager } from '../state';
import '../paraview';
import '../components/data_table';
import '../control_panel';
import '../control_panel/caption';
import { type ParaCaptionBox } from '../control_panel/caption';
import { type ParaView } from '../paraview';
import { type ParaControlPanel } from '../control_panel';
import { ParaState } from '../state';
import { load, LoadError, LoadErrorCode, type SourceKind } from '../loader/paraloader';
import { GlobalState } from '../state';
import { CustomPropertyLoader } from '../state/custom_property_loader';
import { styles } from '../view/styles';
import '../components/aria_live';
import { StyleManager, StyleManagerDeclarationValue } from './style_manager';
import { AvailableCommands, Commander } from './commander';
import { ParaAPI } from '../paraapi/paraapi';
import {
  Scrollyteller,
  type ScrollytellerOptions,
} from '../scrollyteller/scrollyteller';

import { html, css, PropertyValues, TemplateResult, nothing } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { SlotLoader } from '../loader/slotloader';
import { PairAnalyzerConstructor, SeriesAnalyzerConstructor } from '@fizz/paramodel';
import { TourBus } from './tour_bus';

import brailleFont from '../assets/Braille36US.woff2';
import hyperFont from '../assets/Atkinson-Hyperlegible-Regular-102a.woff2';

// @ts-ignore
import cpanelIconAlt from '../assets/info-icon-alt.svg';


// NOTE: We cannot use the `customElement` decorator here as that would clash with `ParaChartsAi`
/** @public */
export class ParaChart extends ParaComponent {
  @property({ type: Boolean }) headless = false;
  @property({ type: Boolean }) scalable = false;
  @property() accessor manifest = '';
  @property() manifestType: SourceKind = 'url';
  /** Manifest update polling interval in seconds */
  @property({ type: Number }) pollInterval = 0;
  // `data` must be a URL, if set
  @property() data = '';
  @property({type: Object}) accessor config: SettingsInput = {};
  @property() accessor forcecharttype: ChartType | undefined;
  @property() type?: ChartType;
  @property() accessor description: string | undefined;
  @property({type: Boolean, attribute: false}) isControlPanelOpen = false;
  @property({type: Boolean, attribute: false}) isDataTableVisible = false;

  readonly captionBox: ParaCaptionBox;
  protected _paraViewRef = createRef<ParaView>();
  protected _controlPanelRef = createRef<ParaControlPanel>();
  private _slotLoader = new SlotLoader();
  protected log: Logger = getLogger("ParaChart");

  // protected _suppleteSettingsWith?: DeepReadonly<Settings>;
  protected _readyPromise: Promise<void>;
  protected _loaderPromise: Promise<void> | null = null;
  protected _loaderResolver: (() => void) | null = null;
  protected _loaderRejector: ((error?: Error) => void) | null = null;
  protected _styleManager!: StyleManager;
  protected _commander!: Commander;
  protected _paraAPI!: ParaAPI;
  // allow _scrollyteller to be cleared with undefined after destroy() ===
  protected _scrollyteller: Scrollyteller | undefined;
  protected _tourBus: TourBus;
  protected _hasFocus = false;

  constructor(
    seriesAnalyzerConstructor?: SeriesAnalyzerConstructor,
    pairAnalyzerConstructor?: PairAnalyzerConstructor
  ) {
    super();
    const customPropLoader = new CustomPropertyLoader();
    const cssProps = customPropLoader.processProperties();
    const globalState = new GlobalState(
      // XXX config won't get set until connectedCallback()
      Object.assign(cssProps, this.config),
      // this._suppleteSettingsWith,
      seriesAnalyzerConstructor,
      pairAnalyzerConstructor
    );
    // Create 2 ParaStates: one for the main chart, one for the explainer
    globalState.createParaState();
    globalState.createParaState();
    // also creates the state controller
    this.globalState = globalState;
    this.globalState.registerCallbacks({
      onUpdate: () => {
        this._paraViewRef.value?.requestUpdate();
      },
      onNotice: (key, value) => {
        this.postNotice(key, value);
      },
      onSettingChange: (path, oldVal, newVal) => {
        this.settingDidChange(path, oldVal, newVal);
      }
    });
    for (let i = 0; i < 2; i++) {
      this.globalState.paraStates[i].registerCallbacks({
        onUpdate: () => {
          this._paraViewRef.value?.requestUpdate();
        },
        onRefreshParaView: () => {
          this._paraViewRef.value?.createDocumentView();
          this._paraViewRef.value?.requestUpdate();
        },
        onNotice: (key, value) => {
          this.postNotice(key, value);
        },
        onSettingChange: (path, oldVal, newVal) => {
          this.settingDidChange(path, oldVal, newVal);
        }
      });
    }
    this.captionBox = document.createElement('para-caption-box');
    this.captionBox.globalState = this._globalState;
    this.captionBox.parachart = this;

    this._tourBus = new TourBus(this._globalState.paraState, this.captionBox);

    customPropLoader.paraState = this.paraState;
    customPropLoader.registerColors();
    customPropLoader.registerSymbols();

    this._loaderPromise = new Promise((resolve, reject) => {
      this._loaderResolver = resolve;
      this._loaderRejector = reject;
    });
    this._readyPromise = new Promise((resolve) => {
      this.addEventListener('paraviewready', async () => {
        this._paraAPI = new ParaAPI(this);
        resolve();
        // It's now safe to load a manifest
        // In headless mode, loadManifest() handles loading via willUpdate, so skip here
        if (this.manifest && !this.headless) {
          this.runLoader(this.manifest, this.manifestType).then(() => {
            this.log.info('ParaCharts fully initialized');
            if (this.pollInterval && this.manifestType === 'url') {
              setInterval(() => {
                this.runLoader(this.manifest, this.manifestType);
              }, this.pollInterval*1000);
            }
            this._scrollyteller = new Scrollyteller(this);
          });
        } else if (this.getElementsByTagName("table")[0]) {
          this.log.info(`loading from slot`);
          const table = this.getElementsByTagName("table")[0];
          const manifest = this.getElementsByClassName("manifest")[0] as HTMLElement;
          this._paraState.dataState = 'pending';
          if (table) {
            const loadresult = await this._slotLoader.findManifest(
              [table, manifest],
              "some-manifest",
              this.description
            )
            this.log.info('loaded manifest')
            if (loadresult.result === 'success') {
              await this.paraState.setManifest(loadresult.manifest!);
              this._paraState.dataState = 'complete';
              this._controlPanelRef.value?.descriptionPanel.positionCaptionBox();
              this._paraAPI = new ParaAPI(this);
              this._loaderResolver!();
            } else {
              //this.log.error(loadresult.error);
              this._paraState.dataState = 'error';
              this._paraState.dispatchEvent(new CustomEvent('manifestError'));
            }
          }
        }
          else {
            this.log.info("No datatable in slot")
            this._paraState.dataState = 'error';
            this._paraState.dispatchEvent(new CustomEvent('manifestError'));
          }
      });
    });
  }

  @queryAssignedElements({flatten: true})
  private _slotted!: HTMLElement[];

  get paraView() {
    return this._paraViewRef.value!;
  }

  get controlPanel() {
    return this._controlPanelRef.value!;
  }

  get ready() {
    return this._readyPromise;
  }

  get loaded() {
    return this._loaderPromise;
  }

  get slotted(){
    return this._slotted;
  }

  get styleManager() {
    return this._styleManager;
  }

  get api() {
    return this._paraAPI;
  }

  get scrollyteller() {
    return this._scrollyteller;
  }

  get tourBus() {
    return this._tourBus;
  }

  get paraState() {
    return this._paraState;
  }

  get hasFocus() {
    return this._hasFocus;
  }

  clearAriaLive() {
    this.paraView.clearAriaLive;
  }

  showAriaLiveHistory() {
    this.paraView.showAriaLiveHistory();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._styleManager) return;
    this.isControlPanelOpen = this._paraState.config.controlPanel.isControlPanelDefaultOpen;
    this._injectFontFace('braille36', brailleFont);
    this._injectFontFace('Atkinson Hyperlegible', hyperFont);
    this._styleManager = new StyleManager();
    this.shadowRoot!.adoptedStyleSheets = [
      ...this.shadowRoot!.adoptedStyleSheets,
      this._styleManager.stylesheet
    ];
    const hostDeclarations: Record<string, StyleManagerDeclarationValue> = {
      '--background-color': 'white',
      '--fizz-theme-color': 'var(--paracharts-theme-color, navy)',
      '--fizz-theme-color-light': 'var(--paracharts-theme-color-light, hsl(210.5, 100%, 88%))',
      '--visited-color': () => this._paraState.colors.colorValue('visit'),
      '--visited-stroke-width': () =>
        this._paraViewRef.value?.documentView?.chartLayers.dataLayer.visitedStrokeWidth ?? 0,
      '--selected-color': 'var(--label-color)',
      '--chart-cursor': 'pointer',
      '--data-cursor': 'cell',
      '--caption-border': () => this._paraState.config.controlPanel.caption.hasBorder
        ? 'solid 2px var(--fizz-theme-color)'
        : 'none',
      '--caption-grid-template-columns': () =>
        this._paraState.config.controlPanel.isExplorationBarVisible
        && this._paraState.config.controlPanel.isCaptionVisible
        && this._paraState.config.controlPanel.caption.isExplorationBarBeside
          ? '2fr 1fr' //'auto auto'
          : '1fr',
      '--exploration-bar-display': () => this._paraState.config.controlPanel.isExplorationBarVisible
        ? 'flex'
        : 'none',
      '--chart-font-scale': () => this._paraState.config.chart.fontScale,
      '--chart-title-font-size': () => this._paraState.config.chart.title.fontSize,
      '--chart-subtitle-font-size': () => this._paraState.config.chart.subtitle.fontSize,
      '--horiz-axis-title-font-size': () => this._paraState.config.axis.horiz.title.fontSize,
      '--vert-axis-title-font-size': () => this._paraState.config.axis.vert.title.fontSize,
      '--horiz-axis-tick-label-font-size': () => this._paraState.config.axis.horiz.ticks.labels.fontSize,
      '--vert-axis-tick-label-font-size': () => this._paraState.config.axis.vert.ticks.labels.fontSize,
      '--direct-label-font-size': () => this._paraState.config.chart.directLabelFontSize,
      '--legend-label-font-size': () => this._paraState.config.legend.fontSize,
      '--bar-label-font-size': () => this._paraState.config.type.bar.labelFontSize,
      '--column-label-font-size': () => this._paraState.config.type.column.labelFontSize,
      '--waterfall-label-font-size': () => this._paraState.config.type.waterfall.labelFontSize,
      'display': 'block',
      'font-family': '"Trebuchet MS", Helvetica, sans-serif',
      'font-size': 'var(--chart-view-font-size, 1rem)'
    };
    if (this.tagName === 'PARA-CHART-AI') {
      hostDeclarations['--control-panel-icon'] =  `url(${cpanelIconAlt})`;
    }
    this._styleManager.set(':host', hostDeclarations);

    if (this._paraState.config.chart.isShowVisitedDatapointsOnly) {
      this._styleManager.set('.datapoint:not(.visited)', {
        'display': 'none'
      });
      this._styleManager.set('.leg-right', {
        'display': 'none'
      });
    }
    this._styleManager.update();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this._commander = Commander.getInst(this._paraViewRef.value!);
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    // Don't load a manifest before the paraview has rendered
    if (changedProperties.has('manifest') && this.manifest !== '' && this._paraViewRef.value) {
      console.log(`manifest changed: ${this.manifest}`);
      this._loaderPromise = new Promise((resolve, reject) => {
        this._loaderResolver = resolve;
        this._loaderRejector = reject;
      });
      this.runLoader(this.manifest, this.manifestType);
      this.dispatchEvent(new CustomEvent('manifestchange', {bubbles: true, composed: true, cancelable: true}));
    }
    if (changedProperties.has('config')) {
      Object.entries(this.config).forEach(([path, value]) =>
        this._paraState.updateSettings(draft => {
          SettingsManager.set(path, value, draft);
        }));
    }
  }

  static styles = [
    css`
      figure {
        display: inline flex;
        flex-direction: column;
        margin: 0;
      }
      figure.scalable {
        width: 100%;
      }
    `
  ];

  protected _injectFontFace(family: string, url: string) {
    // @font-face rules don't work inside of shadow DOM stylesheets, so
    // we have to inject a rule into the document adopted stylesheets.
    // See https://github.com/mdn/interactive-examples/issues/887,
    // https://issues.chromium.org/issues/41085401
    let hasFontFace = false;
    outer: for (const sheet of document.adoptedStyleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule && rule.style.getPropertyValue('font-family') === family) {
          hasFontFace = true;
          break outer;
        }
      }
    }
    if (!hasFontFace) {
      const fontFaceSheet = new CSSStyleSheet();
      fontFaceSheet.replaceSync(`@font-face {
        font-family: "${family}";
        src: url("${url}") format('woff2');
      }`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceSheet];
    }
  }

  async runLoader(
    manifestInput: string,
    manifestType: SourceKind,
    forceType = true,
    description?: string,
    resetSettings = true,
  ): Promise<void> {
    this._paraState.dataState = 'pending';
    try {
      const { manifest, data } = await load(
        manifestType,
        manifestInput,
        forceType ? this.forcecharttype : undefined,
        description ?? this.description
      );
      if (forceType) {
        this._paraState.clearVisited();
        this._paraState.clearSelected();
        this._paraState.clearAllHighlights();
        this._paraState.clearPopups();
      }
      await this._paraState.setManifest(manifest, data, resetSettings);
      this._paraState.dataState = 'complete';
      // NB: cpanel doesn't exist in headless mode
      this._controlPanelRef.value?.descriptionPanel.positionCaptionBox();
      // this._paraAPI = new ParaAPI(this);
      await this._tourBus.sendContextPayload();
      this._loaderResolver!();
    } catch (error) {
      this.log.error(error instanceof Error ? error.message : String(error));
      this._paraState.dataState = 'error';
      this._paraState.dispatchEvent(new CustomEvent('manifestError'));
      this._loaderRejector!(error instanceof Error ? error : new LoadError(LoadErrorCode.UNKNOWN, String(error)));
      this._paraViewRef.value?.rejectJimReady();
    }

    if (this.api) {
      // this should be called after chart is rendered, as final step
      this.enableScrollytelling();
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this.log.info('setting did change:', path, '=', newValue, `(was ${oldValue})`);
    // Update the style manager before the paraview so, e.g., any font scale
    // change can take effect ...
    this._styleManager.update();
    this._paraViewRef.value?.settingDidChange(path, oldValue, newValue);
    this.captionBox.settingDidChange(path, oldValue, newValue);
    // ... then update it again to pick up any changed values from the view tree
    this._styleManager.update();
    if (path.startsWith('description.')) {
      this._paraState.setCaption();
    }
  }

  postNotice(key: string, value: any) {
    if (!this.paraView){
      return
    }
    this.paraView.documentView?.noticePosted(key, value);
    this._globalState.paraState.chartInfo.noticePosted(key, value);
    this.captionBox.noticePosted(key, value);
    this.dispatchEvent(
      new CustomEvent('paranotice', {detail: {key, value}, bubbles: true, composed: true}));
  }

  command(name: keyof AvailableCommands, args: any[]): any {
    const handler = this._commander.commands[name];
    if (handler) {
      return handler(...args);
    } else {
      this.log.warn(`no handler for command '${name}'`);
    }
  }

  render(): TemplateResult {
    // We can't truly hide the para-chart, or labels don't get a proper size,
    // so we fall back on sr-only
    const classes = {
      'sr-only': this.headless,
      'scalable': this.scalable
    };
    const cpanelStyles = {
      'width': `${this._paraState.config.chart.width}px`
    };
    return html`
      <figure
        class=${classMap(classes)}
        aria-hidden=${this.headless ? 'true' : 'false'}
      >
        <para-view
          ${ref(this._paraViewRef)}
          .paraChart=${this}
          .globalState=${this._globalState}
          colormode=${this._paraState?.config.color.colorVisionMode ?? nothing}
          ?scalable=${this.scalable}
          ?disableFocus=${this.headless}
          @focus=${() => {
            this._hasFocus = true;
          }}
          @blur=${() => {
            this._hasFocus = false;
          }}
        ></para-view>
        ${!(this.headless || this._paraState.config.chart.isStatic)
          ? html`
          <para-data-table
            .isVisible=${this.isDataTableVisible}
            .globalState=${this._globalState}
            style=${styleMap(cpanelStyles)}
            .paraChart=${this}
            @focus=${() => {
              this._hasFocus = true;
            }}
            @blur=${() => {
              this._hasFocus = false;
            }}
          ></para-data-table>
            <para-control-panel
              ${ref(this._controlPanelRef)}
              style=${styleMap(cpanelStyles)}
              .paraChart=${this}
              .globalState=${this._globalState}
              @focus=${() => {
                this._hasFocus = true;
              }}
              @blur=${() => {
                this._hasFocus = false;
              }}
            ></para-control-panel>`
          : ''
        }
      </figure>
    `;
  }

  /*
  // Scrollytelling functionality
  */


  /**
   * Enable scrollytelling with the given options
   * This should be called after charts and scrolly DOM are rendered.
   */
  enableScrollytelling(
    options: ScrollytellerOptions = {}
  ): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (this._paraState.settings.scrollytelling.isScrollytellingEnabled) {
      this._scrollyteller?.destroy();
      this._scrollyteller = new Scrollyteller(this, options);
      this._scrollyteller.init();
    }
  }

  /**
   * Should be called when layout changes (e.g., resize, data updates)
   * so scrollyteller can recompute offsets, heights, and observer geometry.
   */
  resizeScrollytelling(): void {
    this._scrollyteller?.resize();
  }

  /**
   * Disable scrollytelling and clean up observers.
   */
  disableScrollytelling(): void {
    this._scrollyteller?.destroy();
    this._scrollyteller = undefined;
  }

  /*
   *  Short Descriptions
   */

  waitForManifest(): Promise<void> {
    if (this.paraState.dataState === 'complete') {
      return Promise.resolve();
    }
    if (this.paraState.dataState === 'error') {
      return Promise.reject(new Error('Manifest failed to load'));
    }
    return new Promise((resolve, reject) => {
      this.paraState.addEventListener('manifestSet', () => resolve(), { once: true });
      this.paraState.addEventListener('manifestError', () => reject(new Error('Manifest failed to load')), { once: true });
    });
  }

  async shortDescription(): Promise<string> {
    await this.waitForManifest();
    return this.paraState.shortDescription().then((summary) => {
      return summary.text;
    });
  }
}
