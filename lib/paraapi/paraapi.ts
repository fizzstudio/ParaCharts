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

import { type Datapoint } from '@fizz/paramodel';

import { type BaseChartInfo } from '../chart_types';
import { type ParaChart } from '../parachart/parachart';
import { Direction, makeSequenceId, Setting, SettingsManager } from '../state';
import { ActionArgumentMap, AvailableActions } from '../state/action_map';

type Actions = { [Property in keyof AvailableActions]: ((args?: ActionArgumentMap) => void | Promise<void>) };

/**
 * Perform various operations on a ParaChart.
 */
export class ParaAPI {
  protected _actions: Actions;
  protected _standardActions: Actions;
  protected _narrativeActions: Actions;

  constructor(protected _paraChart: ParaChart) {
    const paraState = _paraChart.paraState;
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
        paraState.updateSettings(draft => {
          draft.sonification.isSoniEnabled = !draft.sonification.isSoniEnabled;
          const endisable = draft.sonification.isSoniEnabled ? 'enable' : 'disable';
          paraState.announce(`Sonification ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'Sonification', null);
        });
      },
      toggleTrendNavigationMode() {
        paraState.updateSettings(draft => {
          draft.type.line.isTrendNavigationModeEnabled = !draft.type.line.isTrendNavigationModeEnabled;
          const endisable = draft.type.line.isTrendNavigationModeEnabled ? 'enable' : 'disable';
          paraState.announce(`Trend navigation ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'TrendNavigation', null);
        });
      },
      toggleAnnouncementMode() {
        if (paraState.settings.ui.isAnnouncementEnabled) {
          paraState.announce('Announcements disabled');
          paraState.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
          _paraChart.postNotice('disableAnnouncements', null);
        } else {
          paraState.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          paraState.announce('Announcements enabled');
          _paraChart.postNotice('enableAnnouncements', null);
        }
      },
      toggleVoicingMode() {
        paraState.updateSettings(draft => {
          draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
          const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'Voicing', null);
        });
      },
      toggleDarkMode() {
        paraState.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          const endisable = draft.color.isDarkModeEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'DarkMode', null);
          paraState.announce(`Dark mode ${endisable + 'd'}`);
        });
      },
      toggleLowVisionMode() {
        paraState.updateSettings(draft => {
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
        paraState.announce(`Version ${__APP_VERSION__}; commit ${__COMMIT_HASH__}`);
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
        //paraView.startNarrativeHighlightMode();
        self._actions = self._narrativeActions;
        paraState.updateSettings(draft => {
          draft.ui.isNarrativeHighlightEnabled = true; //!draft.ui.isNarrativeHighlightEnabled;
          //const endisable = draft.ui.isNarrativeHighlightEnabled ? 'enable' : 'disable';
          _paraChart.postNotice('enableNarrativeHighlightMode', null);
        });
      },
      playPauseMedia() {

      },
      reset() {
        paraState.clearSelected();
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
      paraState.clearAllDatapointHighlights();
      paraState.clearAllSequenceHighlights();
      paraState.clearAllSeriesLowlights();
      paraView.endNarrativeHighlightMode();
      self._actions = this._standardActions;
      if (paraState.settings.ui.isNarrativeHighlightEnabled) {
        paraState.updateSettings(draft => {
          draft.ui.isNarrativeHighlightEnabled = false;
        });
      } else {
        paraState.updateSettings(draft => {
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

  setManifest(manifestUrl: string) {
    this._paraChart.setAttribute('manifest', manifestUrl);
  }

  // protected _labelToKey(seriesLabel: string): string {
  //   const series = this._paraChart.paraState.model!.series.find(s => s.label === seriesLabel);
  //   if (!series) throw new Error(`no series with label '${seriesLabel}'`);
  //   return series.key;
  // }

  // getSeries(seriesLabel: string): ParaAPISeries {
  //   return this.getAllSeries(seriesLabel)[0];
  // }

  getSeries(...seriesLabelsOrKeys: string[]): ParaAPISeriesGroup {
    // remove dups
    const labelsOrKeys = Array.from(new Set(seriesLabelsOrKeys));
    return new ParaAPISeriesGroup(labelsOrKeys, this);
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
    this._paraChart.paraState.updateSettings(draft => {
      SettingsManager.set(settingPath, value, draft);
    });
  }

  highlightRange(startPortion: number, endPortion: number) {
    this._paraChart.paraState.highlightRange(startPortion, endPortion);
  }

  clearRangeHighlight(startPortion: number, endPortion: number) {
    this._paraChart.paraState.clearRangeHighlight(startPortion, endPortion);
  }

  clearAllRangeHighlights() {
    this._paraChart.paraState.clearAllRangeHighlights();
  }

  clearAllDatapointHighlights() {
    this._paraChart.paraState.clearAllDatapointHighlights();
  }

  clearAllSequenceHighlights() {
    this._paraChart.paraState.clearAllSequenceHighlights();
  }

  clearAllSeriesLowlights() {
    this._paraChart.paraState.clearAllSeriesLowlights();
  }

  clearAllHighlights() {
    this._paraChart.paraState.clearAllHighlights();
  }

  hideAllSeries() {
    this._paraChart.paraState.hideAllSeries();
  }

  unhideAllSeries() {
    this._paraChart.paraState.unhideAllSeries();
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

  getPoint(index: number): ParaAPIPointGroup {
    return this.getPoints(index);
  }

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

  getSequence(start: number, end: number): ParaAPISequenceGroup {
    return this.getSequences([start, end]);
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
      this._api.paraChart.paraState.lowlightSeries(key);
    });
  }

  clearLowlight() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.clearSeriesLowlight(key);
    });
  }

  // isLowlighted(): boolean {
  //   return this._api.paraChart.paraState.isSeriesLowlighted(this._key);
  // }

  lowlightOthers() {
    this._api.paraChart.paraState.lowlightOtherSeries(...this._keys);
  }

  hide() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.hideSeries(key);
    });
  }

  unhide() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.unhideSeries(key);
    });
  }

  // isHidden(): boolean {
  //   return this._api.paraChart.paraState.isSeriesHidden(this._key);
  // }

  hideOthers() {
    this._api.paraChart.paraState.hideOtherSeries(...this._keys);
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
    this._apiSeriesGroup.api.paraChart.paraState.visit(this._datapoints);
  }

  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  highlight() {
    this._apiSeriesGroup.api.clearAllDatapointHighlights();
    this._apiSeriesGroup.api.clearAllSequenceHighlights();
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.highlightDatapoint(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

  clearHighlight() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.clearDatapointHighlight(
        datapoint.seriesKey, datapoint.datapointIndex);
      this._apiSeriesGroup.api.paraChart.paraState.removePopup(this._apiSeriesGroup.api.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)?.id ?? '')
    }
    );
  }

  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.annotatePoint(
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
    this._apiSeriesGroup.api.paraChart.paraState.visit(this._datapoints);
  }

  select(isExtend = false) {
    this.visit();
    this._apiSeriesGroup.api.chartInfo.selectCurrent(isExtend);
  }

  highlight() {
    this._apiSeriesGroup.api.clearAllDatapointHighlights();
    this._apiSeriesGroup.api.clearAllSequenceHighlights();
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.paraState.highlightSequence(key, pair[0], pair[1]);
      });
    });
  }

  clearHighlight() {
    this._apiSeriesGroup.keys.forEach(key => {
      this._boundaryPairs.forEach(pair => {
        this._apiSeriesGroup.api.paraChart.paraState.clearSequenceHighlight(key, pair[0], pair[1]);
        this._apiSeriesGroup.api.paraChart.paraState.removePopup(makeSequenceId(key, pair[0], pair[1]))
      });
    });
  }

  play() {
    this._apiSeriesGroup.api.chartInfo.playDatapoints(this._datapoints);
  }

  annotate(text: string) {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.annotatePoint(
        datapoint.seriesKey, datapoint.datapointIndex, text);
    });
  }

}