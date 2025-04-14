
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from './paraview';

export class ScatterPlot extends PointChart {

  declare protected _settings: DeepReadonly<ScatterSettings>;
  
  constructor(index: number, paraview: ParaView) {
    super(index, paraview);
    this._isComputeXTicks = true;

    // TODO: allow toggle to show or hide symbols
    /*this.has_symbols = true;
    // set symbol for LineChart
    this.set_symbol(dependent_facets);

    // HACK: need to fix how default settings are assigned
    this.base_symbol_size = 0;
    if ( this.chart_obj.options.line && this.chart_obj.options.line.base_symbol_size ) {
      this.base_symbol_size = this.chart_obj.options.line.base_symbol_size;
    } else {
      this.base_symbol_size = ParaSettings.options.line.base_symbol_size;
    }*/

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

