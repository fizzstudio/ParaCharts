
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from '../paraview';
import { AxisInfo } from '../common/axisinfo';
import { clusterObject, coord, generateClusterAnalysis } from '@fizz/clustering';
import { DataSymbol, DataSymbols } from './symbol';
import { TemplateResult } from 'lit';

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

  protected _createDatapoints(): void {
    
    super._createDatapoints()
    if (this.isClustering){
      this._generateClustering();
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
    this._clustering = generateClusterAnalysis(data, true);
  } 
  
}

class ScatterPoint extends ChartPoint {
  declare readonly chart: ScatterPlot;
  protected symbolColor: number | undefined;
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
        }
      }
    }

    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      color: color,
      lighten: true
    });
    this._symbol.id = `${this._id}-sym`;
    this.symbolColor = color;
    this.append(this._symbol);
  }
}

