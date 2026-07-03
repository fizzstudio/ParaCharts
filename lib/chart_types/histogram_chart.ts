import { AxisLabelTier, computeAxisRange, PlaneChartInfo } from './plane_chart';
import { type ParaState } from '../state';
import { DeepReadonly } from '../config/config_types';
import { type ParaView } from '../paraview';
import { Facet, type ChartType } from "@fizz/paramanifest";
import { AxisInfo, computeLabels } from '../common';
import { DocumentView } from '../view/document_view';
import { NavNode } from '../view/layers';
import { Datapoint } from '@fizz/paramodel';
import { Interval } from '@fizz/chart-classifier-utils';

export class HistogramChartInfo extends PlaneChartInfo {
  protected _bins: number = 20;
  protected _data: Array<Array<number>> = [];
  protected _grid: Array<Array<number>> = [[0]];
  protected _maxCount: number = 0;
  _datapointGrid: Array<Array<Datapoint>> = [];

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
    this._init();
  }

  _init() {
    this._bins = this._paraState.config.type.histogram.bins ?? 20;
    this._grid = this._paraState.model!.series.map(s => s.datapoints.map(p => p.facetValueAsNumber('y') as number));
    //const start = Math.min(...this.grid)
    /*
    const end = Math.max(...this.grid)
    
    if (this._paraState.config.type.histogram.displayAxis == 'x') {
      this._yInterval = computeAxisRange(start, end)
    }
    else if (this._paraState.config.type.histogram.displayAxis == 'y') {
      this._xInterval = computeAxisRange(start, end)
    }
      */
    this._xInterval = this._numericXAxisRange("x");
    this._yInterval = this._numericYAxisRange("y");
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this._paraState.clearVisited();
    this._paraState.clearSelected();
    /*
    const targetAxis = this.config.groupingAxis as DeepReadonly<string> == '' ?
      this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label)[0]
      : this.config.groupingAxis;
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
    if (this.config.displayAxis == "x" || this.config.displayAxis == undefined) {
      if (this.config.relativeAxes == "Counts") {
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
      if (this.config.relativeAxes == "Counts") {
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

    const indepFacet = this._paraState.model!.getFacet("x")!;
    const depFacet = this._paraState.model!.getFacet("y")!;
    if (indepFacet.datatype === 'number') {
      this._xInterval = this._numericXAxisRange("x");
    } else {
      this._xInterval = null;
    }
    if (depFacet.datatype === 'number') {
      this._yInterval = this._numericYAxisRange("y");
    } else {
      this._yInterval = null;
    }
      */
    this._createNavMap();
    this._storeChangeUnsub = this._paraState.subscribe(async (key, value) => {
      if (key === 'data') {
        this._createSummarizer();
      }
    });
    // We initially get created after the data has loaded, so the above
    // callback won't run
    this._createSummarizer();
  }

  async setup() {
    //this._conciseSummary = 'test';
  }

  protected _addSettingControls(): void {
    this._paraState.settingControls.insert('chart.width');
    this._paraState.settingControls.insert('chart.height');
    this._paraState.settingControls.insert('chart.isShowPopups');
    // Only add these controls if the y-axis is numeric
    if (!this._paraState.model!.getFacet('y') || this._paraState.model!.getFacet('y')!.datatype !== 'number') return;
    // const range = this.chartLayers.getYAxisInterval();
    // XXX should be min/max label values as numbers, not min/max data values
    const min = this._yInterval!.start; // this._labelInfo.min!;
    const max = this._yInterval!.end; // this._labelInfo.max!;

    this._paraState.settingControls.insert(
      `type.${this._type}.minYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? min
        : value,
      value => {
        const min = this.config.maxYValue === 'unset'
          ? max
          : this.config.maxYValue
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min y-value (${value}) must be less than ${min}` } : {};
      });
    this._paraState.settingControls.insert(
      `type.${this._type}.maxYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? max
        : value,
      value => {
        const max = this.config.minYValue === 'unset'
          ? min
          : this.config.minYValue
        return value as number <= max ?
          { err: `Max y-value (${value}) must be greater than ${max}` } : {};
      });
    this._paraState.settingControls.insert('type.histogram.bins');
    //const variables = this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label);
    const variables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).map(f => f[1].label)
    this._paraState.settingControls.insert('type.histogram.groupingAxis', {
      options: variables as string[]
    });
    this._paraState.settingControls.insert('type.histogram.displayAxis');
    this._paraState.settingControls.insert('type.histogram.relativeAxes');
  }
  /*
      get horizFacet(): Facet | null {
        // return (this._paraState.model as PlaneModel).getAxisFacet('horiz')
        //   ?? this._paraState.model!.getFacet(this._options.isXVertical ? 'y' : 'x')!;
        // const facetKey = this._options.isXVertical
        //     ? this._paraState.model!.dependentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
        //     : this._paraState.model!.independentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
        // return this._paraState.model!.getFacet(facetKey)!
        return this._paraState.model!.getFacet(this._paraState.model!.facetKeys[0])
      }
  
      get vertFacet(): Facet | null {
        // return (this._paraState.model as PlaneModel).getAxisFacet('horiz')
        //   ?? this._paraState.model!.getFacet(this._options.isXVertical ? 'y' : 'x')!;
        // const facetKey = this._options.isXVertical
        //     ? this._paraState.model!.dependentFacetKeys[0] // TODO: Assumes exactly 1 dep facet
        //     : this._paraState.model!.independentFacetKeys[0]; // TODO: Assumes exactly 1 indep facet
        // return this._paraState.model!.getFacet(facetKey)!
        return this._paraState.model!.getFacet(this._paraState.model!.facetKeys[0])
      }
  */
  get grid() {
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }
  /*
  protected _generateBins(): Array<number> {
    const targetAxis = this.config.groupingAxis as DeepReadonly<string | undefined>
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

    for (let i = 0; i < this.bins; i++) {
      grid.push(0);
    }

        for (let point of this._data) {
          // TODO: check that `- 1` is correct
          const xIndex: number = Math.floor((point[0] - xMin) * (this.bins - 1) / (xMax - xMin));
          grid[xIndex]++;
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
        const xValues = []
        for (let datapoint of this._paraState.model!.series[0]) {
          xValues.push(datapoint.facetValueNumericized(targetFacet)!)
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
  
      const x: Array<number> = [];
  
      for (let point of this._data) {
        x.push(point[0]);
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
  
  
    getFacetForOrientation(orientation: AxisOrientation): Facet | null {
      if (this._paraState.config.type.histogram.groupingAxis
        && ((orientation == 'horiz' && this._paraState.config.type.histogram.displayAxis == 'x')
          || (orientation == 'vert' && this._paraState.config.type.histogram.displayAxis == 'y'))) {
        const targetAxis = this._paraState.config.type.histogram.groupingAxis as DeepReadonly<string> == '' ?
          this._paraState.model?.facetSignatures.map((facet) => this._paraState.model?.getFacet(facet.key)?.label)[0]
          : this._paraState.config.type.histogram.groupingAxis;
        let targetFacet = this._paraState.config.type.histogram.displayAxis;
        for (let facet of this._paraState.model!.facetSignatures) {
          if (this._paraState.model!.getFacet(facet.key as string)!.label == targetAxis) {
            targetFacet = facet.key;
          }
        }
        return this._paraState.model!.getFacet(targetFacet)
      }
      return orientation === 'horiz' ? this.horizFacet : this.vertFacet;
    }
  */
  /**
     * Called by `Axis` instances to obtain label tiers.
     * @param facetKey - Axis facet key
     * @param isStagger - Whether to stagger labels between two tiers
     * @returns Array of tiers (each tier being an array of strings)
     */
  /*
computeAxisLabelTiers(facetKey: string, orientation: AxisOrientation, isStagger: boolean): AxisLabelTier[] {

  if (orientation == 'horiz' && this._paraState.config.type.histogram.displayAxis == 'x') {
    return super.computeAxisLabelTiers(facetKey, orientation, isStagger)
  }
  else {
    const start = Math.min(...this.grid);
    const end = Math.max(...this.grid);
    const interval: Interval = { start: start, end: end };
    if (this._paraState.config.type.histogram.displayAxis == 'x') {
      this._yInterval = computeAxisRange(start, end);
    }
    else if (this._paraState.config.type.histogram.displayAxis == 'y') {
      this._xInterval = computeAxisRange(start, end);
    }
    const computed = computeLabels(
      interval.start, interval.end,
      false, true, isStagger).labelTiers as string[][];
    const ret: AxisLabelTier[] = [];
    ret.push({ labels: computed[0] });
    if (isStagger) {
      ret.push({ labels: computed[1] });
    }

    return ret;
  }

}
*/
  get bins() {
    return this._bins;
  }

  protected _createPrimaryNavNodes() {
    return super._createPrimaryNavNodes();
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
*/
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
  /*
    protected _createVerticalNavLinks(): void {
  
    }
  */
  protected _createChordNavNodes() {

  }
  /*
    protected _createSummarizer(): void {
  
    }
  */

}
