import { type Datapoint } from '@fizz/paramodel';
import { type ChartType } from "@fizz/chartsignal-internal";
import { PlaneChartInfo } from './plane_chart';
import { type ParaState } from '../state';

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
  /*
    async _generateClustering(): Promise<clusterObject[] | null> {
      return await (this._paraState.model as PlaneModel).getClusteringAnalysis();
    }
  */
  /*
    protected _datapointSummary(xIndex: number, yIndex: number) {
      const index = yIndex * this.resolution + xIndex;
      const count = this._grid[index % this._resolution][Math.floor(index / this._resolution)];
      const xInterval = this.xInterval!;
      const yInterval = this.yInterval!;
      const xRange = xInterval.end - xInterval.start;
      const yRange = yInterval.end - yInterval.start;
      const xSpan = xRange / this._resolution;
      const ySpan = yRange / this._resolution;
      const up = (yInterval.end - ySpan * (Math.floor((index) / this._resolution))).toFixed(2);
      const down = (yInterval.end - ySpan * (Math.floor((index) / this._resolution) + 1)).toFixed(2);
      const left = (xInterval.start + xSpan * ((index) % this._resolution)).toFixed(2);
      const right = (xInterval.start + xSpan * ((index) % this._resolution + 1)).toFixed(2);
      return `This block contains ${count} datapoints. It spans x values from ${left} to ${right}, and y values from ${down} to ${up}`
    }
    */

  goSeriesMinMax(isMin: boolean): void {

  }

  goChartMinMax(isMin: boolean): void {

  }
}
