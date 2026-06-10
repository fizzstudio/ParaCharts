/* ParaCharts: ParaAPI
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

import { PlaneModel, type Datapoint } from '@fizz/paramodel';

import { ORIENTATION_SENTENCES, PASTRY_ORIENTATION_SENTENCES, type BaseChartInfo } from '../chart_types';
import { type ParaChart } from '../parachart/parachart';
import { HotkeyEvent, makeSequenceId, Setting, SettingsManager } from '../state';
import { SettingsInput } from '../config/config_types';
import { CardinalDirection, Direction } from '../config/config_types';
import { ActionArgumentMap, AvailableActions } from '../state/action_map';
import explainers from '../explainers';
import type { DatapointManifest, Manifest } from '@fizz/paramanifest';
import { ConfigSetting } from '../config/config_types';
import { ConfigGroupMetadata, ConfigGroupSettingsMetadata, configMetadata, ConfigSettingMetadata } from '../config/config_metadata';

type Actions = { [Property in keyof AvailableActions]: ((args?: ActionArgumentMap) => void | Promise<void>) };

/**
 * Perform various operations on a ParaChart.
 */
export class ParaAPI {
  protected _actions: Actions;
  protected _standardActions: Actions;
  protected _tourGuideActions: Actions;
  protected _tourGuideNoSelfVoicing = true;
  protected _tourGuideSelfVoicingState!: boolean;
  protected _liveUpdateRecordCount = 0;
  protected _liveUpdateWaiting = false;

