
import { type ParaChart } from '../parachart/parachart';
import { ParaDialog, ParaComponent } from '../components';
import { logging } from '../common/logger';
//import { styles } from '../../styles';
import {
  type DeepReadonly,
  type TabLabelStyle,
  type ControlPanelSettings
} from '../store/settings_types';
import { SettingsManager } from '../store/settings_manager';
import {
  DescriptionPanel, DataPanel, ColorsPanel, ChartPanel,
  AnnotationPanel, GraphingPanel, ControlsPanel
} from '.';
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

import { MessageDialog, FizzTabs, TabLabelMode } from '@fizz/ui-components';
import '@fizz/ui-components';

import { type Unsubscribe } from '@lit-app/state';

import {
  html, css, PropertyValues,
  unsafeCSS
} from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';


@customElement('para-control-panel')
export class ParaControlPanel extends logging(ParaComponent) {

  @property() sparkBrailleData!: string;

  @state() dataState: 'initial' | 'pending' | 'complete' | 'error' = 'initial';
  dataError?: unknown;
  paraChart!: ParaChart;

  @state() protected _isOpen = false;
  protected _tabsRef = createRef<FizzTabs>();
  protected _descriptionPanelRef = createRef<DescriptionPanel>();
  protected _dataPanelRef = createRef<DataPanel>();
  protected _colorsPanelRef = createRef<ColorsPanel>();
  protected _chartPanelRef = createRef<ChartPanel>();
  protected _annotationPanelRef = createRef<AnnotationPanel>();
  protected _graphingPanelRef = createRef<GraphingPanel>();
  protected _controlsPanelRef = createRef<ControlsPanel>();
  protected _dialogRef = createRef<ParaDialog>();
  protected _msgDialogRef = createRef<MessageDialog>();
  protected _storeChangeUnsub!: Unsubscribe;

  static styles = [
    //styles,
    css`
      * {
        font-family: "Trebuchet MS", Helvetica, sans-serif;
        font-size: var(--control-panel-font-size, 1rem);
      }
      fizz-tabs {
        --background: #eee;
        --toggle-button-icon: var(--control-panel-icon, url(${unsafeCSS(cpanelIcon)}));
        /*--control-panel-icon: url(${unsafeCSS(cpanelIconAlt)});*/
        --summary-marker-font-weight: bold;
        --control-panel-icon-size: 1.1rem;
        --contents-margin: 2px 0 0 0;
        width: 1;
        min-width: 40rem;
        max-width: 50%;
      }
      fizz-tabs.collapsed {
        /*width: rem;*/
        /*min-width: unset;*/
        position: relative;
        top: -2.5rem;
        /*--background: none;
        --control-panel-background: none;
        --control-panel-icon-color: var(--theme-color);
        --control-panel-icon-size: 1.5rem;
        --theme-contrast-color: var(--theme-color);
        --border: none;*/
        border: 2px solid transparent;
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
    `
  ];

