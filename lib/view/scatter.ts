
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from '../paraview';
import { AxisInfo } from '../common/axisinfo';
import { coord, generateClusterAnalysis } from '@fizz/clustering';

export class ScatterPlot extends PointChart {

  declare protected _settings: DeepReadonly<ScatterSettings>;
  
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

  protected _generateClustering(){
    const data: Array<coord> = []
    const seriesList = this.paraview.store.model!.series
    for (let series of seriesList){
      for (let i = 0; i < series.length; i++){
        data.push({x: series[i].x.value as number, y: series[i].y.value as number});
      } 
    }
    this._clustering = generateClusterAnalysis(data, true);
  } 
}

class ScatterPoint extends ChartPoint {
  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.x.value as number - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.contentWidth;
    return parentWidth * xTemp;
  }
}

