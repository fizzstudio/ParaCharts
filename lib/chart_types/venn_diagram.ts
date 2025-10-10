/* ParaCharts: Venn Diagrams
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

import { BaseChartInfo } from './base_chart';
import { type ParaStore, directions, type HorizDirection, datapointIdToCursor } from '../store';
import { queryMessages, describeSelections, getDatapointMinMax } from '../store/query_utils';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { interpolate } from '@fizz/templum';
import {
  NavLayer, NavNode,
} from '../view/layers/data/navigation'
import { type PlaneDatapoint } from '@fizz/paramodel';

import { ChartType } from '@fizz/paramanifest';

export type ArcType = 'circle' | 'semicircle';

export class VennDiagramInfo extends BaseChartInfo {

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._store.settingControls.add({
      type: 'slider',
      key: `type.${this._type}.orientationAngleOffset`,
      label: 'Orientation',
      options: {
        min: 0,
        max: 360,
        step: 1,
        compact: true,
        width: '8rem'
      },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    const labelContents = ['', 'category', 'percentage:(value)'];
    this._store.settingControls.add({
      type: 'dropdown',
      key: `type.${this._type}.insideLabels.contents`,
      label: 'Inside labels:',
      options: { options: labelContents },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._store.settingControls.add({
      type: 'dropdown',
      key: `type.${this._type}.outsideLabels.contents`,
      label: 'Outside labels:',
      options: { options: labelContents },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._store.settingControls.add({
      type: 'textfield',
      key: `type.${this._type}.explode`,
      label: 'Explode',
      options: {
        inputType: 'text',
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  protected _createNavMap() {
    super._createNavMap();
  }

  legend() {
    const xs = this._store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('x')!, this._store.getFormatType('pieSliceLabel')));
    const ys = this._store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('y')!, this._store.getFormatType('pieSliceValue')));
    return xs.map((x, i) => ({
      label: `${x}: ${ys[i]}`,
      color: i,
      datapointIndex: i
    }));
  }

  protected _playDatapoints(datapoints: PlaneDatapoint[]): void {
    this._sonifier.playDatapoints(datapoints, {invert: true, durationVariable: true});
  }

  playDir(dir: HorizDirection): void {
  }

  protected _playRiff() {
  }

  protected _sparkBrailleInfo() {
    return {
      data: (this._navMap!.cursor.isNodeType('datapoint')
        || this._navMap!.cursor.isNodeType('series'))
        ? JSON.stringify(this._store.model!.atKey(
          this._navMap!.cursor.options.seriesKey)!.datapoints.map(dp => ({
            // XXX shouldn't assume x is string (or that we have an 'x' facet, for that matter)
            label: dp.facetValue('x') as string,
            value: dp.facetValueAsNumber('y')
          })))
        : '0',
      isProportional: true
    };
  }

  // TODO: localize this text output
  // focused view: e.options!.focus
  // all visited datapoint views: e.options!.visited
  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor;

    if (queriedNode.isNodeType('top')) {
      msgArray.push(`Displaying Chart: ${this._store.title}`);
    } else if (queriedNode.isNodeType('series')) {
      const seriesKey = queriedNode.options.seriesKey;
      const datapointCount = this._store.model!.atKey(seriesKey)!.length;
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {

      const selectedDatapoints = this._store.selectedDatapoints;
      //const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const datapoint = this._store.model!.atKey(seriesKey)!.datapoints[index];
      const datapointView = this._store.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
      /*
      msgArray.push(replace(
        queryMessages.datapointKeyLength,
        {
          seriesKey: targetView.seriesKey,
          datapointXY: `${targetView.series[visitedDatapoint.index].x.raw}, ${targetView.series[visitedDatapoint.index].y.raw}`,
          datapointIndex: targetView.index + 1,
          datapointCount: targetView.series.length
        }
      ));
      */
      if (selectedDatapoints.size) {
        // if there are selected datapoints, compare the current datapoint against each of those
        // const selectedDatapointViews = selectedDatapoints.map((cursor) => cursor.datapointView);
        const selectedDatapointViews = selectedDatapoints.values().map((id) => {
          const cursor = datapointIdToCursor(id);
          // XXX also yuck
          return this._store.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)!;
        }).toArray();
        const selectionMsgArray = describeSelections(
          datapointView,
          selectedDatapointViews
        );
        msgArray.push(...selectionMsgArray);
      } else {
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        msgArray.push(interpolate(
          queryMessages.percentageOfChart,
          {
            chartKey: seriesKey,
            datapointXY: formatXYDatapoint(datapoint, 'raw'),
            datapointIndex: queriedNode.options.index + 1,
            datapointCount: this._store.model!.atKey(seriesKey)!.length
          }
        ));
        if (this._store.model!.multi) {
          msgArray.push(interpolate(
            queryMessages.percentageOfSeries,
            {
              seriesKey,
              datapointXY: formatXYDatapoint(datapoint, 'raw'),
              datapointIndex: queriedNode.options.index + 1,
              datapointCount: this._store.model!.atKey(seriesKey)!.length
            }
          ));
        }
      }
      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(
        this._store.model!,
        datapoint.facetValueAsNumber('y')!,
        seriesKey
      );
      msgArray.push(...minMaxMsgArray);
    }
    this._store.announce(msgArray);
  }

}
