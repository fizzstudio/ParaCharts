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
import { StyleManager } from './style_manager';
import { AvailableCommands, Commander } from './commander';
import { ParaAPI } from '../paraapi/paraapi';
import {
  Scrollyteller,
  type ScrollytellerOptions,
} from '../scrollyteller/scrollyteller';

import { Manifest } from '@fizz/paramanifest';

import { html, css, PropertyValues, TemplateResult, nothing } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { SlotLoader } from '../loader/slotloader';
import { PairAnalyzerConstructor, SeriesAnalyzerConstructor } from '@fizz/paramodel';
import { initParaSummary } from '@fizz/parasummary';

// NOTE: We cannot use the `customElement` decorator here as that would clash with `ParaChartsAi`
export class ParaChart extends ParaComponent {
  @property({ type: Boolean }) headless = false;
  @property() accessor manifest = '';
  @property() manifestType: SourceKind = 'url';
  // `data` must be a URL, if set
  @property() data = '';
  @property({type: Object}) accessor config: SettingsInput = {};
  @property() accessor forcecharttype: ChartType | undefined;
  @property() type?: ChartType;
  @property() accessor description: string | undefined;
  @property({type: Boolean, attribute: false}) isControlPanelOpen = false;

  readonly captionBox: ParaCaptionBox;
  protected _paraViewRef = createRef<ParaView>();
  protected _controlPanelRef = createRef<ParaControlPanel>();
  protected _manifest?: Manifest;
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
    customPropLoader.paraState = this.paraState;
    customPropLoader.registerColors();
    customPropLoader.registerSymbols();

