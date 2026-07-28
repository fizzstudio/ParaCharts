import { classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { StyleInfo, styleMap } from "lit/directives/style-map.js";
import { nothing, svg } from "lit";
import { enumerate } from "@fizz/paramodel";
import { fixed } from "../../../../common/utils";
import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { type HistogramChartInfo } from '../../../../chart_types/histogram_chart';
import { PlanePlotView, type PlaneSeriesView } from "./plane_plot_view";
import { DatapointView } from "../../../data/datapoint";
import { type SeriesView } from "../../../data/series";
import { type ConfigSetting } from "../../../../config/config_types";

export class Histogram extends PlanePlotView {
  declare protected _chartInfo: HistogramChartInfo;

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
    if (['type.histogram.groupingFacet', 'type.histogram.displayAxis', 'type.histogram.relativeAxes',
      'axis.y.maxValue', 'axis.y.minValue', 'type.histogram.bins'].includes(path)) {
      this.paraview.paraState.setManifest(this.paraview.paraState.originalManifest!, undefined, false);
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get chartInfo() {
    return this._chartInfo;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new HistogramBinView(this, seriesView);
  }

  protected _createDatapoints() {
    for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
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
    return this.datapointViews[idx].x;
  }

}

export class HistogramBinView extends DatapointView {

  declare readonly chart: Histogram;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
  protected _shapes: Shape[] = [];
  constructor(
    chart: Histogram,
    series: SeriesView
  ) {
    super(series);
    this.chart = chart
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
      y: this._y,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 4
    });
  }

  computeLocation() {
  }

  layoutSymbol() {
  }

  protected _createSymbol(): void {
  }

  completeLayout() {
    const info = this.chart.chartInfo;
    const bins = info.bins;
    const id = this.index;
    const seriesIndex = this.parent.index;
    this._count = info.grid[seriesIndex][id];
    if (this.chart.config.displayAxis == "x" || this.chart.config.displayAxis == undefined) {
      this._width = this.chart.parent.width / bins;
      this._x = ((id) % bins) * this._width;
      const yMax = info.yRangeInfo!.interval.end;
      const yMin = info.yRangeInfo!.interval.start;
      const yRange = yMax - yMin;
      const pxPerYUnit = this.chart.parent.logicalHeight / yRange;
      this._height = Math.max(0, Math.abs(this.datapoint.facetValueAsNumber('y')! * pxPerYUnit));
      this._y = this.chart.parent.height - this._height;
      const multiSeriesAdjust = info.grid.slice(seriesIndex + 1, undefined)!.map(
        s => s[id]).map(h => h * pxPerYUnit).reduce((a, b) => a + b, 0);
      this.y -= multiSeriesAdjust;
    }
    else {
      this._height = this.chart.parent.height / bins;
      this._y = ((bins - id - 1) % (bins)) * this._height;
      const xMax = info.xRangeInfo!.interval.end;
      const xMin = info.xRangeInfo!.interval.start;
      const xRange = xMax - xMin;
      const pxPerYUnit = this.chart.parent.logicalWidth / xRange;
      this._width = Math.max(0, Math.abs(this.datapoint.facetValueAsNumber('x')! * pxPerYUnit));
      this._x = 0;
      const multiSeriesAdjust = info.grid.slice(seriesIndex + 1, undefined)!.map(
        s => s[id]).map(h => h * pxPerYUnit).reduce((a, b) => a + b, 0);
      this._x += multiSeriesAdjust;
    }
    super.completeLayout();
  }

  _createShapes() {
    this._shapes = [];
    let rect = new HistogramBin(this.paraview, {
      width: this._width,
      height: this.height,
      x: this._x,
      y: this._y,
      pointerEnter: (e) => {
        this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined;
      },
      pointerMove: (e) => {
        this.shouldAddHoverPopup() ? this.movePopupAction() : undefined;
      },
      pointerLeave: (e) => {
        this.chart.removeDatapointPopup(this);
      }
    })
    rect.role = 'datapoint'
    this._shapes.push(rect)
    this._shapes.forEach(shape => {
      this.append(shape);
    })
  }

  protected _shapeStyleInfo(_shapeIndex: number): StyleInfo {
    return { stroke: "black", strokeWidth: 2, ...this.styleInfo };
  }

}

export class HistogramBin extends RectShape {

  get chart() {
    const parent = this.parent as HistogramBinView;
    return parent.chart;
  }
  render() {
    const index = (this.parent instanceof DatapointView) ? this.parent.parent?.index : undefined;
    if (this.paraview.paraState.colors.palette.isPattern && index !== undefined) {
      this._styleInfo.fill = `url(#Pattern${index})`;
      return svg`
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
          @click=${this.options.click ?? nothing}
        ></rect>
      `;
    }
    else {
      return svg`
        <rect
          ${this._ref ? ref(this._ref) : undefined}
          id=${this._id || nothing}
          style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
          role=${this._role || nothing}
          x=${fixed`${this._x}`}
          y=${fixed`${this._y}`}
          width=${fixed`${this.width}`}
          height=${fixed`${this.height}`}
          clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
          @pointerenter=${this.options.pointerEnter ?? nothing}
          @pointerleave=${this.options.pointerLeave ?? nothing}
          @pointermove=${this.options.pointerMove ?? nothing}
          @click=${this.options.click ?? nothing}
        ></rect>
      `;
    }
  }
}