  get settings() {
    return SettingsManager.getGroupLink<ControlPanelSettings>(
      this.managedSettingKeys[0], this._store.settings);
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

  get graphingPanel() {
    return this._graphingPanelRef.value!;
  }

  // get statusBar() {
  //   return this._descriptionPanelRef.value!.statusBar;
  // }

  get dialog() {
    return this._dialogRef.value!;
  }

  connectedCallback() {
    super.connectedCallback();
    this._isOpen = this.settings.isControlPanelDefaultOpen;
    this._storeChangeUnsub = this._store.subscribe((key, value) => {
      if (key === 'data') {
        this.dataUpdated();
      }
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._storeChangeUnsub();
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
      this.requestUpdate();
    } else if (shortKey === 'isCaptionVisible'
      || shortKey === 'isStatusBarVisible') {
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

  onFocus() {
    this._descriptionPanelRef.value!.clearStatusBar();
    //this.srb.render(this.currentSeriesSummary());
  }

  showHelpDialog(){
    return this._controlsPanelRef.value!.showHelpDialog();
  }

  render() {
    this.log('render', this._isOpen);
    let deetsState = this._isOpen ? 'expanded' : 'collapsed';
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
      <fizz-tabs
        ${ref(this._tabsRef)}
        ?open=${this.settings.isControlPanelDefaultOpen}
        class=${deetsState}
        tablabelmode=${tabLabelModes[this.settings.tabLabelStyle]}
        openbuttonarialabel="Open or close ParaCharts control panel"
        @open=${
          () => {
            this._isOpen = true;
          }
        }
        @close=${
          () => {
            this._isOpen = false;
          }
        }
        @invalidvalue=${(e: CustomEvent) => this._msgDialogRef.value!.show(e.detail)}
        @ready=${() => {
          // this.log('fizz-tab-details ready; focusing data layer');
          // if (this.todo.canvas.documentView) {
          //   this.todo.canvas.documentView.chartLayers.dataLayer.focus();
          // }
          //this.isReady = true;
        }}
      >
        <fizz-tab-panel
          tablabel="Description"
          icon=${tabDescriptionIcon}
        >
          <para-description-panel
            ${ref(this._descriptionPanelRef)}
            .controlPanel=${this}
          ></para-description-panel>
        </fizz-tab-panel>
        <fizz-tab-panel
          tablabel="Data"
          icon=${tabDataIcon}
          ?hidden=${!this.settings.isDataTabVisible}
        >
          <para-data-panel
            ${ref(this._dataPanelRef)}
            .controlPanel=${this}
            .sparkBrailleData=${this.sparkBrailleData}
            .isSparkBrailleVisible=${this.settings.isSparkBrailleVisible}
          ></para-data-panel>
        </fizz-tab-panel>
        <fizz-tab-panel
          tablabel="Colors"
          icon=${tabColorsIcon}
          ?hidden=${!this.settings.isColorsTabVisible}
        >
          <para-colors-panel
            ${ref(this._colorsPanelRef)}
            .controlPanel=${this}
          ></para-colors-panel>
        </fizz-tab-panel>

        <fizz-tab-panel
          tablabel="Audio"
          icon=${tabAudioIcon}
          ?hidden=${!this.settings.isAudioTabVisible}
        >
          <para-audio-panel
            .controlPanel=${this}
          ></para-audio-panel>
        </fizz-tab-panel>

        <fizz-tab-panel
          tablabel="Controls"
          icon=${tabControlsIcon}
          ?hidden=${!this.settings.isControlsTabVisible}
        >
          <para-controls-panel
            ${ref(this._controlsPanelRef)}
            .controlPanel=${this}
          ></para-controls-panel>
        </fizz-tab-panel>

        <fizz-tab-panel
          tablabel="Chart"
          icon=${tabChartIcon}
          ?hidden=${!this.settings.isChartTabVisible}
        >
          <para-chart-panel
            ${ref(this._chartPanelRef)}
            .controlPanel=${this}
          ></para-chart-panel>
        </fizz-tab-panel>

        <fizz-tab-panel
          tablabel="Annotations"
          icon=${tabAnalysisIcon}
          ?hidden=${!this.settings.isAnnotationsTabVisible}
        >
          <para-annotation-panel
            ${ref(this._annotationPanelRef)}
            .controlPanel=${this}
          ></para-annotation-panel>
        </fizz-tab-panel>

        <fizz-tab-panel
          tablabel="Graphing"
          icon=${tabAnalysisIcon}
          ?hidden=${!this.settings.isGraphingTabVisible}
        >
          <para-graphing-panel
            ${ref(this._graphingPanelRef)}
            .controlPanel=${this}
          ></para-graphing-panel>
        </fizz-tab-panel>

        <!--<fizz-tab-panel
          tablabel="Analysis"
          icon=${tabAnalysisIcon}
          ?hidden=${!this.settings.isAnalysisTabVisible}
        >
          <para-analysis-panel
            .controlPanel=${this}
          ></para-analysis-panel>
        </fizz-tab-panel>-->
      </fizz-tabs>
      ${this.renderDialog()}
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