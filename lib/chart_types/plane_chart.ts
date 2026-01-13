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
import { DatapointNavNodeType, NavNode, NavNodeOptionsType, NavNodeType, type NavMap } from '../view/layers/data/navigation';
import { ParaStore } from '../store';
import { ParaView } from '../paraview';
import { type RiffOrder } from './base_chart';
import { type HorizDirection } from '../store';

import { ChartType } from '@fizz/paramanifest';
import { Datapoint, type PlaneDatapoint } from '@fizz/paramodel';
import { DocumentView } from '../view/document_view';
import { Bezier, loopParaviewRefresh } from '../common';

// Soni Constants
export const SONI_PLAY_SPEEDS = [1000, 250, 100, 50, 25];
export const SONI_RIFF_SPEEDS = [450, 300, 150, 100, 75];

/**
 * Abstract base class for business logic for charts drawn in a 2-D Cartesian coordinate system.
 */
export abstract class PlaneChartInfo extends BaseChartInfo {
  protected _altNavMap!: NavMap;
  protected _soniSequenceIndex = 0;
  protected _soniNoteIndex = 0;
  protected _soniSpeedRateIndex = 1;

  constructor(type: ChartType, paraView: ParaView) {
    super(type, paraView);
  }

  /**
   * Whether the chart's datapoints fall on a tick (default) or between them.
   */
  get isIntertick(): boolean {
    return false;
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
        this._navMap!.root, 'chord', { index: node.options.index }, this._store);
      // [node, ...node.allNodes('down', 'datapoint')].forEach(node => {
      //   chordNode.addDatapointView(node.at(0)!);
      // });
    });
    // Link chord landings
    this._navMap!.root.query('chord').slice(0, -1).forEach((node, i) => {
      node.connect('right', this._navMap!.root.get('chord', i + 1)!);
    });
  }

  protected _canCreateSequenceNavNodes(): boolean {
    return !!this._navMap && Object.keys(this._store.seriesAnalyses).length === this._store.model!.seriesKeys.length
      && !!this._store.seriesAnalyses[this._store.model!.seriesKeys[0]];
  }

  protected _createSequenceNavNodes() {
    if (!this._canCreateSequenceNavNodes()) return;
    const seriesSeqNodes: NavNode<'sequence'>[][] = [];
    this._altNavMap = this._navMap!.clone();
    this._altNavMap!.root.query('series').forEach(seriesNode => {
      if (seriesSeqNodes.length) {
        seriesNode.connect('left', seriesSeqNodes.at(-1)!.at(-1)!);
      }
      const analysis = this._store.seriesAnalyses[seriesNode.options.seriesKey]!;
      const datapointNodes = seriesNode.allNodes('right', 'datapoint');
      const seqNodes: NavNode<'sequence'>[] = [];
      analysis.sequences.forEach(seq => {
        const seqNode = new NavNode(seriesNode.layer, 'sequence', {
          seriesKey: seriesNode.options.seriesKey,
          start: seq.start,
          end: seq.end
        }, this._store);
        seqNodes.push(seqNode);
        // seriesNode.datapointViews.slice(seq.start, seq.end).forEach(view => {
        //   seqNode.addDatapointView(view);
        // });
      });
      seriesSeqNodes.push(seqNodes);
      seqNodes.slice(0, -1).forEach((seqNode, i) => {
        seqNode.connect('right', seqNodes[i + 1]);
      });
      // Replace series link to datapoints with link to sequences
      seriesNode.connect('right', seqNodes[0]);
      // Breaks first and last datapoint links with series landings
      datapointNodes[0].disconnect('left', false);
      datapointNodes.at(-1)!.disconnect('right');
      seqNodes.forEach(seqNode => {
        // Unless the first datapoint of the sequence already has an
        // 'out' link set (i.e., it's a boundary node), make a reciprocal
        // link to it
        seqNode.connect('in', datapointNodes[seqNode.options.start],
          !datapointNodes[seqNode.options.start].getLink('out'));
        for (let i = seqNode.options.start + 1; i < seqNode.options.end; i++) {
          // non-reciprocal 'out' links from remaining datapoints to sequence
          datapointNodes[i].connect('out', seqNode, false);
        }
        if (seqNode.peekNode('right', 1)) {
          // We aren't on the last sequence, so the final datapoint is a boundary point.
          // Make a non-reciprocal 'in' link to the next sequence
          datapointNodes[seqNode.options.end - 1].connect('in', seqNode.peekNode('right', 1)!, false);
        }
      });
    });
    // Make sequence node 'down' links
    seriesSeqNodes.slice(0, -1).forEach((seqNodes, i) => {
      seqNodes.forEach(node => {
        const nodeBelow = seriesSeqNodes[i + 1].find(otherNode =>
          otherNode.options.start <= node.options.start && otherNode.options.end > node.options.start)!;
        node.connect('down', nodeBelow, false);
      });
    });
    // Make sequence node 'up' links
    seriesSeqNodes.slice(1).forEach((seqNodes, i) => {
      seqNodes.forEach((node, j) => {
        const nodeAbove = seriesSeqNodes[i].find(otherNode =>
          otherNode.options.start <= node.options.start && otherNode.options.end > node.options.start)!;
        node.connect('up', nodeAbove, false);
      });
    });
  }

  playRiff(datapoints: Datapoint[], order?: RiffOrder, isChord?: boolean) {
    const datapointsClone = [...datapoints];
    datapointsClone.forEach(d => {
      const dpView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(d.seriesKey, d.datapointIndex)!;
      if (!isChord) {
        dpView.alwaysClip = true;
      }
      dpView.baseSymbolScale = 0;
    })
    for (let dpView of this._paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      if (datapointsClone.filter(dp => dp.seriesKey == dpView.seriesKey && dp.datapointIndex == dpView.index).length == 0) {
        dpView.alwaysClip = false;
        dpView.baseSymbolScale = 1;
      }
    }
    let paraview = this._paraView;
    paraview.documentView!.chartLayers.dataLayer.datapointViews.map(d => d.completeLayout())
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
      const length = datapoints.length;
      let start = -1;
      const linear = new Bezier(0, 0, 1, 1, 10);
      const step = (timestamp: number) => {
        if (start === -1) {
          start = timestamp;
        }
        const elapsed = timestamp - start;
        // We can't really disable the animation, but setting the reveal time to 0
        // will result in an imperceptibly short animation duration
        const revealTime = SONI_RIFF_SPEEDS.at(this._store.settings.sonification.riffSpeedIndex)! * length
        const t = Math.min(elapsed / revealTime, 1);
        const linearT = linear.eval(t)!;
        this._paraView.clipWidth = linearT;
        if (elapsed < revealTime) {
          requestAnimationFrame(step);
        } else {
          //this._animEnd();
        }
      };
      requestAnimationFrame(step);
      loopParaviewRefresh(paraview,
        paraview.store.settings.animation.popInAnimateRevealTimeMs
        + SONI_RIFF_SPEEDS.at(this._store.settings.sonification.riffSpeedIndex)! * length, 50);
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
    const length = datapoints.length;
    for (let dpView of this._paraView.documentView!.chartLayers.dataLayer.datapointViews) {
      dpView.alwaysClip = false;
      dpView.baseSymbolScale = 1;
      dpView.completeLayout();
    }
    loopParaviewRefresh(this._paraView,
      this._paraView.store.settings.animation.popInAnimateRevealTimeMs
      + SONI_RIFF_SPEEDS.at(this._store.settings.sonification.riffSpeedIndex)! * length, 50);
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
    return {
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
