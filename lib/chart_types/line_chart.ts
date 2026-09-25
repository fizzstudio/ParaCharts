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

import { getLogger } from '@fizz/logger';
import { interpolate } from '@fizz/templum';
import { formatXYDatapoint } from '@fizz/parasummary';
import { type ChartType, enumerate, PlaneDatapoint, PlaneModel } from '@fizz/chartsignal-internal';
import { PointChartInfo } from './point_chart';
import { datapointIdToCursor, type ParaState, queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax, SettingsManager } from '../state';
import { NavMap, type NavNode } from '../view/layers';
import { DataSymbols } from '../view/symbol';
import { ConfigSetting, LegendConfig, PlaneDirection } from '../config/config_types';
import { AxisRangeInfo } from './plane_chart';
import { LegendItemsWithPosition } from '../view/legend';
import { populateNavMap } from '../navigation/nav_map_builder';

/**
 * Business logic for line charts.
 * @public
 */
export class LineChartInfo extends PointChartInfo {

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
    this.log = getLogger('LineChartInfo');
  }

  protected _addSettingControls(): void {
    if (!this._paraState.comboModel) {
      super._addSettingControls();
    }
    this._paraState.settingControls.insert('type.line.lineWidth', {
      max: this._paraState.config.type.line.lineWidthMax
    });
    this._paraState.settingControls.insert('chart.isDrawSymbols');
  }

  async settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): Promise<void> {
    if (path === 'sonification.isSonificationEnabled') {
      // Add or remove single-series series landings based on whether
      // soni is enabled
      const idx = this._navMap!.cursor!.index;
      if (!this.model!.multi) {
        this._createNavMap();
        this._populateNavMap();
      }
      if (!this._paraState.comboModel || this._paraState.currentDataset) {
        this._navMap!.goTo('datapoint', { seriesKey: this.model!.seriesKeys[0], index: idx }, true);
      }
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  noticePosted(key: string, value: any, count: number) {
    super.noticePosted(key, value, count);
    // if (key === 'seriesAnalyses') {
    //   this._createSequenceNavNodes();
    // }
  }

  get model() {
    return this._paraState.comboModel ?? this._paraState.model;
  }

  get seriesProperties() {
    return this._paraState.comboModel
      ? this._paraState.comboSeriesProperties
      : this._paraState.seriesProperties;
  }

  /**
   * Called by `computeAxisLabelTiers` to get the displayed range for a numeric y-axis.
   * @param facetKey - Facet key
   * @returns Displayed axis range as an Interval
   */
  protected _numericYAxisRange(facetKey: string): AxisRangeInfo {
    const range = super._numericYAxisRange(facetKey);
    return this._paraState.comboModel
      ? {
        interval: {
          start: Math.min(0, range.interval.start),
          end: range.interval.end
        },
        step: range.step
      }
      : range;
  }

  protected _onNavFail(dir: PlaneDirection, from: NavNode): void {
    if (this.model!.series.length < 2) return;
    // Wrap to next series landing
    if (dir === 'right' && from.isNodeType('datapoint')) {
      this.move('out');
      this._navMap!.currentLayer.cursorForward();
    } else {
      super._onNavFail(dir, from);
    }
  }

  protected _canCreateSequenceNavNodes(): boolean {
    return !!this._navMap && Object.keys(this._paraState.seriesAnalyses).length === this.model!.seriesKeys.length
      && !!this._paraState.seriesAnalyses[this.model!.seriesKeys[0]];
  }

  protected _shouldDrawLegend(): boolean {
    const config = SettingsManager.getGroupLinkForInstance<LegendConfig>(
      'legend', this._paraState.config, `legend-${0}`) ?? this._paraState.config.legend;
    const should = config.isDrawLegend &&
      (config.isAlwaysDrawLegend
        || (this.model!.multi
          && (!this._paraState.config.chart.hasDirectLabels || this._paraState.config.chart.hasLegendWithDirectLabels)));
    return should;
  }

  legend(): LegendItemsWithPosition[] {
    const model = this.model!;
    const config = SettingsManager.getGroupLinkForInstance<LegendConfig>(
      'legend', this._paraState.config, `legend-${0}`) ?? this._paraState.config.legend;
    const seriesKeys = enumerate([...model.seriesKeys]);
    const types = new DataSymbols().types;
    if (config.itemOrder === 'alphabetical') {
      seriesKeys.sort((a, b) => a[0].localeCompare(b[0]));
    }
    else if (config.itemOrder === 'reverseAlphabetical') {
      seriesKeys.sort((a, b) => -1 * a[0].localeCompare(b[0]));
    }
    else if (config.itemOrder === 'startingOrder') {
      const model = this.model as PlaneModel;
      const startChord = model.getChordAt(model.independentFacetKeys[0], (model.allPoints.at(0) as PlaneDatapoint).indepBox)!;
      seriesKeys.sort((a, b) =>
        startChord.find(point => point.seriesKey === b[0])!.facetValueAsNumber("y")!
        - startChord.find(point => point.seriesKey === a[0])!.facetValueAsNumber("y")!
      );
    }
    else if (config.itemOrder === 'endingOrder') {
      const model = this.model as PlaneModel;
      const endChord = model.getChordAt(model.independentFacetKeys[0], (model.allPoints.at(-1) as PlaneDatapoint).indepBox)!;
      seriesKeys.sort((a, b) =>
        endChord.find(point => point.seriesKey === b[0])!.facetValueAsNumber("y")!
        - endChord.find(point => point.seriesKey === a[0])!.facetValueAsNumber("y")!
      );
    }
    const items = seriesKeys.map(key => ({
      label: model.atKey(key[0])!.getLabel(),
      seriesKey: key[0],
      colorIndex: this.seriesProperties.properties(key[0]).colorIndex,
      symbol: types[key[1]],
      symbolOptions: { lighten: true }
    }));
    const legendItems = [];
    const position = config.position;
    if (this._shouldDrawLegend()) {
      legendItems.push({ position: position ?? "east", items: items });
    }
    return legendItems;
  }

  // TODO: localize this text output
  // focused view: e.options!.focus
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
      const series = this.model!.atKey(seriesKey)!;
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
      const series = this.model!.atKey(seriesKey)!;
      const datapoint = series.datapoints[index];
      const seriesLabel = series.getLabel();
      const datapointView = this._paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
      msgArray.push(interpolate(
        queryMessages.datapointLabelLength,
        {
          seriesLabel,
          datapointXY: formatXYDatapoint(datapoint, 'raw'),
          datapointIndex: queriedNode.options.index + 1,
          datapointCount: this.model!.atKey(seriesKey)!.length
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
        const datapointMsg = describeAdjacentDatapoints(this.model!, datapointView);
        msgArray.push(datapointMsg);
      }

      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(
        this.model!,
        datapoint.facetValueAsNumber('y')!,
        seriesKey
      );
      msgArray.push(...minMaxMsgArray);
    }
    this._paraState.announce(msgArray);
  }

}
