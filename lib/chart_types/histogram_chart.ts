import { PlaneChartInfo } from './plane_chart';
import { type ParaState } from '../state';
import { DeepReadonly } from '../config/config_types';
import { type ParaView } from '../paraview';
import { type ChartType } from "@fizz/paramanifest";
import { AxisInfo, computeLabels } from '../common';
import { DocumentView } from '../view/document_view';
import { NavNode } from '../view/layers';
import { Datapoint } from '@fizz/paramodel';

export class HistogramChartInfo extends PlaneChartInfo {
  protected _bins: number = 20;
  protected _data: Array<Array<number>> = [];
  protected _grid: Array<number> = [6, 7];
  protected _maxCount: number = 0;
  _datapointGrid: Array<Array<Datapoint>> = [];

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
    this._init();
  }

  protected _init() {
    this._bins = this._paraState.config.type.histogram.bins ?? 20;
    this._grid = this._generateBins();
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this._paraState.clearVisited();
    this._paraState.clearSelected();

    const targetAxis = this.settings.groupingAxis as DeepReadonly<string> == '' ?
      this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label)[0]
      : this.settings.groupingAxis;
    let targetFacet;
    for (let facet of this._paraState.model!.facetSignatures) {
      if (this._paraState.model!.getFacet(facet.key as string)!.label == targetAxis) {
        targetFacet = facet.key;
      }
    }
    //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
    let nonTargetFacet;
    if (targetFacet == "y") {
      nonTargetFacet = "x";
    }
    else {
      nonTargetFacet = "y";
    }

    const targetFacetBoxes = this._paraState.model!.allFacetValues(targetFacet!)!;
    const targetFacetNumbers = targetFacetBoxes.map((b) => b.asNumber()!);
    if (this.settings.displayAxis == "x" || this.settings.displayAxis == undefined) {
      if (this.settings.relativeAxes == "Counts") {
        // this._axisInfo = new AxisInfo(this._paraState, {
        //   xValues: targetFacetNumbers,
        //   yValues: this.grid,
        // });
      }
      else {
        const sum = this.grid.reduce((a, c) => a + c)
        const pctGrid = this.grid.map(g => g / sum)
        // this._axisInfo = new AxisInfo(this._paraState, {
        //   xValues: targetFacetNumbers,
        //   yValues: pctGrid
        // });
      }
    }
    else {
      if (this.settings.relativeAxes == "Counts") {
        // this._axisInfo = new AxisInfo(this._paraState, {
        //   xValues: this.grid,
        //   yValues: targetFacetNumbers,
        // });
      }
      else {
        const sum = this.grid.reduce((a, c) => a + c)
        const pctGrid = this.grid.map(g => g / sum)
        // this._axisInfo = new AxisInfo(this._paraState, {
        //   xValues: pctGrid,
        //   yValues: targetFacetNumbers,
        // });
      }
    }
    super._init();
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._paraState.settingControls.insert('type.histogram.bins');
    const variables = this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label);
    this._paraState.settingControls.insert('type.histogram.groupingAxis', {
      options: variables as string[]
    });
    this._paraState.settingControls.insert('type.histogram.displayAxis');
    this._paraState.settingControls.insert('type.histogram.relativeAxes');
  }

  get grid() {
    //console.log("this._grid", this._grid)
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }

  protected _generateBins(): Array<number> {
    console.log("generateBins")
    const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined>
      ?? this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label)[0];

    let targetFacet;
    for (let facet of this._paraState.model!.facetSignatures) {
      if (this._paraState.model!.getFacet(facet.key as string)!.label == targetAxis) {
        targetFacet = facet.key;
      }
    }
    //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
    let nonTargetFacet;
    if (targetFacet == "y") {
      nonTargetFacet = "x";
    }
    else {
      nonTargetFacet = "y";
    }
    let workingLabels;
    if (targetFacet) {
      const yValues = []
      const xValues = []
      for (let datapoint of this._paraState.model!.series[0]) {
        xValues.push(datapoint.facetValueNumericized(targetFacet)!)
      }
      for (let datapoint of this._paraState.model!.series[0]) {
        yValues.push(datapoint.facetValueNumericized(nonTargetFacet)!)
      }
      workingLabels = computeLabels(Math.min(...xValues), Math.max(...xValues), false)
    }
    else {
      const xBoxes = this._paraState.model!.allFacetValues('x')!;
      const xNumbers = xBoxes.map((x) => x.asNumber()!);
      workingLabels = computeLabels(Math.min(...xNumbers), Math.max(...xNumbers), false);
    }
    const seriesList = this._paraState.model!.series
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetValueNumericized(targetFacet ?? "x")!, series[i].facetValueNumericized(nonTargetFacet ?? "y")!]);
      }
    }

    const y: Array<number> = [];
    const x: Array<number> = [];

    for (let point of this._data) {
      x.push(point[0]);
      y.push(point[1]);
    }

    let xMax: number = workingLabels.max!
    let xMin: number = workingLabels.min!

    const grid: Array<number> = [];
    const datapointGrid: Array<Array<Datapoint>> = [];

    for (let i = 0; i < this.bins; i++) {
      grid.push(0);
      datapointGrid.push([])
    }

    for (let i = 0; i < this._data.length; i++) {
      const point = this._data[i];
      // TODO: check that `- 1` is correct
      const xIndex: number = Math.floor((point[0] - xMin) * (this.bins - 1) / (xMax - xMin));
      grid[xIndex]++;
      datapointGrid[xIndex].push(this._paraState.model!.allPoints[i])
    }
    this._datapointGrid = datapointGrid
    return grid;
  }

  get bins() {
    return this._bins;
  }

    protected _createPrimaryNavNodes() {
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
      left = this._navMap!.root.get('top')!;
      for (let i = 0; i < this._grid.length; i++) {
          const entry = this.grid[i]
          const datapoints = this._datapointGrid[i]
          const node = new NavNode(this._navMap!.root, 'histogramBin', {
            datapointCount: entry,
            datapoints: datapoints,
            index: i
          }, this._paraState)
          node.connect('left', left);
          if (i === 0) {
            node.connect('up', left);
            node.connect('down', left);
            node.connect('right', left);
          }
          left = node;
        }
      
  /*
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


}
