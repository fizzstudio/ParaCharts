import { type Unsubscribe } from '@lit-app/state';
import {
  html, css, PropertyValues,
  unsafeCSS, nothing
} from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { Logger, getLogger } from '@fizz/logger';
import { MessageDialog, FizzTabs, TabLabelMode } from '@fizz/ui-components';
import '@fizz/ui-components';
import { type ParaChart } from '../parachart/parachart';
import { ParaDialog, ParaComponent } from '../components';
import { SettingsManager } from '../state/settings_manager';
import { TabLabelStyle, ControlpanelConfig } from '../config/config_types';
import {
  DescriptionPanel, DataPanel, ColorsPanel, ChartPanel,
  AnnotationPanel, ControlsPanel
} from '.';
import { Popup } from '../view/popup';
import { AnnotationDialog } from './dialogs/annotation_dialog';
import '.';

import tabDescriptionIcon from '../assets/tab-description-icon.svg';
import tabDataIcon from '../assets/tab-data-icon.svg';
import tabColorsIcon from '../assets/tab-colors-icon.svg';
import tabAudioIcon from '../assets/tab-audio-icon.svg';
import tabControlsIcon from '../assets/tab-controls-icon.svg';
import tabChartIcon from '../assets/tab-chart-icon.svg';
import tabAnalysisIcon from '../assets/tab-analysis-icon.svg';
import cpanelIcon from '../assets/info-icon.svg';
import cpanelIconAlt from '../assets/info-icon-alt.svg';
import warningIcon from '../assets/warning-icon.svg?raw';

import { MessageDialog, FizzTabs, TabLabelMode } from '@fizz/ui-components';
import '@fizz/ui-components';

import {
  html, css, PropertyValues,
  unsafeCSS, nothing
} from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { Popup } from '../view/popup';
import { datapointIdToCursor } from '../state';
import { AnnotationDialog } from './dialogs/annotation_dialog';
import { ControlpanelConfig } from '../config/config_types';


@customElement('para-control-panel')
export class ParaControlPanel extends ParaComponent {
  private log: Logger = getLogger("ParaControlPanel");
  @property() sparkBrailleData!: string;

  @state() dataState: 'initial' | 'pending' | 'complete' | 'error' = 'initial';
  @state() private _panelOpenOverride: boolean | null = null;

  private get _panelOpen(): boolean {
    return this._panelOpenOverride ?? this._paraState?.config?.controlPanel?.isControlPanelDefaultOpen ?? true;
  }
  dataError?: unknown;
  paraChart!: ParaChart;

  protected _tabsRef = createRef<FizzTabs>();
  protected _descriptionPanelRef = createRef<DescriptionPanel>();
  protected _dataPanelRef = createRef<DataPanel>();
  protected _colorsPanelRef = createRef<ColorsPanel>();
  protected _chartPanelRef = createRef<ChartPanel>();
  protected _annotationPanelRef = createRef<AnnotationPanel>();
  protected _controlsPanelRef = createRef<ControlsPanel>();
  protected _dialogRef = createRef<ParaDialog>();
  protected _annotationDialogRef = createRef<AnnotationDialog>();
  protected _msgDialogRef = createRef<MessageDialog>();

