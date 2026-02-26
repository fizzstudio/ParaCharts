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

import { ORIENTATION_SENTENCES, PASTRY_ORIENTATION_SENTENCES, type BaseChartInfo } from '../chart_types';
import { type ParaChart } from '../parachart/parachart';
import { Direction, makeSequenceId, Setting, SettingsManager } from '../state';
import { ActionArgumentMap, AvailableActions } from '../state/action_map';
import explainers from '../explainers';
import type { JIM } from '@fizz/jimerator';

type Actions = { [Property in keyof AvailableActions]: ((args?: ActionArgumentMap) => void | Promise<void>) };

/**
 * Perform various operations on a ParaChart.
 */
export class ParaAPI {
  protected _actions: Actions;
  protected _standardActions: Actions;
  protected _narrativeActions: Actions;

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
        paraView.paraState.updateSettings(draft => {
          draft.sonification.isSoniEnabled = !draft.sonification.isSoniEnabled;
          const endisable = draft.sonification.isSoniEnabled ? 'enable' : 'disable';
          paraView.paraState.announce(`Sonification ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'Sonification', null);
        });
      },
      /** Toggle trend navigation mode. */
      toggleTrendNavigationMode() {
        paraView.paraState.updateSettings(draft => {
          draft.type.line.isTrendNavigationModeEnabled = !draft.type.line.isTrendNavigationModeEnabled;
          const endisable = draft.type.line.isTrendNavigationModeEnabled ? 'enable' : 'disable';
          paraView.paraState.announce(`Trend navigation ${endisable + 'd'}`);
          _paraChart.postNotice(endisable + 'TrendNavigation', null);
        });
      },
      /** Toggle screen reader announcements. */
      toggleAnnouncementMode() {
        if (paraView.paraState.settings.ui.isAnnouncementEnabled) {
          paraView.paraState.announce('Announcements disabled');
          paraView.paraState.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
          _paraChart.postNotice('disableAnnouncements', null);
        } else {
          paraView.paraState.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          paraView.paraState.announce('Announcements enabled');
          _paraChart.postNotice('enableAnnouncements', null);
        }
      },
      /** Toggle self-voicing mode. */
      toggleVoicingMode() {
        paraView.paraState.updateSettings(draft => {
          draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
          const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'Voicing', null);
        });
      },
      /** Toggle dark mode. */
      toggleDarkMode() {
        paraView.paraState.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          const endisable = draft.color.isDarkModeEnabled ? 'enable' : 'disable';
          _paraChart.postNotice(endisable + 'DarkMode', null);
          paraView.paraState.announce(`Dark mode ${endisable + 'd'}`);
        });
      },
      /** Toggle low-vision mode */
      toggleLowVisionMode() {
        paraView.paraState.updateSettings(draft => {
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
            _paraChart.runLoader(
              JSON.stringify(explainers[type]!.manifest),
              'content',
              false,
              explainers[type]!.summary,
              false // don't reset settings
            ).then(() => {
              _paraChart.paraState.updateSettings(draft => {
                draft.chart.padding = '32 120';
              }, true);
              _paraChart.styleManager.update();
              paraView.createDocumentView();
            });
          } else {
            paraView.createDocumentView();
            _paraChart.captionBox.setCaption();
          }
        } else {
          // Close the explainer
          _paraChart.globalState.enableParaState(_paraChart.globalState.paraStates[1]);
          paraView.createDocumentView();
          _paraChart.captionBox.setCaption();
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
      toggleNarrativeHighlightMode() {
        paraView.startNarrativeHighlightMode();
        self._actions = self._narrativeActions;
        // paraView.paraState.updateSettings(draft => {
        //   draft.ui.isNarrativeHighlightEnabled = true; //!draft.ui.isNarrativeHighlightEnabled;
        //   //const endisable = draft.ui.isNarrativeHighlightEnabled ? 'enable' : 'disable';
        //   _paraChart.postNotice('enableNarrativeHighlightMode', null);
        // });
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

    this._narrativeActions = Object.create(this._actions);
    const voicing = paraView.ariaLiveRegion.voicing;

    this._narrativeActions.move = async (args: ActionArgumentMap) => {
      paraView.paraChart.captionBox.highlightSpan(args.direction === 'right' || args.direction === 'down');
    };
    this._narrativeActions.goFirst = () => { };
    this._narrativeActions.goLast = () => { };
    this._narrativeActions.repeatLastAnnouncement = () => { };
    this._narrativeActions.toggleNarrativeHighlightMode = () => {
      paraView.endNarrativeHighlightMode();
      self._actions = this._standardActions;
    };
    this._narrativeActions.playPauseMedia = () => {
      voicing.togglePaused();
    };
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

  /** Get the chart JIM. */
  getJIM(): JIM | undefined {
    return this.paraChart.paraState.jimerator?.jim
  }

  /** Download the chart in SVG format. */
  downloadSVG() {
    this._paraChart.paraView.downloadSVG();
  }

  /** Download the chart in PNG format. */
  downloadPNG() {
    this._paraChart.paraView.downloadPNG();
  }

  /** Set a setting. */
  setSetting(settingPath: string, value: Setting) {
    this._paraChart.paraState.updateSettings(draft => {
      SettingsManager.set(settingPath, value, draft);
    });
  }

  /** Highlight the chart title. */
  highlightTitle() {
    this._paraChart.paraState.isTitleHighlighted = true;
  }

  /** Clear any chart title highlight. */
  clearTitleHighlight() {
    this._paraChart.paraState.isTitleHighlighted = false;
  }

  /** Highlight the chart horizontal axis. */
  highlightHorizontalAxis() {
    this._paraChart.paraState.isHorizontalAxisHighlighted = true;
  }

  /** Clear any chart horizontal axis highlight. */
  clearHorizontalAxisHighlight() {
    this._paraChart.paraState.isHorizontalAxisHighlighted = false;
  }

  /** Highlight the chart vertical axis. */
  highlightVerticalAxis() {
    this._paraChart.paraState.isVerticalAxisHighlighted = true;
  }

  /** Clear any chart vertical axis highlight. */
  clearVerticalAxisHighlight() {
    this._paraChart.paraState.isVerticalAxisHighlighted = false;
  }

  /** Highlight the chart east legend. */
  highlightEastLegend() {
    this._paraChart.paraState.isEastLegendHighlighted = true;
  }

  /** Clear any chart east legend highlight. */
  clearEastLegendHighlight() {
    this._paraChart.paraState.isEastLegendHighlighted = false;
  }

  /** Highlight the chart west legend. */
  highlightWestLegend() {
    this._paraChart.paraState.isWestLegendHighlighted = true;
  }

  /** Clear any chart west legend highlight. */
  clearWestLegendHighlight() {
    this._paraChart.paraState.isWestLegendHighlighted = false;
  }

  /** Highlight the chart north legend. */
  highlightNorthLegend() {
    this._paraChart.paraState.isNorthLegendHighlighted = true;
  }

  /** Clear any chart north legend highlight. */
  clearNorthLegendHighlight() {
    this._paraChart.paraState.isNorthLegendHighlighted = false;
  }

  /** Highlight the chart south legend. */
  highlightSouthLegend() {
    this._paraChart.paraState.isSouthLegendHighlighted = true;
  }

  /** Clear any chart south legend highlight. */
  clearSouthLegendHighlight() {
    this._paraChart.paraState.isSouthLegendHighlighted = false;
  }

  /** Highlight a horizontal range of the chart. */
  highlightRange(startPortion: number, endPortion: number) {
    this._paraChart.paraState.highlightRange(startPortion, endPortion);
  }

  /** Clear a chart horizontal range highlight. */
  clearRangeHighlight(startPortion: number, endPortion: number) {
    this._paraChart.paraState.clearRangeHighlight(startPortion, endPortion);
  }

  /** Highlight an intersection between series. */
  highlightIntersection(index: number) {
    this._paraChart.paraState.highlightIntersection(index);
  }

  /** Clear any series intersection highlight. */
  clearIntersectionHighlight(index: number) {
    this._paraChart.paraState.clearIntersectionHighlight(index);
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

  /** Clear all series lowlights. */
  clearAllSeriesLowlights() {
    this._paraChart.paraState.clearAllSeriesLowlights();
  }

  /** Clear all series intersection highlights. */
  clearAllIntersectionHighlights() {
    this._paraChart.paraState.clearAllIntersectionHighlights();
  }

  /** Clear all chart highlights. */
  clearAllHighlights() {
    this._paraChart.paraState.clearAllHighlights();
  }

  /** Hide all chart series. */
  hideAllSeries() {
    this._paraChart.paraState.hideAllSeries();
  }

  /** Unhide all chart series. */
  unhideAllSeries() {
    this._paraChart.paraState.unhideAllSeries();
  }

  /** Enable the hotkey actions for tour guide mode. */
  enableNarrativeActions() {
    this._actions = this._narrativeActions;
  }

  /** Enable the standard hotkey actions. */
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

  /** Lowlight the series. */
  lowlight() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.lowlightSeries(key);
    });
  }

  /** Clear any series lowlights. */
  clearLowlight() {
    this._keys.forEach(key => {
      this._api.paraChart.paraState.clearSeriesLowlight(key);
    });
  }

  // isLowlighted(): boolean {
  //   return this._api.paraChart.paraState.isSeriesLowlighted(this._key);
  // }

  /** Lowlight all other series. */
  lowlightOthers() {
    this._api.paraChart.paraState.lowlightOtherSeries(...this._keys);
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
    this._apiSeriesGroup.api.clearAllDatapointHighlights();
    this._apiSeriesGroup.api.clearAllSequenceHighlights();
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
      this._apiSeriesGroup.api.paraChart.paraState.removePopup(this._apiSeriesGroup.api.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)?.id ?? '')
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
  
  addCrosshair() {
    this._datapoints.forEach(datapoint => {
      this._apiSeriesGroup.api.paraChart.paraState.addDatapointCrosshair(
        datapoint.seriesKey, datapoint.datapointIndex);
    });
  }

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
    this._apiSeriesGroup.api.clearAllDatapointHighlights();
    this._apiSeriesGroup.api.clearAllSequenceHighlights();
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