/* ParaCharts: Setting Types
Copyright (C) 2025 Fizz Studio

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/


/**
 * A single setting.
 * @public
 */
export type Setting = string | number | boolean;
/**
 * A group of settings (which may contain nested setting groups).
 * @public
 */
export type SettingGroup = {[key: string]: Setting | SettingGroup | undefined};

/** @public */
export interface VennSettings extends SettingGroup {
  /** Rotation offset for diagram orientation */
  orientationAngleOffset: number;
  /** Configuration for labels inside circles */
  insideLabels: {
    /** Content to display in inside labels */
    contents: string;
  };
  /** Configuration for labels outside circles */
  outsideLabels: {
    /** Content to display in outside labels */
    contents: string;
  };
  /** Which circles to separate/explode */
  explode: string;
}

/** Chart type-specific settings collection
 * @public
 */
export interface ChartTypeSettings extends SettingGroup {
  /** Venn diagram settings */
  venn: VennSettings
}

/** Complete settings configuration for ParaCharts
 * @public
 */
export interface Settings extends SettingGroup {
  /** Chart type-specific settings */
  type: ChartTypeSettings;
}

/**
 * Context where a particular value appears.
 * @public
 */
export type FormatContext = keyof typeof FORMAT_CONTEXT_SETTINGS;

/** Settings that control the format for each context
 * @public
 */
export const FORMAT_CONTEXT_SETTINGS = {
  horizTick: 'axis.horiz.ticks.labelFormat',
  vertTick: 'axis.vert.ticks.labelFormat',
  linePoint: 'type.line.pointLabelFormat',
  scatterPoint: 'type.scatter.pointLabelFormat',
  histogramPoint: 'type.histogram.pointLabelFormat',
  heatmapPoint: 'type.heatmap.pointLabelFormat',
  barCluster: 'type.bar.clusterLabelFormat',
  pieSliceLabel: 'type.pie.sliceLabelFormat',
  pieSliceValue: 'type.pie.sliceValueFormat',
  donutSliceLabel: 'type.donut.sliceLabelFormat',
  gaugeSliceLabel: 'type.gauge.sliceLabelFormat',
  steplinePoint: 'type.stepline.pointLabelFormat',
  lollipopPoint: 'type.lollipop.pointLabelFormat',
  lollipopCluster: 'type.lollipop.clusterLabelFormat',
  jimX: 'jim.xValueFormat',
  dataTableX: 'dataTable.xValueFormat',
  dataTableY: 'dataTable.yValueFormat',
  statusBar: 'statusBar.valueFormat',
  domId: 'NA'
};