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

/** @public */
export type ColorVisionMode = 'normal' | 'deutan' | 'protan' | 'tritan' | 'grayscale';
/** @public */
export type TabLabelStyle = 'icon' | 'iconLabel' | 'label';
/** @public */
export type AnimationType = 'yAxis' | 'xAxis' | 'none';
/** @public */
export type AnimationOrigin = 'baseline' | 'top' | 'initialValue' | 'custom';

/** @public */
export type BoxStyle = {
  outline: Color;
  outlineWidth: number;
  fill: Color;
};

/** @public */
export interface UISettings extends SettingGroup {
  /** Enable voice output for screen reader users */
  isVoicingEnabled: boolean;
  /** Enable visual highlighting when narrative elements are announced */
  isNarrativeHighlightEnabled: boolean;
  /** Pause narrative highlighting temporarily */
  isNarrativeHighlightPaused: boolean;
  /** Enable aria-live announcements */
  isAnnouncementEnabled: boolean;
  /** Voice output speech rate. Range: 0.1 to 10 */
  speechRate: number;
  /** Enable fullscreen mode */
  isFullscreenEnabled: boolean;
  /** Enable low vision accessibility enhancements */
  isLowVisionModeEnabled: boolean;
  /** Show focus ring around active elements */
  isFocusRingEnabled: boolean;
  /** Gap size around focus ring in pixels */
  focusRingGap: number;
  /** Timeout in milliseconds for navigation runs */
  navRunTimeoutMs: number;
}

/** @public */
export interface AnimationSettings extends SettingGroup {
  isAnimationEnabled: boolean;
  animateRevealTimeMs: number;
  popInAnimateRevealTimeMs: number;
  animationType: AnimationType;
  animationOrigin: AnimationOrigin;
  animationOriginValue: number;
  expandPoints: boolean;
  lineSnake: boolean;
  symbolPopIn: boolean;
}

/** @public */
export interface CaptionBoxSettings extends SettingGroup {
  isCaptionExternalWhenControlPanelClosed: boolean;
  hasBorder: boolean;
  isExplorationBarBeside: boolean;
}

/** @public */
export interface ControlPanelSettings extends SettingGroup {
  isControlPanelDefaultOpen: boolean;
  tabLabelStyle: TabLabelStyle;
  isCaptionVisible: boolean;
  isExplorationBarVisible: boolean;
  caption: CaptionBoxSettings;
  isSparkBrailleVisible: boolean;
  isDataTabVisible: boolean;
  isColorsTabVisible: boolean;
  isAudioTabVisible: boolean;
  isControlsTabVisible: boolean;
  isChartTabVisible: boolean;
  isAnnotationsTabVisible: boolean;
  isMDRAnnotationsVisible: boolean;
  isAnalysisTabVisible: boolean;
  isSparkBrailleControlVisible: boolean;
  isColorPaletteControlVisible: boolean;
  isCVDControlVisible: boolean;
}

/** @public */
export interface ColorSettings extends SettingGroup {
  /** Color vision deficiency simulation mode */
  colorVisionMode: ColorVisionMode;
  /** Enable dark color scheme */
  isDarkModeEnabled: boolean;
  /** Contrast adjustment level (0-2) */
  contrastLevel: number;
  /** Name of the color palette to use */
  colorPalette: string;
  /** Comma-separated list of custom color names */
  colorMap?: string;
}

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

export type VertDirection = 'up' | 'down';
export type HorizDirection = 'left' | 'right';
export type PlaneDirection = VertDirection | HorizDirection;
export type DepthDirection = 'in' | 'out';
export type Direction = VertDirection | HorizDirection | DepthDirection;
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