  constructor(protected _paraChart: ParaChart) {
    const paraView = _paraChart.paraView;

    // we use a function here bc the chartInfo object may get replaced
    const chartInfo = () => _paraChart.globalState.paraState.chartInfo;
    const self = this;
    this._standardActions = {
      move(args: ActionArgumentMap) {
        chartInfo().clearPlay();
        chartInfo().move(args.direction as Direction);
      },
      /** Go to the first point of a series. */
      goFirst() {
        chartInfo().navFirst();
      },
      /** Go to the last point of a series. */
      goLast() {
        chartInfo().navLast();
      },
      /** Go to the series minimum. */
      goMinimum() {
        chartInfo().goSeriesMinMax(true);
      },
      /** Go to the series maximum. */
      goMaximum() {
        chartInfo().goSeriesMinMax(false);
      },
      /** Go to the chart minimum. */
      goTotalMinimum() {
        chartInfo().goChartMinMax(true);
      },
      /** Go to the chart maximum. */
      goTotalMaximum() {
        chartInfo().goChartMinMax(false);
      },
      /** Select a datapoint. */
      select() {
        chartInfo().selectCurrent(false);
      },
      /** Extend the current selection. */
      extendSelection() {
        chartInfo().selectCurrent(true);
      },
      /** Clear the current selection. */
      clearSelection() {
        chartInfo().clearDatapointSelection();
      },
      /** Play the sonification for the points to the right. */
      playRight() {
        chartInfo().playDir('right');
      },
      /** Play the sonification for the points to the left. */
      playLeft() {
        chartInfo().playDir('left');
      },
      /** Stop any sonification. */
      stopPlay() {
        chartInfo().clearPlay();
      },
      /** Query datapoints. */
      queryData() {
        chartInfo().queryData();
      },
      /** Toggle sonification mode. */
      toggleSonificationMode() {
        paraView.paraState.updateConfig(draft => {
          draft.sonification.isSonificationEnabled = !draft.sonification.isSonificationEnabled;
          const endisable = draft.sonification.isSonificationEnabled ? 'enable' : 'disable';
          paraView.paraState.announce(`Sonification ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'Sonification', null);
        });
      },
      /** Toggle trend navigation mode. */
      toggleTrendNavigationMode() {
        paraView.paraState.updateConfig(draft => {
          draft.type.line.isTrendNavigationModeEnabled = !draft.type.line.isTrendNavigationModeEnabled;
          const endisable = draft.type.line.isTrendNavigationModeEnabled ? 'enable' : 'disable';
          paraView.paraState.announce(`Trend navigation ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'TrendNavigation', null);
        });
      },
      /** Toggle screen reader announcements. */
      toggleAnnouncementMode() {
        if (paraView.paraState.config.ui.isAnnouncementEnabled) {
          paraView.paraState.announce('Announcements disabled');
          paraView.paraState.updateConfig(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
          _paraChart.postNotice('disableAnnouncements', null);
        } else {
          paraView.paraState.updateConfig(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          paraView.paraState.announce('Announcements enabled');
          _paraChart.postNotice('enableAnnouncements', null);
        }
      },
      /** Toggle self-voicing mode. */
      toggleVoicingMode() {
        paraView.paraState.updateConfig(draft => {
          draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
          const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'Voicing', null);
        });
      },
      /** Toggle dark mode. */
      toggleDarkMode() {
        paraView.paraState.updateConfig(draft => {
          if (draft.color.themeMode === 'dark') {
            draft.color.themeMode = 'auto';
            _paraChart.postNotice('enableAutoColorMode', null);
            paraView.paraState.announce('Using auto color theme.');
          } else if (draft.color.themeMode === 'auto') {
            draft.color.themeMode = 'light';
            _paraChart.postNotice('enableLightColorMode', null);
            paraView.paraState.announce('Using light color theme.');
          } else {
            draft.color.themeMode = 'dark';
            _paraChart.postNotice('enableDarkColorMode', null);
            paraView.paraState.announce('Using dark color theme.');
          }
        });
      },
      /** Toggle low-vision mode */
      toggleLowVisionMode() {
        paraView.paraState.updateConfig(draft => {
          if (draft.ui.isLowVisionModeEnabled) {
            // Allow the exit from fullscreen to disable LV mode
            draft.ui.isFullscreenEnabled = false;
            _paraChart.postNotice('disableLowVisionMode', null);
          } else {
            draft.ui.isLowVisionModeEnabled = true;
            _paraChart.postNotice('enableLowVisionMode', null);
          }
        });
      },
      /** Open the help dialog. */
      openHelp() {
        _paraChart.controlPanel.showHelpDialog();
      },
      /** Open the chart explainer. */
      openExplainer() {
        if (_paraChart.globalState.paraState === _paraChart.globalState.paraStates[1]) {
          // Open the explainer
          const type = paraView.documentView!.type;
          paraView.destroyDocumentView();
          _paraChart.globalState.enableParaState(_paraChart.globalState.paraStates[0]);
          if (!_paraChart.globalState.paraState.model) {
            if (_paraChart.globalState!.paraStates[1].model!.series.length === 1) {
              _paraChart.runLoader(
                JSON.stringify(explainers[type]!.single!.manifest),
                'content',
                false,
                explainers[type]!.single!.summary,
                false // don't reset settings
              ).then(() => {
                _paraChart.paraState.updateConfig(draft => {
                  draft.chart.padding = '32 120';
                }, true);
                _paraChart.styleManager.update();
                paraView.createDocumentView();
              });
            }
            else {
              _paraChart.runLoader(
                JSON.stringify(explainers[type]!.multi!.manifest),
                'content',
                false,
                explainers[type]!.multi!.summary,
                false // don't reset settings
              ).then(() => {
                _paraChart.paraState.updateConfig(draft => {
                  draft.chart.padding = '32 120';
                }, true);
                _paraChart.styleManager.update();
                paraView.createDocumentView();
              });
            }
          } else {
            paraView.createDocumentView();
            _paraChart.paraState.setCaption();
          }
        } else {
          // Close the explainer
          _paraChart.globalState.enableParaState(_paraChart.globalState.paraStates[1]);
          paraView.createDocumentView();
          _paraChart.paraState.setCaption();
        }
      },
      /** Announce the ParaCharts version information. */
      announceVersionInfo() {
        paraView.paraState.announce(`Version ${__APP_VERSION__}; commit ${__COMMIT_HASH__}`);
      },
      /** Toggle chord mode. */
      jumpToChordLanding() {
        chartInfo().navToChordLanding();
      },
      /** Silence any speech or sonification. */
      shutUp() {
        paraView.ariaLiveRegion.voicing.shutUp();
      },
      /** Repeat the last announcement. */
      repeatLastAnnouncement() {
        paraView.ariaLiveRegion.replay();
      },
      /** Add an annotation. */
      addAnnotation() {
        _paraChart.controlPanel.annotationPanel.addAnnotation();
      },
      /** Toggle tour guide mode. */
      toggleNarrativeHighlightMode: (args: ActionArgumentMap) => {
        this._tourGuideNoSelfVoicing = args.noSelfVoicing as boolean;
        paraView.paraState.updateConfig(draft => {
          draft.ui.isTourGuideEnabled = true;
          if (!args.noSelfVoicing) {
            this._tourGuideSelfVoicingState = draft.ui.isVoicingEnabled;
            draft.ui.isVoicingEnabled = true;
          }
        });
      },
      /** Toggle data table. */
      toggleDataTable() {
        _paraChart.isDataTableVisible = ! _paraChart.isDataTableVisible;
      },
      /** Play or pause audio. */
      playPauseMedia() {

      },
      /** Reset chart selections and navigation. */
      reset() {
        paraView.paraState.clearSelected();
        chartInfo().navMap!.root.goTo('top', {});
        paraView.createDocumentView();
      }
    };
    this._actions = this._standardActions;

    this._tourGuideActions = Object.create(this._actions);
    const voicing = paraView.ariaLiveRegion.voicing;

    this._tourGuideActions.move = async (args: ActionArgumentMap) => {
      paraView.paraChart.captionBox.highlightSpan(args.direction === 'right' || args.direction === 'down');
    };
    this._tourGuideActions.goFirst = () => { };
    this._tourGuideActions.goLast = () => { };
    this._tourGuideActions.repeatLastAnnouncement = () => { };
    this._tourGuideActions.toggleNarrativeHighlightMode = () => {
      paraView.paraState.updateConfig(draft => {
        draft.ui.isTourGuideEnabled = false;
        if (!this._tourGuideNoSelfVoicing) {
          draft.ui.isVoicingEnabled = this._tourGuideSelfVoicingState;
        }
        this._tourGuideNoSelfVoicing = true;
      });
    };
    this._tourGuideActions.playPauseMedia = () => {
      voicing.togglePaused();
    };
  }

  /** Enable the hotkey actions for tour guide mode. */
  enableTourGuideActions() {
    this._actions = this._tourGuideActions;
  }

  /** Enable the standard hotkey actions. */
  disableTourGuideActions() {
    this._actions = this._standardActions;
  }

  get paraChart(): ParaChart {
    return this._paraChart;
  }

  get chartInfo(): BaseChartInfo {
    return this._paraChart.globalState.paraState.chartInfo;
  }

  get actions(): Actions {
    return this._actions;
  }

  /** Perform a hotkey action. */
  doAction(action: keyof AvailableActions, args?: ActionArgumentMap) {
    this._actions[action](args);
  }

  /** Set the chart manifest. */
  setManifest(manifestUrl: string) {
    this._paraChart.setAttribute('manifest', manifestUrl);
  }

  /** Wait for a manifest to be loaded. Resolves immediately if already loaded. */
  waitForManifest(): Promise<void> {
    return this._paraChart.waitForManifest();
  }

  protected async _slideWindow(points: Record<string, {x: string, y: string}>, forward = true) {
    // mani.jim.datasets[0].series[0].records[0].x
    const mani = this._paraChart.paraState.manifest!;
    for (const [k, v] of Object.entries(points)) {
      let data: DatapointManifest[] | undefined;
      for (const series of mani.jim.datasets[0].series) {
        if (series.key === k) {
          data = series.records;
        }
      }
      if (!data) {
        throw new Error(`no such series '${k}'`);
      }
      if (forward) {
        data.splice(0, 1);
        data.push({
          x: v.x,
          y: v.y
        });
      } else {
        data.pop();
        data.unshift({
          x: v.x,
          y: v.y
        });
      }
    }
    const maniStr = JSON.stringify(mani, null, 2);
    await this._paraChart.runLoader(maniStr, 'content', undefined, undefined, false);
  }

  /** Add a record to the end of the chart and remove the first record. */
  async addRecord(pushPoints: Record<string, {x: string, y: string}>) {
    await this._slideWindow(pushPoints);
    //if (!this._paraChart.hasFocus) return;
    const sleep = (msec: number) => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, msec);
      });
    };
    const waitKey = (key: string) => {
      return new Promise<void>((resolve, reject) => {
        this._paraChart.paraState.keymapManager.addEventListener('hotkeypress', (ev: HotkeyEvent) => {
          if (ev.key === key) {
            resolve();
          }
        });
      });
    };
    const liveUpdateDelayMs = this._paraChart.paraState.config.ui.liveUpdateDelay*1000;
    this._liveUpdateRecordCount++;
    if (!this._liveUpdateWaiting) {
      while (this._liveUpdateRecordCount) {
        this._liveUpdateWaiting = true;
        const concise = await this._paraChart.paraState.chartInfo.summarizer.getConciseSummary();
        const announcement = `Live update: ${this._liveUpdateRecordCount} record${this._liveUpdateRecordCount > 1 ? 's' : ''} added. ${concise.text}`;
        this._liveUpdateRecordCount = 0;
        if (this._paraChart.paraState.config.ui.isVoicingEnabled) {
          await this._paraChart.paraView.ariaLiveRegion.voicing.speak(announcement, []);
          await sleep(liveUpdateDelayMs);
        } else {
          this._paraChart.paraState.announce(announcement + ' Press spacebar for next update.');
          // Await spacebar OR ui.isVoicingEnabled becoming true
          await Promise.any([
            waitKey(' '),
            this._paraChart.paraState.waitForSetting('ui.isVoicingEnabled', true)]);
        }
        this._liveUpdateWaiting = false;
      }
    }
  }

  /** Remove the last record from the chart and add a new record to the start. */
  async removeRecord(unshiftPoints: Record<string, {x: string, y: string}>) {
    await this._slideWindow(unshiftPoints, false);
  }

  /** Get the chart title label. */
  getTitle(): ParaAPITitle {
    return new ParaAPITitle(this)
  }

  /** Get the chart horizontal axis. */
  getHorizontalAxis(): ParaAPIHorizontalAxis {
    return new ParaAPIHorizontalAxis(this)
  }

  /** Get the chart vertical axis. */
  getVerticalAxis(): ParaAPIVerticalAxis {
    return new ParaAPIVerticalAxis(this)
  }

  /** Get a chart legend. */
  getLegend(location: CardinalDirection): ParaAPILegend {
    return new ParaAPILegend(location, this);
  }

  /** Get a horizontal range of the chart. */
  getRange(startPortion: number, endPortion: number): ParaAPIRange {
    return new ParaAPIRange(startPortion, endPortion, this);
  }

  /** Get an intersection between two or more series. */
  getIntersection(index: number): ParaAPIIntersection {
    return new ParaAPIIntersection(index, this);
  }

  // protected _labelToKey(seriesLabel: string): string {
  //   const series = this._paraChart.paraState.model!.series.find(s => s.label === seriesLabel);
  //   if (!series) throw new Error(`no series with label '${seriesLabel}'`);
  //   return series.key;
  // }

  // getSeries(seriesLabel: string): ParaAPISeries {
  //   return this.getAllSeries(seriesLabel)[0];
  // }

  /** Get one or more series to operate on. */
  getSeries(...seriesLabelsOrKeys: string[]): ParaAPISeriesGroup {
    // remove dups
    const labelsOrKeys = Array.from(new Set(seriesLabelsOrKeys));
    return new ParaAPISeriesGroup(labelsOrKeys, this);
  }

  highlightCluster(clusterID: number) {
    this.paraChart.paraState.highlightCluster(clusterID);
  }

  // sendKey(keyId: string) {
  //   this._paraChart.command('key', [keyId]);
  // }

  /** Get the serialized SVG version of the chart. */
  serializeChart() {
    return this._paraChart.paraView.serialize();
  }

  /** Get the chart description. */
  async getDescription(): Promise<string | undefined> {
    const summary = await this._paraChart.globalState.paraState.chartInfo.summarizer.getChartSummary();
    return summary?.text;
  }

  /** Get the chart alt text. */
  async getAltText(): Promise<string | undefined> {
    const chartType = this._paraChart.paraState.type;
    const orientationSentences = ['pie', 'donut', 'gauge'].includes(chartType)
      ? PASTRY_ORIENTATION_SENTENCES
      : ORIENTATION_SENTENCES;
    const summary = await this.paraChart.globalState.paraState.chartInfo.summarizer.getRequestedSummaries(orientationSentences);
    return summary?.text;
  }

  /** Get the chart short description. */
  async getShortDescription(): Promise<string | undefined> {
    const summary = await this._paraChart.paraState.chartInfo.summarizer.getRequestedSummaries(['$.datasets[0]._short']);
    return summary?.text;
  }

  /** Get the chart JIM. */
  getJIM(): Manifest | undefined {
    const manifest = this.paraChart.paraState.jimerator?.manifest;
    if (!manifest) return undefined;
    return { jim: manifest.jim };
  }

  /** Download the chart in SVG format. */
  downloadSVG() {
    this._paraChart.paraView.downloadSVG();
  }

  /** Download the chart in PNG format. */
  downloadPNG() {
    this._paraChart.paraView.downloadPNG();
  }

  /** Get a setting. */
  getSetting(settingPath: string): Setting {
    return SettingsManager.get(settingPath, this._paraChart.paraState.settings);
  }

  /** Get multiple settings. */
  getSettings(settingPaths: string[]): SettingsInput {
    const out: SettingsInput = {};
    settingPaths.forEach(path => {
      out[path] = SettingsManager.get(path, this._paraChart.paraState.settings);
    });
    return out;
  }

  /** Get all settings. */
  getAllSettings(): SettingsInput {
    return SettingsManager.getAllSettings(this._paraChart.paraState.settings);
  }

  /** Set a setting. */
  setSetting(settingPath: string, value: Setting) {
    this._paraChart.paraState.updateSettings(draft => {
      SettingsManager.set(settingPath, value, draft);
    });
  }

  /** Set multiple settings. */
  setSettings(settingsInput: SettingsInput) {
    this._paraChart.paraState.updateSettings(draft => {
      Object.entries(settingsInput).forEach(([path, value]) => {
        SettingsManager.set(path, value, draft);
      });
    });
  }

  /** Get a setting. */
  getConfigSetting(settingPath: string): ConfigSetting {
    return SettingsManager.get(settingPath, this._paraChart.paraState.config);
  }

  /** Get multiple settings. */
  getConfigSettings(settingPaths: string[]): SettingsInput {
    const out: SettingsInput = {};
    settingPaths.forEach(path => {
      out[path] = SettingsManager.get(path, this._paraChart.paraState.config);
    });
    return out;
  }

  /** Get all settings. */
  getAllConfigSettings(): SettingsInput {
    return SettingsManager.getAllSettings(this._paraChart.paraState.config);
  }

  /** Set a setting. */
  setConfigSetting(settingPath: string, value: ConfigSetting) {
    this._paraChart.paraState.updateConfig(draft => {
      SettingsManager.set(settingPath, value, draft);
    });
  }

  /** Set multiple settings. */
  setConfigSettings(settingsInput: SettingsInput) {
    this._paraChart.paraState.updateConfig(draft => {
      Object.entries(settingsInput).forEach(([path, value]) => {
        SettingsManager.set(path, value, draft);
      });
    });
  }

  /** Get config group metadata. */
  getConfigGroupMetadata(path: string): ConfigGroupMetadata | undefined{
    return configMetadata[path];
  }

  /** Get config settings metadata matching all given keywords. */
  getConfigSettingsMetadata(keywords: string[]): ConfigGroupSettingsMetadata {
    const out: ConfigGroupSettingsMetadata = {};
    for (const [path, group] of Object.entries(configMetadata)) {
      for (const [key, settingMetadata] of Object.entries(group.settings)) {
        if (keywords.every(kw => settingMetadata.keywords?.includes(kw))) {
          out[`${path}.${key}`] = settingMetadata;
        }
      }
    }
    return out;
  }

  /** Set chart width. */
  setWidth(width: number) {
    this._paraChart.paraState.updateConfig(draft => {
      draft.chart.width = width;
    });
  }

  /** Set chart height. */
  setHeight(height: number) {
    this._paraChart.paraState.updateConfig(draft => {
      draft.chart.height = height;
    });
  }

  /** Set chart width and height. */
  setSize(width: number, height: number) {
    this._paraChart.paraState.updateConfig(draft => {
      draft.chart.width = width;
      draft.chart.height = height;
    });
  }

  /** Highlight the chart title. */
  highlightTitle() {
    this.getTitle().highlight();
  }

  /** Clear any chart title highlight. */
  clearTitleHighlight() {
    this.getTitle().clearHighlight();
  }

  /** Highlight the chart horizontal axis. */
  highlightHorizontalAxis() {
    this.getHorizontalAxis().highlight();
  }

  /** Clear any chart horizontal axis highlight. */
  clearHorizontalAxisHighlight() {
    this.getHorizontalAxis().clearHighlight();
  }

  /** Highlight the chart vertical axis. */
  highlightVerticalAxis() {
    this.getVerticalAxis().highlight();
  }

  /** Clear any chart vertical axis highlight. */
  clearVerticalAxisHighlight() {
    this.getVerticalAxis().clearHighlight();
  }

  /** Highlight the chart east legend. */
  highlightEastLegend() {
    this.getLegend('east').highlight();
  }

  /** Clear any chart east legend highlight. */
  clearEastLegendHighlight() {
    this.getLegend('east').clearHighlight();
  }

  /** Highlight the chart west legend. */
  highlightWestLegend() {
    this.getLegend('west').highlight();
  }

  /** Clear any chart west legend highlight. */
  clearWestLegendHighlight() {
    this.getLegend('west').clearHighlight();
  }

  /** Highlight the chart north legend. */
  highlightNorthLegend() {
    this.getLegend('north').highlight();
  }

  /** Clear any chart north legend highlight. */
  clearNorthLegendHighlight() {
    this.getLegend('north').clearHighlight();
  }

  /** Highlight the chart south legend. */
  highlightSouthLegend() {
    this.getLegend('south').highlight();
  }

  /** Clear any chart south legend highlight. */
  clearSouthLegendHighlight() {
    this.getLegend('south').clearHighlight();
  }

  /** Highlight a horizontal range of the chart. */
  highlightRange(startPortion: number, endPortion: number) {
    this.getRange(startPortion, endPortion).highlight();
  }

  /** Clear a chart horizontal range highlight. */
  clearRangeHighlight(startPortion: number, endPortion: number) {
    this.getRange(startPortion, endPortion).clearHighlight();
  }

  /** Highlight an intersection between series. */
  highlightIntersection(index: number) {
    this.getIntersection(index).highlight();
  }

  /** Clear any series intersection highlight. */
  clearIntersectionHighlight(index: number) {
    this.getIntersection(index).clearHighlight();
  }

  /** Clear all chart horizontal range highlights. */
  clearAllRangeHighlights() {
    this._paraChart.paraState.clearAllRangeHighlights();
  }

  /** Clear all datapoint highlights. */
  clearAllDatapointHighlights() {
    this._paraChart.paraState.clearAllDatapointHighlights();
  }

  /** Clear all sequence highlights. */
  clearAllSequenceHighlights() {
    this._paraChart.paraState.clearAllSequenceHighlights();
  }

  /** Clear all series highlights. */
  clearAllSeriesHighlights() {
    this._paraChart.paraState.clearAllSeriesDimming();
  }

  /** Clear all series intersection highlights. */
  clearAllIntersectionHighlights() {
    this._paraChart.paraState.clearAllIntersectionHighlights();
  }

  /** Clear all chart highlights. */
  clearAllHighlights() {
    this._paraChart.paraState.clearAllHighlights();
  }

  /** Clear all chart highlights. */
  clearAllPopups() {
    this._paraChart.paraState.clearPopups();
  }
  clearVisited() {
    this._paraChart.paraState.clearVisited();
  }

  clearSelected() {
    this._paraChart.paraState.clearSelected();
  }

  /** Hide all chart series. */
  hideAllSeries() {
    this._paraChart.paraState.hideAllSeries();
  }

  /** Unhide all chart series. */
  unhideAllSeries() {
    this._paraChart.paraState.unhideAllSeries();
  }

  addCrosshair(xAxis: string | number, yAxis: string | number) {
    this.paraChart.paraState.addDataSpaceCrosshair(String(xAxis), String(yAxis))
  }

  clearCrosshair(xAxis: string | number, yAxis: string | number) {
    this.paraChart.paraState.clearDataSpaceCrosshair(String(xAxis), String(yAxis))
  }

  addTrendLine() {
    this.paraChart.paraState.updateConfig(draft => {
      draft.type.scatter.isShowTrendLine = true;
    });
  }


  removeTrendLine() {
    this.paraChart.paraState.updateConfig(draft => {
      draft.type.scatter.isShowTrendLine = false;
    });
  }

  refresh() {
    this._paraChart.paraView.createDocumentView();
  }
}

