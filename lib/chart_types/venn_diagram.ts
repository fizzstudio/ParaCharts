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
import { type ParaState, directions, type Direction, type HorizDirection, datapointIdToCursor } from '../state';
import { queryMessages, describeSelections, getDatapointMinMax } from '../state/query_utils';
import { Datapoint, type PlaneDatapoint } from '@fizz/paramodel';
import { formatXYDatapointX } from '@fizz/parasummary';
import { interpolate } from '@fizz/templum';
import {
  NavLayer, NavNode, type VennPartNavNodeOptions,
} from '../view/layers/data/navigation';

import { ChartType } from '@fizz/paramanifest';

export class VennDiagramInfo extends BaseChartInfo {

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
  }

  private _regionOptionsForSeries(seriesKey: string): VennPartNavNodeOptions[] {
    const seriesKeys = this._paraState.model!.series.map(series => series.key);
    const seriesIndex = seriesKeys.indexOf(seriesKey);
    if (seriesIndex === -1) {
      return [];
    }
    if (seriesKeys.length === 2) {
      return [
        { seriesKey, part: 'only' },
        {
          seriesKey,
          part: 'pair',
          otherSeriesKey: seriesKeys[(seriesIndex + 1) % seriesKeys.length]!,
        },
      ];
    }
    if (seriesKeys.length === 3) {
      const nextSeriesKey = seriesKeys[(seriesIndex + 1) % seriesKeys.length]!;
      const prevSeriesKey = seriesKeys[(seriesIndex + seriesKeys.length - 1) % seriesKeys.length]!;
      return [
        { seriesKey, part: 'only' },
        { seriesKey, part: 'pair', otherSeriesKey: nextSeriesKey },
        { seriesKey, part: 'triple' },
        { seriesKey, part: 'pair', otherSeriesKey: prevSeriesKey },
      ];
    }
    return [];
  }

  private _matchesRegion(entry: Set<string>, region: VennPartNavNodeOptions): boolean {
    if (!entry.has(region.seriesKey)) {
      return false;
    }
    if (region.part === 'only') {
      return entry.size === 1;
    }
    if (region.part === 'triple') {
      return entry.size === this._paraState.model!.series.length;
    }
    if (!region.otherSeriesKey || !entry.has(region.otherSeriesKey)) {
      return false;
    }
    return entry.size === 2 || this._paraState.model!.series.length === 2;
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

      const regionOptions = this._regionOptionsForSeries(series.key);
      if (regionOptions.length) {
        const circleLayer = new NavLayer(this._navMap!, `circle-${series.key}`);
        const regionNodes = regionOptions.map(options => new NavNode(circleLayer, 'venn-part', options, this._paraState));
        regionNodes.forEach((regionNode, regionIndex) => {
          const nextRegion = regionNodes[(regionIndex + 1) % regionNodes.length]!;
          const prevRegion = regionNodes[(regionIndex + regionNodes.length - 1) % regionNodes.length]!;
          regionNode.connect('right', nextRegion, false);
          regionNode.connect('left', prevRegion, false);
          regionNode.connect('up', layer, false);
          regionNode.connect('out', layer, false);
        });
        node.connect('down', circleLayer, false);
      }

      return node;
    });
    nodes.slice(0, -1).forEach((node, i) => {
      node.connect('right', layer.get('datapoint', i + 1)!);
    });
    nodes.at(-1)!.connect('right', nodes[0]);
  }

  async move(dir: Direction) {
    const dirStr = dir as string;
    if ((dirStr === 'shiftleft' || dirStr === 'shiftright')
        && this._navMap!.cursor.isNodeType('venn-part')) {
      const allParts = this._paraState.model!.series.flatMap(series => this._regionOptionsForSeries(series.key));
      const cursor = this._navMap!.cursor;
      const currentIndex = allParts.findIndex(
        p => p.seriesKey === cursor.options.seriesKey
          && p.part === cursor.options.part
          && p.otherSeriesKey === cursor.options.otherSeriesKey
      );
      if (currentIndex !== -1) {
        const delta = dirStr === 'shiftright' ? 1 : -1;
        const nextIndex = (currentIndex + delta + allParts.length) % allParts.length;
        this._navMap!.goTo('venn-part', allParts[nextIndex]);
        this._paraState.postNotice('move', { dir, options: this._navMap!.cursor.options });
        return;
      }
    }
    await super.move(dir);
  }

  async navRunDidEnd(cursor: NavNode, quiet = false) {
    if (cursor.isNodeType('venn-part')) {
      if (!quiet) {
        this._paraState.announce([
          this._describeVennPart(cursor.options.seriesKey, cursor.options.part, cursor.options.otherSeriesKey)
        ]);
      }
    } else {
      await super.navRunDidEnd(cursor, quiet);
    }
  }

  private _describeVennPart(seriesKey: string, part: 'only' | 'pair' | 'triple', otherSeriesKey?: string): string {
    const allSeries = this._paraState.model!.series;
    const seriesLabel = this._paraState.model!.atKey(seriesKey)!.getLabel();
    const itemMap = new Map<string, Set<string>>();
    for (const s of allSeries) {
      for (const dp of s.datapoints) {
        const item = String(dp.facetValue('item') ?? '');
        if (!itemMap.has(item)) {
          itemMap.set(item, new Set());
        }
        if (dp.facetValue('membership') === 'included') {
          itemMap.get(item)!.add(s.key);
        }
      }
    }
    const region: VennPartNavNodeOptions = { seriesKey, part, otherSeriesKey };
    const items = [...itemMap.entries()]
      .filter(([, includedSeries]) => this._matchesRegion(includedSeries, region))
      .map(([item]) => item);
    if (part === 'only') {
      return `${seriesLabel} only: ${items.join(', ')}`;
    }
    if (part === 'triple') {
      const allLabels = allSeries.map(series => series.getLabel()).join(', ');
      return `Intersection of ${allLabels}: ${items.join(', ')}`;
    }
    const otherLabel = otherSeriesKey ? this._paraState.model!.atKey(otherSeriesKey)!.getLabel() : 'other series';
    return `Intersection of ${seriesLabel} and ${otherLabel}: ${items.join(', ')}`;
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
            label: dp.facetValue('x') as string,
            value: dp.facetValueAsNumber('y')
          })))
        : '0',
      isProportional: true
    };
  }

  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor;

    if (queriedNode.isNodeType('top')) {
      msgArray.push(`Displaying Chart: ${this._paraState.title}`);
    } else if (queriedNode.isNodeType('venn-part')) {
      msgArray.push(
        this._describeVennPart(
          queriedNode.options.seriesKey,
          queriedNode.options.part,
          queriedNode.options.otherSeriesKey,
        )
      );
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
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const datapoint = this._paraState.model!.atKey(seriesKey)!.datapoints[index];
      const datapointView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
      if (selectedDatapoints.size) {
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
