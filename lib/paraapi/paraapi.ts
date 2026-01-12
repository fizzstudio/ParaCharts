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
  protected _actions: Actions;
  protected _standardActions: Actions;
  protected _narrativeActions: Actions;

  constructor(protected _paraChart: ParaChart) {
    const store = _paraChart.store;
    const paraView = _paraChart.paraView;

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
          _paraChart.postNotice(endisable + 'Sonification', null);
        });
      },
      toggleTrendNavigationMode() {
        store.updateSettings(draft => {
          draft.type.line.isTrendNavigationModeEnabled = !draft.type.line.isTrendNavigationModeEnabled;
          const endisable = draft.type.line.isTrendNavigationModeEnabled ? 'enable' : 'disable';
          store.announce(`Trend navigation ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'TrendNavigation', null);
        });
      },
      toggleAnnouncementMode() {
        if (store.settings.ui.isAnnouncementEnabled) {
          store.announce('Announcements disabled');
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
          _paraChart.postNotice('disableAnnouncements', null);
        } else {
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          store.announce('Announcements enabled');
          _paraChart.postNotice('enableAnnouncements', null);
        }
      },
      toggleVoicingMode() {
        store.updateSettings(draft => {
          draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
          const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'Voicing', null);
        });
      },
      toggleDarkMode() {
        store.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          const endisable = draft.color.isDarkModeEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'DarkMode', null);
          store.announce(`Dark mode ${endisable + 'd'}`);
        });
      },
      toggleLowVisionMode() {
        store.updateSettings(draft => {
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
        paraView.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        paraView.ariaLiveRegion.replay();
      },
      addAnnotation() {
        _paraChart.controlPanel.annotationPanel.addAnnotation();
      },
      toggleNarrativeHighlightMode() {
        paraView.startNarrativeHighlightMode();
        self._actions = self._narrativeActions;
        store.updateSettings(draft => {
          draft.ui.isNarrativeHighlightEnabled = true; //!draft.ui.isNarrativeHighlightEnabled;
          //const endisable = draft.ui.isNarrativeHighlightEnabled ? 'enable' : 'disable';
          _paraChart.postNotice('enableNarrativeHighlightMode', null);
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
    const voicing = paraView.ariaLiveRegion.voicing;

    this._narrativeActions.move = async (args: ActionArgumentMap) => {
      paraView.paraChart.captionBox.highlightSpan(args.direction === 'right' || args.direction === 'down');
    };
    this._narrativeActions.goFirst = () => { };
    this._narrativeActions.goLast = () => { };
    this._narrativeActions.repeatLastAnnouncement = () => { };
    this._narrativeActions.toggleNarrativeHighlightMode = () => {
      _paraChart.captionBox.clearSpanHighlights();
      store.clearAllHighlights();
      store.clearAllSequenceHighlights();
      store.clearAllSeriesLowlights();
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

  get actions(): Actions {
    return this._actions;
  }

  doAction(action: keyof AvailableActions, args?: ActionArgumentMap) {
    this._actions[action](args);
  }

  // protected _labelToKey(seriesLabel: string): string {
  //   const series = this._paraChart.store.model!.series.find(s => s.label === seriesLabel);
  //   if (!series) throw new Error(`no series with label '${seriesLabel}'`);
  //   return series.key;
  // }

  // getSeries(seriesLabel: string): ParaAPISeries {
  //   return this.getAllSeries(seriesLabel)[0];
  // }

  getSeries(...seriesLabels: string[]): ParaAPISeriesGroup {
    // remove dups
    const labels = Array.from(new Set(seriesLabels));
    return new ParaAPISeriesGroup(labels, this);
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

  clearAllHighlights() {
    this._paraChart.store.clearAllHighlights();
  }

  clearAllSequenceHighlights() {
    this._paraChart.store.clearAllSequenceHighlights();
  }

  clearAllSeriesLowlights() {
    this._paraChart.store.clearAllSeriesLowlights();
  }

  hideAllSeries() {
    this._paraChart.store.hideAllSeries();
  }

  unhideAllSeries() {
    this._paraChart.store.unhideAllSeries();
  }

  enableNarrativeActions() {
    this._actions = this._narrativeActions;
  }

  enableStandardActions() {
    this._actions = this._standardActions;
  }
}

/**
 * Perform operations on one or more ParaChart series.
 */
export class ParaAPISeriesGroup {
  protected _datapoints: Map<string, Datapoint[]>;
  protected _keys: string[];

  constructor(protected _labels: string[], protected _api: ParaAPI) {
    const allSeries = _labels.map(label => {
      const series = _api.paraChart.store.model!.atLabel(label);
      if (!series) throw new Error(`no series with label '${label}'`);
      return series;
    });
    this._keys = allSeries.map(series => series.key);
    this._datapoints = new Map();
    allSeries.forEach(series => {
      this._datapoints.set(series.key, [...series.datapoints]);
    });
  }

  get labels(): string[] {
    return this._labels;
  }

  get keys(): string[] {
    return this._keys;
  }

  get api(): ParaAPI {
    return this._api;
  }

  // getPoint(index: number): ParaAPIPoint {
  //   return this.getPoints(index)[0];
  // }

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

  lowlight() {
    this._keys.forEach(key => {
      this._api.paraChart.store.lowlightSeries(key);
    });
  }

  clearLowlight() {
    this._keys.forEach(key => {
      this._api.paraChart.store.clearSeriesLowlight(key);
    });
  }

  // isLowlighted(): boolean {
  //   return this._api.paraChart.store.isSeriesLowlighted(this._key);
  // }

  lowlightOthers() {
    this._api.paraChart.store.lowlightOtherSeries(...this._keys);
  }

  hide() {
    this._keys.forEach(key => {
      this._api.paraChart.store.hideSeries(key);
    });
  }

  unhide() {
    this._keys.forEach(key => {
      this._api.paraChart.store.unhideSeries(key);
    });
  }

  // isHidden(): boolean {
  //   return this._api.paraChart.store.isSeriesHidden(this._key);
  // }

  hideOthers() {
    this._api.paraChart.store.hideOtherSeries(...this._keys);
  }

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

  visit() {
    this._apiSeriesGroup.api.paraChart.store.visit(this._datapoints);
  }

  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  highlight() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.store.highlight(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

  clearHighlight() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.store.clearHighlight(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.store.annotatePoint(
        datapoint.seriesKey, datapoint.datapointIndex, text);
    });
  }

  clipTo() {
    // XXX not sure clipping to multiple points makes sense
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraView.clipTo(
        datapoint.seriesKey, Number(datapoint.datapointIndex));
    });
  }

}

/**
 * Perform operations on one or more ParaChart sequences.
 */
export class ParaAPISequenceGroup {
  constructor(protected _datapoints: Datapoint[], protected _boundaryPairs: [number, number][], protected _apiSeriesGroup: ParaAPISeriesGroup) {

  }

  visit() {
    this._apiSeriesGroup.api.paraChart.store.visit(this._datapoints);
  }

  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  highlight() {
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.store.highlightSequence(key, pair[0], pair[1]);
      });
    });
  }

  clearHighlight() {
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.store.clearSequenceHighlight(key, pair[0], pair[1]);
      });
    });
  }

  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.store.annotatePoint(
        datapoint.seriesKey, datapoint.datapointIndex, text);
    });
  }

}