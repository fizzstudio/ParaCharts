/* ParaCharts: Pastry Charts
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

import { BaseChartInfo, RiffOrder } from './base_chart';
import { type ParaState, directions, type HorizDirection, datapointIdToCursor } from '../state';
import { type ParaView } from '../paraview';
import { queryMessages, describeSelections, getDatapointMinMax } from '../state/query_utils';
import { Datapoint } from '@fizz/paramodel';
import { formatXYDatapointX } from '@fizz/parasummary';
import { interpolate } from '@fizz/templum';
import {
  NavLayer, NavNode,
} from '../view/layers/data/navigation'
import { type PlaneDatapoint } from '@fizz/paramodel';

import { ChartType } from '@fizz/paramanifest';

export class VennDiagramInfo extends BaseChartInfo {

  constructor(type: ChartType, paraView: ParaView) {
    super(type, paraView);
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.add({
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
    this._paraState.settingControls.add({
      type: 'dropdown',
      key: `type.${this._type}.insideLabels.contents`,
      label: 'Inside labels:',
      options: { options: labelContents },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._paraState.settingControls.add({
      type: 'dropdown',
      key: `type.${this._type}.outsideLabels.contents`,
      label: 'Outside labels:',
      options: { options: labelContents },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._paraState.settingControls.add({
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
    const layer = new NavLayer(this._navMap!, 'circles');
    directions.forEach(dir => {
      this._navMap!.node('top', {})!.connect(dir, layer);
    });
    const nodes = this._paraState.model!.series[0].datapoints.map((datapoint, i) => {
    //const nodes = this._chartLandingView.children[0].children.map((datapointView, i) => {
      const node = new NavNode(layer, 'datapoint', {
        seriesKey: datapoint.seriesKey,
        index: datapoint.datapointIndex
      }, this._paraState);
      //node.addDatapointView(datapointView);
      node.connect('out', this._navMap!.root);
      node.connect('up', this._navMap!.root);
      return node;
    });
    nodes.slice(0, -1).forEach((node, i) => {
      node.connect('right', layer.get('datapoint', i + 1)!);
    });
    nodes.at(-1)!.connect('right', nodes[0]);
  }

  /*
  legend() {
  }
*/
  playDatapoints(datapoints: PlaneDatapoint[]): void {
    this._sonifier.playDatapoints(datapoints, { invert: true, durationVariable: true });
  }

  playDir(dir: HorizDirection): void {
  }

  playRiff(datapoints: Datapoint[], order?: RiffOrder) {
  }

  protected _sparkBrailleInfo() {
    return {
      data: (this._navMap!.cursor.isNodeType('datapoint')
        || this._navMap!.cursor.isNodeType('series'))
        ? JSON.stringify(this._paraState.model!.atKey(
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
      msgArray.push(`Displaying Chart: ${this._paraState.title}`);
    } else if (queriedNode.isNodeType('series')) {
      const seriesKey = queriedNode.options.seriesKey;
      const series = this._paraState.model!.atKey(seriesKey)!;
      const datapointCount = series.length;
      const seriesLabel = series.getLabel();
      msgArray.push(interpolate(
        queryMessages.seriesLabelLength,
        { seriesLabel, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {

      const selectedDatapoints = this._paraState.selectedDatapoints;
      //const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const datapoint = this._paraState.model!.atKey(seriesKey)!.datapoints[index];
      const datapointView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
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
          return this._paraView.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)!;
        }).toArray();
        const selectionMsgArray = describeSelections(
          datapointView,
          selectedDatapointViews
        );
        msgArray.push(...selectionMsgArray);
      } else {
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        const series = this._paraState.model!.atKey(seriesKey)!;
        msgArray.push(interpolate(
          queryMessages.percentageOfChart,
          {
            datapointX: formatXYDatapointX(datapoint, 'raw'),
            datapointIndex: queriedNode.options.index + 1,
            datapointCount: series.length
          }
        ));
        if (this._paraState.model!.multi) {
          msgArray.push(interpolate(
            queryMessages.percentageOfSeries,
            {
              seriesLabel: series.getLabel(),
              datapointX: formatXYDatapointX(datapoint, 'raw'),
              datapointIndex: queriedNode.options.index + 1,
              datapointCount: series.length
            }
          ));
        }
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
