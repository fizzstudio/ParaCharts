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


import { type Size2d } from '@fizz/chart-classifier-utils'

import { type SnapLocation } from '../common/types';
import { type Color } from '../common/color_types';
import { AxisOrientation } from '@fizz/paramodel';

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

/**
 * A mapping of dotted setting paths to values.
 * @public
 */
export type SettingsInput = {[path: string]: Setting};

/** Color vision deficiency simulation options
 * @public
 */
export type ColorVisionMode = 'normal' | 'deutan' | 'protan' | 'tritan' | 'grayscale';

/** Control panel tab label display style
 * @public
 */
export type TabLabelStyle = 'icon' | 'iconLabel' | 'label';

/** Which axis to animate along during chart reveal
 * @public
 */
export type AnimationType = 'yAxis' | 'xAxis' | 'none';

/** Starting point for chart animations
 * @public
 */
export type AnimationOrigin = 'baseline' | 'top' | 'initialValue' | 'custom';

/** @public */
export interface TitleSettings extends SettingGroup {
  /** Whether to draw the chart title */
  isDrawTitle: boolean;
  /** The text of the chart's title. */
  text?: string;
  /** Space between the chart title and content (in SVG units). */
  margin: number;
  /** The font size of the chart title, as a CSS font size string. */
  fontSize: string;
  //fontColor: string;
  align?: SnapLocation;
  /** The position of the chart title (either 'top' or 'bottom'). */
  position?: 'top' | 'bottom';
  //textTransform: string;
  //valueLabel: string;
}

/** @public */
export interface LabelSettings extends SettingGroup {
  /** Enable drawing of labels */
  isDrawEnabled: boolean;
  /** Margin around labels in pixels */
  margin: number;
  /** Font size for labels */
  fontSize: number;
  /** Label text color */
  color: Color; // NOTE: not yet implemented
}

/** SVG viewBox dimensions for chart viewport
 * @public
 */
export interface ViewBox extends SettingGroup {
  /** X coordinate of top-left corner */
  x: number;
  /** Y coordinate of top-left corner */
  y: number;
  /** Width of viewable area */
  width: number;
  /** Height of viewable area */
  height: number;
}

/** @public */
export type VertDirection = 'up' | 'down';

/** @public */
export type HorizDirection = 'left' | 'right';

/** @public */
export type PlaneDirection = VertDirection | HorizDirection;

/** @public */
export type DepthDirection = 'in' | 'out';

/** @public */
export type Direction = VertDirection | HorizDirection | DepthDirection;

/** @public */
export const directions: Direction[] = ['up', 'down', 'left', 'right', 'in', 'out'];

/** @public */
export type VertCardinalDirection = 'north' | 'south';
/** @public */
export type HorizCardinalDirection = 'east' | 'west';

/**
 * Which direction is "up" on a chart.
 * @public
 */
export type CardinalDirection = VertCardinalDirection | HorizCardinalDirection;

/** Developer and debugging settings
 * @public
 */
export interface DevSettings extends SettingGroup {
  /** Enable debug mode with additional logging */
  isDebug: boolean;
  /** Show visual grid territories for debugging layout */
  isShowGridTerritories: boolean;
}

/** Format for label display - 'raw' for unformatted or format string
 * @public
 */
export type LabelFormat = 'raw' | string;

/** @public */
export interface AxisSettings extends SettingGroup {
  /** Minimum value for axis scale */
  minValue: number | 'unset';
  /** Maximum value for axis scale */
  maxValue: number | 'unset';
  /** Interval between major values */
  interval: number | 'unset';
}

/** X-axis specific settings
 * @public
 */
export interface XAxisSettings extends AxisSettings {

}
/** Y-axis specific settings
 * @public
 */
export interface YAxisSettings extends AxisSettings {
}

/** @public */
export interface AxesSettings extends SettingGroup {
  /** Minimum interval between axis values */
  minInterval: number;
  /** Margin around data points */
  datapointMargin: number;
  /** X-axis configuration */
  x: XAxisSettings;
  /** Y-axis configuration */
  y: YAxisSettings;
}

/** Plot area dimensions
 * @public
 */
export interface PlotAreaSettings extends SettingGroup {
  /** Size of the plot area */
  size: Size2d;
}

/** Base settings for plot-based charts
 * @public
 */
export interface PlotSettings extends SettingGroup {
}

/** Settings for 2D plane charts with X/Y axes
 * @public
 */