/** @public */
export interface ChartSettings extends SettingGroup {
  /** The type of chart to display */
  type: ChartType;
  /** Chart dimensions in pixels */
  size: Size2d;
  /** Chart title configuration */
  title: TitleSettings;
  /** Which direction is "up" on the chart */
  orientation: CardinalDirection;
  /** Padding around chart content (CSS format) */
  padding: string;
  /** Font family for all chart text */
  fontFamily: string;
  /** Font weight for chart text */
  fontWeight: string;
  /** Global font size multiplier */
  fontScale: number;
  /** Stroke color for lines and shapes */
  stroke: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Scale factor for highlighted strokes */
  strokeHighlightScale: number;
  /** Stroke width for symbols in pixels */
  symbolStrokeWidth: number;
  /** Scale factor for highlighted symbols */
  symbolHighlightScale: number;
  /** Show direct labels on data points */
  hasDirectLabels: boolean;
  /** Font size for direct labels */
  directLabelFontSize: string;
  /** Show legend when direct labels are present */
  hasLegendWithDirectLabels: boolean;
  /** Draw symbols at data points */
  isDrawSymbols: boolean;
  /** Disable all interactivity */
  isStatic: boolean;
  /** Only show data points that have been visited */
  isShowVisitedDatapointsOnly: boolean;
  /** Show popups on hover or focus */
  isShowPopups: boolean;
}

/** @public */
export interface DevSettings extends SettingGroup {
  isDebug: boolean;
  isShowGridTerritories: boolean;
}

/** @public */
export type LabelFormat = 'raw' | string;

/** @public */
export interface TickLabelSettings extends SettingGroup {
  isDrawTickLabels: boolean;
  fontSize: string;
  angle: number;
  offsetGap: number;
  gap: number;
}

/** @public */
export interface TickSettings extends SettingGroup {
  isDrawTicks?: boolean;
  padding: number;
  opacity: number;
  strokeWidth: number;
  strokeLinecap: string;
  length: number;
  labelFormat: LabelFormat;
  labels: TickLabelSettings;
  step: number;
  /** Only applies to indep axis for non-point charts (e.g., bar charts) */
  isOnDatapoint: boolean;
}

/** @public */
export interface AxisLineSettings extends SettingGroup {
  isDrawAxisLine: boolean;
  isDrawOverhang: boolean;
  strokeWidth: number;
  strokeLinecap: string;
}

/** @public */
export interface AxisSettings extends SettingGroup {
  minValue: number | 'unset';
  maxValue: number | 'unset';
  interval: number | 'unset';
}

/** @public */
export interface AxisTitleSettings extends SettingGroup {
  isDrawTitle?: boolean;
  text?: string;
  gap: number;
  fontSize: string;
  align?: 'start' | 'middle' | 'end';
  position?: 'top' | 'bottom';
}

/** @public */
export interface OrientedAxisSettings<T extends AxisOrientation> extends SettingGroup {
  isDrawAxis: boolean;
  position: T extends 'horiz'
    ? VertCardinalDirection
    : HorizCardinalDirection;
  title: AxisTitleSettings;
  ticks: TickSettings;
  line: AxisLineSettings;
  labelOrder: T extends 'horiz'
    ? 'westToEast' | 'eastToWest'
    : 'southToNorth' | 'northToSouth';
  isStaggerLabels: boolean;
  isWrapLabels: boolean;
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

export type LegendItemOrder = 'alphabetical' | 'series';

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
  itemOrder: LegendItemOrder;
  fontSize: string;
}

export interface PlotAreaSettings extends SettingGroup {
  size: Size2d;
}

export interface PopupSettings extends SettingGroup {
  opacity: number;
  leftPadding: number;
  rightPadding: number;
  upPadding: number;
  downPadding: number;
  margin: number;
  maxWidth: number;
  shape: "box" | "boxWithArrow";
  activation: "onHover" | "onFocus" | "onSelect";
  borderRadius: number;
  backgroundColor: "dark" | "light"
}

/** @public */
export interface PlotSettings extends SettingGroup {
}

export interface PlaneChartSettings extends PlotSettings {
  minYValue: number | 'unset';
  maxYValue: number | 'unset';
}

export type BarClusterMode = 'facet';
export type BarDataLabelPosition = 'center' | 'end' | 'base' | 'outside';

/** @public */
export interface BarSettings extends PlaneChartSettings {
  stacking: 'none' | 'standard'; // | '100%';
  barWidth: number;
  // minBarWidth: number;
  colorByDatapoint: boolean;
  isDrawTotalLabels: boolean;
  //isStackLabelInsideBar: boolean;
  stackLabelGap: number;
  isDrawRecordLabels: boolean;
  /** Per-bar data value labels */
  isDrawDataLabels: boolean;
  dataLabelPosition: BarDataLabelPosition;
  clusterBy?: BarClusterMode;
  orderBy?: string;
  clusterGap: number;
  barGap: number;
  stackInsideGap: number;
  isAbbrevSeries: boolean;
  clusterLabelFormat: LabelFormat;
  lineWidth: number;
  isShowPopups: boolean;
  labelFontSize: string;
}

