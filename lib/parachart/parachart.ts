/* ParaCharts: Accessible Charts
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

import { logging } from '../common/logger';
import { ParaComponent } from '../components';
import { ChartType } from '@fizz/paramanifest'
import { DeepReadonly, Settings, SettingsInput, type Setting } from '../store/settings_types';
import { SettingsManager } from '../store';
import '../paraview';
import '../control_panel';
import '../control_panel/caption';
import { type ParaCaptionBox } from '../control_panel/caption';
import { type ParaView } from '../paraview';
import { type ParaControlPanel } from '../control_panel';
import { ParaStore } from '../store';
import { ParaLoader, type SourceKind } from '../loader/paraloader';
import { CustomPropertyLoader } from '../store/custom_property_loader';
import { ParaApi } from '../api/api';
import { styles } from '../view/styles';
import { type AriaLive } from '../components';
import '../components/aria_live';
import { StyleManager } from './style_manager';

import { Manifest } from '@fizz/paramanifest';

import { html, css, PropertyValues, TemplateResult, nothing } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { SlotLoader } from '../loader/slotloader';
import { PairAnalyzerConstructor, SeriesAnalyzerConstructor } from '@fizz/paramodel';
import { initParaSummary } from '@fizz/parasummary';

@customElement('para-chart')
export class ParaChart extends logging(ParaComponent) {

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
  protected _ariaLiveRegionRef = createRef<AriaLive>();
  protected _manifest?: Manifest;
  protected _loader = new ParaLoader();
  private _slotLoader = new SlotLoader();

  protected _suppleteSettingsWith?: DeepReadonly<Settings>;
  protected _readyPromise: Promise<void>;
  protected _loaderPromise: Promise<void> | null = null;
  protected _api: ParaApi;
  protected _styleManager!: StyleManager;

  constructor(
    seriesAnalyzerConstructor?: SeriesAnalyzerConstructor,
    pairAnalyzerConstructor?: PairAnalyzerConstructor
  ) {
    super();
    const customPropLoader = new CustomPropertyLoader();
    const cssProps = customPropLoader.processProperties();
    // also creates the state controller
    this.store = new ParaStore(
      this,
      // XXX config won't get set until connectedCallback()
      Object.assign(cssProps, this.config),
      this._suppleteSettingsWith,
      seriesAnalyzerConstructor,
      pairAnalyzerConstructor
    );
    this.captionBox = document.createElement('para-caption-box');
    this.captionBox.store = this._store;
    this.captionBox.parachart = this;
    customPropLoader.store = this.store;
    customPropLoader.registerColors();
    customPropLoader.registerSymbols();
    this._api = new ParaApi(this);

    this._readyPromise = new Promise((resolve) => {
      this.addEventListener('paraviewready', async () => {
        resolve();
        await initParaSummary();
        // It's now safe to load a manifest
        if (this.manifest) {
          if (this.data) {
            await this._loader.preloadData(this.data);
          }
          this._loaderPromise = this._runLoader(this.manifest, this.manifestType).then(() => {
            this.log('ParaCharts will now commence the raising of the roof and/or the dead');
          });
        } else if (this.getElementsByTagName("table")[0]) {
          this.log(`loading from slot`);
          const table = this.getElementsByTagName("table")[0];
          const manifest = this.getElementsByClassName("manifest")[0] as HTMLElement;
          this._store.dataState = 'pending';
          if (table) {
            const loadresult = await this._slotLoader.findManifest(
              [table, manifest],
              "some-manifest",
              this.description
            )
            this.log('loaded manifest')
            if (loadresult.result === 'success') {
              this.store.setManifest(loadresult.manifest!);
              this._store.dataState = 'complete';
            } else {
              //console.error(loadresult.error);
              this._store.dataState = 'error';
            }
          }
        }
          else {
            console.log("No datatable in slot")
            if (this.getAttribute("type") === 'graph') {
              const tempTable = document.createElement("table")
              //Using a temporary, very sparse table to load the canvas, as the model isn't configured to load with literally no data
              //The numbers here don't matter as long as they're outside the default graphing calc viewport
              tempTable.innerHTML = `<table>
                          <caption>No graph data present</caption>
                          <thead>
                              <tr>
                                  <th>X</th>
                                  <th>Y</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td>100</td>
                                  <td>100</td>
                              </tr>
                              <tr>
                                  <td>101</td>
                                  <td>101</td>
                              </tr>
                          </tbody>
                      </table>`
              const loadresult = await this._slotLoader.findManifest([tempTable], "some-manifest")
              this.log('loaded manifest')
              if (loadresult.result === 'success') {
                this.store.setManifest(loadresult.manifest!);
                this._store.dataState = 'complete';
              } else {
                //console.error(loadresult.error);
                this._store.dataState = 'error';
              }
            }
            else {
              this._store.dataState = 'error'
            }
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

  get loader() {
    return this._loader;
  }

  get ariaLiveRegion() {
    return this._ariaLiveRegionRef.value!;
  }

  get slotted(){
    return this._slotted;
  }

  get styleManager() {
    return this._styleManager;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isControlPanelOpen = this._store.settings.controlPanel.isControlPanelDefaultOpen;

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
      '--visited-color': () => this._store.colors.colorValue('highlight'),
      '--visited-stroke-width': () =>
        this._paraViewRef.value?.documentView?.chartLayers.dataLayer.visitedStrokeWidth ?? 0,
      '--selected-color': 'var(--label-color)',
      '--datapoint-centroid': '50% 50%',
      '--focus-animation': 'all 0.5s ease-in-out',
      '--chart-cursor': 'pointer',
      '--data-cursor': 'cell',
      '--focus-shadow-color': 'gray',
      '--focus-shadow': 'drop-shadow(0px 0px 4px var(--focus-shadow-color))',
      '--caption-border': () => this._store.settings.controlPanel.caption.hasBorder
        ? 'solid 2px var(--theme-color)'
        : 'none',
      '--caption-grid-template-columns': () => this._store.settings.controlPanel.caption.isExplorationBarBeside
        ? 'auto auto'
        : '1fr',
      '--exploration-bar-display': () => this._store.settings.controlPanel.isStatusBarVisible
        ? 'flex'
        : 'none',
      '--chart-font-scale': () => this._store.settings.chart.fontScale,
      '--chart-title-font-size': () => this._store.settings.chart.title.fontSize,
      '--horiz-axis-title-font-size': () => this._store.settings.axis.horiz.title.fontSize,
      '--vert-axis-title-font-size': () => this._store.settings.axis.vert.title.fontSize,
      '--horiz-axis-tick-label-font-size': () => this._store.settings.axis.horiz.tick.tickLabel.fontSize,
      '--vert-axis-tick-label-font-size': () => this._store.settings.axis.vert.tick.tickLabel.fontSize,
      'display': 'block',
      'font-family': '"Trebuchet MS", Helvetica, sans-serif',
      'font-size': 'var(--chart-view-font-size, 1rem)'
    });
    if (this._store.settings.chart.isShowVisitedDatapointsOnly) {
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
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    // Don't load a manifest before the paraview has rendered
    if (changedProperties.has('manifest') && this.manifest !== '' && this._paraViewRef.value) {
      this.log(`manifest changed: '${this.manifestType === 'content' ? '<content>' : this.manifest}`);
      this._loaderPromise = this._runLoader(this.manifest, this.manifestType);
      this.dispatchEvent(new CustomEvent('manifestchange', {bubbles: true, composed: true, cancelable: true}));
    }
    if (changedProperties.has('config')) {
      Object.entries(this.config).forEach(([path, value]) =>
        this._store.updateSettings(draft => {
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
        display: inline grid;
        margin: 0;
      }
    `
  ];

  protected async _runLoader(manifestInput: string, manifestType: SourceKind): Promise<void> {
    this.log(`loading manifest: '${manifestType === 'content' ? '<content>' : manifestInput}'`);
    this._store.dataState = 'pending';
    const loadresult = await this._loader.load(
      this.manifestType,
      manifestInput,
      this.forcecharttype,
      this.description
    );
    this.log('loaded manifest')
    if (loadresult.result === 'success') {
      this._manifest = loadresult.manifest;
      this._store.setManifest(loadresult.manifest, loadresult.data);
      this._store.dataState = 'complete';
    } else {
      console.error(loadresult.error);
      this._store.dataState = 'error';
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this.log('setting did change:', path, '=', newValue, `(was ${oldValue})`);
    // Update the style manager before the paraview so, e.g., any font scale
    // change can take effect ...
    this._styleManager.update();
    this._paraViewRef.value?.settingDidChange(path, oldValue, newValue);
    // ... then update it again to pick up any changed values from the view tree
    this._styleManager.update();
  }

  clearAriaLive() {
    this._ariaLiveRegionRef.value!.clear();
  }

  showAriaLiveHistory() {
    this._ariaLiveRegionRef.value!.showHistoryDialog();
  }

  getChartSVG() {
    return this._api.serializeChart();
  }

  downloadSVG() {
    this._api.downloadSVG();
  }

  downloadPNG() {
    this._api.downloadPNG();
  }

  render(): TemplateResult {
    this.log('render');
    // We can't truly hide the para-chart, or labels don't get a proper size,
    // so we fall back on sr-only
    const classes = {
      'sr-only': this.headless
    };
    return html`
      <figure
        class=${classMap(classes)}
        aria-hidden=${this.headless ? 'true' : 'false'}
      >
        <para-view
          ${ref(this._paraViewRef)}
          .paraChart=${this}
          .store=${this._store}
          colormode=${this._store?.settings.color.colorVisionMode ?? nothing}
          ?disableFocus=${this.headless}
        ></para-view>
        ${!(this.headless || this._store.settings.chart.isStatic)
          ? html`
            <para-control-panel
              ${ref(this._controlPanelRef)}
              .paraChart=${this}
              .store=${this._store}
            ></para-control-panel>`
          : ''
        }
        <para-aria-live-region
          ${ref(this._ariaLiveRegionRef)}
          .store=${this._store}
          .announcement=${this._store.announcement}
        ></para-aria-live-region>
        <slot
          @slotchange=${(e: Event) => {
            //this._signalManager.signal('slotChange');
          }}
        ></slot>
      </figure>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart': ParaChart;
  }
}
