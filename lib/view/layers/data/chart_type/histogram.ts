import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { nothing, svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { fixed } from "../../../../common/utils";
import { type ViewContext } from '../../../view_context';
import { datapointIdToCursor, type Setting } from "../../../../state";
import { PointChartType } from '../../../../config/config_types';
import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { PlanePlotView, PlaneSeriesView, ScatterPointView } from ".";
import { DatapointView, SeriesView } from "../../../data";
import { strToId } from "@fizz/paramanifest";
import { HistogramChartInfo } from '../../../../chart_types/histogram_chart';
import { View } from "../../../base_view";
import { ClassInfo, classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { styleMap } from "lit/directives/style-map.js";

export class Histogram extends PlanePlotView {
  declare protected _chartInfo: HistogramChartInfo;
  protected _bins: HistogramBinView[] = []
  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.histogram.groupingAxis', 'type.histogram.displayAxis', 'type.histogram.relativeAxes', 'axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    } else if (path === 'type.histogram.bins') {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
      // this.paraview.paraState.updateSettings(draft => {
      //   draft.axis.y.maxValue = 'unset'
      // });
      // this.paraview.paraState.updateSettings(draft => {
      //   draft.axis.y.minValue = 'unset'
      // });
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  get datapointViews() {
    return super.datapointViews;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new ScatterPointView(seriesView);
  }

  protected _createDatapoints() {
    console.log("createDatapoints")
    const seriesView = new PlaneSeriesView(this, this.paraview.paraState.model!.series[0].key);
    this._chartLandingView.append(seriesView);
    for (let i = 0; i < this.chartInfo.bins; i++) {
      const bin = new HistogramBinView(this, seriesView);
      this._bins.push(bin)
    }
    //Note from Sam: I will add multi-series stacked support eventually, for now it makes more sense to have the values from each series
    //added together in the same bin
    /*
    for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {


      for (const [value, j] of enumerate(col)) {
        //const datapointView = this._newDatapointView(seriesView);
        //seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }

    }
      */
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: PlaneSeriesView, b: PlaneSeriesView) => {
      return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    });
  }
  /*
    protected _layoutDatapoints() {
      for (const datapointView of this.datapointViews) {
        datapointView.completeLayout();
      }
    }
  */
  protected _completeDatapointLayout(): void {
    console.log("bins", this._bins)
    console.log("grid", this.chartInfo.grid)
    super._completeDatapointLayout();
    this._bins.forEach(t => t.parent == undefined ? this.append(t) : nothing)
    this._bins.forEach(t => t.completeLayout())
    this._bins.forEach(t => t._createShapes())
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

}

export class HistogramBinView extends View {

  declare readonly chart: Histogram;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
  protected _shapes: Shape[] = []
  seriesKey: string = ''
  constructor(
    chart: Histogram,
    series: SeriesView
  ) {

    super(chart.paraview);
    this.chart = chart
    this.seriesKey = series.seriesKey
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
    return new RectShape(this.paraview, {
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
    const info = this.chart.chartInfo;
    if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined) {
      const id = this.index - 1;
      this._y = this.chart.parent.height;
      this._width = this.chart.parent.width / info.bins;
      this._x = (id) % info.bins * this._width
      //console.log("info.grid", info.grid)
      const gridMax = Math.max(...info.grid)
      this._height = (info.grid[id] / gridMax) * this._y
      if (this.chart.settings.relativeAxes == "Percentage") {
        this._height = this._height / info.grid.reduce((a, c) => a + c)
      }
      this._count = info.grid[id];
      /*
      this._id = [
        'datapoint-tile',
        strToId(this.seriesKey),
        `${this._x}`,
        `${this._y}`
      ].join('-');
      */
    }
    else {
      const id = this.index - length;
      this._x = 0;
      this._height = this.chart.parent.height / info.bins;
      this._y = (info.grid.length - id - 1) % info.bins * this._height + (this._height)
      // this._width = (((info.grid[id] - info.axisInfo!.xLabelInfo!.min!) / info.axisInfo!.xLabelInfo!.max!) * this.chart.parent.width)
      if (this.chart.settings.relativeAxes == "Percentage") {
        this._width = this._width / info.grid.reduce((a, c) => a + c)
      }
      this._count = info.grid[id];
      /*
      this._id = [
        'datapoint-tile',
        strToId(this.seriesKey),
        `${this._x}`,
        `${this._y}`
      ].join('-');
*/
    }
  }

  summary() {
    // const length = this.paraview.paraState.model!.series.flat()[0].length
    // //const yInfo = this.chart.axisInfo!.yLabelInfo!
    // //const ySpan = yInfo.range! / this.chart.bins
    // //const up = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins))).toFixed(2)
    // //const down = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins) + 1)).toFixed(2)
    // const xInfo = this.chart.chartInfo.axisInfo!.xLabelInfo!
    // const xSpan = xInfo.range! / this.chart.chartInfo.bins;
    // const left = (xInfo.min! + xSpan * ((this.index) % this.chart.chartInfo.bins)).toFixed(2)
    // const right = (xInfo.min! + xSpan * ((this.index) % this.chart.chartInfo.bins + 1)).toFixed(2)
    // return `This bin contains ${this.count} datapoints, which is ${(100 * this.count / length).toFixed(2)}% of the overall data.
    //     It spans x values from ${left} to ${right}}`
    return 'FIXME';
  }

  //Note: I'm overriding this for now because at the time of writing JIM doesn't support visualizations with a
  //different number of visible datapoints (treating bins as datapoints in this case) than exist in the dataset

  protected _createId(..._args: any[]): string {
    //const jimIndex = this._parent.modelIndex*this._series.length + this.index + 1;
    //const id = this.paraview.paraState.jimerator!.jim.selectors[`datapoint${jimIndex}`].dom as string;
    const id = `datapoint-${this.index}`
    // don't include the '#' from JIM
    return id;
  }


  protected get _d() {
    return fixed`
          M${this._x},${this._y}
          v${-1 * this._height}
          h${this._width}
          v${this._height}
          Z`;
  }

  _createShapes() {
    console.log("createShapes")
    this._shapes = [];
    let rect = new HistogramBin(this.paraview, {
      width: this._width,
      height: this.height,
      x: this._x,
      y: this._y - this.height,
      stroke: "black",
      strokeWidth: 2,
      click: (e) => this._onClick()
    })
    rect.role = 'clickable'
    this._shapes.push(rect)
    this._shapes.forEach(shape => {
      this.append(shape);
    })
  }

  get classInfo(): ClassInfo {
    const index = this.index;
    return {
      datapoint: true,
      [`series-${0}`]: true,
      visited: this.paraview.paraState.isVisited(this.seriesKey, index),
      selected: this.paraview.paraState.isSelected(this.seriesKey, index),
      highlighted: this.paraview.paraState.isDatapointHighlighted(this.seriesKey, index),
      lowlighted: this.paraview.paraState.isDatapointLowlighted(this.seriesKey, index)
    };
  }

  protected _onClick() {
    /*
    this.chart.chartInfo.navMap?.goTo('heatmapTile',
      {
        datapointCount: parent.count,
        datapoints: parent.datapoints,
        yIndex: parent._yIndex,
        xIndex: parent._xIndex
      });
      */
  }

  content() {
    return svg`
              <g
                id=${this._id}
                class=${classMap(this.classInfo)}
              >
                ${super.content()}
              </g>`;
  }
  /*
  render() {
    console.log("render")
  
    const isVisited = this.paraview.paraState.visitedDatapoints.values().some(item => {
      const cursor = datapointIdToCursor(item);
      return cursor.index === this.index;
    });
    if (isVisited) {
      const axis = this.chart.settings.displayAxis;
      const line = axis === 'y'
        ? svg`<line x1=${this._x} y1=${this._y} x2=${this._x} y2=${this._y - this._height} stroke="var(--visited-color, hsl(0,100%,50%))" stroke-width=2 />`
        : svg`<line x1=${this._x} y1=${this._y} x2=${this._x + this._width} y2=${this._y} stroke="var(--visited-color, hsl(0,100%,50%))" stroke-width=2 />`;
      return svg`
        <g>
          <path d=${this._d} role="datapoint" stroke-width=2
            class="series-0 datapoint visited" id=${this.id}></path>
          ${line}
        </g>
      `;
    }
    return svg`
      <path class="series-0" d=${this._d} role="datapoint"
        stroke-width=2 stroke="hsl(0,0%,0%)" id=${this.id}></path>
    `;
  }
*/
}

export class HistogramBin extends RectShape {

  get chart() {
    const parent = this.parent as HistogramBinView;
    return parent.chart;
  }
  render() {
    const cursor = this.chart.chartInfo.navMap!.cursor!
    if (cursor.type == 'histogramBin' && cursor.index == this.parent!.index - 1) {
      this._classInfo.visited = true;
      this._styleInfo.strokeWidth = 4;
    }
    else {
      this._classInfo.visited = false;
      this._styleInfo.strokeWidth = this.options.strokeWidth ?? this._options.strokeWidth;
    }
    console.log(this._classInfo)
    console.log(classMap(this._classInfo))
    const index = (this.parent instanceof DatapointView) ? this.parent.parent?.index : undefined;
    if (this.paraview.paraState.colors.palette.isPattern && index !== undefined) {
      this._styleInfo.fill = `url(#Pattern${index})`
      return svg`
        <defs>${this.paraview.paraState.colors.patternValueAt(index)}</defs>
        <rect
          x=${fixed`${this._x}`}
          y=${fixed`${this._y}`}
          width=${fixed`${this.width}`}
          height=${fixed`${this.height}`}
          fill="white"
          stroke-width=2
        ></rect>
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
          @pointerenter=${this.options.pointerEnter ?? nothing}
          @pointerleave=${this.options.pointerLeave ?? nothing}
        ></rect>
      `;
    }
    else {
      return svg`
        <rect
          ${this._ref ? ref(this._ref) : undefined}
          id=${this._id || nothing}
          style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
          class=${Object.keys(this._classInfo).length ? classMap( this._classInfo) : nothing}
          role=${this._role || nothing}
          x=${fixed`${this._x}`}
          y=${fixed`${this._y}`}
          width=${fixed`${this.width}`}
          height=${fixed`${this.height}`}
          clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
          @pointerenter=${this.options.pointerEnter ?? nothing}
          @pointerleave=${this.options.pointerLeave ?? nothing}
          @pointermove=${this.options.pointerMove ?? nothing}
        ></rect>
      `;
    }
  }
}