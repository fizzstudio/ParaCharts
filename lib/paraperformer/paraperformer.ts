/* ParaCharts: ParaPerformer
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
import { Direction } from '../store';

/**
 * Perform various operations on a ParaChart.
 */
export class ParaPerformer {
  protected _allSeries: ParaPerformerSeries[];

  constructor(protected _paraChart: ParaChart) {
    this._allSeries = _paraChart.store.model!.seriesKeys.map(key => new ParaPerformerSeries(key, this));
  }

  get paraChart(): ParaChart {
    return this._paraChart;
  }

  get chartInfo(): BaseChartInfo {
    return this._paraChart.paraView.documentView!.chartInfo;
  }

  get allSeries(): readonly ParaPerformerSeries[] {
    return this._allSeries;
  }

  getSeries(seriesKey: string): ParaPerformerSeries {
    const ret = this._allSeries.find(pps => pps.key === seriesKey);
    if (!ret) throw new Error(`no series with key '${seriesKey}'`);
    return ret;
  }

  sendKey(keyId: string) {
    this._paraChart.command('key', [keyId]);
  }

  move(dir: Direction) {
    this.chartInfo.clearPlay();
    this.chartInfo.move(dir);
  }

  goFirst() {
    this.chartInfo.navFirst();
  }

  goLast() {
    this.chartInfo.navLast();
  }

  goMinimum() {
    this.chartInfo.goSeriesMinMax(true);
  }

  goMaximum() {
    this.chartInfo.goSeriesMinMax(false);
  }

  goTotalMinimum() {
    this.chartInfo.goChartMinMax(true);
  }

  goTotalMaximum() {
    this.chartInfo.goChartMinMax(false);
  }

  select() {
    this.chartInfo.selectCurrent(false);
  }

  extendSelection() {
    this.chartInfo.selectCurrent(true);
  }

  clearSelection() {
    this.chartInfo.clearDatapointSelection();
  }

  playRight() {
    this.chartInfo.playDir('right');
  }

  playLeft() {
    this.chartInfo.playDir('left');
  }

  stopPlay() {
    this.chartInfo.clearPlay();
  }

  queryData() {
    this.chartInfo.queryData();
  }

  toggleSonificationMode() {
    this._paraChart.store.updateSettings(draft => {
      draft.sonification.isSoniEnabled = !draft.sonification.isSoniEnabled;
      const endisable = draft.sonification.isSoniEnabled ? 'enable' : 'disable';
      this._paraChart.store.announce(`Sonification ${endisable + 'd'}`);
      this._paraChart.paraView.documentView!.postNotice(endisable + 'Sonification', null);
    });
  }

  toggleAnnouncementMode() {
    if (this._paraChart.store.settings.ui.isAnnouncementEnabled) {
      this._paraChart.store.announce('Announcements disabled');
      this._paraChart.store.updateSettings(draft => {
        draft.ui.isAnnouncementEnabled = false;
      });
      this._paraChart.paraView.documentView!.postNotice('disableAnnouncements', null);
    } else {
      this._paraChart.store.updateSettings(draft => {
        draft.ui.isAnnouncementEnabled = true;
      });
      this._paraChart.store.announce('Announcements enabled');
      this._paraChart.paraView.documentView!.postNotice('enableAnnouncements', null);
    }
  }

  toggleVoicingMode() {
    this._paraChart.store.updateSettings(draft => {
      draft.ui.isVoicingEnabled = !draft.ui.isVoicingEnabled;
      const endisable = draft.ui.isVoicingEnabled ? 'enable' : 'disable';
      this._paraChart.paraView.documentView!.postNotice(endisable + 'Voicing', null);
    });
  }

  toggleDarkMode() {
    this._paraChart.store.updateSettings(draft => {
      draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
      const endisable = draft.color.isDarkModeEnabled ? 'enable' : 'disable';
      this._paraChart.paraView.documentView!.postNotice(endisable + 'DarkMode', null);
      this._paraChart.store.announce(`Dark mode ${endisable + 'd'}`);
    });
  }