    this._loaderPromise = new Promise((resolve, reject) => {
      this._loaderResolver = resolve;
      this._loaderRejector = reject;
    });
    this._readyPromise = new Promise((resolve) => {
      this.addEventListener('paraviewready', async () => {
        resolve();
        await initParaSummary();
        // It's now safe to load a manifest
        // In headless mode, loadManifest() handles loading via willUpdate, so skip here
        if (this.manifest && !this.headless) {
          this.runLoader(this.manifest, this.manifestType).then(() => {
            this.log.info('ParaCharts fully initialized');
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
              this.paraState.setManifest(loadresult.manifest!);
              this._paraState.dataState = 'complete';
              this._controlPanelRef.value?.descriptionPanel.positionCaptionBox();
              this._paraAPI = new ParaAPI(this);
              this._loaderResolver!();
            } else {
              //this.log.error(loadresult.error);
              this._paraState.dataState = 'error';
            }
          }
        }
          else {
            this.log.info("No datatable in slot")
            this._paraState.dataState = 'error'
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

  get paraState() {
    return this._paraState;
  }

  clearAriaLive() {
    this.paraView.clearAriaLive;
  }

  showAriaLiveHistory() {
    this.paraView.showAriaLiveHistory();
  }

  connectedCallback() {
    super.connectedCallback();
    this.isControlPanelOpen = this._paraState.settings.controlPanel.isControlPanelDefaultOpen;

    this._styleManager = new StyleManager(this.shadowRoot!.adoptedStyleSheets[0]);
    this._styleManager.set(':host', {
      '--axis-line-color': 'hsl(0, 0%, 0%)',
      '--label-color': 'hsl(0, 0%, 0%)',
      '--tick-grid-color': 'hsl(270, 50%, 50%)',
      '--background-color': 'white',
      '--theme-color': 'var(--fizz-theme-color, purple)',
      '--theme-color-light': 'var(--fizz-theme-color-light, hsl(275.4, 100%, 88%))',
      '--theme-contrast-color': 'white',
      '--fizz-theme-color': 'var(--paracharts-theme-color, navy)',
      '--fizz-theme-color-light': 'var(--paracharts-theme-color-light, hsl(210.5, 100%, 88%))',
      '--visited-color': () => this._paraState.colors.colorValue('visit'),
      '--highlighted-color': () => this._paraState.colors.colorValue('highlight'),
      '--visited-stroke-width': () =>
        this._paraViewRef.value?.documentView?.chartLayers.dataLayer.visitedStrokeWidth ?? 0,
      '--selected-color': 'var(--label-color)',
      '--datapoint-centroid': '50% 50%',
      '--focus-animation': 'all 0.5s ease-in-out',
      '--chart-cursor': 'pointer',
      '--data-cursor': 'cell',
      '--focus-shadow-color': 'gray',
      '--focus-shadow': 'drop-shadow(0px 0px 4px var(--focus-shadow-color))',
      '--caption-border': () => this._paraState.settings.controlPanel.caption.hasBorder
        ? 'solid 2px var(--theme-color)'
        : 'none',
      '--caption-grid-template-columns': () =>
        this._paraState.settings.controlPanel.isExplorationBarVisible
        && this._paraState.settings.controlPanel.isCaptionVisible
        && this._paraState.settings.controlPanel.caption.isExplorationBarBeside
          ? '2fr 1fr' //'auto auto'
          : '1fr',
      '--exploration-bar-display': () => this._paraState.settings.controlPanel.isExplorationBarVisible
        ? 'flex'
        : 'none',
      '--chart-font-scale': () => this._paraState.settings.chart.fontScale,
      '--chart-title-font-size': () => this._paraState.settings.chart.title.fontSize,
      '--horiz-axis-title-font-size': () => this._paraState.settings.axis.horiz.title.fontSize,
      '--vert-axis-title-font-size': () => this._paraState.settings.axis.vert.title.fontSize,
      '--horiz-axis-tick-label-font-size': () => this._paraState.settings.axis.horiz.ticks.labels.fontSize,
      '--vert-axis-tick-label-font-size': () => this._paraState.settings.axis.vert.ticks.labels.fontSize,
      '--direct-label-font-size': () => this._paraState.settings.chart.directLabelFontSize,
      '--legend-label-font-size': () => this._paraState.settings.legend.fontSize,
      '--bar-label-font-size': () => this._paraState.settings.type.bar.labelFontSize,
      '--column-label-font-size': () => this._paraState.settings.type.column.labelFontSize,
      '--waterfall-label-font-size': () => this._paraState.settings.type.waterfall.labelFontSize,
      'display': 'block',
      'font-family': '"Trebuchet MS", Helvetica, sans-serif',
      'font-size': 'var(--chart-view-font-size, 1rem)'
    });
    if (this._paraState.settings.chart.isShowVisitedDatapointsOnly) {
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
    styles,
    css`
      :host {
        --summary-marker-size: 1.1rem;
      }
      figure {
        display: inline flex;
        flex-direction: column;
        margin: 0;
      }
    `
  ];

  async runLoader(
    manifestInput: string,
    manifestType: SourceKind,
    forceType = true,
    description?: string
  ): Promise<void> {
    this._paraState.dataState = 'pending';
    try {
      const { manifest, data } = await load(
        manifestType,
        manifestInput,
        forceType ? this.forcecharttype : undefined,
        description ?? this.description
      );
      this._manifest = manifest;
      if (forceType) {
        this._paraState.clearVisited();
        this._paraState.clearSelected();
        this._paraState.clearAllHighlights();
        this._paraState.clearPopups();
      }
      this._paraState.setManifest(manifest, data);
      this._paraState.dataState = 'complete';
      // NB: cpanel doesn't exist in headless mode
      this._controlPanelRef.value?.descriptionPanel.positionCaptionBox();
      this._paraAPI = new ParaAPI(this);
      this._loaderResolver!();
    } catch (error) {
      this.log.error(error instanceof Error ? error.message : String(error));
      this._paraState.dataState = 'error';
      this._loaderRejector!(error instanceof Error ? error : new LoadError(LoadErrorCode.UNKNOWN, String(error)));
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
  }

  postNotice(key: string, value: any) {
    if (!this.paraView){
      return
    }
    this.paraView.documentView?.noticePosted(key, value);
    this.paraView.documentView?.chartInfo.noticePosted(key, value);
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
      'sr-only': this.headless
    };
    const cpanelStyles = {
      'width': `${this._paraState.settings.chart.size.width}px`
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
          colormode=${this._paraState?.settings.color.colorVisionMode ?? nothing}
          ?disableFocus=${this.headless}
        ></para-view>
        ${!(this.headless || this._paraState.settings.chart.isStatic)
          ? html`
            <para-control-panel
              ${ref(this._controlPanelRef)}
              style=${styleMap(cpanelStyles)}
              .paraChart=${this}
              .globalState=${this._globalState}
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

}
