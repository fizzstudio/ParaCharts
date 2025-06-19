import { enumerate, strToId } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { boxToNumber, fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { DeepReadonly, HistogramSettings, PointChartType } from "../../../../store";
import { Rect } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { XYChart, XYSeriesView } from "./xy_chart";
import { DatapointView, SeriesView } from "../../../data";

export class Histogram extends XYChart {
  protected _bins: number = 20;
  protected _data: Array<Array<number>> = [];
  protected _grid: Array<number> = [];
  protected _maxCount: number = 0;
  declare protected _settings: DeepReadonly<HistogramSettings>;
  constructor(
    paraview: ParaView,
    dataLayerIndex: number
  ) {
    super(paraview, dataLayerIndex);
    this._init()
  }

  _init() {
    this._settings = this.paraview.store.settings.type.histogram;
    this._bins = this.paraview.store.settings.type.histogram.bins ?? 20
    this._generateBins();
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this.paraview.store.clearVisited();
    this.paraview.store.clearSelected();

        const targetAxis = this.settings.groupingAxis as DeepReadonly<string> == '' ?
            this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)[0]
            : this.settings.groupingAxis
        let targetFacet;
        for (let facet of this.paraview.store.model!.facets) {
            if (this.paraview.store.model!.getFacet(facet.key as string)!.label == targetAxis) {
                targetFacet = facet.key
            }
        }
        //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
        let nonTargetFacet;
        if (targetFacet == "y") {
            nonTargetFacet = "x"
        }
        else {
            nonTargetFacet = "y"
        }
        const targetFacetBoxes = this.paraview.store.model!.allFacetValues(targetFacet!)!;
        const targetFacetNumbers = targetFacetBoxes.map((b) => boxToNumber(b, targetFacetBoxes));
        if (this.settings.displayAxis == "x" || this.settings.displayAxis == undefined) {
            this._axisInfo = new AxisInfo(this.paraview.store, {
                xValues: targetFacetNumbers,
                yValues: this.grid,
            });
        }
        else {
            this._axisInfo = new AxisInfo(this.paraview.store, {
                xValues: this.grid,
                yValues: targetFacetNumbers,
            });
        }
    }

  protected _addedToParent() {
    super._addedToParent();
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'type.histogram.bins',
      label: 'Bins',
      options: {
        inputType: 'number',
        min: 5,
        max: 100
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    const variables = this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)
    this.paraview.store.settingControls.add({
      type: 'dropdown',
      key: 'type.histogram.groupingAxis',
      label: 'Axis to group:',
      options: { options: variables as string[] },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this.paraview.store.settingControls.add({
      type: 'dropdown',
      key: 'type.histogram.displayAxis',
      label: 'Axis to display histogram:',
      options: { options: ["x", "y"] },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this.paraview.store.observeSetting('type.histogram.bins', (_oldVal, newVal) => {
      if (this.isActive) {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();

        this.paraview.store.updateSettings(draft => {
          draft.axis.y.maxValue = 'unset'
        });
        this.paraview.store.updateSettings(draft => {
          draft.axis.y.minValue = 'unset'
        });

      }
    });
    this.paraview.store.observeSettings(['type.histogram.groupingAxis', 'type.histogram.displayAxis', 'axis.y.maxValue', 'axis.y.minValue'], (_oldVal, newVal) => {
      if (this.isActive) {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
      }
    });
  }

  /*
  settingDidChange(key: string, value: any) {
      if (!super.settingDidChange(key, value)) {
        this.paraview.requestUpdate();
        return true;
      }
      return false;
    }
*/

  get datapointViews() {
    return super.datapointViews;
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

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new HistogramBinView(this, seriesView);
  }

  protected _beginLayout() {
    this._createDatapoints();
    for (const datapointView of this.datapointViews) {
      datapointView.computeLocation();
    }
    for (const datapointView of this.datapointViews) {
      datapointView.completeLayout();
    }

  }

  completeLayout() {
    super._completeLayout();
  }

  protected _createDatapoints() {
    const xs: string[] = [];
    for (const [p, i] of enumerate(this.paraview.store.model!.series[0].datapoints)) {
      console.log(`${this.parent.docView.type as PointChartType}Point`)
      xs.push(formatBox(p.facetBox('x')!, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
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
      for (let i = 0; i < this._bins; i++) {
        const bin = new HistogramBinView(this, seriesView);
        seriesView.append(bin)
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: XYSeriesView, b: XYSeriesView) => {
      return (b.children[0].datapoint.y.value as number) - (a.children[0].datapoint.y.value as number);
    });
  }

  protected _layoutDatapoints() {
    for (const datapointView of this.datapointViews) {
      datapointView.completeLayout();
    }
  }

  protected _generateBins(): Array<number> {
    const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined>
      ?? this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)[0]

    let targetFacet;
    for (let facet of this.paraview.store.model!.facets) {
      if (this.paraview.store.model!.getFacet(facet.key as string)!.label == targetAxis) {
        targetFacet = facet.key
      }
    }
    //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
    let nonTargetFacet;
    if (targetFacet == "y") {
      nonTargetFacet = "x"
    }
    else {
      nonTargetFacet = "y"
    }
    let workingLabels;
    if (targetFacet) {
      const yValues = []
      const xValues = []
      for (let datapoint of this.paraview.store.model!.series[0]) {
        xValues.push(datapoint.facetAsNumber(targetFacet) as number)
      }
      for (let datapoint of this.paraview.store.model!.series[0]) {
        yValues.push(datapoint.facetAsNumber(nonTargetFacet) as number)
      }
      workingLabels = computeLabels(Math.min(...xValues), Math.max(...xValues), false)
    }
    else {
      const xBoxes = this.paraview.store.model!.allFacetValues('x')!;
      const xNumbers = xBoxes.map((x) => boxToNumber(x, xBoxes));
      workingLabels = computeLabels(Math.min(...xNumbers), Math.max(...xNumbers), false);
    }
    const seriesList = this.paraview.store.model!.series
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetAsNumber(targetFacet ?? "x")!, series[i].facetAsNumber(nonTargetFacet ?? "y")!]);
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

    //console.log(xMax)
    //console.log(xMin)
    const grid: Array<number> = [];

    for (let i = 0; i < this.bins; i++) {
      grid.push(0);
    }

        for (let point of this._data) {
          // TODO: check that `- 1` is correct
          const xIndex: number = Math.floor((point[0] - xMin) * (this.bins - 1) / (xMax - xMin));
          console.log('xi', xIndex)
          grid[xIndex]++;
        }
        return this._grid = grid;
    }
    seriesRef(series: string) {
        return this.paraview.ref<SVGGElement>(`series.${series}`);
    }

  raiseSeries(series: string) {
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  /* 
  getDatapointGroupBbox(labelText: string) {
      const xSeries = this._model.indepSeries();
      // XXX Could take these directly from the DOM
      const labels = xSeries.mapBoxed(box => this._model.format(box, 'xTick'));
      const idx = labels.findIndex(label => label === labelText);
      if (idx === -1) {
          throw new Error(`no such datapoint with label '${labelText}'`);
      }
      const g = todo().canvas.ref<SVGGElement>('dataset').value!.children[idx] as SVGGElement;
      return g.getBBox();
  }
*/

  getTickX(idx: number) {
    return this.datapointViews[idx].x; // this.points[idx][0].x;
  }

  get bins() {
    return this._bins;
  }

  async moveRight() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof HistogramBinView) {
      if (!leaf.next) {
        //leaf.blur(false)
        //this._eventActionManager!.dispatch('series_endpoint_reached');
      }
      else {
        await leaf.next!.focus();
      }
    }
  }

  async moveLeft() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof HistogramBinView) {
      if (!leaf.prev) {
        //leaf.blur(false)
        //this._eventActionManager!.dispatch('series_endpoint_reached');
      }
      else {
        await leaf.prev!.focus();
      }
    }
  }

  async moveDown() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof HistogramBinView) {
      if (!leaf.prev) {
        //leaf.blur(false)
        //this._eventActionManager!.dispatch('series_endpoint_reached');
      }
      else {
        await leaf.prev!.focus();
      }
    } else if (leaf instanceof SeriesView) {
      if (!leaf.next) {
        await this._chartLandingView.children[0].children[0].focus();
        return;
      } else {
        await leaf.next!.focus();
        //this._sonifier.playNotification('series');
      }
    } else {
      // At chart root, so move to the first series landing 
      await this._chartLandingView.children[0].focus();
    }
  }

  async moveUp() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof HistogramBinView) {
      if (!leaf.next) {
        //leaf.blur(false)
        //this._eventActionManager!.dispatch('series_endpoint_reached');
      }
      else {
        await leaf.next!.focus();
      }
    }
  }

}

