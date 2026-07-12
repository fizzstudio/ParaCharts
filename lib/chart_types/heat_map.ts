import { type Datapoint, type PlaneModel } from '@fizz/paramodel';
import { type ChartType } from "@fizz/paramanifest";
import { computeLabels } from '../common/axisinfo';
import { PlaneChartInfo } from './plane_chart';
import { NavNode } from '../view/layers';
import { type ParaState } from '../state';
import { clusterObject } from '@fizz/clustering';

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
        //this._grid[i][j] = this._paraState.model?.allPoints[i * this.resolution + j].facetValueNumericized("z")!;
        this._grid[i][j] = this._paraState.model?.allPoints[j * this.resolution + i].facetValueNumericized("z")!;
      }
    }
    //console.log("grid", this.grid)
    //this._generateHeatmap();
    //const values = this._grid.flat();
    //console.log("allFacetValues", this._paraState.model?.allFacetValues("z"))
    this._maxCount = Math.max(...this.grid.flat());
    // Generate the heat map before creating the nav nodes
    const cluster = async () => {
      this._paraState.clusterAnalyses = await this._generateClustering();
      //(this._paraState.chartInfo as ScatterChartInfo)._clustering = this._paraState.clusterAnalyses;
    };
    cluster()
    super._init();
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.insert('type.heatmap.resolution');
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

  protected _createPrimaryNavNodes() {
    super._createPrimaryNavNodes();
    // Create vertical links between datapoints
    this._navMap!.root.query('datapoint').slice(0, -this._resolution).forEach(
      (pointNode, i) => {
        pointNode.connect('down', pointNode.layer.get('datapoint', i + this._resolution)!);
      }
    )
    return;
    // Create series and datapoint nav nodes, and link them horizontally thusly:
    // - [SERIES-A]-[SERIES-A-POINT-0]- ... -[SERIES-A-POINT-(N-1)]-[SERIES-B]-[SERIES-B-POINT-0]- ...
    let left = this._navMap!.root.get('top')!;
    //const depFacet = this._paraState.model!.dependentFacetKeys[0];
    // Sort by value of first datapoint from greatest to least
    /*
    const sortedSeries = this.seriesInNavOrder();
    sortedSeries.forEach((series, i) => {
      if (sortedSeries.length > 1) {
        const seriesNode = new NavNode(this._navMap!.root, 'series', {
          seriesKey: series.key
        }, this._paraState);
        seriesNode.connect('left', left);
        if (i === 0) {
          seriesNode.connect('up', left);
          seriesNode.connect('down', left);
          seriesNode.connect('right', left);
        }
        left = seriesNode;
      }
    });
    if (this._paraState.model?.multi){
      left = this._navMap!.root.get('series')!;
    }
    else{
      left = this._navMap!.root.get('top')!;
    }
      */
     /*
    left = this._navMap!.root.get('top')!;
    for (let i = 0; i < this._grid.length; i++) {
      for (let j = 0; j < this._grid[i].length; j++) {
        const entry = this.grid[j][i]
        const datapoints = this._datapointGrid[j][i]
        const node = new NavNode(this._navMap!.root, 'heatmapTile', {
          datapointCount: entry,
          datapoints: datapoints,
          yIndex: i,
          xIndex: j
        }, this._paraState)
        node.connect('left', left);
        if (i === 0 && j === 0) {
          node.connect('up', left);
          node.connect('down', left);
          node.connect('right', left);
        }
        left = node;
      }
    }

    // Create vertical links between datapoints
    this._navMap!.root.query('heatmapTile').slice(0, -this._resolution).forEach(
      (pointNode, i) => {
        pointNode.connect('down', pointNode.layer.get('heatmapTile', i + this._resolution)!);
      }
    )
      */
  }

  protected _createNavLinksBetweenSeries() {
    // Don't do anything here, since we create vertical links between rows
    // XXX For the case of a multi-series heatmap, we need to do ... something
  }

  protected _createVerticalNavLinks(): void {
    
  }

  protected _createChordNavNodes() {

  }

  async _generateClustering(): Promise<clusterObject[] | null> {
    return await (this._paraState.model as PlaneModel).getClusteringAnalysis();
  }

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
 /*
  async navRunDidEnd(cursor: NavNode, quiet = false) {
   
    if (cursor.isNodeType('heatmapTile')) {
      if (!quiet) {
        this._paraState.announce(this._datapointSummary(cursor.options.xIndex, cursor.options.yIndex));
      }
    }
     
    //Sam: Most stuff here (summaries, sparkbraille, sonification) is not implemented yet for heatmaps,
    // I'm overriding to prevent errors, uncomment this as they get added
    
      const seriesKey = cursor.at(0)?.seriesKey ?? '';
      if (cursor.type === 'top') {
        await this.paraview.paraState.asyncAnnounce(this.paraview.summarizer.getChartSummary());
      } else if (cursor.type === 'series') {
        this.paraview.paraState.announce(
          await this.paraview.summarizer.getSeriesSummary(seriesKey));
        this._playRiff();
        this.paraview.paraState.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'datapoint') {
        // NOTE: this needs to be done before the datapoint is visited, to check whether the series has
        //   ever been visited before this point
        const seriesPreviouslyVisited = this.paraview.paraState.everVisitedSeries(seriesKey);
        const announcements = [this.paraview.summarizer.getDatapointSummary(cursor.at(0)!.datapoint, 'statusBar')];
        const isSeriesChange = !this.paraview.paraState.wasVisitedSeries(seriesKey);
        if (isSeriesChange) {
          announcements[0] = `${seriesKey}: ${announcements[0]}`;
          if (!seriesPreviouslyVisited) {
            const seriesSummary = await this.paraview.summarizer.getSeriesSummary(seriesKey);
            announcements.push(seriesSummary);
          }
        }
        this.paraview.paraState.announce(announcements);
        if (this.paraview.paraState.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          this._playDatapoints([cursor.at(0)!.datapoint]);
        }
        this.paraview.paraState.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'chord') {
        if (this.paraview.paraState.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          if (this.paraview.paraState.settings.sonification.isArpeggiateChords) {
            this._playRiff(this._chordRiffOrder());
          } else {
            this._playDatapoints(cursor.datapointViews.map(view => view.datapoint));
          }
        }
      } else if (cursor.type === 'sequence') {
        this.paraview.paraState.announce(await this.paraview.summarizer.getSequenceSummary(cursor.options as SequenceNavNodeOptions));
        this._playRiff();
      }
        
  }
 */
  protected _generateHeatmap(): Array<Array<number>> {
    const seriesList = this._paraState.model!.series;
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetValueNumericized("x")!, series[i].facetValueNumericized("y")!]);
      }
    }

    const y: Array<number> = [];
    const x: Array<number> = [];

    for (const point of this._data) {
      x.push(point[0]);
      y.push(point[1]);
    }
    const xLabels = computeLabels(Math.min(...this._paraState.model!.allFacetValues('x')!.map((x) => x.value as number)),
      Math.max(...this._paraState.model!.allFacetValues('x')!.map((x) => x.value as number)), false);
    const yLabels = computeLabels(Math.min(...this._paraState.model!.allFacetValues('y')!.map((x) => x.value as number)),
      Math.max(...this._paraState.model!.allFacetValues('y')!.map((x) => x.value as number)), false);

    let yMax: number = yLabels.max!;
    let xMax: number = xLabels.max!;
    let yMin: number = yLabels.min!;
    let xMin: number = xLabels.min!;

    const grid: Array<Array<number>> = [];
    const datapointGrid: Array<Array<Array<Datapoint>>> = [];

    for (let i = 0; i < this.resolution; i++) {
      grid.push([]);
      datapointGrid.push([]);
      for (let j = 0; j < this.resolution; j++) {
        grid[i].push(0);
        datapointGrid[i].push([]);
      }
    }
    for (let i = 0; i < this._data.length; i++) {
      const point = this._data[i];
      const xIndex: number = Math.floor((point[0] - xMin) * this.resolution / (xMax - xMin));
      let yIndex: number = this.resolution - Math.floor((point[1] - yMin) * this.resolution / (yMax - yMin)) - 1;
      if (yIndex == -1){
        yIndex++;
      }
      grid[xIndex][ yIndex]++;
      datapointGrid[xIndex][yIndex].push(this._paraState.model!.allPoints[i]);
    }
    this._grid = grid;
    this._datapointGrid = datapointGrid;
    return grid;
  }

  get resolution() {
    return this._resolution
  }

  goSeriesMinMax(isMin: boolean): void {

  }

  goChartMinMax(isMin: boolean): void {

  }
}
