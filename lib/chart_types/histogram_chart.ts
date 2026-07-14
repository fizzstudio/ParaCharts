import { type ChartType } from "@fizz/paramanifest";
import { PlaneChartInfo } from './plane_chart';
import { type ParaState } from '../state';
import { DeepReadonly, type TypeHistogramConfig } from "../config/config_types";

export class HistogramChartInfo extends PlaneChartInfo {
  protected _bins: number = 20;
  protected _grid: Array<Array<number>> = [[0]];
  protected _maxCount: number = 0;

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
    this._init();
  }

  get grid() {
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }

  get bins() {
    return this._bins;
  }

  get config() {
    return super.config as DeepReadonly<TypeHistogramConfig>;
  }

  _init() {
    this._bins = this._paraState.config.type.histogram.bins ?? 20;
    if (this.config.displayAxis == 'x') {
      this._grid = this._paraState.model!.series.map(s => s.datapoints.map(p => p.facetValueAsNumber('y') as number));
    }
    else {
      this._grid = this._paraState.model!.series.map(s => s.datapoints.map(p => p.facetValueAsNumber('x') as number));
    }
    this._xInterval = this._numericXAxisRange("x");
    this._yInterval = this._numericYAxisRange("y");
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this._paraState.clearVisited();
    this._paraState.clearSelected();
    this._createNavMap();
    this._createSummarizer();
  }

  async setup() {
    //this._conciseSummary = 'test';
  }

  protected _addSettingControls(): void {
    this._paraState.settingControls.insert('chart.width');
    this._paraState.settingControls.insert('chart.height');
    this._paraState.settingControls.insert('chart.isShowPopups');
    // Only add these controls if the y-axis is numeric
    if (!this._paraState.model!.getFacet('y') || this._paraState.model!.getFacet('y')!.datatype !== 'number') return;
    // const range = this.chartLayers.getYAxisInterval();
    // XXX should be min/max label values as numbers, not min/max data values
    const min = this._yInterval!.start; // this._labelInfo.min!;
    const max = this._yInterval!.end; // this._labelInfo.max!;

    this._paraState.settingControls.insert(
      `type.${this._type}.minYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? min
        : value,
      value => {
        const min = this.config.maxYValue === 'unset'
          ? max
          : this.config.maxYValue
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min y-value (${value}) must be less than ${min}` } : {};
      });
    this._paraState.settingControls.insert(
      `type.${this._type}.maxYValue`,
      undefined,
      (value: any) => value === 'unset'
        ? max
        : value,
      value => {
        const max = this.config.minYValue === 'unset'
          ? min
          : this.config.minYValue
        return value as number <= max ?
          { err: `Max y-value (${value}) must be greater than ${max}` } : {};
      });
    this._paraState.settingControls.insert('type.histogram.bins');
    const variables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).map(f => f[1].label);
    this._paraState.settingControls.insert('type.histogram.groupingAxis', {
      options: variables
    });
    this._paraState.settingControls.insert('type.histogram.displayAxis');
    this._paraState.settingControls.insert('type.histogram.relativeAxes');
  }

  protected _createChordNavNodes() {
  }

}