export class HistogramBinView extends DatapointView {

  declare readonly chart: Histogram;
  declare protected _parent: XYSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
  protected isVisited: boolean = false;
  constructor(
    chart: Histogram,
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

  get _selectedMarkerX() {
    return this._x;
  }

  get _selectedMarkerY() {
    return this._y;
  }

  get selectedMarker(): Shape {
    return new Rect(this.paraview, {
      width: this._width,
      height: this._height,
      x: this._x,
      y: this._y - this._height,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 4
    });
  }

  // protected get visitedTransform() {
  //   return 'scaleX(1.15)';
  // }

  computeLocation() {
  }
  layoutSymbol() {
  }
  /*
   completeLayout() {
  //super.completeLayout();
}
  */
  completeLayout() {
    console.log("bin completeLayout")
    if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined) {
      const id = this.index;
      this._y = this.chart.parent.height;
      this._width = this.chart.parent.width / this.chart.bins;
      this._x = (this.index) % this.chart.bins * this._width
      this._height = (((this.chart.grid[id] - this.chart.axisInfo!.yLabelInfo!.min!) / this.chart.axisInfo!.yLabelInfo!.max!) * this._y)
      this._count = this.chart.grid[id];
      this._id = [
        'datapoint-tile',
        strToId(this.seriesKey),
        `${this._x}`,
        `${this._y}`
      ].join('-');
    }
    else {
      const id = this.index - length;
      this._x = 0;
      this._height = this.chart.parent.height / this.chart.bins;
      this._y = (this.chart.grid.length - id - 1) % this.chart.bins * this._height + (this._height)
      this._width = (((this.chart.grid[id] - this.chart.axisInfo!.xLabelInfo!.min!) / this.chart.axisInfo!.xLabelInfo!.max!) * this.chart.parent.width)
      this._count = this.chart.grid[id];

      this._id = [
        'datapoint-tile',
        strToId(this.seriesKey),
        `${this._x}`,
        `${this._y}`
      ].join('-');

    }
  }

