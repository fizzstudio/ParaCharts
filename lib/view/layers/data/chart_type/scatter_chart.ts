import { type XYSeriesView, PointChart, ChartPoint, XYDatapointView, TrendLineView} from '.';
import { type ScatterSettings, Setting, type DeepReadonly } from '../../../../store/settings_types';
import { ParaView } from '../../../../paraview';
import { AxisInfo } from '../../../../common/axisinfo';
import { clusterObject, coord, generateClusterAnalysis } from '@fizz/clustering';
import { DataSymbol, DataSymbols } from '../../../symbol';
import { svg, TemplateResult } from 'lit';
import { View } from '../../../base_view';
import { Colors } from '../../../../common/colors';


export class ScatterPlot extends PointChart {

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
    return super.settings as DeepReadonly<ScatterSettings>;
  }

  get isClustering(){
    return this._isClustering;
  }

  get clustering(){
    return this._clustering;
  }

  get datapointViews(){
    return super.datapointViews as ScatterPoint[];
  }

  protected _addedToParent(): void {
    super._addedToParent();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'type.scatter.isDrawTrendLine',
      label: 'Trend line',
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'type.scatter.isShowOutliers',
      label: 'Show outliers',
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.scatter.isDrawTrendLine', 'type.scatter.isShowOutliers'].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ScatterPoint(seriesView);
  }

  protected _createDatapoints(): void {
    
    super._createDatapoints()
    if (this.isClustering){
      this._generateClustering();
    }
  }

  protected _beginLayout(): void {
    super._beginLayout();
    if (this.paraview.store.settings.type.scatter.isDrawTrendLine){
      let trendLine = new TrendLineView(this);
      this.append(trendLine);
    }
    if (this.isClustering) {
      for (let i = 0; i < this.clustering!.length; i++) {
        //this.append(new ClusterShellView(this, i))
      }
    }
  }

  protected _generateClustering(){
    const data: Array<coord> = []
    const seriesList = this.paraview.store.model!.series
    for (let series of seriesList){
      for (let i = 0; i < series.length; i++){
        data.push({x: Number(series.rawData[i].x), y: Number(series.rawData[i].y)});
      } 
    }
    this.paraview.store.settings.type.scatter.isShowOutliers ? this._clustering = generateClusterAnalysis(data, false)
        : this._clustering = generateClusterAnalysis(data, true)
    for (let point of this.datapointViews){
      let i = 0;
      for (let cluster of this._clustering){
        if (cluster.dataPointIDs.includes(point.index)){
          point.clusterID = i;
        }
        i++
      }
    }
  } 
  
}

class ScatterPoint extends ChartPoint {
  declare readonly chart: ScatterPlot;
  protected symbolColor: number | undefined;
  clusterID?: number;

  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.x.value as number - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  get width() {
    if (this._symbol?.width!){
      return 2 * 1.5 * this._symbol!.width
    }
    else{
      return 36
    }
  }

  protected _createShape(): void {
  }

  select(isExtend: boolean){
    super.select(isExtend);
    for (let child of this.chart.children){
      //const child = this.chart.parent.selectionLayer.children[childID]
      if (child instanceof ClusterShellView){
        child.remove();
      }
    }  
    let testPoint = this.paraview.store.selectedDatapoints[0]

    this.chart.append(new ClusterShellView(this.chart, this.clusterID))
  }

  protected get _symbolColor() {
    return this.paraview.store.isVisited(this.seriesKey, this.index)
      ? -1
      : this.symbolColor;
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
          break;
        }
        else{
          symbolType = types[8]
        }
      }
    }
    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      color: color,
      lighten: true
    });
    this._symbol.role = 'datapoint'
    this._symbol.id = `${this._id}-sym`;
    this.symbolColor = color;
    this.append(this._symbol);
  }

  render(){
    return super.render()
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