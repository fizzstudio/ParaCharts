import { PointChartInfo } from '.';
import { clusterObject, coord, generateClusterAnalysis } from '@fizz/clustering';
import { strToId, ChartType } from '@fizz/paramanifest';
import { type ParaStore } from '../store';
import { AxisInfo } from '../common/axisinfo';
import { DatapointNavNodeType, NavNode, NavNodeOptionsType, NavNodeType, ScatterPointNavNodeOptions } from '../view/layers/data/navigation';
import { Datapoint } from '@fizz/paramodel';
import { mapn } from '@fizz/chart-classifier-utils';
import { DocumentView } from '../view/document_view';


export class ScatterChartInfo extends PointChartInfo {

  protected _clustering?: clusterObject[];
  protected _currentCluster = -1;

  constructor(type: ChartType, store: ParaStore, docView: DocumentView) {
    super(type, store, docView);
  }

  protected _init(): void {
    // perform clustering before the nav tree is created
    this._generateClustering();
    super._init();
    this._axisInfo = new AxisInfo(this._store, {
      xValues: this._store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this._store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'type.scatter.isDrawTrendLine',
      label: 'Trend line',
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'type.scatter.isShowOutliers',
      label: 'Show outliers',
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'chart.showPopups',
      label: 'Show popups',
      parentView: 'controlPanel.tabs.chart.popups',
    });
  }

  get clustering() {
    return this._clustering;
  }

  get currentCluster(): number {
    return this._currentCluster;
  }

  protected get _datapointNavNodeType(): DatapointNavNodeType {
    return 'scatterpoint';
  }

  protected _datapointNavNodeOptions(datapoint: Datapoint): NavNodeOptionsType<DatapointNavNodeType> {
    const opts = super._datapointNavNodeOptions(datapoint) as ScatterPointNavNodeOptions;
    opts.cluster = this._findCluster(datapoint.datapointIndex);
    return opts;
  }

  protected _createNavMap() {
    super._createNavMap();
    if (this._clustering) {
      this._createClusterNavNodes();
    }
  }

  protected _generateClustering() {
    const data: Array<coord> = []
    const seriesList = this._store.model!.series;
    for (const series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        data.push({ x: Number(series.rawData[i].x), y: Number(series.rawData[i].y) });
      }
    }
    const labels: string[] = [];
    if (seriesList.length > 1) {
      for (const series of seriesList) {
        for (let i = 0; i < series.length; i++) {
          labels.push(series[i].seriesKey);
        }
      }
    }

    if (this._store.model!.numSeries > 1) {
      this._clustering = generateClusterAnalysis(data, true, labels);
    } else {
      this._clustering = generateClusterAnalysis(data, false);
    }
  }

  get navDatapointType(): DatapointNavNodeType {
    return 'scatterpoint';
  }

  seriesInNavOrder() {
    // point chart sorts by height onscreen
    return this._store.model!.series;
  }

  protected _createClusterNavNodes() {
    const seriesClusterNodes: NavNode<'cluster'>[][] = [];
    this._navMap!.root.query('series').forEach(seriesNode => {
      if (seriesClusterNodes.length) {
        seriesNode.connect('left', seriesClusterNodes.at(-1)!.at(-1)!);
      }
      let clustering = this.clustering!;
      if (this._store.model!.numSeries > 1) {
        clustering = clustering!.slice(seriesNode.index, seriesNode.index + 1);
      }
      const datapointNodes = seriesNode.allNodes('right', 'scatterpoint');
      const clusterNodes: NavNode<'cluster'>[] = [];

      clustering.forEach(cluster => {
        const clusterNode = new NavNode(seriesNode.layer, 'cluster', {
          seriesKey: seriesNode.options.seriesKey,
          start: 0,//cluster.dataPointIDs[0],
          end: cluster.dataPointIDs.length - 1,//cluster.dataPointIDs[cluster.dataPointIDs.length - 1],
          datapoints: this._store.model!.numSeries > 1
            // XXX not sure if this will work for general case of multi-series
            ? cluster.dataPointIDs.map(id => id - cluster.dataPointIDs[0])
            : [...cluster.dataPointIDs, ...cluster.outlierIDs],
          clustering: cluster
        }, this._store);
        clusterNodes.push(clusterNode);
      });
      seriesClusterNodes.push(clusterNodes);
      clusterNodes.sort((a,b) => a.options.clustering.centroid[0] - b.options.clustering.centroid[0]);
      clusterNodes.slice(0, -1).forEach((clusterNode, i) => {
        clusterNode.connect('right', clusterNodes[i + 1]);
      });
      // Replace series link to datapoints with link to clusters
      seriesNode.connect('right', clusterNodes[0]);
      // Breaks first and last datapoint links with series landings
      datapointNodes[0].disconnect('left', false);
      datapointNodes.at(-1)!.disconnect('right');
      clusterNodes.forEach(clusterNode => {
        // Unless the first datapoint of the cluster already has an
        // 'out' link set (i.e., it's a boundary node), make a reciprocal
        // link to it
        clusterNode.connect('in', datapointNodes[0],
          !datapointNodes[0].getLink('out'));
        for (const node of datapointNodes) {
          // non-reciprocal 'out' links from remaining datapoints to cluster
          node.connect('out', clusterNode, false);
        }
        if (clusterNode.peekNode('right', 1)) {
          // We aren't on the last cluster, so the final datapoint is a boundary point.
          // Make a non-reciprocal 'in' link to the next cluster
          datapointNodes.at(-1)!.connect('in', clusterNode.peekNode('right', 1)!, false);
        }
      });
    });
    const top = this.navMap!.node('top', {})!;
    seriesClusterNodes.forEach((clusterNodes, i) => {
      clusterNodes.forEach((node, j) => {
        node.connect('out', top, false);
      });
    });
    top.connect('right', seriesClusterNodes[0][0], true);
    seriesClusterNodes.slice(0, -1).forEach((clusterNodes, i) => {
      clusterNodes[clusterNodes.length - 1].connect('right', seriesClusterNodes[i + 1][0], true);
    });
  }

  protected _findCluster(datapointIndex: number) {
    // XXX could speed this up by either doing a binary search (assuming the datapoint IDs are sorted),
    // or caching the cluster ID in the datapoint node
    return this._clustering!.findIndex(cluster => cluster.dataPointIDs.includes(datapointIndex));
  }

  async navRunDidEnd(cursor: NavNode): Promise<void> {
    if (!this._clustering) return;
    if (cursor.isNodeType('cluster')) {
      this._currentCluster = cursor.options.clustering.id;
    } else if (cursor.isNodeType('scatterpoint')) {
      this._currentCluster = cursor.options.cluster;
    } else if (cursor.isNodeType('top')) {
      this._currentCluster = -1;
    }
    // the nav run timeout may end AFTER the latest render
    this._store.paraChart.paraView.requestUpdate();
    super.navRunDidEnd(cursor)
  }
}