/**
 * Perform operations on the chart title.
 */
export class ParaAPITitle {
  constructor(protected _api: ParaAPI) {
  }

  /** Highlight the title. */
  highlight() {
    this._api.paraChart.paraState.isTitleHighlighted = true;
  }

  /** Clear any title highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.isTitleHighlighted = false;
  }
}

/**
 * Perform operations on the chart horizontal axis.
 */
export class ParaAPIHorizontalAxis {
  constructor(protected _api: ParaAPI) {
  }

  /** Highlight the horizontal axis. */
  highlight() {
    this._api.paraChart.paraState.isHorizontalAxisHighlighted = true;
  }

  /** Clear any horizontal axis highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.isHorizontalAxisHighlighted = false;
  }

  highlightLabel(tierIndex: number, labelIndex: number) {
    this._api.paraChart.paraState.highlightAxisLabel({ tierIndex: tierIndex, labelIndex: labelIndex, orientation: 'horiz' });

  }
  clearHighlightLabel(tierIndex: number, labelIndex: number) {
    this._api.paraChart.paraState.clearAxisLabelHighlight({ tierIndex: tierIndex, labelIndex: labelIndex, orientation: 'horiz' });
  }

  getMaxPoints() {
    const datapoints = this._api.paraChart.paraState.model!.allPoints;
    const max = Math.max(...datapoints.map(d => d.facetValueNumericized("x")!));
    const maxPoints = datapoints.filter(d => d.facetValueNumericized("x")! == max);
    return new ParaAPIPointGroup(maxPoints, this._api.getSeries(maxPoints[0].seriesKey));
  }

  getMinPoints() {
    const datapoints = this._api.paraChart.paraState.model!.allPoints;
    const min = Math.min(...datapoints.map(d => d.facetValueNumericized("x")!));
    const minPoints = datapoints.filter(d => d.facetValueNumericized("x")! == min);
    return new ParaAPIPointGroup(minPoints, this._api.getSeries(minPoints[0].seriesKey));
  }

}

/**
 * Perform operations on the chart vertical axis.
 */
export class ParaAPIVerticalAxis {
  constructor(protected _api: ParaAPI) {
  }