  summary() {
    const length = this.paraview.store.model!.series.flat()[0].length
    //const yInfo = this.chart.axisInfo!.yLabelInfo!
    //const ySpan = yInfo.range! / this.chart.bins
    //const up = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins))).toFixed(2)
    //const down = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins) + 1)).toFixed(2)
    const xInfo = this.chart.axisInfo!.xLabelInfo!
    const xSpan = xInfo.range! / this.chart.bins;
    const left = (xInfo.min! + xSpan * ((this.index) % this.chart.bins)).toFixed(2)
    const right = (xInfo.min! + xSpan * ((this.index) % this.chart.bins + 1)).toFixed(2)
    return `This bin contains ${this.count} datapoints, which is ${(100 * this.count / length).toFixed(2)}% of the overall data. 
        It spans x values from ${left} to ${right}}`

  }

  async onFocus() {
    await super.onFocus()
    this.isVisited = !this.isVisited
    this._visit();
    this.paraview.store.announce(this.summary());
  }

  protected _visit() {
    this.paraview.store.visit([{ seriesKey: this.seriesKey, index: this.index }]);
  }


  protected get _d() {
    return fixed`
          M${this._x},${this._y}
          v${-1 * this._height}
          h${this._width}
          v${this._height}
          Z`;
  }

