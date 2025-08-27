import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { DeepReadonly, HeatmapSettings, PointChartType, type Setting } from "../../../../store";
import { DatapointView, SeriesView } from "../../../data";

import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { XYChart, XYSeriesView } from "./xy_chart";
import { strToId } from "@fizz/paramanifest";

export class Heatmap extends XYChart {
  protected _resolution: number = 25;
  protected _data: Array<Array<number>> = [];
  protected _grid: Array<Array<number>> = [];
  protected _maxCount: number = 0;
  declare protected _settings: DeepReadonly<HeatmapSettings>;

  constructor(
    paraview: ParaView,
    dataLayerIndex: number
  ) {
    super(paraview, dataLayerIndex);
    this._init()
  }

  _init() {
    this._settings = this.paraview.store.settings.type.heatmap
    this._resolution = this.paraview.store.settings.type.heatmap.resolution ?? 20
    this._generateHeatmap();
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this.paraview.store.clearVisited();
    this.paraview.store.clearSelected();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
  }

  protected _addedToParent() {
    super._addedToParent();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
    /*
        todo().controller.registerSettingManager(this);
        todo().controller.settingViews.add(this, {
          type: 'textfield',
          key: 'type.scatter.resolution',
          label: 'Resolution',
          options: {
            inputType: 'number',
            min: 5,
            max: 100
          },
          parentView: 'chartDetails.tabs.chart.chart',
        });
        todo().deets!.chartPanel.requestUpdate();
        */
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'type.heatmap.resolution',
      label: 'Resolution',
      options: {
        inputType: 'number',
        min: 5,
        max: 100
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (path === 'type.heatmap.resolution') {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get grid() {
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }

  get settings() {
    return this._settings;
  }

  protected _createPrimaryNavNodes() {
    super._createPrimaryNavNodes();
    // Create vertical links between datapoints
    this._navMap!.root.query('series').forEach(seriesNode => {
      seriesNode.allNodes('right')
        // skip bottom row
        .slice(0, -this._resolution).forEach((pointNode, i) => {
        pointNode.connect('down', pointNode.layer.get('datapoint', i + this._resolution)!);
      });
    });
  }

  protected _createNavLinksBetweenSeries() {
    // Don't do anything here, since we create vertical links between rows
    // XXX For the case of a multi-series heatmap, we need to do ... something
  }

  protected _createChordNavNodes() {

  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new HeatmapTileView(this, seriesView);
  }

  protected _createDatapoints() {
    const xs: string[] = [];
    for (const [x, i] of enumerate(this.paraview.store.model!.allFacetValues('x')!)) {
      xs.push(formatBox(x, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
      const seriesView = new XYSeriesView(this, col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        //const datapointView = this._newDatapointView(seriesView);
        //seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
      for (let i = 0; i < this._resolution ** 2; i++) {
        const heatmapTile = new HeatmapTileView(this, seriesView);
        seriesView.append(heatmapTile)
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: XYSeriesView, b: XYSeriesView) => {
      return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    });
  }

  protected _generateHeatmap(): Array<Array<number>> {
    //const xValues = this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number)
    //const yValues = this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number)

    //for (let i = 0; i < xValues.length; i++){
    //  this._data.push([xValues[i],yValues[i]])
    //}

    const seriesList = this.paraview.store.model!.series
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetValueNumericized("x")!, series[i].facetValueNumericized("y")!]);
      }
    }

    const y: Array<number> = [];
    const x: Array<number> = [];

    for (let point of this._data) {
      x.push(point[0]);
      y.push(point[1]);
    }
    const xLabels = computeLabels(Math.min(...this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number)), Math.max(...this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number)), false)
    const yLabels = computeLabels(Math.min(...this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number)), Math.max(...this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number)), false)

    let yMax: number = yLabels.max!;
    let xMax: number = xLabels.max!;
    let yMin: number = yLabels.min!;
    let xMin: number = xLabels.min!;


    xMax += (xMax - xMin) / 10
    xMin -= (xMax - xMin) / 10


    const grid: Array<Array<number>> = [];

    for (let i = 0; i < this.resolution; i++) {
      grid.push([]);
      for (let j = 0; j < this.resolution; j++) {
        grid[i].push(0);
      }
    }
    for (let point of this._data) {
      const xIndex: number = Math.floor((point[0] - xMin) * this.resolution / (xMax - xMin));
      const yIndex: number = Math.floor((point[1] - yMin) * this.resolution / (yMax - yMin));
      grid[xIndex][this.resolution - yIndex - 1]++;
    }
    return this._grid = grid;
  }

  seriesRef(series: string) {
    return this.paraview.ref<SVGGElement>(`series.${series}`);
  }

  _raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getTickX(idx: number) {
    return this.datapointViews[idx].x; // this.points[idx][0].x;
  }

  get resolution() {
    return this._resolution
  }

  goSeriesMinMax(isMin: boolean): void {

  }

  goChartMinMax(isMin: boolean): void {

  }

}

export class HeatmapTileView extends DatapointView {

  declare readonly chart: Heatmap;
  declare protected _parent: XYSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;

