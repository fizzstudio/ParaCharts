import { ParaStore } from '../store';
import { PlaneChartInfo } from './plane_chart';
import { AxisInfo } from '../common/axisinfo';
import { DeepReadonly, BarSettings, datapointIdToCursor } from '../store';
import {
  queryMessages, describeAdjacentDatapoints, describeSelections, getDatapointMinMax
} from '../store/query_utils';
import { type Label } from '../view/label';

import { ChartType, strToId } from '@fizz/paramanifest';
import { enumerate, Box } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { interpolate } from '@fizz/templum';
import { DocumentView } from '../view/document_view';

type BarClusterMap = {[key: string]: BarCluster};

export interface BarStackItem {
  series: string;
  value: Box<'number'>;
}

/**
 * Contains clustered bar stack data.
 */
export class BarCluster {
  stacks: {[key: string]: BarStack} = {};
  readonly id: string;
  readonly labelId: string;

  constructor(public readonly chartInfo: BarChartInfo, public readonly key: string) {
    this.id = `barcluster-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
  }

  get index() {
    return Object.keys(this.chartInfo.clusteredData).indexOf(this.key);
  }
}

/**
 * Contains data for bars contained in a stack.
 */
export class BarStack {
  bars: {[key: string]: BarStackItem} = {};

  readonly id: string;
  readonly labelId: string;

  protected _label: Label | null = null;

  constructor(public readonly cluster: BarCluster, public readonly key: string) {
    this.id = `barstack-${strToId(this.cluster.key)}-${strToId(this.key)}`;
    this.labelId = `tick-x-${this.id}`;
  }

  get index() {
    return Object.keys(this.cluster.stacks).indexOf(this.key);
  }

  get label() {
    return this._label;
  }

  set label(label: Label | null) {
    this._label = label;
  }
}

/**
 * Business logic for bar charts.
 * @public
 */
export class BarChartInfo extends PlaneChartInfo {
  protected _clusteredData!: BarClusterMap;
  protected _stacksPerCluster!: number;

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _init(): void {
    super._init();
    this._clusteredData = this._clusterData();
    const yValues = Object.values(this._clusteredData).flatMap(c =>
      Object.values(c.stacks).map(s =>
        Object.values(s.bars).map(item => item.value.value).reduce((a, b) => a + b, 0)
//        + Object.values(s.bars).length*this.settings.stackInsideGap
      ));
    //const idxMax = yValues.indexOf(Math.max(...yValues));
    //const numBars = Object.values(Object.values(Object.values(this._clusteredData)[0].stacks)[0].bars).length;
    // XXX needs to be y units, not pixels
    //yValues[idxMax] += numBars*this.settings.stackInsideGap;
    this._axisInfo = new AxisInfo(this._store, {
      // xTiers: [this.paraview.store.model!.allFacetValues('x')!.map(x =>
      //   formatBox(x, 'barCluster', this.paraview.store))],
      xTiers: [Object.keys(this._clusteredData)],
      yValues: yValues,
      yMin: Math.min(0, Math.min(...yValues)),
      isXInterval: true,
      // manifest can override this
      isXVertical: this._store.type === 'bar'
    });
    const numSeries = this._store.model!.numSeries;
    if (this.settings.stacking === 'standard') {
      this._stacksPerCluster = 1;
    } else if (this.settings.stacking === 'none') {
      const seriesPerStack = 1;
      this._stacksPerCluster = Math.ceil(numSeries/seriesPerStack);
    }
  }

  get settings() {
    return super.settings as DeepReadonly<BarSettings>;
  }

  get clusteredData() {
    return this._clusteredData;
  }

  get stacksPerCluster() {
    return this._stacksPerCluster;
  }

  protected _clusterData() {
    const settings = this._store.settings.type[this._type] as BarSettings;
    const clusterMap: BarClusterMap = {};
    const xs = this._store.model!.series[0].datapoints.map(dp => dp.facetBox('x')!);

    const clusters: BarCluster[] = [];

    // if (this.paraview.store.settings.type.bar.clusterBy === 'facet') {
    //   for (const facet of this.paraview.store.model!.facets) {
    //     const cluster: Cluster = {};
    //     clusterMap[facet.key] = cluster;
    //     for (const series of this.paraview.store.model!.series) {
    //       const item: StackItem = {
    //         series: series.key,
    //         value: series.facet(facet.key)![0] as Box<'number'>
    //       };
    //       const stack: Stack = {[series.key]: item};
    //       cluster[series.key] = stack;
    //     }
    //   }
    //   return clusterMap;
    // }

    for (const [x, i] of enumerate(xs)) {
      //const clusterKey = this._model.format(xSeries.atBoxed(i), 'barCluster');
      const clusterKey = formatBox(x, this._store.getFormatType('barCluster'));
      let cluster = clusterMap[clusterKey];
      if (!cluster) {
        cluster = new BarCluster(this, clusterKey);
        clusterMap[clusterKey] = cluster;
        clusters.push(cluster);
      }
    }

    const allSeries = [...this._store.model!.series];
    if (this._store.type === 'column' && settings.stacking === 'standard') {
      // Place the series into stacks in the reverse order to how they appear in the
      // model (i.e., first series will be topmost onscreen in 'standard' mode)
      allSeries.reverse();
    }
    for (const [series, i] of enumerate(allSeries)) {
      for (const [value, j] of enumerate(series.datapoints.map(dp => dp.facetBox('y')))) {
        let stack: BarStack;
        let stackKey: string;
        if (settings.stacking === 'standard') {
          stackKey = 'stack';
          stack = clusters[j].stacks[stackKey];
          if (!stack) {
            stack = new BarStack(clusters[j], stackKey);
            clusters[j].stacks[stackKey] = stack;
          }
        } else if (settings.stacking === 'none') {
          const seriesPerStack = 1;
          stackKey = series.key;
          stack = clusters[j].stacks[stackKey];
          if (!stack) {
            stack = new BarStack(clusters[j], stackKey);
            clusters[j].stacks[stackKey] = stack;
          }
        }
        stack!.bars[series.key] = {
          series: series.key,
          value: series.datapoints[j].facetBox('y') as Box<'number'>
        };
      }
    }
    return clusterMap;
  }

  legend() {
    if (this._store.settings.legend.itemOrder === 'series') {
      // return this._chartLandingView.children.map(view => ({
      //   label: (view as SeriesView).seriesKey,
      //   color: (view as SeriesView).color  // series color
      // }));
      return this._store.model!.series.map(series => ({
        label: series.key,
        color: this._store.seriesProperties!.properties(series.key).color
      }));
    } else {
      return this._store.model!.seriesKeys.toSorted().map(key => ({
        label: key,
        color: this._store.seriesProperties!.properties(key).color
      }));
    }
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
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      const seriesKey = queriedNode.options.seriesKey;
      const datapointCount = this._store.model!.atKey(seriesKey)!.length;
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {
      /*
      if (e.options!.isChordMode) {
        // focused view: e.options!.focus
        // all visited datapoint views: e.options!.visited
        // const focusedDatapoint = e.targetView;
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      }
        */
      const selectedDatapoints = this._store.selectedDatapoints;
      const seriesKey = queriedNode.options.seriesKey;
      const index = queriedNode.options.index;
      const datapoint = this._store.model!.atKey(seriesKey)!.datapoints[index];
      // XXX yuck
      const datapointView = this._store.paraChart.paraView.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;

      msgArray.push(interpolate(
        queryMessages.datapointKeyLength,
        {
          seriesKey,
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