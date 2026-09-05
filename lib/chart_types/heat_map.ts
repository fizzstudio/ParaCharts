import { enumerate, type Datapoint } from '@fizz/paramodel';
import { type ChartType } from "@fizz/chartsignal-internal";
import { PlaneChartInfo } from './plane_chart';
import { SettingsManager, type ParaState } from '../state';
import { LegendConfig } from '../common_exports';
import { LegendItemsWithPosition } from '../view/legend';

export class HeatMapInfo extends PlaneChartInfo {
  protected _resolution!: number;
  protected _data!: Array<Array<number>>;
  protected _grid!: Array<Array<number>>;
  protected _datapointGrid!: Array<Array<Array<Datapoint>>>;
  protected _maxCount!: number;

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
  }

  protected _init() {
    this._grid = []
    this._resolution = this._paraState.config.type.heatmap.resolution ?? 20;
    for (let i = 0; i < this.resolution; i++) {
      this._grid.push([]);
    }
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        this._grid[i][j] = this._paraState.model?.allPoints[j * this.resolution + i].facetValueNumericized("z")!;
      }
    }
    this._maxCount = Math.max(...this.grid.flat());
    // Generate the heat map before creating the nav nodes
    //const cluster = async () => {
    //  this._paraState.clusterAnalyses = await this._generateClustering();
    //(this._paraState.chartInfo as ScatterChartInfo)._clustering = this._paraState.clusterAnalyses;
    //};
    //cluster()
    super._init();
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.insert('type.heatmap.resolution');
    const variables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).map(f => f[1].label);
    this._paraState.settingControls.insert('type.heatmap.xFacet', {
      options: variables
    });
    this._paraState.settingControls.insert('type.heatmap.yFacet', {
      options: variables
    });
  }

  get grid() {
    return this._grid;
  }

  get datapointGrid() {
    return this._datapointGrid;
  }

  get maxCount() {
    return this._maxCount;
  }

  get resolution() {
    return this._resolution
  }

  protected _createPrimaryNavNodes() {
    super._createPrimaryNavNodes();
    // Create vertical links between datapoints
    this._navMap!.root.query('datapoint').slice(0, -this._resolution).forEach(
      (pointNode, i) => {
        pointNode.connect('down', pointNode.layer.get('datapoint', i + this._resolution)!);
      }
    )
  }

  protected _createNavLinksBetweenSeries() {
    // Don't do anything here, since we create vertical links between rows
    // XXX For the case of a multi-series heatmap, we need to do ... something
  }

  protected _createVerticalNavLinks(): void {

  }

  protected _createChordNavNodes() {

  }

  goSeriesMinMax(isMin: boolean): void {

  }

  goChartMinMax(isMin: boolean): void {

  }

  legend(): LegendItemsWithPosition[] {
    const model = this._paraState.model!;
    const config = SettingsManager.getGroupLinkForInstance<LegendConfig>('legend', this._paraState.config, `legend-${0}`) ?? this._paraState.config.legend;
    const seriesKeys = enumerate([...model.seriesKeys]);
    if (config.itemOrder === 'alphabetical') {
      seriesKeys.sort((a, b) => a[0].localeCompare(b[0]));
    }
    else if (config.itemOrder === 'reverseAlphabetical') {
      seriesKeys.sort((a, b) => -1 * a[0].localeCompare(b[0]));
    }
    const items = seriesKeys.map(key => ({
      label: model.atKey(key[0])!.getLabel(),
      seriesKey: key[0],
      colorIndex: this._paraState.seriesProperties!.properties(key[0]).colorIndex,
    }));
    const legendItems = [];
    const position = config.position;
    if (config.isAlwaysDrawLegend) {
      legendItems.push({ position: position, items: items });
    }
    return legendItems;
  }
}
