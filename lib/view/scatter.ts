
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from '../paraview';
import { AxisInfo } from '../common/axisinfo';

export class ScatterPlot extends PointChart {
  
  constructor(paraview: ParaView, index: number) {
    super(paraview, index);
    this._isClustering = true;
  }

  get settings() {
    return super.settings as DeepReadonly<ScatterSettings>;
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

}

class ScatterPoint extends ChartPoint {
  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.x.value as number - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  protected _createShape() {
  }
}