  /** Highlight the vertical axis. */
  highlight() {
    this._api.paraChart.paraState.isVerticalAxisHighlighted = true;
  }

  /** Clear any vertical axis highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.isVerticalAxisHighlighted = false;
  }

  highlightLabel(tierIndex: number, labelIndex: number) {
    this._api.paraChart.paraState.highlightAxisLabel({ tierIndex: tierIndex, labelIndex: labelIndex, orientation: 'vert' });

  }
  clearHighlightLabel(tierIndex: number, labelIndex: number) {
    this._api.paraChart.paraState.clearAxisLabelHighlight({ tierIndex: tierIndex, labelIndex: labelIndex, orientation: 'vert' });
  }

  getMaxPoints() {
    const datapoints = this._api.paraChart.paraState.model!.allPoints;
    const max = Math.max(...datapoints.map(d => d.facetValueNumericized("y")!));
    const maxPoints = datapoints.filter(d => d.facetValueNumericized("y")! == max);
    return new ParaAPIPointGroup(maxPoints, this._api.getSeries(maxPoints[0].seriesKey));
  }

  getMinPoints() {
    const datapoints = this._api.paraChart.paraState.model!.allPoints;
    const min = Math.min(...datapoints.map(d => d.facetValueNumericized("y")!));
    const minPoints = datapoints.filter(d => d.facetValueNumericized("y")! == min);
    return new ParaAPIPointGroup(minPoints, this._api.getSeries(minPoints[0].seriesKey));
  }
}

/**
 * Perform operations on the chart legend.
 */
export class ParaAPILegend {
  constructor(protected _location: CardinalDirection, protected _api: ParaAPI) {
    if (!['north', 'south', 'east', 'west'].includes(_location)) {
      throw new Error("'location' must be one of 'north', 'south', 'east', 'west'");
    }
  }

