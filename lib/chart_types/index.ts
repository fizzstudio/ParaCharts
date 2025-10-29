import { BaseChartInfo } from './base_chart';
import { LineChartInfo } from './line_chart';
import { BarChartInfo } from './bar_chart';
import { PastryChartInfo } from './pastry_chart';
import { ScatterChartInfo } from './scatter_chart';
import { HeatMapInfo } from './heat_map';
import { TableInfo } from './table';

export * from './base_chart';
export * from './plane_chart';
export * from './point_chart';
export * from './line_chart';
export * from './pastry_chart';
export * from './scatter_chart';
export * from './heat_map';

export const chartInfoClasses = {
  bar: BarChartInfo,
  column: BarChartInfo,
  line: LineChartInfo,
  pie: PastryChartInfo,
  donut: PastryChartInfo,
  scatter: ScatterChartInfo,
  heatmap: HeatMapInfo,
  table: TableInfo,
  // histogram: Histogram,
  // gauge: BarChart, //GaugeChart,
  // stepline: LineChart, //StepLineChart,
  // lollipop: BarChart, //LollipopChart
};
