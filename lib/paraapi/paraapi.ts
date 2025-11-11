/* ParaCharts: ParaAPI
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

import { type Datapoint } from '@fizz/paramodel';

import { type BaseChartInfo } from '../chart_types';
import { type ParaChart } from '../parachart/parachart';
import { Direction, Setting, SettingsManager } from '../store';
import { ActionArgumentMap, AvailableActions } from '../store/action_map';

type Actions = { [Property in keyof AvailableActions]: ((args?: ActionArgumentMap) => void | Promise<void>) };

/**
 * Perform various operations on a ParaChart.
 */
export class ParaAPI {

  protected _allSeries: ParaAPISeries[];
  protected _actions: Actions;
  protected _standardActions: Actions;
  protected _narrativeActions: Actions;

  constructor(protected _paraChart: ParaChart) {
    const store = _paraChart.store;
    const paraView = _paraChart.paraView;
    this._allSeries = store.model!.seriesKeys.map(key => new ParaAPISeries(key, this));

    // we use a function here bc the chartInfo object may get replaced
    const chartInfo = () => _paraChart.paraView.documentView!.chartInfo;
    const self = this;
    this._standardActions = {
      move(args: ActionArgumentMap) {
        chartInfo().clearPlay();
        chartInfo().move(args.direction as Direction);
      },
      goFirst() {
        chartInfo().navFirst();
      },
      goLast() {
        chartInfo().navLast();
      },
      goMinimum() {
        chartInfo().goSeriesMinMax(true);
      },
      goMaximum() {
        chartInfo().goSeriesMinMax(false);
      },
      goTotalMinimum() {
        chartInfo().goChartMinMax(true);
      },
      goTotalMaximum() {
        chartInfo().goChartMinMax(false);
      },
      select() {
        chartInfo().selectCurrent(false);
      },
      extendSelection() {
        chartInfo().selectCurrent(true);
      },
      clearSelection() {
        chartInfo().clearDatapointSelection();
      },
      playRight() {
        chartInfo().playDir('right');
      },
      playLeft() {
        chartInfo().playDir('left');
      },
      stopPlay() {
        chartInfo().clearPlay();
      },
      queryData() {
        chartInfo().queryData();
      },
      toggleSonificationMode() {
        store.updateSettings(draft => {
          draft.sonification.isSoniEnabled = !draft.sonification.isSoniEnabled;
          const endisable = draft.sonification.isSoniEnabled ? 'enable' : 'disable';
          store.announce(`Sonification ${endisable + 'd'}`);
          paraView.documentView!.postNotice(endisable + 'Sonification', null);
        });
      },
      toggleAnnouncementMode() {
        if (store.settings.ui.isAnnouncementEnabled) {
          store.announce('Announcements disabled');
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
          paraView.documentView!.postNotice('disableAnnouncements', null);
        } else {
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          store.announce('Announcements enabled');
          paraView.documentView!.postNotice('enableAnnouncements', null);
        }
      },
      toggleVoicingMode() {
        store.updateSettings(draft => {
          draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
          const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
          paraView.documentView!.postNotice(endisable + 'Voicing', null);
        });
      },
      toggleDarkMode() {
        store.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          const endisable = draft.color.isDarkModeEnabled ? 'enable' : 'disable';
          paraView.documentView!.postNotice(endisable + 'DarkMode', null);
          store.announce(`Dark mode ${endisable + 'd'}`);
        });
      },
      toggleLowVisionMode() {
        store.updateSettings(draft => {
          if (draft.ui.isLowVisionModeEnabled) {
            // Allow the exit from fullscreen to disable LV mode
            draft.ui.isFullscreenEnabled = false;
            paraView.documentView!.postNotice('disableLowVisionMode', null);
          } else {
            draft.ui.isLowVisionModeEnabled = true;
            paraView.documentView!.postNotice('enableLowVisionMode', null);
          }
        });
      },
      openHelp() {
        _paraChart.controlPanel.showHelpDialog();
      },
      announceVersionInfo() {
        store.announce(`Version ${__APP_VERSION__}; commit ${__COMMIT_HASH__}`);
      },
      jumpToChordLanding() {
        chartInfo().navToChordLanding();
      },
      shutUp() {
        _paraChart.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        _paraChart.ariaLiveRegion.replay();
      },
      addAnnotation() {
        store.addAnnotation();
      },
      toggleNarrativeHighlightMode() {
        paraView.startNarrativeHighlightMode();
        self._actions = self._narrativeActions;
        store.updateSettings(draft => {
          draft.ui.isNarrativeHighlightEnabled = true; //!draft.ui.isNarrativeHighlightEnabled;
          //const endisable = draft.ui.isNarrativeHighlightEnabled ? 'enable' : 'disable';
          paraView.documentView!.postNotice('enableNarrativeHighlightMode', null);
        });
      },
      playPauseMedia() {

      },
      reset() {
        store.clearSelected();
        chartInfo().navMap!.root.goTo('top', {});
        paraView.createDocumentView();
      }
    };
    this._actions = this._standardActions;

    this._narrativeActions = Object.create(this._actions);
    let prevIdx = 0;
    const voicing = paraView.paraChart.ariaLiveRegion.voicing;
    const getMsg = (idx: number) => {
        const div = document.createElement('div');
        div.innerHTML = store.announcement.html;
        return (div.children[idx] as HTMLElement).innerText;
    };
    const highlightSpan = (idxDelta: number) => {
      const spans = store.paraChart.captionBox.getSpans();
      let idx = prevIdx;
      store.clearHighlight();
      store.clearAllSeriesLowlights();
      spans.forEach(span => {
        span.classList.remove('highlight');
      });
      if (!voicing.manualOverride) {
        idx = voicing.highlightIndex!;
        voicing.manualOverride = true;
      }
      idx = Math.min(store.announcement.highlights.length - 1, Math.max(0, idx + idxDelta));

      prevIdx = idx;
      const msg = getMsg(idx);
      const highlight = store.announcement.highlights[idx];
      const prevHighlight = store.announcement.highlights[Math.max(0, idx - 1)];
      let prevNavcode = prevHighlight.navcode ?? '';
      const span = spans[idx];

      span.classList.add('highlight');
      voicing.shutUp();
      voicing.speakText(msg);
      prevNavcode = voicing.doHighlight(highlight, prevNavcode);
      if (prevNavcode) {
        chartInfo().didRemoveHighlight(prevNavcode);
        prevNavcode = '';
      }
    };

    this._narrativeActions.move = async (args: ActionArgumentMap) => {
      highlightSpan(args.direction === 'right' || args.direction === 'down' ? 1 : -1);
    };
    this._narrativeActions.goFirst = () => {};
    this._narrativeActions.goLast = () => {};
    this._narrativeActions.repeatLastAnnouncement = () => {};
    this._narrativeActions.toggleNarrativeHighlightMode = () => {
      if (voicing.manualOverride) {
        voicing.manualOverride = false;
        (async () => {
          store.announce(await chartInfo().summarizer.getChartSummary());
        })();
      } else {
        paraView.endNarrativeHighlightMode();
        self._actions = this._standardActions;
        if (store.settings.ui.isNarrativeHighlightEnabled) {
          store.updateSettings(draft => {
            draft.ui.isNarrativeHighlightEnabled = false;
          });
        } else {
          store.updateSettings(draft => {
            draft.ui.isNarrativeHighlightEnabled = true;
          });
        }
      }
    };
    this._narrativeActions.playPauseMedia = () => {
      voicing.togglePaused();
    };
  }

  get paraChart(): ParaChart {
    return this._paraChart;
  }

  get chartInfo(): BaseChartInfo {
    return this._paraChart.paraView.documentView!.chartInfo;
  }

  get allSeries(): readonly ParaAPISeries[] {
    return this._allSeries;
  }

  get actions(): Actions {
    return this._actions;
  }

  doAction(action: keyof AvailableActions, args?: ActionArgumentMap) {
    this._actions[action](args);
  }

  getSeries(seriesKey: string): ParaAPISeries {
    return this.getAllSeries(seriesKey)[0];
  }

  getAllSeries(...seriesKeys: string[]): ParaAPISeries[] {
    // remove dups
    const keys = Array.from(new Set(seriesKeys));
    const series: ParaAPISeries[] = [];
    for (const key of keys) {
      const s = this._allSeries.find(pps => pps.key === key);
      if (!s) throw new Error(`no series with key '${key}'`);
      series.push(s);
    }
    return series;
  }

  // sendKey(keyId: string) {
  //   this._paraChart.command('key', [keyId]);
  // }

  serializeChart() {
    return this._paraChart.paraView.serialize();
  }

  downloadSVG() {
    this._paraChart.paraView.downloadSVG();
  }

  downloadPNG() {
    this._paraChart.paraView.downloadPNG();
  }

  setSetting(settingPath: string, value: Setting) {
    this._paraChart.store.updateSettings(draft => {
      SettingsManager.set(settingPath, value, draft);
    });
  }

  clearAllSeriesLowlights() {
    this._paraChart.store.clearAllSeriesLowlights();
  }

  enableNarrativeActions() {
    this._actions = this._narrativeActions;
  }

  enableStandardActions() {
    this._actions = this._standardActions;
  }
}