  constructor(
    chart: Heatmap,
    series: SeriesView
  ) {

    super(series);
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get count() {
    return this._count
  }

  get fillColor(){
    let color = `hsl(0, 0%, 0%)`
    if (this._count > 0) {
      color = `hsl(0, 0%, ${(85 * this._count / this.chart.maxCount) + 15}%)`
    }
    return color
  }

  get _selectedMarkerX() {
    return this._x;
  }

  get _selectedMarkerY() {
    return this._y;
  }

  get selectedMarker(): Shape {
    return new RectShape(this.paraview, {
      width: this._width,
      height: this._height,
      x: this._x,
      y: this._y,
      fill: 'none',
      stroke: 'red',
      strokeWidth: 4,
    });
  }

  // protected get visitedTransform() {
  //   return 'scaleX(1.15)';
  // }

  protected _createId(..._args: any[]): string {
    //const facets = [...this.datapoint.entries()].map(([key, box]) =>
    // `${key}_${formatBox(box, this.paraview.store.getFormatType('domId'))}`).join('-');
    //console.log([...this.datapoint.entries()])
    //console.log(facets)

    return [
      'datapoint',
      strToId(this.series.key),
      //facets,
      `${this.index}`
    ].join('-');
  }

  completeLayout() {
    this._height = this.chart.parent.height / this.chart.resolution;
    this._width = this.chart.parent.width / this.chart.resolution;
    this._x = (this.index) % this.chart.resolution * this._width
    this._y = Math.floor((this.index) / this.chart.resolution) * this._height
    const id = this.index;
    this._count = this.chart.grid[id % this.chart.resolution][Math.floor(id / this.chart.resolution)]
    this._id = [
      'datapoint',
      strToId(this.seriesKey),
      `${this._x}`,
      `${this._y}`
    ].join('-');
    super.completeLayout();
  }

  protected _createSymbol() {
  }

  layoutSymbol() {
  }


  protected get _d() {
    return fixed`
      M${this._x},${this._y}
      v${this._height}
      h${this._width}
      v${-1 * this._height}
      Z`;
  }


  summary() {
    const length = this.chart.paraview.store!.model!.series[0].length
    const xInfo = this.chart.axisInfo!.xLabelInfo!
    const yInfo = this.chart.axisInfo!.yLabelInfo!
    const xSpan = xInfo.range! / this.chart.resolution
    const ySpan = yInfo.range! / this.chart.resolution
    const up = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.resolution))).toFixed(2)
    const down = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.resolution) + 1)).toFixed(2)
    const left = (xInfo.min! + xSpan * ((this.index - length) % this.chart.resolution)).toFixed(2)
    const right = (xInfo.min! + xSpan * ((this.index - length) % this.chart.resolution + 1)).toFixed(2)
    return `This block contains ${this.count} datapoints. It spans x values from ${left} to ${right}, and y values from ${down} to ${up}`
  }

  protected _createShapes() {
    //console.log("createShapes call")
    const shape = new RectShape(this.paraview, {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
      fill: this.fillColor,
      stroke: this.fillColor
    });
    //console.log(this.fillColor)
    //shape.styleInfo.fill = this.fillColor;
    this._shapes.push(shape)
    super._createShapes();
  }



    protected _contentUpdateShapes() {}
  
  prender() {
    let color = `hsl(0, 0%, 0%)`
    if (this._count > 0) {
      color = `hsl(0, 0%, ${(85 * this._count / this.chart.maxCount) + 15}%)`
    }
    return svg`
      <path
        d='${this._d}'
        role="datapoint"
        stroke-width= '${3}'
        fill= '${color}'
        stroke= '${this.paraview.store.visitedDatapoints.some(item => item.index === this.index) ? 'hsl(0, 100.00%, 50.00%)' : color}'
        id= '${this.id}'
      ></path>
    `;
  }

}

export class HeatmapTile extends RectShape {
/*
  constructor(paraview: ParaView, options: RectOptions) {
    super(paraview, options);
    this._width = options.width;
    this._height = options.height;
    if (options.isPattern){
      this._isPattern = options.isPattern;
    }
    console.log(this._styleInfo)
  }

  protected get _options(): RectOptions {
    let options = super._options as RectOptions;
    options.width = this._width;
    options.height = this._height;
    options.isPattern = this._isPattern
    return options;
  }
  
  clone(): RectShape {
    return new RectShape(this.paraview, this._options);
  }

  render() {
    let color = `hsl(0, 0%, 0%)`
    if (this.parent._count > 0) {
      color = `hsl(0, 0%, ${(85 * this.parent._count / this.parent.chart.maxCount) + 15}%)`
    }
    console.log(this.parent.fillColor)
    return svg`
      <path
        d='${this._d}'
        role="datapoint"
        stroke-width= '${3}'
        fill= '${this.parent.fillColor}'
        stroke= '${this.paraview.store.visitedDatapoints.some(item => item.index === this.index) ? 'hsl(0, 100.00%, 50.00%)' : color}'
        id= '${this.id}'
      ></path>
    `;
  }
  */
}