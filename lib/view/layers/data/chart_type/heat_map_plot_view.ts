import { classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { styleMap } from "lit/directives/style-map.js";
import { nothing, svg } from "lit";
import { getLogger } from '@fizz/logger';
import { enumerate } from "@fizz/paramodel";
import { type HeatMapInfo, type BaseChartInfo } from '../../../../chart_types';
import { fixed } from "../../../../common/utils";
import { type DataLayerContext } from '../../../view_context';
import { RectShape, Shape } from "../../../shape";
import { ConfigSetting } from '../../../../config/config_types';
import { PlaneDatapointView, PlanePlotView, PlaneSeriesView } from './plane_plot_view';
import { SeriesView } from "../../../data";

export class HeatMapPlotView extends PlanePlotView {
  declare protected _chartInfo: HeatMapInfo;
  protected _tiles: HeatmapTileView[] = [];
  constructor(
    paraview: DataLayerContext,
    width: number,
    height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this.log = getLogger("HeatMapPlotView");
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
    if (['type.heatmap.resolution', 'type.heatmap.xFacet', 'type.heatmap.yFacet',
      'color.colorVisionMode', 'color.colorPalette', 'color.isDarkModeEnabled'].includes(path)) {
      this.paraview.paraState.setManifest(this.paraview.paraState.originalManifest!, undefined, false);
      this.paraview.paraState.setCaption();
      this.paraview.paraState.clearSelected();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get chartInfo(): HeatMapInfo {
    return this._chartInfo;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new HeatmapTileView(this, seriesView);
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
    return this.datapointViews[idx].x; // this.points[idx][0].x;
  }

}

export class HeatmapTileView extends PlaneDatapointView {

  declare readonly chart: HeatMapPlotView;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
  protected _shapes: Shape[] = [];
  protected _fillColor!: string;
  protected _fillColorIndex!: number;
  _xIndex: number = 0;
  _yIndex: number = 0;
  constructor(
    chart: HeatMapPlotView,
    series: SeriesView
  ) {
    super(series);
    this.chart = chart;
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
    if (this._fillColor) {
      return this._fillColor;
    }
    if (this.paraview.paraState.config.color.isDarkModeEnabled) {
      let color = `hsl(0, 0%, 0%)`;
      if (this._count > 0) {
        //this.chart.chartInfo.maxCount
        //const cA = this.paraview.paraState.clusterAnalyses!;
        /*
        const indices = this._datapoints.map(d => {
          const seriesKey = d.seriesKey;
          const seriesIndex = this.paraview.paraState.model?.seriesKeys.indexOf(seriesKey)!
          let jimIndex = 0;
          for (let i = seriesIndex - 1; i >= 0; i--) {
            jimIndex += this.paraview.paraState.model!.series[i].datapoints.length;
          }
          return d.datapointIndex + jimIndex;
        })
        const clusterIds = indices.map(
          id => cA.findIndex(c => [...c.dataPointIDs, ...c.outlierIDs].includes(id)));
        const mostCommonCluster = getMostCommonReduce(clusterIds);
        this._fillColorIndex = mostCommonCluster;
        */
        const baseColor = this.paraview.paraState.colors.colorValueAt(0);
        const lightenCount = Math.floor(this._count / this.chart.chartInfo.maxCount * 8) - 2;
        const lightened = this.paraview.paraState.colors.lighten(baseColor, lightenCount);
        color = lightened;
      }
      this._fillColor = color;
      return color
    }
    else {
      let color = `hsl(0, 0%, 100%)`;
      if (this._count > 0) {
        const baseColor = this.paraview.paraState.colors.colorValueAt(0);
        const lightenCount = 2 - Math.floor(this._count / this.chart.chartInfo.maxCount * 8);
        const lightened = this.paraview.paraState.colors.lighten(baseColor, lightenCount);
        color = lightened;
      }
      this._fillColor = color;
      return color;
    }
  }

  get fillColorIndex() {
    return this._fillColorIndex;
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

  completeLayout() {
    const index = this.index;
    const info = this.chart.chartInfo;
    this._height = this.chart.parent.height / info.resolution;
    this._width = this.chart.parent.width / info.resolution;
    this._yIndex = Math.floor(index / info.resolution);
    this._xIndex = index % info.resolution;
    this._x = this._xIndex * this._width;
    this._y = this._yIndex * this._height;
    this._count = info.grid[this._xIndex][this._yIndex];
    this.id = [
      'datapoint',
      //strToId(this.seriesKey),
      fixed`${this._x}`,
      fixed`${this._y}`
    ].join('-');
    super.completeLayout();
  }

  protected _createSymbol() { }
  protected _contentUpdateShapes() { }
  layoutSymbol() { }

  _createShapes() {
    this._shapes = [];
    const strokeWidth = 3
    const fillColor = this.fillColor
    const shape = new HeatmapTile(this.paraview, {
      x: this._x + strokeWidth / 2,
      y: this._y + strokeWidth / 2,
      width: this._width - strokeWidth,
      height: this._height - strokeWidth,
      fill: fillColor,
      stroke: fillColor,
      strokeWidth: strokeWidth + .5,
      pointerEnter: (e) => {
        this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined;
      },
      pointerMove: (e) => {
        this.shouldAddHoverPopup() ? this.movePopupAction() : undefined;
      },
      pointerLeave: (e) => {
        this.chart.removeDatapointPopup(this);
      },
    });
    shape.role = 'datapoint';
    this._shapes.push(shape);
    this._shapes.forEach(shape => {
      this.append(shape);
    });
  }
}

export class HeatmapTile extends RectShape {
  get count() {
    const parent = this.parent as HeatmapTileView;
    return parent.count;
  }
  get chart() {
    const parent = this.parent as HeatmapTileView;
    return parent.chart;
  }

  get fillColor() {
    const parent = this.parent as HeatmapTileView;
    return parent.fillColor;
  }

  get fillColorIndex() {
    const parent = this.parent as HeatmapTileView;
    return parent.fillColorIndex;
  }

  get parentIndex() {
    const parent = this.parent as HeatmapTileView;
    return parent.index;
  }

  render() {
    const cursor = this.chart.chartInfo.navMap!.cursor!
    if (cursor.type == 'datapoint' && cursor.index == this.parent!.index) {
      this._styleInfo.stroke = 'var(--visited-color, hsl(0, 100%, 50%))'
      this._styleInfo.strokeWidth = 4;
    }
    else {
      this._styleInfo.stroke = this.options.stroke ?? this._options.stroke;
      this._styleInfo.strokeWidth = this.options.strokeWidth ?? this._options.strokeWidth;
    }

    const index = this.fillColorIndex
    if (this.paraview.paraState.colors.palette.isPattern && index !== undefined) {
      this._styleInfo.fill = `url(#Pattern${index})`
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
      ></rect>
    `;
    }
    else {
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
          @pointerenter=${this.options.pointerEnter ?? nothing}
          @pointerleave=${this.options.pointerLeave ?? nothing}
          clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        ></rect>
      `;
    }
  }
}