  render() {
    let stroke = `hsl(0, 0%, 0%)`
    //let fill = todo().controller.colors.colorValueAt(this.seriesProps.color);
    let fill = 0;
    if (this.paraview.store.visitedDatapoints.some(item => item.index === this.index)) {
      if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined) {
        return svg`
                    <g>
                        <path
                            d='${this._d}'
                            role="datapoint"
                            stroke-width= '2'
                            fill= '${'hsl(0, 100.00%, 50.00%)'}'
                            stroke= '${stroke}'
                            id= '${this.id}'
                        ></path>
                        <line x1=${this._x} y1=${this._y} x2=${this._x + this._width} y2=${this._y} stroke="hsl(0, 100.00%, 50.00%)" stroke-width= 2 />
                    </g>
                `;
      }
      else {
        return svg`
                    <g>
                        <path
                            d='${this._d}'
                            role="datapoint"
                            stroke-width= '2'
                            fill= '${'hsl(0, 100.00%, 50.00%)'}'
                            stroke= '${stroke}'
                            id= '${this.id}'
                        ></path>
                        <line x1=${this._x} y1=${this._y} x2=${this._x} y2=${this._y - this._height} stroke="hsl(0, 100.00%, 50.00%)" stroke-width= 2 />
                    </g>
                `;
      }
    }
    else {
      return svg`
                    <path
                        d='${this._d}'
                        role="datapoint"
                        stroke-width= '2'
                        fill= '${fill}'
                        stroke= '${stroke}'
                        id= '${this.id}'
                    ></path>
            `;
    }
  }

}


/*
export class HistogramDatapointView extends XYDatapointView {

    declare readonly chart: Histogram;
    declare protected _parent: XYSeriesView;

    protected _height!: number;
    protected _width!: number;
    protected _color: number = 0;

    constructor(
        seriesView: XYSeriesView,
    ) {
        super(seriesView);
        this._id = [
                'datapoint-unused',
                strToId(this.seriesKey),
                `${this._x}`,
                `${this._y}`
            ].join('-');
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get color() {
        return this._color
    }

    get _selectedMarkerX() {
        return this._x;
    }

    get _selectedMarkerY() {
        return this._y;
    }

    // protected get visitedTransform() {
    //   return 'scaleX(1.15)';
    // }

    computeLayout() {
        
        const orderIdx = Object.keys(this.stack.bars).indexOf(this.series.name!);
        const distFromXAxis = Object.values(this.stack.bars).slice(0, orderIdx)
          .map(bar => bar._height)
          .reduce((a, b) => a + b, 0);
        const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
        this._height = this.datapoint.y.number*pxPerYUnit;
        this._x = this.stack.x + this.stack.cluster.x;
        this._y = this.chart.height - this._height - distFromXAxis;
        
        if (this.chart.settings.displayAxis == "x" || undefined){
            this._height = this.chart.height / this.chart.bins;
            this._width = this.chart.width / this.chart.bins;
            this._x = this.index % this.chart.bins * this._width
            this._y = Math.floor(this.index / this.chart.bins) * this._height
        }
        
    }

    protected get _d() {

        return fixed`
      M${this._x},${this._y}
      v${this._height}
      h${this._width}
      v${-1 * this._height}
      Z`;
    }

    render() {
        // 'stacked' === this.paraChart.multiseries && this.params.yInfo.stackOffset ?
        // aria-labelledby="${this.params.labelId}"
        //const visitedScale = this._isVisited ? this.chart.settings.highlightScale : 1;
        const visitedScale = 1.5
        const styles = {
            strokeWidth: 2 * visitedScale,
            fill: this.color,
            stroke: "white"
        };
        return svg``;
    }

}
*/