  toggleLowVisionMode() {
    this._paraChart.store.updateSettings(draft => {
      if (draft.ui.isLowVisionModeEnabled) {
        // Allow the exit from fullscreen to disable LV mode
        draft.ui.isFullscreenEnabled = false;
        this._paraChart.paraView.documentView!.postNotice('disableLowVisionMode', null);
      } else {
        draft.ui.isLowVisionModeEnabled = true;
        this._paraChart.paraView.documentView!.postNotice('enableLowVisionMode', null);
      }
    });
  }

  openHelp() {
    this._paraChart.controlPanel.showHelpDialog();
  }

  announceVersionInfo() {
    this._paraChart.store.announce(`Version ${__APP_VERSION__}; commit ${__COMMIT_HASH__}`);
  }

  jumpToChordLanding() {
    this.chartInfo.navToChordLanding();
  }

  shutUp() {
    this._paraChart.ariaLiveRegion.voicing.shutUp();
  }

  repeatLastAnnouncement() {
    this._paraChart.ariaLiveRegion.replay();
  }

  addAnnotation() {
    this._paraChart.store.addAnnotation();
  }

  toggleNarrativeHighlightMode() {
    this._paraChart.paraView.startNarrativeHighlightMode();
    this._paraChart.store.updateSettings(draft => {
      draft.ui.isNarrativeHighlightEnabled = !draft.ui.isNarrativeHighlightEnabled;
      const endisable = draft.ui.isNarrativeHighlightEnabled ? 'enable' : 'disable';
      this._paraChart.paraView.documentView!.postNotice(endisable + 'NarrativeHighlightMode', null);
    });
  }

  playPauseMedia() {

  }

  reset() {
    this._paraChart.store.clearSelected();
    this.chartInfo.navMap!.root.goTo('top', {});
    this._paraChart.paraView.createDocumentView();
  }
}

/**
 * Perform operations on a ParaChart series.
 */
export class ParaPerformerSeries {
  protected _allPoints: ParaPerformerPoint[];
  protected _datapoints: Datapoint[];

  constructor(protected _key: string, protected _performer: ParaPerformer) {
    this._datapoints = [..._performer.paraChart.store.model!.atKey(_key)!.datapoints];
    this._allPoints = this._datapoints.map(dp => new ParaPerformerPoint(dp, this));
  }

  get key(): string {
    return this._key;
  }

  get performer(): ParaPerformer {
    return this._performer;
  }

  get allPoints(): readonly ParaPerformerPoint[] {
    return this._allPoints;
  }

  getPoint(index: number): ParaPerformerPoint {
    return this._allPoints[index];
  }

  lowlight() {
    this._performer.paraChart.store.lowlightSeries(this._key);
  }

  clearLowlight() {
    this._performer.paraChart.store.clearSeriesLowlight(this._key);
  }

  isLowlighted(): boolean {
    return this._performer.paraChart.store.isSeriesLowlighted(this._key);
  }

  lowlightOthers() {
    this._performer.paraChart.store.lowlightOtherSeries(this._key);
  }

  playRiff() {
    this._performer.chartInfo.playRiff(this._datapoints);
  }
}

/**
 * Perform operations on a ParaChart datapoint.
 */
export class ParaPerformerPoint {
  constructor(protected _datapoint: Datapoint, protected _performerSeries: ParaPerformerSeries) {

  }

  click() {
    this._performerSeries.performer.paraChart.command(
      'click', [this._performerSeries.key, this._datapoint.datapointIndex]);
  }

  highlight() {

  }

  clearHighlight() {

  }

  play() {
    this._performerSeries.performer.chartInfo.playDatapoints([this._datapoint]);
  }

  annotate(text: string) {
    this._performerSeries.performer.paraChart.store.annotatePoint(
      this._performerSeries.key, this._datapoint.datapointIndex, text);
  }
}