  static styles = [
    //styles,
    css`
      * {
        font-family: "Trebuchet MS", Helvetica, sans-serif;
        font-size: var(--control-panel-font-size, 1rem);
      }
      #wrapper {
        position: relative;
      }
      fizz-tabs {
        --background: #eee;
        --summary-marker-font-weight: bold;
        --control-panel-icon-size: 1.1rem;
        --toggle-button-size: 1.5em;
        --contents-margin: 2px 0 0 0;
        width: 1;
        /*min-width: 40rem;*/
        /*max-width: 50%;*/
      }
      fizz-tabs.collapsed {
        /*width: rem;*/
        /*min-width: unset;*/
        /*position: absolute;*/
        /*bottom: 10px;*/
        /*--background: none;
        --control-panel-background: none;
        --control-panel-icon-color: var(--theme-color);
        --control-panel-icon-size: 1.5rem;
        --theme-contrast-color: var(--theme-color);
        --border: none;*/
        border: 2px solid transparent;
        margin: 4px 0 0 4px;
      }

      fizz-tabs.expanded {
        border: 2px solid var(--theme-color);
        border-radius: 4px;
        --background: none;
        --control-panel-icon-color: ghostwhite;
        --summary-padding: 0 0.35rem;
        --summary-margin: -2px 0;
      }

      fizz-tabs.collapsed.darkmode  {
        --control-panel-icon-color: ghostwhite;
      }

    `,
    // Isolated from the main css block above: Vite's build transformation of Lit
    // css`` templates silently drops rules that follow a ${unsafeCSS()} interpolation
    // in the same block. Keep any unsafeCSS() usage quarantined here so it cannot
    // corrupt other rules.
    css`
      fizz-tabs {
        --toggle-button-icon: var(--control-panel-icon, url(${unsafeCSS(cpanelIcon)}));
        /*--control-panel-icon: url(${unsafeCSS(cpanelIconAlt)});*/
      }
    `,
    css`
      .contrast-warning-badge {
        position: absolute;
        bottom: 1px;
        left: 1.9rem;
        width: 1.1rem;
        height: 1.3rem;
        display: inline-flex;
        align-items: center;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        color: orangered;
        user-select: none;
        z-index: 10;
      }
    `,
  ];

  get config() {
    return SettingsManager.getGroupLink<ControlpanelConfig>(
      this.managedSettingKeys[0], this._paraState.config);
  }

  get managedSettingKeys() {
    return ['controlPanel'];
  }

  get descriptionPanel() {
    return this._descriptionPanelRef.value!;
  }

  get chartPanel() {
    return this._chartPanelRef.value!;
  }

  get annotationPanel() {
    return this._annotationPanelRef.value!;
  }

  get controlsPanel() {
    return this._controlsPanelRef.value!;
  }

  // get statusBar() {
  //   return this._descriptionPanelRef.value!.statusBar;
  // }

  get dialog() {
    return this._dialogRef.value!;
  }

  get annotationDialog() {
    return this._annotationDialogRef.value!;
  }

  connectedCallback() {
    super.connectedCallback();
    //this._isOpen = this.settings.isControlPanelDefaultOpen;
    this.addButtonListeners();
  }

  noticePosted(key: string, value: any) {
    if (key === 'setData') {
      this.dataUpdated();
    }
  }

