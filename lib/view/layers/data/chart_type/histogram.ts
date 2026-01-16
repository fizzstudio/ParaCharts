import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { datapointIdToCursor, DeepReadonly, HistogramSettings, PointChartType, type Setting } from "../../../../state";
import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { PlanePlotView, PlaneSeriesView } from ".";
import { DatapointView, SeriesView } from "../../../data";
import { strToId } from "@fizz/paramanifest";
import { HistogramChartInfo } from '../../../../chart_types/histogram_chart';

export class Histogram extends PlanePlotView {
  declare protected _settings: DeepReadonly<HistogramSettings>;
  declare protected _chartInfo: HistogramChartInfo;

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.histogram.groupingAxis', 'type.histogram.displayAxis', 'type.histogram.relativeAxes', 'axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    } else if (path === 'type.histogram.bins') {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
        this.paraview.paraState.updateSettings(draft => {
          draft.axis.y.maxValue = 'unset'
        });
        this.paraview.paraState.updateSettings(draft => {
          draft.axis.y.minValue = 'unset'
        });
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  get datapointViews() {
    return super.datapointViews;
  }

  get settings() {
    return this._settings;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new HistogramBinView(this, seriesView);
  }

  protected _createDatapoints() {
    const xs: string[] = [];
    for (const [p, i] of enumerate(this.paraview.paraState.model!.series[0].datapoints)) {
      xs.push(formatBox(p.facetBox('x')!, this.paraview.paraState.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    const seriesView = new PlaneSeriesView(this, this.paraview.paraState.model!.series[0].key);
    this._chartLandingView.append(seriesView);
    for (let i = 0; i < this.chartInfo.bins; i++) {
        const bin = new HistogramBinView(this, seriesView);
        seriesView.append(bin)
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

  protected _layoutDatapoints() {
    for (const datapointView of this.datapointViews) {
      datapointView.completeLayout();
    }
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

export class HistogramBinView extends DatapointView {

  declare readonly chart: Histogram;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
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
      const id = this.index;
      this._y = this.chart.parent.height;
      this._width = this.chart.parent.width / info.bins;
      this._x = (this.index) % info.bins * this._width
      // this._height = (((info.grid[id] - info.axisInfo!.yLabelInfo!.min!) / info.axisInfo!.yLabelInfo!.max!) * this._y)
      if (this.chart.settings.relativeAxes == "Percentage"){
        this._height = this._height / info.grid.reduce((a, c) => a + c)
      }
      this._count = info.grid[id];
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
      this._height = this.chart.parent.height / info.bins;
      this._y = (info.grid.length - id - 1) % info.bins * this._height + (this._height)
      // this._width = (((info.grid[id] - info.axisInfo!.xLabelInfo!.min!) / info.axisInfo!.xLabelInfo!.max!) * this.chart.parent.width)
      if (this.chart.settings.relativeAxes == "Percentage"){
        this._width = this._width / info.grid.reduce((a, c) => a + c)
      }
      this._count = info.grid[id];

      this._id = [
        'datapoint-tile',
        strToId(this.seriesKey),
        `${this._x}`,
        `${this._y}`
      ].join('-');

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

  render() {
    let stroke = `hsl(0, 0%, 0%)`
    let fill = this.paraview.paraState.colors.colorValueAt(0)
    if (this.paraview.paraState.visitedDatapoints.values().some(item => {
      const cursor = datapointIdToCursor(item);
      return cursor.index === this.index;
    })) {
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