  /** Highlight the legend. */
  highlight() {
    switch (this._location) {
      case 'north':
        this._api.paraChart.paraState.isNorthLegendHighlighted = true; break;
      case 'south':
        this._api.paraChart.paraState.isSouthLegendHighlighted = true; break;
      case 'east':
        this._api.paraChart.paraState.isEastLegendHighlighted = true; break;
      case 'west':
        this._api.paraChart.paraState.isWestLegendHighlighted = true; break;
    }
  }

  /** Clear any legend highlight. */
  clearHighlight() {
    switch (this._location) {
      case 'north':
        this._api.paraChart.paraState.isNorthLegendHighlighted = false; break;
      case 'south':
        this._api.paraChart.paraState.isSouthLegendHighlighted = false; break;
      case 'east':
        this._api.paraChart.paraState.isEastLegendHighlighted = false; break;
      case 'west':
        this._api.paraChart.paraState.isWestLegendHighlighted = false; break;
    }
  }
}

/**
 * Perform operations on a horizontal range of the chart.
 */
export class ParaAPIRange {
  /**
   *
   * @param _startPortion - Value between 0 and 1, < _endPortion
   * @param _endPortion - Value between 0 and 1, > _startPortion
   * @param _api
   */
  constructor(protected _startPortion: number, protected _endPortion: number, protected _api: ParaAPI) {
    if (_startPortion < 0 || _startPortion > 1 || _endPortion < 0 || _endPortion > 1) {
      throw new Error('startPortion and endPortion must be between 0 and 1 inclusive');
    }
    if (_startPortion >= _endPortion) {
      throw new Error('startPortion must be < endPortion');
    }
  }

