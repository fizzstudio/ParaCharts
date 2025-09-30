import { type PlaneSeriesView, PointPlotView, PointDatapointView, PlaneDatapointView, TrendLineView } from '.';
import { type ScatterSettings, Setting, type DeepReadonly, PointChartType } from '../../../../store/settings_types';
import { DataSymbol, DataSymbols } from '../../../symbol';
import { svg, TemplateResult } from 'lit';
import { View } from '../../../base_view';
import { Colors } from '../../../../common/colors';
import { enumerate } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { strToId } from '@fizz/paramanifest';
import { ClassInfo } from 'lit/directives/class-map.js';
import { ScatterChartInfo } from '../../../../chart_types';
import { fixed } from '../../../../common/utils';


export class ScatterPlotView extends PointPlotView {
  declare protected _chartInfo: ScatterChartInfo;

  datapointViewsStatic?: ScatterPointView[];

  protected _clusterShellView: ClusterShellView | null = null;

  get settings() {
    return super.settings as DeepReadonly<ScatterSettings>;
  }

  get chartInfo(): ScatterChartInfo {
    return this._chartInfo;
  }

  get datapointViews() {
    return super.datapointViews as ScatterPointView[];
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.scatter.isShowOutliers'].includes(path)) {
      this.updateOutliers();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new ScatterPointView(seriesView);
  }

  protected _createDatapoints(): void {
    //Note: this is the same as the PointChart implementation at the time I copied it over, except it doesn't sort at the end
    const xs: string[] = [];
    for (const [p, i] of enumerate(this.paraview.store.model!.series[0].datapoints)) {
      xs.push(formatBox(p.facetBox('x')!, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
    }
    const datapointViews = this.datapointViews;
    for (const cluster of this._chartInfo.clustering!) {
      for (const id of cluster.dataPointIDs) {
        datapointViews[id].clusterID = cluster.id;
      }
      for (const id of cluster.outlierIDs) {
        datapointViews[id].clusterID = cluster.id;
        datapointViews[id].isOutlier = true;
      }
    }

    this.datapointViewsStatic = super.datapointViews as ScatterPointView[];
  }

  protected _beginDatapointLayout(): void {
    super._beginDatapointLayout();
    for (let child of this.children) {
      if (child instanceof ScatterTrendLineView) {
        child.remove();
      }
    }
    let trendLine = new ScatterTrendLineView(this);
    this.append(trendLine);
  }

  updateOutliers() {
    for (let datapoint of this.datapointViews) {
      if (datapoint.isOutlier) {
        datapoint.completeLayout();
      }
    }
  }

  content(...options: any[]) {
    const chartInfo = this.parent.docView.chartInfo as ScatterChartInfo;
    if (chartInfo.clustering) {
      this._clusterShellView?.remove();
      if (chartInfo.currentCluster !== -1) {
        this._clusterShellView = new ClusterShellView(this, chartInfo.currentCluster);
        this.append(this._clusterShellView);
      }
    }
    return super.content(...options);
  }

}

class ScatterPointView extends PointDatapointView {
  declare readonly chart: ScatterPlotView;
  symbolColor: number | undefined;
  clusterID?: number;
  isOutlier: boolean = false;

  protected _computeX() {
    const axisInfo = this.chart.chartInfo.axisInfo!;
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.facetValueNumericized('x')! - axisInfo.xLabelInfo.min!)
      / axisInfo.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  get width() {
    if (this._symbol?.width!) {
      return 2 * 1.5 * this._symbol!.width
    }
    else {
      return 36
    }
  }

  protected _createShape(): void {
  }

  protected get _symbolColor() {
    return this.paraview.store.isVisited(this.seriesKey, this.index)
      ? -1
      : this.symbolColor;
  }

  protected _createSymbol(): void {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    let color: number = series.color;
    const types = new DataSymbols().types;
    if (this.chart.chartInfo.clustering) {
      if (this.clusterID !== undefined) {
        color = Number(this.clusterID)
        symbolType = types[color % types.length]
      }
      else {
        symbolType = types[8]
      }
      const isShowOutliers = this.paraview.store.settings.type.scatter.isShowOutliers
      if (isShowOutliers && this.isOutlier) {
        color = 0
        symbolType = types[8]
      }
    }
    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      lighten: true
    });
    this._symbol.role = 'datapoint'
    this._symbol.id = `${this._id}-sym`;
    this.symbolColor = color;
    this._children = this.children.filter(c => c.id == this._symbol!.id)
    this.append(this._symbol);
  }

  get classInfo(): ClassInfo {
    return {
      [`cluster-${this.clusterID}`]: this.clusterID !== undefined,
      ...super.classInfo
    };
  }
}

export class ScatterTrendLineView extends TrendLineView{
  render() {
    if (!this.paraview.store.settings.type.scatter.isDrawTrendLine) { return svg``}
    return svg`
    <line x1=${this.x1} x2=${this.x2} y1=${this.y1} y2=${this.y2} style="stroke:red;stroke-width:3"/>
    `}
}

export class ClusterShellView extends View {
  protected _points: Array<Array<number>> = [];
  constructor(private chart: ScatterPlotView, private clusterID?: number, private selectedPoints?: PlaneDatapointView[]) {
    super(chart.paraview);
    this.generatePoints();
  }

  protected _createId(..._args: any[]): string {
    return ``;
  }

  get width() {
    return this._width
    //return this.selectionLayer.width;
  }

  get height() {
    return this._height
    //return Math.max(this.selectionLayer.height, 20);
  }

  protected generatePoints() {
    if (this.selectedPoints !== undefined) {
      let points = [];
      for (let point of this.selectedPoints) {
        points.push([point.x, point.y])
      }
      this._points = points;
    } else if (this.clusterID !== undefined) {
      const datapointViews = this.chart.datapointViewsStatic!
      const chartInfo = this.chart.parent.docView.chartInfo as ScatterChartInfo;
      const clustering = chartInfo.clustering!;
      const shellIDsList = clustering[this.clusterID].hullIDs;
      const points = [];
      for (const ID of shellIDsList) {
        points.push([datapointViews[ID].x, datapointViews[ID].y]);
      }
      this._points = points;
    } else {
      this._points = [];
    }
  }

  get points() {
    return this._points;
  }

  get pointsString() {
    let pointsString: string = "";
    for (const point of this.points!) {
      pointsString = pointsString.concat(fixed`${point[0]},${point[1]} `);
    }
    return pointsString;
  }

  get centroid() {
    const c: number[] = [0, 0];
    for (const point of this.points!) {
      c[0] += (point[0] / this.points!.length);
      c[1] += (point[1] / this.points!.length);
    }
    return c;
  }

  get color() {
    if (this.clusterID !== undefined) {
      return this.clusterID
    }
    else {
      return 0
    }
  }

  render() {
    let colors = new Colors(this.paraview.store);
    return svg`<g>
      <polygon points=${this.pointsString} style="stroke:black; fill:none; stroke-width:2"/>
      <circle
        cx=${fixed`${this.centroid[0]}`}
        cy=${fixed`${this.centroid[1]}`} r="8"
        style=stroke:black;fill:${colors.colorValueAt(this.color)}
      />
    </g>`
  }
}