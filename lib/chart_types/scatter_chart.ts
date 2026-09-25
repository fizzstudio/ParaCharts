import { PointChartInfo } from './point_chart';
import { type ChartType, type clusterObject, Datapoint, PlaneModel } from '@fizz/chartsignal-internal';
import { type ParaState } from '../state/parastate';
import { DatapointNavNodeType, NavMap, type NavNode, NavNodeOptionsType, ScatterPointNavNodeOptions } from '../view/layers/data/navigation';
import { DataSymbols } from '../view/symbol';
import { LegendItemsWithPosition } from '../view/legend';
import { SettingsManager } from '../state';
import { LegendConfig } from '../config/config_types';
import { populateNavMap } from '../navigation/nav_map_builder';


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
      // this._createNavNodes();
      // this._populateNavMap();
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

  protected _populateNavMap(): void {
    if (!this._clustering) return;
    super._populateNavMap();
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
      if (this._shouldDrawLegend()) {
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
      if (this._shouldDrawLegend()) {
        legendItems.push({ position: position, items: items });
      }
      return legendItems;
    }
  }
}
