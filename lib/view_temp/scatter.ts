
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from './paraview';

export class ScatterPlot extends PointChart {

  declare protected _settings: DeepReadonly<ScatterSettings>;
  
  constructor(index: number, paraview: ParaView) {
    super(index, paraview);
    this._isComputeXTicks = true;

    this._isClustering = true;

  }

  get settings() {
    return this._settings;
  }

  settingDidChange(key: string, value: Setting | undefined) {
    return false;
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ScatterPoint(seriesView);
  }

}

class ScatterPoint extends ChartPoint {
}