/** @public */
export interface LollipopSettings extends BarSettings {
}

/** @public */
export interface WaterfallSettings extends PlaneChartSettings {
  barWidth: number;
  colorByDatapoint: boolean;
  isDrawLabels: boolean;
  labelPosition: BarDataLabelPosition;
  barLabelGap: number;
  barGap: number;
  isShowPopups: boolean;
  labelFontSize: string;
}

/** @public */
export interface VennSettings extends SettingGroup {
  orientationAngleOffset: number;
  insideLabels: {
    contents: string;
  };
  outsideLabels: {
    contents: string;
  };
  explode: string;
}



/** @public */
export interface VennSettings extends SettingGroup {
  orientationAngleOffset: number;
  insideLabels: {
    contents: string;
  };
  outsideLabels: {
    contents: string;
  };
  explode: string;
}



/** @public */
export interface PointSettings extends PlaneChartSettings {
  pointLabelFormat: LabelFormat;
  selectedPointMarkerSize: Size2d;
}

/** @public */
export interface LineSettings extends PointSettings {
  lineWidth: number;
  lineWidthMax: number;
  lowVisionLineWidth: number;
  lineHighlightScale: number;
  baseSymbolSize: number;
  seriesLabelPadding: number; // also used after leader lines
  leaderLineLength: number;
  isAlwaysShowSeriesLabel?: boolean;
  isShowPopups: boolean;
  isTrendNavigationModeEnabled: boolean;
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
  isDrawTrendLine: boolean;
  isShowOutliers: boolean;
}

/** @public */
export interface HeatmapSettings extends PointSettings {
  resolution: number;
}

export interface HistogramSettings extends PointSettings {
  bins: number;
  displayAxis: string;
  groupingAxis: string;
  relativeAxes: "Counts" | "Percentage";
}

// export type SliceLabelPosition = 'inside' | 'outside' | 'auto';

export interface RadialOutsideLabelSettings extends SettingGroup {
  vertGap: number;
  arcGap: number;
  horizShift: number;
  horizPadding: number;
  leaderStyle: 'direct' | 'underline';
  format: LabelFormat;
  underlineGap: number;
  contents: string;
}

export interface RadialInsideLabelSettings extends SettingGroup {
  format: LabelFormat;
  /** Value between 0 and 1 indicating position as distance along radius */
  position: number;
  contents: string;
}

/** @public */
export interface RadialSettings extends SettingGroup {
  outsideLabels: RadialOutsideLabelSettings;
  insideLabels: RadialInsideLabelSettings;
  isRenderCenterLabel: boolean;
  annularThickness: number;
  centerLabel: 'none' | 'title';
  centerLabelPadding: number;
  orientationAngleOffset: number;
  explode: string;
  explodeDistance: number;
}

/** @public */
export interface ChartTypeSettings extends SettingGroup {
  bar: BarSettings;
  column: BarSettings;
  line: LineSettings;
  scatter: ScatterSettings;
  histogram: HistogramSettings;
  heatmap: HeatmapSettings;
  pie: RadialSettings;
  donut: RadialSettings;
  gauge: RadialSettings;
  stepline: StepLineSettings;
  lollipop: LollipopSettings;
  waterfall: WaterfallSettings;
  venn: VennSettings
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
  hertzLower: number;
  hertzUpper: number;
  soniPlaySpeed?: number;
  riffSpeed?: riffSpeeds;
  riffSpeedIndex: number;  // 👈 Add this line
  isArpeggiateChords: boolean;
}

/** @public */
export interface ScrollytellingSettings extends SettingGroup {
  isScrollytellingEnabled: boolean;
  isScrollyAnnouncementsEnabled: boolean;
  isScrollySoniEnabled: boolean;
}

/** @public */
export interface Settings extends SettingGroup {
  chart: ChartSettings;
  axis: AxesSettings;
  legend: LegendSettings;
  popup: PopupSettings;
  plotArea: PlotAreaSettings;
  type: ChartTypeSettings;
  grid: GridSettings;
  ui: UISettings;
  animation: AnimationSettings;
  scrollytelling: ScrollytellingSettings;
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