  addButtonListeners() {
    const loop = () => {
      let timestamp = setTimeout(() => {
        loop();
      }, 100);
      let toggleButton = this.shadowRoot?.getElementById("wrapper")?.children[0].shadowRoot?.children[0].getElementsByClassName("toggle")[0]
      if (toggleButton) {
        toggleButton.addEventListener("pointerenter", () => {
          this._paraState.config.chart.isShowPopups
            && this._paraState.config.popup.activation === "onHover"
            && !this._paraState.config.ui.isTourGuideEnabled ? this.addPopup(this._panelOpen) : undefined
        })
        toggleButton.addEventListener("pointerleave", () => {
          this.paraChart.paraView.paraState.removePopup(this.id);
        })
        toggleButton.addEventListener("click", () => {
          this.paraChart.paraView.paraState.removePopup(this.id);
          this.addButtonListeners();
        })
        clearTimeout(timestamp);
      }
    };
    loop()

  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  // Anything that needs to be done when data is updated, do here
  private dataUpdated(): void {
    this.dataState = 'complete';
  }

  settingDidChange(key: string, value: any) {
    const shortKey = key.match(/controlPanel\.(\w+)/)![1];
    const regex = /is(\w+)TabVisible/;
    const tabName = shortKey.match(regex)?.[1];
    if (tabName) {
      if (value) {
        this._tabsRef.value!.show(tabName);
      } else {
        this._tabsRef.value!.hide(tabName);
      }
    } else if (shortKey === 'isControlPanelDefaultOpen'
      || shortKey === 'tabLabelStyle'
    ) {
      if (shortKey === 'isControlPanelDefaultOpen') {
        this._panelOpenOverride = value as boolean;
        this.paraChart.isControlPanelOpen = value as boolean;
      }
      this.requestUpdate();
    } else if (shortKey === 'isCaptionVisible'
      || shortKey === 'isExplorationBarVisible') {
        this._descriptionPanelRef.value!.requestUpdate();
    } else if (shortKey === 'isSparkBrailleVisible') {
      this._dataPanelRef.value!.isSparkBrailleVisible = value;
    } else if (shortKey === 'isSparkBrailleControlVisible') {
      this._dataPanelRef.value!.requestUpdate();
    } else if (shortKey === 'isColorPaletteControlVisible'
      || shortKey === 'isCVDControlVisible'
    ) {
      this._colorsPanelRef.value!.requestUpdate();
    } else {
      return false;
    }
    return true;
  }

  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has('dataState') && this.dataState === 'complete') {
      //this.todo.signalManager.signal('controlPanelDataLoadComplete');
      // Any panels that need updating in response to changed data should
      // do so here
      // this.annotationPanel.requestUpdate();
      this.descriptionPanel.requestUpdate();

      // if (!this._isReady) {
      //   this.isReady = true;
      //   //this.descriptionPanelRef.value!.initStatusBar();
      // }
    }
  }

  externalizeCaptionBox() {
    this.after(this.paraChart.captionBox);
  }

  onFocus() {
    this._descriptionPanelRef.value!.clearStatusBar();
    //this.srb.render(this.currentSeriesSummary());
  }

  showHelpDialog(){
    return this._controlsPanelRef.value!.showHelpDialog();
  }

  async openColorPrefsViaAlert() {
    if (!this._panelOpen) {
      const tabs = this._tabsRef.value!;
      tabs.open = true;
      tabs.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
      await this.updateComplete;
    }
    this._tabsRef.value!.selectedTab = 2;
    await this.updateComplete;
    this._colorsPanelRef.value!.showColorPrefsDialog();
  }

  addPopup(isOpen: boolean) {
    let paraview = this.paraChart.paraView
    let text = isOpen ? "Close control panel" : "Customize settings"
    let y = paraview.documentView!.height! - 70
    let x = 0 - this.paraChart.paraView.documentView!.chartLayers.x
    let popup = new Popup(paraview,
      {
        text: text,
        x: x,
        y: y + (isOpen ? 26.4 : 0),
        id: this.id,
        type: "controlPanelIcon",
        fill: "hsl(0, 0%, 0%)",
        inbounds: true
      },
      {
        fill: "hsl(0, 0%, 100%)",
        shape: "boxWithArrow"
      })
    paraview.paraState.popups.push(popup)
  }

  render() {
    const description = this._globalState.l10n?.localize('cpanel.tabs.description.title') ?? '';
    let deetsState = this._panelOpen ? 'expanded' : 'collapsed';
//    deetsState += this.todo.darkMode ? ' darkmode' : '';

    const tabBarStyle = {
      //['--background-selected']: 'white'
      //['--title-font-size']: '1rem',
      ['--title-font-size']: '0.95rem',
      marginLeft: '0.25rem'
    };
    const tabLabelModes: {[labelStyle in TabLabelStyle]: TabLabelMode} = {
      icon: 'icons',
      iconLabel: 'icons-labels',
      label: 'labels'
    };
    // @keydown=${(event: KeyboardEvent) => {
    //   this.todo.canvas.handleKeyEvent(new KeyboardEvent('keydown', {
    //     key: event.key,
    //     code: event.code,
    //     location: event.location,
    //     repeat: event.repeat,
    //     isComposing: event.isComposing,
    //     ctrlKey: event.ctrlKey,
    //     shiftKey: event.shiftKey,
    //     altKey: event.altKey,
    //     metaKey: event.metaKey
    //   }));
    // }}
    return html`
      <div id="wrapper">
        <fizz-tabs
          ${ref(this._tabsRef)}
          ?open=${this.config.isControlPanelDefaultOpen}
          class=${deetsState}
          tablabelmode=${tabLabelModes[this.config.tabLabelStyle]}
		      openbuttonarialabel="ParaCharts control panel"
          style="--tab-text-transform: capitalize"
          @open=${
            () => {
              this.paraChart.isControlPanelOpen = true;
              this._panelOpenOverride = true;
              if (this.config.caption.isCaptionExternalWhenControlPanelClosed) {
                this._descriptionPanelRef.value!.internalizeCaptionBox();
              }
            }
          }
          @close=${
            () => {
              this.paraChart.isControlPanelOpen = false;
              this._panelOpenOverride = false;
              if (this.config.caption.isCaptionExternalWhenControlPanelClosed) {
                this.externalizeCaptionBox();
              }
            }
          }
          @invalidvalue=${(e: CustomEvent) => this._msgDialogRef.value!.show(e.detail)}
          @ready=${() => {
            // this.log.info('fizz-tab-details ready; focusing data layer');
            // if (this.todo.canvas.documentView) {
            //   this.todo.canvas.documentView.chartLayers.dataLayer.focus();
            // }
            //this.isReady = true;
          }}
        >
          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.description.title')}
            icon=${tabDescriptionIcon}
          >
            <para-description-panel
              ${ref(this._descriptionPanelRef)}
              .controlPanel=${this}
            ></para-description-panel>
          </fizz-tab-panel>
          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.data.title')}
            icon=${tabDataIcon}
            ?hidden=${!this.config.isDataTabVisible}
          >
            <para-data-panel
              ${ref(this._dataPanelRef)}
              .controlPanel=${this}
              .sparkBrailleData=${this.sparkBrailleData}
              .isSparkBrailleVisible=${this.config.isSparkBrailleVisible}
            ></para-data-panel>
          </fizz-tab-panel>
          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.colors.title')}
            icon=${tabColorsIcon}
            ?hidden=${!this.config.isColorsTabVisible}
          >
            <para-colors-panel
              ${ref(this._colorsPanelRef)}
              .controlPanel=${this}
            ></para-colors-panel>
          </fizz-tab-panel>

          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.audio.title')}
            icon=${tabAudioIcon}
            ?hidden=${!this.config.isAudioTabVisible}
          >
            <para-audio-panel
              .controlPanel=${this}
            ></para-audio-panel>
          </fizz-tab-panel>

          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.controls.title')}
            icon=${tabControlsIcon}
            ?hidden=${!this.config.isControlsTabVisible}
          >
            <para-controls-panel
              ${ref(this._controlsPanelRef)}
              .controlPanel=${this}
            ></para-controls-panel>
          </fizz-tab-panel>

          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.chart.title')}
            icon=${tabChartIcon}
            ?hidden=${!this.config.isChartTabVisible}
          >
            <para-chart-panel
              ${ref(this._chartPanelRef)}
              .controlPanel=${this}
            ></para-chart-panel>
          </fizz-tab-panel>

          <fizz-tab-panel
            tablabel=${this._globalState.l10n.localize('cpanel.tabs.annotations.title')}
            icon=${tabAnalysisIcon}
            ?hidden=${!this.config.isAnnotationsTabVisible}
          >
            <para-annotation-panel
              ${ref(this._annotationPanelRef)}
              .controlPanel=${this}
            ></para-annotation-panel>
          </fizz-tab-panel>
        </fizz-tabs>
        ${!this._panelOpen && this._paraState.colorContrastWarnings.length > 0 ? html`
          <button
            class="contrast-warning-badge"
            title="Color contrast issues detected — click to review"
            aria-label="Color contrast issues detected"
            @click=${() => this.openColorPrefsViaAlert()}
          >${unsafeSVG(warningIcon)}</button>
        ` : nothing}
      </div>
      ${this.renderDialog()}
      ${this.renderAnnotationDialog()}
    `;
  }

  private renderDialog() {
    return html`
      <para-dialog
        ${ref(this._dialogRef)}
        id="generic-dialog"
      ></para-dialog>
      <fizz-msg-dialog
        ${ref(this._msgDialogRef)}
      ></fizz-msg-dialog>
    `;
  }

  private renderAnnotationDialog() {
    return html`
      <para-annotation-dialog
        ${ref(this._annotationDialogRef)}
        id="generic-annotation-dialog"
      ></para-annotation-dialog>
    `;
  }

  private renderTabDebug() {
    return html`
      <fizz-tab-panel tablabel="Debug">
        <div class="tab-content">
          <div
            class="setting-views"
          >
          </div>
        </div>
      </fizz-tab-panel>
    `;
  }

  private getJsonStr( json: object, isWrapped?: boolean, indents?: number ) {
    if (isWrapped) {
      return `
        <pre><code>${JSON.stringify(json, null, indents)}
        </code></pre>
      `;
    }
    else {
      return JSON.stringify(json, null, indents);
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-control-panel': ParaControlPanel;
  }
}
