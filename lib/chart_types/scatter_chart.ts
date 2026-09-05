import { PointChartInfo } from './point_chart';
import { type clusterObject } from '@fizz/clustering';
import { type ChartType } from '@fizz/chartsignal-internal';
import { type ParaState } from '../state/parastate';
import { DatapointNavNodeType, NavNode, NavNodeOptionsType, ScatterPointNavNodeOptions, SeriesNavNodeOptions } from '../view/layers/data/navigation';
import { Datapoint, PlaneModel } from '@fizz/paramodel';
import { DataSymbols } from '../view/symbol';
import { LegendItemsWithPosition } from '../view/legend';
import { LegendConfig } from '../common_exports';
import { SettingsManager } from '../state';


export class ScatterChartInfo extends PointChartInfo {

  _clustering?: clusterObject[] | null;
  protected _currentCluster = -1;

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
  }

  protected _init(): void {
    // perform clustering before the nav tree is created
    if (this._paraState.type == 'scatter') {
      const cluster = async () => {
        this._paraState.clusterAnalyses = await this._generateClustering();
        (this._paraState.chartInfo as ScatterChartInfo)._clustering = this._paraState.clusterAnalyses;
      };
      cluster()
    }
    super._init();
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.insert('type.scatter.isShowTrendLine');
    this._paraState.settingControls.insert('type.scatter.isShowOutliers');
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
    return opts;
  }

  async storeDidChange(key: string, value: any) {
    await super.storeDidChange(key, value);
    if (key === 'clusterAnalyses') {
      this._createClusterNavNodes();
      //this._paraView.documentView?.chartLayers.dataLayer.init();
    }
  }
  async _generateClustering(): Promise<clusterObject[] | null> {
    return await this.model.getClusteringAnalysis();
  }

  get navDatapointType(): DatapointNavNodeType {
    return 'scatterpoint';
  }

  get model() {
    return super.model as PlaneModel;
  }

  seriesInNavOrder() {
    // point chart sorts by height onscreen
    return this._paraState.model!.series;
  }

  protected _createClusterNavNodes() {
    const seriesClusterNodes: NavNode<'cluster'>[][] = [];
    const isMultiSeries = this._navMap!.root.query('series').length > 0 ? true : false;
    const seriesNodes = isMultiSeries ? this._navMap!.root.query('series') : this._navMap!.root.query('top');
    let left = this._navMap!.root.get('top')!;
    seriesNodes.forEach((seriesNode, seriesIndex) => {
      if (seriesClusterNodes.length) {
        seriesNode.connect('left', seriesClusterNodes.at(-1)!.at(-1)!);
      }
      let clustering = this.clustering!;
      if (this._paraState.model!.numSeries > 1) {
        clustering = clustering!.slice(seriesNode.index, seriesNode.index + 1);
      }
      const datapointNodes = seriesNode.allNodes('right', 'scatterpoint');
      const clusterNodes: NavNode<'cluster'>[] = [];

      clustering.forEach((cluster, clusterIndex) => {
        const clusterNode = new NavNode(seriesNode.layer, 'cluster', {
          seriesKey: isMultiSeries ? (seriesNode.options as SeriesNavNodeOptions).seriesKey : this.seriesInNavOrder()[0].key,
          start: 0,
          end: cluster.dataPointIDs.length - 1,
          datapoints: [...cluster.dataPointIDs, ...cluster.outlierIDs].map(id => this._paraState.model?.allPoints[id]).filter(p => p != undefined),
          clustering: cluster,
          index: clusterIndex + seriesIndex
        }, this._paraState);
        clusterNodes.push(clusterNode);
      });
      seriesClusterNodes.push(clusterNodes);
      clusterNodes.sort((a, b) => a.options.clustering.centroid[0] - b.options.clustering.centroid[0]);
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
        const childDatapointNodes = datapointNodes.filter(dp => clusterNode.options.datapoints.includes(dp.datapoints[0]));
        clusterNode.connect('in', childDatapointNodes[0],
          !childDatapointNodes[0].getLink('out'));
        for (const node of childDatapointNodes) {
          // non-reciprocal 'out' links from remaining datapoints to cluster
          node.connect('out', clusterNode, false);
          (node!.options as ScatterPointNavNodeOptions).cluster = clusterNode.index;
          node.disconnect("left", false);
          node.connect("left", left);
          left = node;
        }
        if (clusterNode.peekNode('right', 1)) {
          // We aren't on the last cluster, so the final datapoint is a boundary point.
          // Make a non-reciprocal 'in' link to the next cluster
          childDatapointNodes.at(-1)!.connect('in', clusterNode.peekNode('right', 1)!, false);
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

  async navRunDidEnd(cursor: NavNode, quiet = false): Promise<void> {
    if (!this._clustering) return;
    if (cursor.isNodeType('cluster')) {
      this._currentCluster = cursor.options.clustering.id;
    } else if (cursor.isNodeType('scatterpoint')) {
      this._currentCluster = cursor.options.cluster;
    } else if (cursor.isNodeType('top')) {
      this._currentCluster = -1;
    }
    // the nav run timeout may end AFTER the latest render
    this._paraView.requestUpdate();
    super.navRunDidEnd(cursor, quiet)
  }

  legend(): LegendItemsWithPosition[] {
    const model = this._paraState.model!;
    const config = SettingsManager.getGroupLinkForInstance<LegendConfig>('legend', this._paraState.config, `legend-${0}`) ?? this._paraState.config.legend;
    const types = new DataSymbols().types;
    if (model.multi || !this.clustering) {
      const seriesKeys = [...model.seriesKeys];
      if (config.itemOrder === 'alphabetical') {
        seriesKeys.sort();
      }
      const items = seriesKeys.map((key, i) => ({
        label: model.atKey(key)!.getLabel(),
        seriesKey: key,
        colorIndex: this._paraState.seriesProperties!.properties(key).colorIndex,
        symbol: types[i],
        symbolOptions: { lighten: true }
      }));
      const legendItems = [];
      const position = config.position;
      if (config.isAlwaysDrawLegend) {
        legendItems.push({ position: position, items: items });
      }
      return legendItems;
    }
    else {
      const items = this.clustering.map((c, i) => ({
        label: `cluster ${i + 1} (${c.regionDesc})`,
        seriesKey: model.seriesKeys[0],
        colorIndex: i,
        symbol: types[i],
        symbolOptions: { lighten: true },
        clusterIndex: i
      }))
      const legendItems = [];
      const position = config.position;
      if (config.isAlwaysDrawLegend) {
        legendItems.push({ position: position, items: items });
      }
      return legendItems;
    }
  }
}
