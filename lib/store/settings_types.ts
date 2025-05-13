/* ParaCharts: Setting Types
Copyright (C) 2025 Fizz Studios

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

/** @public */
export type ColorVisionMode = 'normal' | 'deutan' | 'protan' | 'tritan' | 'grayscale';
/** @public */
export type TabLabelStyle = 'icon' | 'iconLabel' | 'label';

/** @public */
export type BoxStyle = {
  outline: Color;
  outlineWidth: number;
  fill: Color;
};

/** @public */
export interface UISettings extends SettingGroup {
  isVoicingEnabled: boolean;
  isAnnouncementEnabled: boolean;
  speechRate: number;
  isFullScreenEnabled: boolean;
  isLowVisionModeEnabled: boolean;
}

/** @public */
export interface ControlPanelSettings extends SettingGroup {
  isControlPanelDefaultOpen: boolean;
  tabLabelStyle: TabLabelStyle;
  isCaptionVisible: boolean;
  isStatusBarVisible: boolean;
  isSparkBrailleVisible: boolean;
  isDataTabVisible: boolean;
  isColorsTabVisible: boolean;
  isAudioTabVisible: boolean;
  isControlsTabVisible: boolean;
  isChartTabVisible: boolean;
  isAnnotationsTabVisible: boolean;
  isAnalysisTabVisible: boolean;
  isSparkBrailleControlVisible: boolean;
  isColorPaletteControlVisible: boolean;
  isCVDControlVisible: boolean;
}

/** @public */
export interface ColorSettings extends SettingGroup {
  colorVisionMode: ColorVisionMode;
  isDarkModeEnabled: boolean;
  contrastLevel: number;
  colorPalette: string;
}

/** @public */
export interface TitleSettings extends SettingGroup {
  text?: string;
  margin: number;
  fontSize: number;
  //fontColor: string;
  align?: SnapLocation;
  position?: 'top' | 'bottom';
  //textTransform: string;
  //valueLabel: string;
}

/** @public */
export interface LabelSettings extends SettingGroup {
  isDrawEnabled: boolean;
  margin: number;
  fontSize: number;
  color: Color; // NOTE: not yet implemented
}

