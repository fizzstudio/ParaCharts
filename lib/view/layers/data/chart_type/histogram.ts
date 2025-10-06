
import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { svg } from "lit";
import { AxisInfo, computeLabels } from "../../../../common/axisinfo";
import { fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { DeepReadonly, HistogramSettings, PointChartType, type Setting } from "../../../../store";
import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { PlanePlotView, PlaneSeriesView } from ".";
import { DatapointView, SeriesView } from "../../../data";
import { strToId } from "@fizz/paramanifest";

export class Histogram extends PlanePlotView {
  protected _createDatapoints(): void {
    
  }
}

export class HistogramBinView extends DatapointView {

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