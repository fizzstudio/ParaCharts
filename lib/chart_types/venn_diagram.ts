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

  queryData(): void {
    const node = this._navMap!.cursor;

    if (node.isNodeType('top')) {
      this._paraState.announce(['Venn diagram']);
      return;
    }

    if (node.isNodeType('datapoint')) {
      const i = node.options.index;
      const label = i === 0 ? 'A only'
        : i === 1 ? 'A and B'
          : 'B only';

      this._paraState.announce([label]);
    }
  }

  protected _sparkBrailleInfo() {
    return null;
  }
  
  protected _createNavMap() {
    super._createNavMap();

    const navMap = this._navMap!;
    const root = navMap.node('top', {})!;

    // One layer that represents “being inside the Venn”
    const layer = new NavLayer(navMap, 'regions');

    // Delegate all directions from top into the regions layer
    directions.forEach(dir => {
      root.connect(dir, layer);
    });

    // Create three region nodes
    const nodes = [
      new NavNode(layer, 'datapoint', { index: 0 }, this._paraState), // A only
      new NavNode(layer, 'datapoint', { index: 1 }, this._paraState), // A ∩ B
      new NavNode(layer, 'datapoint', { index: 2 }, this._paraState), // B only
    ];

    // Allow escape back to chart
    nodes.forEach(node => {
      node.connect('up', root);
      node.connect('out', root);
    });

    // Simple cyclic navigation
    nodes[0].connect('right', nodes[1]);
    nodes[1].connect('right', nodes[2]);
    nodes[2].connect('right', nodes[0]);

    nodes[0].connect('left', nodes[2]);
    nodes[2].connect('left', nodes[1]);
    nodes[1].connect('left', nodes[0]);
  }
}