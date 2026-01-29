import { Logger, getLogger } from '@fizz/logger';
import { enumerate } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { nothing, svg } from "lit";
import { type BaseChartInfo } from '../../../../chart_types';
import { type HeatMapInfo } from '../../../../chart_types/heat_map';
import { fixed } from "../../../../common/utils";
import { ParaView } from "../../../../paraview";
import { DeepReadonly, HeatmapSettings, PointChartType, type Setting } from "../../../../state";
import { DatapointView, SeriesView } from "../../../data";

import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { PlanePlotView, PlaneSeriesView } from ".";
import { strToId } from "@fizz/paramanifest";
import { classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { styleMap } from "lit/directives/style-map.js";
import { NavNode } from "../navigation";

export class HeatMapPlotView extends PlanePlotView {
  declare protected _settings: DeepReadonly<HeatmapSettings>;
  declare protected _chartInfo: HeatMapInfo;
  constructor(
    paraview: ParaView,
    width: number,
    height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this.log = getLogger("HeatMapPlotView");
    this._settings = this.paraview.paraState.settings.type.heatmap;
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (path === 'type.heatmap.resolution') {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get settings() {
    return this._settings;
  }

  get chartInfo(): HeatMapInfo {
    return this._chartInfo;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new HeatmapTileView(this, seriesView);
  }

  protected _createDatapoints() {
    this.log.info('CREATING DATAPOINTS');
    const xs: string[] = [];
    for (const [x, i] of enumerate(this.paraview.paraState.model!.allFacetValues('x')!)) {
      xs.push(formatBox(x, this.paraview.paraState.getFormatType(`${this.parent.parent.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {
      const seriesView = new PlaneSeriesView(this, col.key);
      this._chartLandingView.append(seriesView);
      for (let i = 0; i < this._chartInfo.resolution ** 2; i++) {
        const heatmapTile = new HeatmapTileView(this, seriesView);
        seriesView.append(heatmapTile)
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: PlaneSeriesView, b: PlaneSeriesView) => {
      return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    });
  }

  // protected _layoutDatapoints() {
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.completeLayout();
  //   }
  // }

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

export class HeatmapTileView extends DatapointView {

  declare readonly chart: HeatMapPlotView;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;

  constructor(
    chart: HeatMapPlotView,
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
      color = `hsl(0, 0%, ${(85 * this._count / this.chart.chartInfo.maxCount) + 15}%)`
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
    // `${key}_${formatBox(box, this.paraview.paraState.getFormatType('domId'))}`).join('-');
    return [
      'datapoint',
      strToId(this.series.key),
      //facets,
      `${this.index}`
    ].join('-');
  }

  completeLayout() {
    const info = this.chart.chartInfo;
    this._height = this.chart.parent.height / info.resolution;
    this._width = this.chart.parent.width / info.resolution;
    this._x = (this.index) % info.resolution * this._width;
    this._y = Math.floor((this.index) / info.resolution) * this._height;
    const id = this.index;
    this._count = info.grid[id % info.resolution][Math.floor(id / info.resolution)]
    this.id = [
      'datapoint',
      strToId(this.seriesKey),
      fixed`${this._x}`,
      fixed`${this._y}`
    ].join('-');
    super.completeLayout();
  }

  protected _createSymbol() { }
  protected _contentUpdateShapes() { }
  layoutSymbol() { }

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
    this._styleInfo.stroke = this.paraview.paraState.visitedDatapoints.values().some(item =>
      item === (this.parent as HeatmapTileView).datapointId)
        ? 'hsl(0, 100.00%, 50.00%)'
        : this.options.stroke ?? this._options.stroke;
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
