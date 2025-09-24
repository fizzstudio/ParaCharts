import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { nothing, svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { DeepReadonly, HeatmapSettings, PointChartType, type Setting } from "../../../../store";
import { DatapointView, SeriesView } from "../../../data";

import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { XYChart, XYSeriesView } from "./xy_chart";
import { strToId } from "@fizz/paramanifest";
import { classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { styleMap } from "lit/directives/style-map.js";
import { NavNode } from "../navigation";

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

  async navRunDidEnd(cursor: NavNode) {
    if (cursor.type === 'datapoint') {
      const dpView = cursor.datapointViews[0] as HeatmapTileView;
      this.paraview.store.announce(dpView.summary())
    }
    //Sam: Most stuff here (summaries, sparkbraille, sonification) is not implemented yet for heatmaps, 
    // I'm overriding to prevent errors, uncomment this as they get added
    /*
      const seriesKey = cursor.at(0)?.seriesKey ?? '';
      if (cursor.type === 'top') {
        await this.paraview.store.asyncAnnounce(this.paraview.summarizer.getChartSummary());
      } else if (cursor.type === 'series') {
        this.paraview.store.announce(
          await this.paraview.summarizer.getSeriesSummary(seriesKey));
        this._playRiff();
        this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'datapoint') {
        // NOTE: this needs to be done before the datapoint is visited, to check whether the series has
        //   ever been visited before this point
        const seriesPreviouslyVisited = this.paraview.store.everVisitedSeries(seriesKey);
        const announcements = [this.paraview.summarizer.getDatapointSummary(cursor.at(0)!.datapoint, 'statusBar')];
        const isSeriesChange = !this.paraview.store.wasVisitedSeries(seriesKey);
        if (isSeriesChange) {
          announcements[0] = `${seriesKey}: ${announcements[0]}`;
          if (!seriesPreviouslyVisited) {
            const seriesSummary = await this.paraview.summarizer.getSeriesSummary(seriesKey);
            announcements.push(seriesSummary);
          }
        }
        this.paraview.store.announce(announcements);
        if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          this._playDatapoints([cursor.at(0)!.datapoint]);
        }
        this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'chord') {
        if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          if (this.paraview.store.settings.sonification.isArpeggiateChords) {
            this._playRiff(this._chordRiffOrder());
          } else {
            this._playDatapoints(cursor.datapointViews.map(view => view.datapoint));
          }
        }
      } else if (cursor.type === 'sequence') {
        this.paraview.store.announce(await this.paraview.summarizer.getSequenceSummary(cursor.options as SequenceNavNodeOptions));
        this._playRiff();
      }
        */
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

  get fillColor() {
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
      width: this._width + 4,
      height: this._height + 4,
      x: this._x - 2,
      y: this._y - 2,
      fill: 'none',
      stroke: 'red',
      strokeWidth: 5,
    });
  }

  protected _createId(..._args: any[]): string {
    //const facets = [...this.datapoint.entries()].map(([key, box]) =>
    // `${key}_${formatBox(box, this.paraview.store.getFormatType('domId'))}`).join('-');
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

  protected _createSymbol() { }
  protected _contentUpdateShapes() { }
  layoutSymbol() { }

  summary() {
    const xInfo = this.chart.axisInfo!.xLabelInfo!
    const yInfo = this.chart.axisInfo!.yLabelInfo!
    const xSpan = xInfo.range! / this.chart.resolution
    const ySpan = yInfo.range! / this.chart.resolution
    const up = (yInfo.max! - ySpan * (Math.floor((this.index) / this.chart.resolution))).toFixed(2)
    const down = (yInfo.max! - ySpan * (Math.floor((this.index) / this.chart.resolution) + 1)).toFixed(2)
    const left = (xInfo.min! + xSpan * ((this.index) % this.chart.resolution)).toFixed(2)
    const right = (xInfo.min! + xSpan * ((this.index) % this.chart.resolution + 1)).toFixed(2)
    return `This block contains ${this.count} datapoints. It spans x values from ${left} to ${right}, and y values from ${down} to ${up}`
  }

  protected _createShapes() {
    const shape = new HeatmapTile(this.paraview, {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
      fill: this.fillColor,
      stroke: this.fillColor
    });
    this._shapes.push(shape)
    super._createShapes();
  }
}

export class HeatmapTile extends RectShape {
  get count() {
    let parent = this.parent as HeatmapTileView;
    return parent.count;
  }
  get chart() {
    let parent = this.parent as HeatmapTileView;
    return parent.chart;
  }
  get fillColor() {
    let parent = this.parent as HeatmapTileView;
    return parent.fillColor;
  }

  get parentIndex() {
    let parent = this.parent as HeatmapTileView;
    return parent.index;
  }
  render() {
    this._styleInfo.stroke = this.paraview.store.visitedDatapoints.some(item => item.index === this.parentIndex) ? 'hsl(0, 100.00%, 50.00%)' : this.options.stroke ?? this._options.stroke
    return svg`
        <rect
          ${this._ref ? ref(this._ref) : undefined}
          id=${this._id || nothing}
          style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
          class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
          role=${this._role || nothing}
          x=${fixed`${this._x}`}
          y=${fixed`${this._y}`}
          width=${fixed`${this.width}`}
          height=${fixed`${this.height}`}
          fill= '${this.fillColor}'

          clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        ></rect>
      `;
  }
}