/* ParaCharts: Line Chart Info
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

import { Logger, getLogger } from '../common/logger';
import { PointChartInfo } from './point_chart';
import { datapointIdToCursor, type ParaStore } from '../store';
import { type LineSettings, type DeepReadonly, type Setting } from '../store/settings_types';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../store/query_utils';

import { interpolate } from '@fizz/templum';

import { NavNode, type NavMap } from '../view/layers/data/navigation';
import { formatXYDatapoint } from '@fizz/parasummary';
import { type ChartType } from '@fizz/paramanifest';
import { Highlight } from '@fizz/parasummary';

/**
 * Business logic for line charts.
 * @public
 */
export class LineChartInfo extends PointChartInfo {
  protected _prevHighlightNavcode = '';
  protected _altNavMap!: NavMap;

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
    this.log = getLogger("LineChartInfo");
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    // XXX only do this if type === 'line'
    this._store.settingControls.add({
      type: 'textfield',
      key: 'type.line.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number',
        min: 1,
        max: this._store.settings.type.line.lineWidthMax as number
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'chart.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'chart.showPopups',
      label: 'Show popups',
      parentView: 'controlPanel.tabs.chart.popups',
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

  protected _canCreateSequenceNavNodes(): boolean {
    return !!this._navMap && Object.keys(this._store.seriesAnalyses).length === this._store.model!.seriesKeys.length
        && !!this._store.seriesAnalyses[this._store.model!.seriesKeys[0]];
  }

  protected _createNavMap() {
    super._createNavMap();
    // In AI mode, the following call will only do anything when the doc view
    // has been recreated (so the series analyses already exist)
    this._createSequenceNavNodes();
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

  noticePosted(key: string, value: any) {
    super.noticePosted(key, value);
    if (this._store.settings.ui.isNarrativeHighlightEnabled) {
      if (key === 'utteranceBoundary') {
        const highlight: Highlight = value;
        this._prevHighlightNavcode = this._doHighlight(highlight, this._prevHighlightNavcode);
      } else if (key === 'utteranceEnd') {
        // So that on the initial transition from auto-narration to manual
        // span navigation, we don't remove any highlights added in manual mode
        if (!this._store.paraChart.captionBox.highlightManualOverride) {
          this._store.clearHighlight();
          this._store.clearAllSeriesLowlights();
        }
        // this._highlightIndex = null;
        if (this._prevHighlightNavcode) {
          this.didRemoveHighlight(this._prevHighlightNavcode);
          this._prevHighlightNavcode = '';
        }
      }
    }
  }

  protected _doHighlight(highlight: Highlight, prevNavcode: string) {
    if (highlight.navcode) {
      if (highlight.navcode.startsWith('series')) {
        const segments = highlight.navcode.split(/-/);
        this._store.lowlightOtherSeries(...segments.slice(1));
      } else {
        this._store.clearHighlight();
        this._store.highlight(highlight.navcode);
        if (prevNavcode) {
          this.didRemoveHighlight(prevNavcode);
        }
        this.didAddHighlight(highlight.navcode);
      }
      prevNavcode = highlight.navcode;
    } else {
      this._store.clearHighlight();
      this._store.clearAllSeriesLowlights();
      if (prevNavcode) {
        this.didRemoveHighlight(prevNavcode);
        prevNavcode = '';
      }
    }
    return prevNavcode;
  }

  legend() {
    const model = this._store.model!;
    const seriesKeys = [...model.seriesKeys];
    if (this._store.settings.legend.itemOrder === 'alphabetical') {
      seriesKeys.sort();
    }
    return seriesKeys.map(key => ({
      label: model.atKey(key)!.getLabel(),
      seriesKey: key,
      color: this._store.seriesProperties!.properties(key).color
    }));
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
      /*
      if (e.options!.isChordMode) {
        // this.log.info('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // this.log.info('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      const seriesKey = queriedNode.options.seriesKey;
      const series = this._store.model!.atKey(seriesKey)!;
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
      const selectedDatapoints = this._store.selectedDatapoints;
      //const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const series = this._store.model!.atKey(seriesKey)!;
      const datapoint = series.datapoints[index];
      const seriesLabel = series.getLabel();
      // XXX yuck
      const datapointView = this._store.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
      msgArray.push(interpolate(
        queryMessages.datapointLabelLength,
        {
          seriesLabel,
          datapointXY: formatXYDatapoint(datapoint, 'raw'),
          datapointIndex: queriedNode.options.index + 1,
          datapointCount: this._store.model!.atKey(seriesKey)!.length
        }
      ));

      if (selectedDatapoints.size > 0) {
        // if there are selected datapoints, compare the current datapoint against each of those
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
        const datapointMsg = describeAdjacentDatapoints(this._store.model!, datapointView);
        msgArray.push(datapointMsg);
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