/** @public */
export interface ViewBox extends SettingGroup {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** @public */
export type VertDirection = 'north' | 'south';
/** @public */
export type HorizDirection = 'east' | 'west';

/**
 * Which direction is "up" on a chart.
 * @public
 */
export type CardinalDirection = VertDirection | HorizDirection;

/** @public */
export interface ChartSettings extends SettingGroup {
  type: ChartType;
  size: Partial<Size2d>;
  title: TitleSettings;
  orientation: CardinalDirection;
  padding: number;
  fontFamily: string;
  fontWeight: string;
  strokeWidth: number;
  strokeHighlightScale: number;
  symbolStrokeWidth: number;
  symbolHighlightScale: number;
  hasDirectLabels: boolean;
  hasLegendWithDirectLabels: boolean;
  isDrawSymbols: boolean;
}

/** @public */
export interface DevSettings extends SettingGroup {
  isDebug: boolean;
}

/** @public */
export type LabelFormat = 'raw' | string;

/** @public */
export interface TickLabelSettings extends SettingGroup {
  angle: number;
  offsetPadding: number;
  gap: number;
}

/** @public */
export interface TickSettings extends SettingGroup {
  isDrawEnabled?: boolean;
  padding: number;
  fontSize: number;
  opacity: number;
  strokeWidth: number;
  strokeLinecap: string;
  length: number;
  labelFormat: LabelFormat;
  tickLabel: TickLabelSettings;
  step: number;
}

/** @public */
export interface AxisLineSettings extends SettingGroup {
  isDrawEnabled?: boolean;
  isDrawOverhangEnabled?: boolean;
  strokeWidth: number;
  strokeLinecap: string;
}

/** @public */
export interface AxisSettings extends SettingGroup {
  title: AxisTitleSettings;
  line: AxisLineSettings;
  tick: TickSettings;
  minValue?: number;
  maxValue?: number;
}

/** @public */
export interface AxisTitleSettings extends SettingGroup {
  isDrawTitle?: boolean;
  text?: string;
  gap: number;
  fontSize: number;
  align?: 'start' | 'middle' | 'end';
  position?: 'top' | 'bottom';
}

/** @public */
export interface OrientedAxisSettings<T extends AxisOrientation> extends SettingGroup {
  position: T extends 'horiz' ? VertDirection : HorizDirection;
  labelOrder: T extends 'horiz' ? 'westToEast' | 'eastToWest' : 'southToNorth' | 'northToSouth';
}

/** @public */
export interface XAxisSettings extends AxisSettings {

}
/** @public */
export interface YAxisSettings extends AxisSettings {
}

/** @public */
export interface AxesSettings extends SettingGroup {
  minInterval: number;
  datapointMargin: number;
  x: XAxisSettings;
  y: YAxisSettings;
  horiz: OrientedAxisSettings<'horiz'>;
  vert: OrientedAxisSettings<'vert'>;
}

/** @public */
export interface LegendSettings extends SettingGroup {
  isDrawLegend: boolean;
  isDrawLegendWhenNeeded: boolean; // NOTE: not yet implemented
  isAlwaysDrawLegend: boolean;
  boxStyle: BoxStyle;
  padding: number;
  symbolLabelGap: number;
  pairGap: number;
  position: CardinalDirection;
  margin: number;
}

/** @public */
export interface PlotSettings extends SettingGroup {
}

/** @public */
export interface BarSettings extends PlotSettings {
  barWidthMin: number;
  clusterBy?: string;
  stackContent: StackContentOptions;
  stackCount: number;
  orderBy?: string;
  clusterPaddingPx: number;
  barGap: number;
  isAbbrevSeries: boolean;
  clusterLabelFormat: LabelFormat;
  lineWidth: number;
}

/** @public */
export interface LollipopSettings extends BarSettings {
}

/** @public */
export type StackContentOptions = 'all' | 'count';

/** @public */
export interface PointSettings extends PlotSettings {
  pointLabelFormat: LabelFormat;
  selectedPointMarkerSize: Size2d;
}

/** @public */
export interface LineSettings extends PointSettings {
  lineWidth: number;
  lineWidthMax: number;
  baseSymbolSize: number;
  seriesLabelPadding: number; // also used after leader lines
  leaderLineLength: number;
  isAlwaysShowSeriesLabel?: boolean;
}

/** @public */
export interface StepLineSettings extends PointSettings {
  lineWidth: number;
  lineWidthMax: number;
  baseSymbolSize: number;
  seriesLabelPadding: number; // also used after leader lines
  leaderLineLength: number;
  isAlwaysShowSeriesLabel?: boolean;
}

/** @public */
export interface ScatterSettings extends PointSettings {

}

/** @public */
export interface RadiusSettings extends SettingGroup {
  outer: number;
  inner: number;
  innerPercent: number;
}

/** @public */
export interface RadialSettings extends SettingGroup {
  label: LabelSettings;
  isRenderCenterLabel: boolean;
  radius?: RadiusSettings;
  sliceLabelFormat: LabelFormat;
  sliceValueFormat: LabelFormat;
}

/** @public */
export interface ChartTypeSettings extends SettingGroup {
  bar: BarSettings;
  column: BarSettings;
  line: LineSettings;
  scatter: ScatterSettings;
  pie: RadialSettings;
  donut: RadialSettings;
  gauge: RadialSettings;
  stepline: StepLineSettings;
  lollipop: LollipopSettings;
}

/** @public */
export interface JimSettings extends SettingGroup {
  xValueFormat: LabelFormat;
}

/** @public */
export interface DataTableSettings extends SettingGroup {
  xValueFormat: LabelFormat;
  yValueFormat: LabelFormat;
}

/** @public */
export type PointChartType = 'line' | 'stepline' | 'scatter';
/** @public */
export type XYChartType = 'bar' | 'lollipop' | PointChartType;
/** @public */
export type RadialChartType = 'pie' | 'donut' | 'gauge';
/** @public */
export type ChartType = XYChartType | RadialChartType;

/** @public */
export interface GridSettings extends SettingGroup {
  isDrawHorizLines: boolean;
  isDrawVertLines: boolean;
  isDrawHorizAxisOppositeLine: boolean;
  isDrawVertAxisOppositeLine: boolean;
}

/** @public */
export interface StatusBarSettings extends SettingGroup {
  valueFormat: LabelFormat;
}

/** @public */
export type riffSpeeds = 'slow' | 'medium' | 'fast';

/** @public */
export interface SonificationSettings extends SettingGroup {
  isSoniEnabled: boolean;
  isRiffEnabled: boolean;
  isNotificationEnabled: boolean;
  isChordModeEnabled: boolean;
  hertzLower: number;
  hertzUpper: number;
  soniPlaySpeed?: number;
  riffSpeed?: riffSpeeds;
}

/** @public */
export interface Settings extends SettingGroup {
  chart: ChartSettings;
  axis: AxesSettings;
  legend: LegendSettings;
  type: ChartTypeSettings;
  grid: GridSettings;
  ui: UISettings;
  controlPanel: ControlPanelSettings;
  color: ColorSettings;
  jim: JimSettings;
  dataTable: DataTableSettings;
  statusBar: StatusBarSettings;
  sonification: SonificationSettings;
  dev: DevSettings;
}

export type DeepReadonly<T> = {
  readonly [Property in keyof T]: T extends Setting ? T[Property] : DeepReadonly<T[Property]>;
};

/** 
 * Context where a particular value appears. 
 * @public
 */
export type FormatContext = keyof typeof FORMAT_CONTEXT_SETTINGS;
// Settings that control the format for each context
export const FORMAT_CONTEXT_SETTINGS = {
  xTick: 'axis.x.tick.labelFormat',
  yTick: 'axis.y.tick.labelFormat',
  linePoint: 'type.line.pointLabelFormat',
  scatterPoint: 'type.scatter.pointLabelFormat',
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