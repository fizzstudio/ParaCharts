import { PointChart, ChartPoint, TrendLineView } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { XYDatapointView, type XYSeriesView } from './xychart';
import { ParaView } from '../paraview';
import { AxisInfo } from '../common/axisinfo';
import { clusterObject, coord, generateClusterAnalysis } from '@fizz/clustering';
import { DataSymbol, DataSymbols } from './symbol';
import { SelectionLayer } from './selectionlayer';
import { View } from './base_view';
import { DatapointView } from './data';
import { Colors } from '../common/colors';
import { svg } from 'lit';

export class ScatterPlot extends PointChart {

  declare protected _settings: DeepReadonly<ScatterSettings>;
  protected _isClustering: boolean = false;
  protected _clustering?: clusterObject[];
  
  constructor(paraview: ParaView, index: number) {
    super(paraview, index);
    if (this.paraview.store.model?.numSeries === 1){
      this._isClustering = true;
    }
    else{
      this._isClustering = false;
    }
  }

  get settings() {
    return this._settings;
  }

  get isClustering(){
    return this._isClustering;
  }

  get clustering(){
    return this._clustering;
  }

  settingDidChange(key: string, value: Setting | undefined) {
    return false;
  }

  protected _addedToParent(): void {
    super._addedToParent();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ScatterPoint(seriesView);
  }

  protected _createComponents(): void {
    if (this.isClustering){
      this._generateClustering();
    }
    super._createComponents()
  }

  protected _layoutComponents(): void {
    super._layoutComponents()
    let trendLine = new TrendLineView(this);
      this.append(trendLine);
    if (this.isClustering){
      for (let i = 0; i < this.clustering!.length; i++){
        this.append(new ClusterShellView(this, i))
      }
    }
  }
      
  protected _generateClustering(){
    const data: Array<coord> = []
    const seriesList = this.paraview.store.model!.series
    for (let series of seriesList){
      for (let i = 0; i < series.length; i++){
        data.push({x: series[i].x.value as number, y: series[i].y.value as number});
      } 
    }
    this._clustering = generateClusterAnalysis(data, false);
  } 
}

class ScatterPoint extends ChartPoint {
  declare readonly chart: ScatterPlot;
  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.x.value as number - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.contentWidth;
    return parentWidth * xTemp;
  }
  
  protected _createSymbol(): void {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    const index = this.parent.children.indexOf(this);
    let color: number = series.color;
    const types = new DataSymbols().types;
    if (this.chart.isClustering) {
      let clustering = this.chart.clustering as clusterObject[]
      for (let clusterId in clustering) {
        if (clustering[clusterId].dataPointIDs.indexOf(index) > -1) {
          color = Number(clusterId)
          symbolType = types[color % types.length]
        }
      }
    }
    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      color
    });
    this.append(this._symbol);
  }
}

export class ClusterShellView extends View {
  protected _points: Array<Array<number>> = [];
  constructor(private chart: ScatterPlot, private clusterID?: number, private selectedPoints?: XYDatapointView[]) {
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
      for (let point of this.selectedPoints){
        points.push([point.x, point.y])
      }
      this._points = points;
    }
    else if (this.clusterID !== undefined) {
      const clustering = this.chart.clustering as clusterObject[];
      let shellIDsList = clustering[this.clusterID].hullIDs
      let points = []
      let start = Date.now();
      for (let ID of shellIDsList) {
        points.push([this.chart.datapointViews[ID].x, this.chart.datapointViews[ID].y])
      }
      this._points = points;
    }
    else{
      this._points = [];
    }
  }

  get points(){
    return this._points
  }

  get pointsString(){
    let pointsString: string = "";
    for (let point of this.points!){
      pointsString = pointsString.concat(`${point[0]},${point[1]} `)
    }
    return pointsString;
  }
  get centroid() {
    const c: number[] = [0, 0]
    for (let point of this.points!){
      c[0] += (point[0] / this.points!.length)
      c[1] += (point[1] / this.points!.length)
    }
    return c;
  }
  get color() {
    if (this.clusterID !== undefined){
      return this.clusterID
    }
    else {
      return 0
    }
    /*
    const clustering = this.selectionLayer.parent.dataLayer.clustering as clusterObject[];
    const testPoint = this.selectionLayer.children[0] as SelectedDatapointMarker;
    const pointID = testPoint.datapointView._extraAttrs[1].value;
    let color: number = 0;
    let targetId = clustering.findIndex((e: clusterObject) => { 
      return e.dataPointIDs.includes(pointID)})
    return targetId
    */
  }
  render() {
    let colors = new Colors(this.paraview.store);
      return svg`<g>
      <polygon points=${this.pointsString} style="stroke:black; fill:none; stroke-width:2"/>
      <circle cx=${this.centroid[0]} cy=${this.centroid[1]} r="8" style=stroke:black;fill:${colors.colorValueAt(this.color)}/>
    </g>`
  }
}
