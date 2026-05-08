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

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
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
    const nodes = this._paraState.model!.series.map((series, i) => {
      const node = new NavNode(layer, 'datapoint', {
        seriesKey: series.key,
        index: 0
      }, this._paraState);
      node.connect('out', this._navMap!.root);
      node.connect('up', this._navMap!.root);

      // Create a per-circle sub-layer with "only" and "intersection" regions
      const circleLayer = new NavLayer(this._navMap!, `circle-${series.key}`);
      const onlyNode = new NavNode(circleLayer, 'venn-part', {
        seriesKey: series.key,
        part: 'only'
      }, this._paraState);
      const intersectionNode = new NavNode(circleLayer, 'venn-part', {
        seriesKey: series.key,
        part: 'intersection'
      }, this._paraState);
      // left/right between the two parts (with wrap-around)
      onlyNode.connect('right', intersectionNode);        // also sets intersectionNode.left = onlyNode
      intersectionNode.connect('right', onlyNode, false); // wrap: right from intersection → only
      onlyNode.connect('left', intersectionNode, false);  // wrap: left from only → intersection
      // up/out from a part returns to the circles layer
      onlyNode.connect('up', layer, false);
      onlyNode.connect('out', layer, false);
      intersectionNode.connect('up', layer, false);
      intersectionNode.connect('out', layer, false);
      // down from circle node enters its sub-layer
      node.connect('down', circleLayer, false);

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
  async navRunDidEnd(cursor: NavNode, quiet = false) {
    if (cursor.isNodeType('venn-part')) {
      if (!quiet) {
        this._paraState.announce([this._describeVennPart(cursor.options.seriesKey, cursor.options.part)]);
      }
    } else {
      await super.navRunDidEnd(cursor, quiet);
    }
  }

  private _describeVennPart(seriesKey: string, part: 'only' | 'intersection'): string {
    const allSeries = this._paraState.model!.series;
    const seriesLabel = this._paraState.model!.atKey(seriesKey)!.getLabel();
    const itemMap = new Map<string, { inThisSeries: boolean; inOther: boolean }>();
    for (const s of allSeries) {
      for (const dp of s.datapoints) {
        const item = String(dp.facetValue('item') ?? '');
        if (!itemMap.has(item)) {
          itemMap.set(item, { inThisSeries: false, inOther: false });
        }
        const entry = itemMap.get(item)!;
        if (s.key === seriesKey && dp.facetValue('membership') === 'included') {
          entry.inThisSeries = true;
        }
        if (s.key !== seriesKey && dp.facetValue('membership') === 'included') {
          entry.inOther = true;
        }
      }
    }
    if (part === 'only') {
      const items = [...itemMap.entries()]
        .filter(([, e]) => e.inThisSeries && !e.inOther)
        .map(([item]) => item);
      return `${seriesLabel} only: ${items.join(', ')}`;
    } else {
      const items = [...itemMap.entries()]
        .filter(([, e]) => e.inThisSeries && e.inOther)
        .map(([item]) => item);
      return `Intersection: ${items.join(', ')}`;
    }
  }

  playDatapoints(datapoints: PlaneDatapoint[]): Promise<void> {
    return this._sonifier.playDatapoints(datapoints, { invert: true, durationVariable: true });
  }

  playDir(dir: HorizDirection): void {
  }

  playRiff(datapoints: Datapoint[], order?: RiffOrder): Promise<void> {
    return Promise.resolve();
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
    } else if (queriedNode.isNodeType('venn-part')) {
      msgArray.push(this._describeVennPart(queriedNode.options.seriesKey, queriedNode.options.part));
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
