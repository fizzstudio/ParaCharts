/* ParaCharts: Line Chart Info
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
import { PointChartInfo } from './point_chart';
import { datapointIdToCursor, type ParaState } from '../state';
import { type ParaView } from '../paraview';
import { type LineSettings, type DeepReadonly, type Setting } from '../state/settings_types';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../state/query_utils';

import { interpolate } from '@fizz/templum';

import { formatXYDatapoint } from '@fizz/parasummary';
import { type ChartType } from '@fizz/paramanifest';
import { Highlight } from '@fizz/parasummary';

/**
 * Business logic for line charts.
 * @public
 */
export class LineChartInfo extends PointChartInfo {

  constructor(type: ChartType, paraView: ParaView) {
    super(type, paraView);
    this.log = getLogger("LineChartInfo");
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    // XXX only do this if type === 'line'
    this._paraState.settingControls.add({
      type: 'textfield',
      key: 'type.line.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number',
        min: 1,
        max: this._paraState.settings.type.line.lineWidthMax as number
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._paraState.settingControls.add({
      type: 'checkbox',
      key: 'chart.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  get settings() {
    return super.settings as DeepReadonly<LineSettings>;
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.line.isTrendNavigationModeEnabled'].includes(path)) {
      [this._navMap, this._altNavMap] = [this._altNavMap, this._navMap!];
      this._navMap!.root.goTo('top', {});
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  async storeDidChange(key: string, value: any) {
    await super.storeDidChange(key, value);
    if (key === 'seriesAnalyses') {
      // This gets called each time a series analysis completes after a
      // new manifest is loaded in AI mode. The following call will only
      // do anything once analyses have been generated for all series.
      this._createSequenceNavNodes();
    }
  }

  protected _createNavMap() {
    super._createNavMap();
    // In AI mode, the following call will only do anything when the doc view
    // has been recreated (so the series analyses already exist)
    this._createSequenceNavNodes();
  }

  legend() {
    const model = this._paraState.model!;
    const seriesKeys = [...model.seriesKeys];
    if (this._paraState.settings.legend.itemOrder === 'alphabetical') {
      seriesKeys.sort();
    }
    return seriesKeys.map(key => ({
      label: model.atKey(key)!.getLabel(),
      seriesKey: key,
      color: this._paraState.seriesProperties!.properties(key).color
    }));
  }

  // TODO: localize this text output
  // focused view: e.options!.focus
  // all visited datapoint views: e.options!.visited
  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor;

    if (queriedNode.isNodeType('top')) {
      msgArray.push(`Displaying Chart: ${this._paraState.title}`);
    } else if (queriedNode.isNodeType('series')) {
      /*
      if (e.options!.isChordMode) {
        // this.log.info('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // this.log.info('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      const seriesKey = queriedNode.options.seriesKey;
      const series = this._paraState.model!.atKey(seriesKey)!;
      const datapointCount = series.length;
      const seriesLabel = series.getLabel();
      msgArray.push(interpolate(
        queryMessages.seriesLabelLength,
        { seriesLabel, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {
      /*
      if (e.options!.isChordMode) {
        // focused view: e.options!.focus
        // all visited datapoint views: e.options!.visited
        // const focusedDatapoint = e.targetView;
        // this.log.info('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // this.log.info('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      }
        */
      const selectedDatapoints = this._paraState.selectedDatapoints;
      //const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const series = this._paraState.model!.atKey(seriesKey)!;
      const datapoint = series.datapoints[index];
      const seriesLabel = series.getLabel();
      const datapointView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
      msgArray.push(interpolate(
        queryMessages.datapointLabelLength,
        {
          seriesLabel,
          datapointXY: formatXYDatapoint(datapoint, 'raw'),
          datapointIndex: queriedNode.options.index + 1,
          datapointCount: this._paraState.model!.atKey(seriesKey)!.length
        }
      ));

      if (selectedDatapoints.size > 0) {
        // if there are selected datapoints, compare the current datapoint against each of those
        const selectedDatapointViews = selectedDatapoints.values().map((id) => {
          const cursor = datapointIdToCursor(id);
          // XXX also yuck
          return this._paraView.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)!;
        }).toArray();
        const selectionMsgArray = describeSelections(
          datapointView,
          selectedDatapointViews
        );
        msgArray.push(...selectionMsgArray);
      } else {
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        const datapointMsg = describeAdjacentDatapoints(this._paraState.model!, datapointView);
        msgArray.push(datapointMsg);
      }

      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(
        this._paraState.model!,
        datapoint.facetValueAsNumber('y')!,
        seriesKey
      );
      msgArray.push(...minMaxMsgArray);
    }
    this._paraState.announce(msgArray);
  }

}