  /** Highlight the range. */
  highlight() {
    this._api.paraChart.paraState.highlightRange(this._startPortion, this._endPortion);
  }

  /** Clear any highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.clearRangeHighlight(this._startPortion, this._endPortion);
  }
}

/**
 * Perform operations on an intersection between two or more series.
 */
export class ParaAPIIntersection {
  constructor(protected _index: number, protected _api: ParaAPI) {
    if (!(this._api.paraChart.paraState.model instanceof PlaneModel)) {
      throw new Error('chart type does not support intersections');
    }
    if (_index < 0) {
      throw new Error('intersection index must not be negative');
    }
    if (_index > this._api.paraChart.paraState.model!.intersections.length - 1) {
      throw new Error('intersection index out of range');
    }
  }

  /** Highlight the intersection. */
  highlight() {
    this._api.paraChart.paraState.highlightIntersection(this._index);
  }

  /** Clear any highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.clearIntersectionHighlight(this._index);
  }
}

/**
 * Perform operations on one or more ParaChart series.
 */
export class ParaAPISeriesGroup {
  protected _datapoints: Map<string, Datapoint[]>;
  protected _keys: string[];

  constructor(labelsOrKeys: string[], protected _api: ParaAPI) {
    this._keys = [];
    const allSeries = labelsOrKeys.map(labelOrKey => {
      const seriesFromLabel = _api.paraChart.paraState.model!.atLabel(labelOrKey);
      const seriesFromKey = _api.paraChart.paraState.model!.atKey(labelOrKey);
      if (!seriesFromLabel && !seriesFromKey) {
        throw new Error(`no series with label or key '${labelOrKey}'`);
      }
      return seriesFromLabel ?? seriesFromKey!;
    });
    this._datapoints = new Map();
    allSeries.forEach(series => {
      this._datapoints.set(series.key, [...series.datapoints]);
      this._keys.push(series.key);
    });
  }

