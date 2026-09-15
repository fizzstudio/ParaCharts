/* ParaCharts: Candlestick Chart Info
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

import { getLogger } from '@fizz/logger';
import { interpolate } from '@fizz/templum';
import { formatXYDatapoint } from '@fizz/parasummary';
import { type ChartType } from '@fizz/chartsignal-internal';
import { enumerate, PlaneDatapoint, PlaneModel } from '@fizz/paramodel';
import { PointChartInfo } from './point_chart';
import { datapointIdToCursor, type ParaState, queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../state';
import { DataSymbols } from '../view/symbol';
import { ConfigSetting } from '../config/config_types';
import { CandlestickNavNodeOptions, NavMap, type NavNode } from '../view/layers';
import { LegendItem } from '../view/legend';
import { populateNavMap } from '../navigation/nav_map_builder';

/**
 * Business logic for candlestick charts.
 * @public
 */
export class CandlestickChartInfo extends PointChartInfo {

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
    this.log = getLogger('CandlestickChartInfo');
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.insert('type.line.lineWidth', {
      max: this._paraState.config.type.line.lineWidthMax
    });
    this._paraState.settingControls.insert('type.candlestick.isHollow');
  }

  get isIntertick(): boolean {
    return true;
  }

/*  protected _populateNavMap() {
    const top = this._navMap!.top.cursor!;
    const candlesticksLayer = this._navMap!.newLayer('candlestick');
    top.connectIn(candlesticksLayer);

    // Sort by value of first datapoint from greatest to least
    const sortedSeries = this.seriesInNavOrder();
    let prevCandlestickNode: NavNode | null = null;
    sortedSeries[0].datapoints.forEach((_datapoint, i) => {
      const candlestickNode = candlesticksLayer.newNode(
        'candlestick',
        {
          index: i
        });
      if (prevCandlestickNode) {
        candlestickNode.connect('left', prevCandlestickNode);
        candlestickNode.connect('up', prevCandlestickNode);
      }
      prevCandlestickNode = candlestickNode;
      const detailsLayer = this._navMap!.newLayer('details');
      candlestickNode.connectIn(detailsLayer);
      let prevNode: NavNode | null = null;
      ['open', 'high', 'low', 'close'].forEach((seriesKey, j) => {
        const node = detailsLayer.newNode(
          'datapoint',
          {
            seriesKey,
            index: i
          });
          if (prevNode) {
            node.connect('down', prevNode);
          }
          prevNode = node;
      });
    });
  } */

  pointerClick(datasetIndex: number, seriesKey: string, datapointIndex: number, isShift: boolean) {
    // Set quiet = true so that the visit announcement doesn't overwrite
    // the selection announcement
    this._navMap!.goTo('candlestick', {
      index: datapointIndex
    }, true);
    this.selectCurrent(isShift);
  }

  goChartMinMax(isMin: boolean) {
    if (this._navMap!.cursor!.isNodeType('chord')) {
      const averages = this._openCloseAverage();
      const matchTarget = isMin ? Math.min(...averages) : Math.max(...averages);
      this._navMap!.goTo('chord', {
        index: averages.indexOf(matchTarget)
      });
      this._paraState.postNotice('goChartMinMax', { isMin, options: this._navMap!.cursor.options });
    } else {
      super.goChartMinMax(isMin);
    }
  }

  protected _composeVisitAnnouncement(): string {
    const index = (this._navMap!.cursor!.options as CandlestickNavNodeOptions).index;
    const x = this.model!.series[0].datapoints[index].facetBox('x')!.raw;
    return `candlestick ${x}`;
  }

  async navRunDidEnd(cursor: NavNode, quiet?: boolean) {
    await super.navRunDidEnd(cursor, quiet);
    if (cursor.isNodeType('candlestick')) {
      if (this._paraState.config.sonification.isSonificationEnabled) {
        if (this._paraState.config.sonification.isArpeggiateChords) {
          await this._playCurrentRiff(this._chordRiffOrder(), true);
        } else {
          const datapoints = cursor.datapoints.map(dp =>
            this.model!.atKeyAndIndex(dp.seriesKey, dp.datapointIndex)!);
          await this.playDatapoints(datapoints as PlaneDatapoint[]);
        }
      }
      if (!quiet) {
        this._paraState.announce(this._composeVisitAnnouncement());
      }
      this._paraState.sparkBrailleInfo = this._sparkBrailleInfo();
    }
  }

  protected _openCloseAverage(): number[] {
    const open = this._paraState.model!.atKey('open')!;
    const close = this._paraState.model!.atKey('close')!;
    return open.datapoints.map((dp, i) =>
        (dp.facetValueAsNumber('y')! + close.datapoints[i].facetValueAsNumber('y')!)/2);
  }

  // all visited datapoint views: e.options!.visited
  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor!;

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

  protected _sparkBrailleData(): string {
    return this._navMap!.cursor!.isNodeType('chord')
      ? this._openCloseAverage().join(' ')
      : super._sparkBrailleData();
  }
}
