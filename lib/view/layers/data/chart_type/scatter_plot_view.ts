import { svg } from 'lit';
import { ClassInfo } from 'lit/directives/class-map.js';
import { Datapoint, enumerate, PlaneModel } from '@fizz/paramodel';
import { DataSymbol, DataSymbols } from '../../../symbol';
import { View } from '../../../base_view';
import { PlaneChartInfo, type ScatterChartInfo } from '../../../../chart_types';
import { fixed } from '../../../../common/utils';
import { ConfigSetting } from '../../../../config/config_types';
import { PointDatapointView, PointPlotView, type PointSeriesView, type TrendLineView } from './point_plot_view';


export class ScatterPlotView extends PointPlotView {
  declare protected _chartInfo: ScatterChartInfo;
  protected _types = new DataSymbols().types;
  _trendLine?: TrendLineView;

  protected _clusterShellView: ClusterShellView | null = null;

  get chartInfo(): ScatterChartInfo {
    return this._chartInfo;
  }

  get datapointViews() {
    return super.datapointViews as ScatterPointView[];
  }

  get types() {
    return this._types
  }

  get model() {
    return super.model as PlaneModel;
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
    if (['type.scatter.isShowOutliers'].includes(path)) {
      this.updateOutliers();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  protected _newDatapointView(seriesView: PointSeriesView) {
    return new ScatterPointView(seriesView);
  }

  protected _createDatapoints(): void {
    //Note: this is the same as the PointChart implementation at the time I copied it over, except it doesn't sort at the end
    const xs: string[] = [];
    /*
    for (const [p, i] of enumerate(this.paraview.paraState.model!.series[0].datapoints)) {
      xs.push(formatBox(p.facetBox('x')!, this.paraview.paraState.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
      */
    for (const [col, i] of enumerate(this.paraview.paraState.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
    }
    const datapointViews = this.datapointViews;
    if (this._chartInfo.clustering) {
      for (const cluster of this._chartInfo.clustering) {
        for (const id of cluster.dataPointIDs) {
          datapointViews[id].clusterID = cluster.id;
        }
        for (const id of cluster.outlierIDs) {
          datapointViews[id].clusterID = cluster.id;
          datapointViews[id].isOutlier = true;
        }
      }
    }
  }

  noticePosted(key: string, value: any): void {
    if (['animRevealEnd'].includes(key)) {
      this._completeDatapointLayout();
    }
  }

  updateOutliers() {
    for (let datapoint of this.datapointViews) {
      if (datapoint.isOutlier) {
        datapoint.completeLayout();
      }
    }
  }

  content(...options: any[]) {
    const chartInfo = this.paraview.paraState.chartInfo as ScatterChartInfo;
    if (chartInfo.clustering) {
      this.paraview.paraState.clusterShellViews = this.paraview.paraState.clusterShellViews.filter(c => c.clusterID !== this._clusterShellView?.clusterID)
      this._clusterShellView?.remove();
      if (chartInfo.currentCluster !== -1) {
        this._clusterShellView = new ClusterShellView(this, chartInfo.currentCluster);
        this.paraview.paraState.clusterShellViews.push(this._clusterShellView)
      }
    }
    return super.content(...options);
  }

  addClusterShell(index: number) {
    this.paraview.paraState.clusterShellViews.splice(0, this.paraview.paraState.clusterShellViews.length);
    this.paraview.paraState.clusterShellViews.push(new ClusterShellView(this, index));
  }

  dimOtherClusters(seriesKey: string, index: number) {
    const chartInfo = this.chartInfo as ScatterChartInfo;
    const otherDatapoints = chartInfo._clustering!.filter(c => c.id !== index).map(
      c => { return [...c.dataPointIDs, ...c.outlierIDs] }).flat();
    otherDatapoints.map(id => this.paraview.paraState.lowlightDatapoint(seriesKey, id))
    this.paraview.paraState.refreshParaView();
  }


  pinCluster(seriesKey: string, index: number) {
    this.unpinCluster();
    this.paraview.paraState.pinnedCluster = index;
    this.dimOtherClusters(seriesKey, index);
  }

  unpinCluster() {
    this.paraview.paraState.pinnedCluster = null;
    this.paraview.paraState.clearAllDatapointLowlights();
  }

  hideCluster(seriesKey: string, index: number) {
    this._resetFrontedDatapoints();
    const { frontDatapoints, backDatapoints } = this.getPointsbyCluster(index);
    frontDatapoints.forEach(p => this.paraview.paraState.hideDatapoint(p.seriesKey, p.datapointIndex));
    this.paraview.paraState.hideCluster(index);
    this.paraview.paraState.refreshParaView();
  }

  unhideCluster(seriesKey: string, index: number) {
    this._resetFrontedDatapoints();
    const { frontDatapoints, backDatapoints } = this.getPointsbyCluster(index);
    frontDatapoints.forEach(p => this.paraview.paraState.clearDatapointHidden(p.seriesKey, p.datapointIndex));
    this.paraview.paraState.unhideCluster(index);
    this.paraview.paraState.refreshParaView();
  }

  getPointsbyCluster(index: number): { frontDatapoints: Datapoint[], backDatapoints: Datapoint[] } {
    let frontDatapoints: Datapoint[] = [];
    let backDatapoints: Datapoint[] = [];
    const points = this.model!.allPoints;
    for (let point of points) {
      if ([...this.paraview.paraState.clusterAnalyses![index].dataPointIDs, ...this.paraview.paraState.clusterAnalyses![index].outlierIDs].includes(point.datapointIndex)) {
        frontDatapoints.push(point);
      }
      else {
        backDatapoints.push(point);
      }
    }
    return { frontDatapoints, backDatapoints };
  }
}

export class ScatterPointView extends PointDatapointView {
  declare readonly chart: ScatterPlotView;
  symbolColor: number | undefined;
  clusterID?: number;
  isOutlier: boolean = false;

  computeX() {
    const xRange = (this.chart.chartInfo as PlaneChartInfo).xRangeInfo!;
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.facetValueNumericized('x')! - xRange.interval.start)
      / (xRange.interval.end - xRange.interval.start);
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  protected _createShapes(): void {
  }

  protected get _symbolColor(): number {
    // @simonvarey: I added the symbolColor assignment to fix a build error. It may be incorrect
    if (this.symbolColor === undefined) {
      this.symbolColor = this.seriesProps.colorIndex;
    }
    return this.paraview.paraState.isVisited(this.seriesKey, this.index)
      ? -1
      : this.symbolColor;
  }

  protected _createSymbol(): void {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    let color: number = series.colorIndex;
    const types = this.chart.types;
    if (this.chart.chartInfo.clustering) {
      if (this.clusterID !== undefined) {
        color = Number(this.clusterID)
        symbolType = types[color % types.length]
      }
      else {
        symbolType = types[8]
      }
      const isShowOutliers = this.paraview.paraState.config.type.scatter.isShowOutliers
      if (isShowOutliers && this.isOutlier) {
        color = 0
        symbolType = types[8]
      }
    }
    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.paraState.config.chart.symbolStrokeWidth,
      lighten: true,
      pointerEnter: (e) => {
        this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined
      },
      pointerLeave: (e) => {
        this.paraview.paraState.removePopup(this.id);
      },
      datapoint: this.datapoint
    });
    this._symbol.role = 'datapoint'
    this._symbol.id = `${this._id}-sym`;
    this.symbolColor = color;
    this._children = this.children.filter(c => !(c instanceof DataSymbol))
    this.append(this._symbol);
  }

  get classInfo(): ClassInfo {
    return {
      [`cluster-${this.clusterID}`]: this.clusterID !== undefined,
      ...super.classInfo
    };
  }

  get colorIndex() {
    if (this.chart.chartInfo.clustering) {
      return this.clusterID!
    }
    return super.colorIndex
  }

  endAnimStep(bezT: number, linearT: number) {
    //this.completeLayout();
    this._symbol!.y = this.y
  }
}


export class ClusterShellView extends View {
  protected _points: Array<Array<number>> = [];
  constructor(private chart: ScatterPlotView, public clusterID?: number, private selectedPoints?: ScatterPointView[]) {
    super(chart.paraview);
    this.generatePoints();
  }

  protected _createId(..._args: any[]): string {
    return ``;
  }

  protected generatePoints() {
    if (this.selectedPoints !== undefined) {
      let points = [];
      for (let point of this.selectedPoints) {
        points.push([point.x, point.y])
      }
      this._points = points;
    } else if (this.clusterID !== undefined) {
      const datapointViews = this.chart.datapointViews;
      const chartInfo = this.paraview.paraState.chartInfo as ScatterChartInfo;
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

  get centroidCoords() {
    const c: number[] = [0, 0];
    for (const point of this.points!) {
      c[0] += (point[0] / this.points!.length);
      c[1] += (point[1] / this.points!.length);
    }
    return c;
  }

  get centroidColor() {
    if (this.clusterID !== undefined) {
      const numColors = this.paraview.paraState.colors.numSeriesColors;
      return this.clusterID % numColors;
    }
    else {
      return 0;
    }
  }

  render() {
    return svg`<g>
      <polygon points=${this.pointsString} style="stroke:black; fill:none; stroke-width:2"/>
      <circle
        cx=${fixed`${this.centroidCoords[0]}`}
        cy=${fixed`${this.centroidCoords[1]}`} r="8"
        class="series-${this.centroidColor} cluster-centroid"
      />
    </g>`
  }
}