  get keys(): string[] {
    return this._keys;
  }

  get api(): ParaAPI {
    return this._api;
  }

  /** Get a datapoint to operate on. */
  getPoint(index: number): ParaAPIPointGroup {
    return this.getPoints(index);
  }

  /** Get one or more datapoints to operate on. */
  getPoints(...indices: number[]): ParaAPIPointGroup {
    // remove dups
    const idxs = Array.from(new Set(indices));
    const datapoints = this._keys.flatMap(key => idxs.map(idx => {
      const datapoint = this._datapoints.get(key)![idx];
      if (!datapoint) throw new Error(`series '${key}' has no datapoint at index ${idx}`);
      return datapoint;
    }));
    return new ParaAPIPointGroup(datapoints, this);
  }

  /** Get a sequence to operate on. */
  getSequence(start: number, end: number): ParaAPISequenceGroup {
    return this.getSequences([start, end]);
  }

  /** Get one or more sequences to operate on. */
  getSequences(...boundaryPairs: [number, number][]): ParaAPISequenceGroup {
    const hasPair = (ary: [number, number][], p: [number, number]) =>
      !!ary.find((val: [number, number]) => val[0] === p[0] && val[1] === p[1]);
    // remove dups
    const pairs: [number, number][] = [];
    boundaryPairs.forEach(pair => {
      if (pair[0] >= pair[1]) throw new Error('sequence index 1 must be < index 2');
      if (!hasPair(pairs, pair)) {
        pairs.push(pair);
      }
    });
    const datapoints = this._keys.flatMap(key => pairs.flatMap(pair => {
      const datapoints = this._datapoints.get(key)!.slice(pair[0], pair[1]);
      if (datapoints.length < 2) throw new Error('sequences must have at least 2 points');
      return datapoints;
    }));
    return new ParaAPISequenceGroup(datapoints, pairs, this);
  }