export interface PlaneChartSettings extends PlotSettings {
  /** Minimum Y value override */
  minYValue: number | 'unset';
  /** Maximum Y value override */
  maxYValue: number | 'unset';
}

/** How to cluster bar data
 * @public
 */
export type BarClusterMode = 'facet';

/** Position for data value labels on bars
 * @public
 */
export type BarDataLabelPosition = 'center' | 'end' | 'base' | 'outside';

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

/** @public */
export interface StepLineSettings extends PlaneChartSettings {
  /** Width of step line strokes */
  lineWidth: number;
  /** Maximum line width */
  lineWidthMax: number;
  /** Base size for symbols */
  baseSymbolSize: number;
  /** Padding around series labels */
  seriesLabelPadding: number; // also used after leader lines
  /** Length of leader lines */
  leaderLineLength: number;
  /** Always show series labels */
  isAlwaysShowSeriesLabel?: boolean;
}

/** @public */
export interface HeatmapSettings extends PlaneChartSettings {
  /** Grid resolution for heat map */
  resolution: number;
}

/** Histogram chart settings
 * @public
 */
export interface HistogramSettings extends PlaneChartSettings {
  /** Number of bins for grouping data */
  bins: number;
  /** Which axis shows the histogram bars */
  displayAxis: string;
  /** Which axis is used for grouping */
  groupingAxis: string;
  /** Show counts or percentages */
  relativeAxes: "Counts" | "Percentage";
}

// export type SliceLabelPosition = 'inside' | 'outside' | 'auto';

/** Chart type-specific settings collection
 * @public
 */
export interface ChartTypeSettings extends SettingGroup {
  /** Histogram settings */
  histogram: HistogramSettings;
  /** Heat map settings */
  heatmap: HeatmapSettings;
  /** Step line chart settings */
  stepline: StepLineSettings;
  /** Venn diagram settings */
  venn: VennSettings
}

/** Navigation assistance settings (JIM - Jaws Integrated Mode)
 * @public
 */
export interface JimSettings extends SettingGroup {
  /** Format for X-axis values */
  xValueFormat: LabelFormat;
}

/** Data table display settings
 * @public
 */
export interface DataTableSettings extends SettingGroup {
  /** Format for X-axis values in table */
  xValueFormat: LabelFormat;
  /** Format for Y-axis values in table */
  yValueFormat: LabelFormat;
}

/** Chart types that display individual points
 * @public
 */
export type PointChartType = 'line' | 'stepline' | 'scatter';

/** Chart types that use X/Y coordinate system
 * @public
 */
export type XYChartType = 'bar' | 'lollipop' | PointChartType;

/** Chart types that use radial/circular layout
 * @public
 */
export type RadialChartType = 'pie' | 'donut' | 'gauge';

/** All supported chart types
 * @public
 */
export type ChartType = XYChartType | RadialChartType;

/** Status bar display settings
 * @public
 */
export interface StatusBarSettings extends SettingGroup {
  /** Format for status bar values */
  valueFormat: LabelFormat;
}

/** Audio feedback playback speeds
 * @public
 */
export type riffSpeeds = 'slow' | 'medium' | 'fast';

/** Scrollytelling narrative mode settings
 * @public
 */
export interface ScrollytellingSettings extends SettingGroup {
  /** Enable scrollytelling mode */
  isScrollytellingEnabled: boolean;
  /** Enable audio announcements during scrolling */
  isScrollyAnnouncementsEnabled: boolean;
  /** Enable sonification during scrolling */
  isScrollySoniEnabled: boolean;
}

/** Complete settings configuration for ParaCharts
 * @public
 */
export interface Settings extends SettingGroup {
  /** Axis configuration */
  axis: AxesSettings;
  /** Plot area settings */
  plotArea: PlotAreaSettings;
  /** Chart type-specific settings */
  type: ChartTypeSettings;
  /** Scrollytelling settings */
  scrollytelling: ScrollytellingSettings;
  /** Navigation assistance settings */
  jim: JimSettings;
  /** Data table settings */
  dataTable: DataTableSettings;
  /** Status bar settings */
  statusBar: StatusBarSettings;
  /** Developer/debugging settings */
  dev: DevSettings;
}

/** @public */
export type DeepReadonly<T> = {
  readonly [Property in keyof T]: T extends Setting ? T[Property] : DeepReadonly<T[Property]>;
};

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
  heatmapPoint: 'type.histogram.pointLabelFormat',
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