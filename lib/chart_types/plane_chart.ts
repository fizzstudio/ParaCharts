/* ParaCharts: Plane Charts
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
import { DatapointNavNodeType, NavNode, NavNodeOptionsType, NavNodeType } from '../view/layers/data/navigation';
import { ParaStore } from '../store';
import { type RiffOrder } from './base_chart';
import { type HorizDirection } from '../store';

import { ChartType } from '@fizz/paramanifest';
import { Datapoint, type PlaneDatapoint } from '@fizz/paramodel';
import { DocumentView } from '../view/document_view';

// Soni Constants
export const SONI_PLAY_SPEEDS = [1000, 250, 100, 50, 25];
export const SONI_RIFF_SPEEDS = [450, 300, 150, 100, 75];

/**
 * Abstract base class for business logic for charts drawn in a 2-D Cartesian coordinate system.
 */
export abstract class PlaneChartInfo extends BaseChartInfo {
  protected _soniSequenceIndex = 0;
  protected _soniNoteIndex = 0;
  protected _soniSpeedRateIndex = 1;

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _createNavMap() {
    super._createNavMap();
    this._createPrimaryNavNodes();
    if (this._store.model!.seriesKeys.length > 1) {
      this._createVerticalNavLinks();
      this._createChordNavNodes();
    }
  }

  protected get _datapointNavNodeType(): DatapointNavNodeType {
    return 'datapoint';
  }

  protected _datapointNavNodeOptions(datapoint: Datapoint): NavNodeOptionsType<DatapointNavNodeType> {
    return {
      seriesKey: datapoint.seriesKey,
      index: datapoint.datapointIndex
    };
  }

  protected _createPrimaryNavNodes() {
    // Create series and datapoint nav nodes, and link them horizontally thusly:
    // - [SERIES-A]-[SERIES-A-POINT-0]- ... -[SERIES-A-POINT-(N-1)]-[SERIES-B]-[SERIES-B-POINT-0]- ...
    let left = this._navMap!.root.get('top')!;
    const depFacet = this._store.model!.dependentFacetKeys[0];
    // Sort by value of first datapoint from greatest to least
    const sortedSeries = this.seriesInNavOrder();
    sortedSeries.forEach((series, i) => {
      const seriesNode = new NavNode(this._navMap!.root, 'series', {
        seriesKey: series.key
      }, this._store);
      seriesNode.connect('left', left);
      left = seriesNode;
      //series.datapoints.forEach((_dp, j) => seriesNode.addDatapoint(series.key, j));
      series.datapoints.forEach((dp, j) => {
        const node = new NavNode(this._navMap!.root,
          this._datapointNavNodeType, this._datapointNavNodeOptions(dp),
          this._store);
        //node.addDatapoint(series.key, j);
        node.connect('left', left);
        left = node;
      });
    });
  }

  protected _createVerticalNavLinks() {
    // Create vertical links between series and datapoints
    this._store.model!.series.slice(0, -1).forEach((series, i) => {
      const seriesNode = this._navMap!.root.get('series', i)!;
      const nextSeriesNode = this._navMap!.root.get('series', i + 1)!;
      seriesNode.connect('down', nextSeriesNode);
      for (let j = 1; j <= series.datapoints.length; j++) {
        seriesNode.peekNode('right', j)!.connect(
          'down', nextSeriesNode.peekNode('right', j)!);
      }
    });
  }

  protected _createChordNavNodes() {
    // Create chord landings
    // NB: This will produce the nodes in insertion order
    this._navMap!.root.query(this._datapointNavNodeType, {
      seriesKey: this.seriesInNavOrder()[0].key
    }).forEach(node => {
      const chordNode = new NavNode(
        this._navMap!.root, 'chord', {index: node.options.index}, this._store);
      // [node, ...node.allNodes('down', 'datapoint')].forEach(node => {
      //   chordNode.addDatapointView(node.at(0)!);
      // });
    });
    // Link chord landings
    this._navMap!.root.query('chord').slice(0, -1).forEach((node, i) => {
      node.connect('right', this._navMap!.root.get('chord', i + 1)!);
    });
  }

  playRiff(datapoints: Datapoint[], order?: RiffOrder) {
    if (order === 'sorted') {
      datapoints.sort((a, b) => a.facetValueAsNumber('y')! - b.facetValueAsNumber('y')!);
    } else if (order === 'reversed') {
      datapoints.reverse();
    }
    if (datapoints.length) {
      if (this._soniRiffInterval!) {
        clearInterval(this._soniRiffInterval!);
      }
      this._soniSequenceIndex++;
      this._soniRiffInterval = setInterval(() => {
        const datapoint = datapoints.shift();
        if (!datapoint) {
          clearInterval(this._soniRiffInterval!);
        } else {
          this._sonifier.playDatapoints([datapoint as PlaneDatapoint]);
          this._soniNoteIndex++;
        }
      }, SONI_RIFF_SPEEDS.at(this._store.settings.sonification.riffSpeedIndex));
    }
  }

  playDatapoints(datapoints: PlaneDatapoint[]): void {
    this._sonifier.playDatapoints(datapoints);
  }

  playDir(dir: HorizDirection) {
    if (this._navMap!.cursor.type !== this._datapointNavNodeType) {
      return;
    }
    this.clearPlay();
    let cursor = this._navMap!.cursor;
    this._soniInterval = setInterval(() => {
      const next = cursor.peekNode(dir, 1);
      if (next && next.type === this._datapointNavNodeType) {
        this.playDatapoints([next.datapoints[0] as PlaneDatapoint]);
        cursor = next;
      } else {
        this.clearPlay();
      }
    }, SONI_PLAY_SPEEDS.at(this._soniSpeedRateIndex));
  }

  protected _sparkBrailleInfo() {
    return  {
      data: (this._navMap!.cursor.isNodeType(this._datapointNavNodeType)
        || this._navMap!.cursor.isNodeType('series')
        || this._navMap!.cursor.isNodeType('sequence'))
        ? this._store.model!.atKey(this._navMap!.cursor.options.seriesKey)!.datapoints.map(dp =>
          dp.facetValueAsNumber('y')!).join(' ')
        : '0',
      isBar: this._type === 'bar' || this._type === 'column'
    };
  }


}