/**
 * Perform operations on a ParaChart series.
 */
export class ParaAPISeries {
  protected _allPoints: ParaAPIPoint[];
  protected _datapoints: Datapoint[];

  constructor(protected _key: string, protected _api: ParaAPI) {
    this._datapoints = [..._api.paraChart.store.model!.atKey(_key)!.datapoints];
    this._allPoints = this._datapoints.map(dp => new ParaAPIPoint(dp, this));
  }

  get key(): string {
    return this._key;
  }

  get api(): ParaAPI {
    return this._api;
  }

  get allPoints(): readonly ParaAPIPoint[] {
    return this._allPoints;
  }

  getPoint(index: number): ParaAPIPoint {
    return this.getPoints(index)[0];
  }

  getPoints(...indices: number[]): ParaAPIPoint[] {
    // remove dups
    const idxs = Array.from(new Set(indices));
    const points: ParaAPIPoint[] = [];
    for (const idx of idxs) {
      const p = this._allPoints[idx];
      if (!p) throw new Error(`invalid index '${idx}'`);
      points.push(p);
    }
    return points;
  }

  lowlight() {
    this._api.paraChart.store.lowlightSeries(this._key);
  }

  clearLowlight() {
    this._api.paraChart.store.clearSeriesLowlight(this._key);
  }

  isLowlighted(): boolean {
    return this._api.paraChart.store.isSeriesLowlighted(this._key);
  }

  lowlightOthers() {
    this._api.paraChart.store.lowlightOtherSeries(this._key);
  }

  playRiff() {
    this._api.chartInfo.playRiff(this._datapoints);
  }
}

/**
 * Perform operations on a ParaChart datapoint.
 */
export class ParaAPIPoint {
  constructor(protected _datapoint: Datapoint, protected _apiSeries: ParaAPISeries) {

  }

  visit() {
    this._apiSeries.api.chartInfo.navMap!.goTo(this._apiSeries.api.chartInfo.navDatapointType, {
      seriesKey: this._datapoint.seriesKey,
      index: this._datapoint.datapointIndex
    });
  }

  select(isExtend = false) {
    this.visit();
    this._apiSeries.api.chartInfo.selectCurrent(isExtend);
  }

  highlight() {

  }

  clearHighlight() {

  }

  play() {
    this._apiSeries.api.chartInfo.playDatapoints([this._datapoint]);
  }

  annotate(text: string) {
    this._apiSeries.api.paraChart.store.annotatePoint(
      this._apiSeries.key, this._datapoint.datapointIndex, text);
  }
}