import { getLogger } from '@fizz/logger';
import { Datapoint, enumerate } from "@fizz/paramodel";
import { nothing, svg } from "lit";
import { type BaseChartInfo } from '../../../../chart_types';
import { type HeatMapInfo } from '../../../../chart_types/heat_map';
import { fixed, getMostCommonReduce } from "../../../../common/utils";
import { type DataLayerContext } from '../../../view_context';
import { DatapointPopupOptions } from "../../../data";
import { RectShape } from "../../../shape/rect";
import { Shape } from "../../../shape/shape";
import { PlanePlotView, PlaneSeriesView, ScatterPointView } from ".";
import { classMap } from "lit/directives/class-map.js";
import { ref } from "lit/directives/ref.js";
import { styleMap } from "lit/directives/style-map.js";
import { View } from '../../../base_view';
import { Popup, ShapeTypes } from '../../../popup';
import { ConfigSetting } from '../../../../config/config_types';

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
    if (['type.heatmap.resolution', 'color.colorVisionMode'].includes(path)) {
      this.paraview.paraState.createChartInfo();
      this.paraview.createDocumentView();
      this._completeDatapointLayout();
      this.paraview.requestUpdate();
    }
    if (['color.colorPalette'].includes(path)) {
      this.paraview.paraState.createChartInfo();
      this.paraview.createDocumentView();
      this._completeDatapointLayout();
      this.paraview.requestUpdate();
      return;
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  get chartInfo(): HeatMapInfo {
    return this._chartInfo;
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new HeatmapPointView(seriesView);
  }

  protected _createDatapoints() {
    this.log.info('CREATING DATAPOINTS');
    const xs: string[] = [];
    for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
    }
    for (let i = 0; i < this._chartInfo.resolution ** 2; i++) {
      const tileView = new HeatmapTileView(this);
      this._tiles.push(tileView);
      // the `index` property of the datapoint view will equal j
    }

    //for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {
    //const seriesView = this._newSeriesView(col.key);
    //this._chartLandingView.append(seriesView);
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    //this._chartLandingView.sortChildren((a: PlaneSeriesView, b: PlaneSeriesView) => {
    //  return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    //});
  }

  // protected _layoutDatapoints() {
  //   for (const datapointView of this.datapointViews) {
  //     datapointView.completeLayout();
  //   }
  // }

  protected _completeDatapointLayout() {

    super._completeDatapointLayout();
    this._tiles.forEach(t => t.parent == undefined ? this.append(t) : nothing)
    this._tiles.forEach(t => t.completeLayout())
    this._tiles.forEach(t => t._createShapes())
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

export class HeatmapPointView extends ScatterPointView {
  content() {
    return svg``
  }

  protected _createSymbol(): void {
    return;
  }
  addDatapointPopup(options?: DatapointPopupOptions): void {
    return;
  }
}

export class HeatmapTileView extends View {

  declare readonly chart: HeatMapPlotView;
  declare protected _parent: PlaneSeriesView;

  protected _height!: number;
  protected _width!: number;
  protected _count: number = 0;
  protected _datapoints: Datapoint[] = [];
  protected _shapes: Shape[] = [];
  protected _fillColor!: string;
  protected _fillColorIndex!: number;
  _xIndex: number = 0;
  _yIndex: number = 0;
  constructor(
    chart: HeatMapPlotView,
  ) {
    super(chart.paraview);
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

  get datapoints() {
    return this._datapoints;
  }

  get fillColor() {
    if (this._fillColor) {
      return this._fillColor;
    }
    let color = `hsl(0, 0%, 0%)`;
    if (this._count > 0) {
      //this.chart.chartInfo.maxCount
      const cA = this.paraview.paraState.clusterAnalyses!;
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
      const baseColor = this.paraview.paraState.colors.colorValueAt(mostCommonCluster);
      const lightenCount = Math.floor(this._count / this.chart.chartInfo.maxCount * 8) - 2;
      const lightened = this.paraview.paraState.colors.lighten(baseColor, lightenCount);
      color = lightened;
    }
    this._fillColor = color;
    return color
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

  protected _createId(..._args: any[]): string {
    /*
    //const facets = [...this.datapoint.entries()].map(([key, box]) =>
    // `${key}_${formatBox(box, this.paraview.paraState.getFormatType('domId'))}`).join('-');
    return [
      'datapoint',
      strToId(this.series.key),
      //facets,
      `${this.index}`
    ].join('-');
    */
    return super._createId(..._args);
  }

  completeLayout() {
    const index = this.index - 1;
    const info = this.chart.chartInfo;
    this._height = this.chart.parent.height / info.resolution;
    this._width = this.chart.parent.width / info.resolution;
    this._yIndex = Math.floor(index / info.resolution);
    this._xIndex = index % info.resolution;
    this._x = this._xIndex * this._width;
    this._y = this._yIndex * this._height;
    this._count = info.grid[this._xIndex][this._yIndex];
    this._datapoints = info.datapointGrid[this._xIndex][this._yIndex];

    this.id = [
      'datapoint',
      //strToId(this.seriesKey),
      fixed`${this._x}`,
      fixed`${this._y}`
    ].join('-');

    //super.completeLayout();
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
        this.shouldAddHoverPopup() ? this.addPopup() : undefined;
      },
      pointerLeave: (e) => {
        this.paraview.paraState.removePopup(this.id);
      },
    });
    this._shapes.push(shape)
    this._shapes.forEach(shape => {
      this.append(shape);
    })
  }

  addPopup() {
    const index = this._yIndex * this.chart.chartInfo.resolution + this._xIndex + 1;
    let datapointText = `Tile ${index} / ${this.chart.chartInfo.resolution ** 2}: ${this.count} points`
    let x = this.x + this.width / 2;
    let y = this.y;
    let color = this.fillColorIndex;
    let fill = undefined;
    let shape = "boxWithArrow";
    let pointerControlled = false;
    let popup = new Popup(this.paraview,
      {
        text: datapointText,
        x: x,
        y: y,
        id: this.id,
        color: color,
        rotationExempt: this.paraview.paraState.type == 'bar' ? false : true,
        angle: this.paraview.paraState.type == 'bar' ? -90 : 0,
        pointerControlled,
        margin: this.height
      },
      {
        shape: shape as ShapeTypes,
        fill: fill
      });
    //focus ? this.paraview.paraState.focusPopups.push(popup) :
    //  select ? this.paraview.paraState.selectPopups.push(popup) :
    this.paraview.paraState.popups.push(popup);
    this._popup = popup;
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

  protected _onClick() {
    const parent = this.parent as HeatmapTileView;
    this.chart.chartInfo.navMap?.goTo('heatmapTile',
      {
        datapointCount: parent.count,
        datapoints: parent.datapoints,
        yIndex: parent._yIndex,
        xIndex: parent._xIndex
      });
  }

  render() {
    const cursor = this.chart.chartInfo.navMap!.cursor!
    if (cursor.type == 'heatmapTile' && cursor.index == this.parent!.index - 1) {
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
        role=${'clickable'}
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
          role=${'clickable'}
          x=${fixed`${this._x}`}
          y=${fixed`${this._y}`}
          width=${fixed`${this.width}`}
          height=${fixed`${this.height}`}
          fill= '${this.fillColor}'
          @click=${() => this._onClick()}
          @pointerenter=${this.options.pointerEnter ?? nothing}
          @pointerleave=${this.options.pointerLeave ?? nothing}
          clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        ></rect>
      `;
    }
  }
}