  /** Dim the series. */
  dim() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.dimSeries(key);
    });
  }

  /** Clear any series dimming. */
  clearDimming() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.clearSeriesDimming(key);
    });
  }

  // isLowlighted(): boolean {
  //   return this._api.paraChart.paraState.isSeriesLowlighted(this._key);
  // }

  /** Highlight the series. */
  highlight() {
    this.clearDimming();
    this._api.paraChart.paraState.dimOtherSeries(...this._keys);
  }

  /** Clear any highlight. */
  clearHighlight() {
    this._api.paraChart.paraState.clearAllSeriesDimming();
  }

  /** Deprecated alias for `highlight()` */
  lowlightOthers() {
    this.highlight();
  }

  /** Hide the series. */
  hide() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.hideSeries(key);
    });
  }

  /** Unhide the series. */
  unhide() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.unhideSeries(key);
    });
  }

  // isHidden(): boolean {
  //   return this._api.paraChart.paraState.isSeriesHidden(this._key);
  // }

  /** Hide all other series. */
  hideOthers() {
    this._api.paraChart.paraState.hideOtherSeries(...this._keys);
  }

  /** Play the sonification riff for the series. */
  playRiff() {
    this._keys.forEach(key => {
      this._api.chartInfo.playRiff(this._datapoints.get(key)!);
    });
  }
}

/**
 * Perform operations on one or more ParaChart datapoints.
 */
export class ParaAPIPointGroup {
  constructor(protected _datapoints: Datapoint[], protected _apiSeriesGroup: ParaAPISeriesGroup) {

  }

  /** Visit the datapoint(s). */
  visit() {
    this._apiSeriesGroup.api.paraChart.paraState.visit(this._datapoints);
  }

  /** Select the datapoint(s). */
  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  /** Highlight the datapoint(s). */
  highlight() {
    // this._apiSeriesGroup.api.clearAllDatapointHighlights();
    // this._apiSeriesGroup.api.clearAllSequenceHighlights();
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.highlightDatapoint(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

  /** Clear any datapoint highlights. */
  clearHighlight() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.clearDatapointHighlight(
        datapoint.seriesKey, datapoint.datapointIndex);
      const id = this._apiSeriesGroup.api.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)?.id ?? '';
      this._apiSeriesGroup.api.paraChart.paraState.removePopup(id);
      this._apiSeriesGroup.api.paraChart.paraState.removeCrosshair(id);
    }
    );
  }

  /** Play the sonification for the datapoint(s). */
  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  /** Annotate the datapoint(s). */
  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.annotatePoint(
        datapoint.seriesKey, datapoint.datapointIndex, text);
    });
  }

  /** Clip the datapoint(s). */
  clipTo() {
    // XXX not sure clipping to multiple points makes sense
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraView.clipTo(
        datapoint.seriesKey, Number(datapoint.datapointIndex));
    });
  }

  /** Add crosshair and popup to the datapoint(s). */
  addCrosshair() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.addDatapointCrosshair(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

  /** Remove crosshair and popup from the datapoint(s). */
  removeCrosshair() {
    this._apiSeriesGroup.api.paraChart.paraState.clearPopups();
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.clearDatapointCrosshair(
        datapoint.seriesKey, datapoint.datapointIndex);
      //this._apiSeriesGroup.api.paraChart.paraState.removePopup(this._apiSeriesGroup.api.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)?.id ?? '')
    }
    );
    this._apiSeriesGroup.api.paraChart.paraView.requestUpdate();
  }

}

/**
 * Perform operations on one or more ParaChart sequences.
 */
export class ParaAPISequenceGroup {
  constructor(protected _datapoints: Datapoint[], protected _boundaryPairs: [number, number][], protected _apiSeriesGroup: ParaAPISeriesGroup) {

  }

  /** Visit the sequence(s). */
  visit() {
    this._apiSeriesGroup.api.paraChart.paraState.visit(this._datapoints);
  }

  /** Select the sequence(s). */
  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  /** Highlight the sequence(s). */
  highlight() {
    // this._apiSeriesGroup.api.clearAllDatapointHighlights();
    // this._apiSeriesGroup.api.clearAllSequenceHighlights();
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.paraState.highlightSequence(key, pair[0], pair[1]);
      });
    });
  }

  /** Clear any sequence highlights. */
  clearHighlight() {
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.paraState.clearSequenceHighlight(key, pair[0], pair[1]);
        this._apiSeriesGroup.api.paraChart.paraState.removePopup(makeSequenceId(key, pair[0], pair[1]))
      });
    });
  }

  /** Play the sonification for the sequence(s). */
  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  /** Annotate the sequence(s). */
  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.annotatePoint(
        datapoint.seriesKey, datapoint.datapointIndex, text);
    });
  }
}