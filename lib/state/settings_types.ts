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

/** Visual styling for boxes and containers
 * @public
 */
export type BoxStyle = {
  /** Border color */
  outline: Color;
  /** Border width in pixels */
  outlineWidth: number;
  /** Background fill color */
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
  /** Voice output speech rate. Range: 0.5 to 2 */
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
  /** Enable chart animations */
  isAnimationEnabled: boolean;
  /** Duration for main chart reveal animation in milliseconds */
  animateRevealTimeMs: number;
  /** Duration for symbol pop-in animation in milliseconds */
  popInAnimateRevealTimeMs: number;
  /** Which axis to animate along */
  animationType: AnimationType;
  /** Starting point for animations */
  animationOrigin: AnimationOrigin;
  /** Custom value for animation origin when set to 'custom' */
  animationOriginValue: number;
  /** Animate point expansion on data reveal */
  expandPoints: boolean;
  /** Animate lines drawing like snakes */
  lineSnake: boolean;
  /** Animate symbols popping in individually */
  symbolPopIn: boolean;
}

/** @public */
export interface CaptionBoxSettings extends SettingGroup {
  /** Move caption outside chart when control panel is closed */
  isCaptionExternalWhenControlPanelClosed: boolean;
  /** Show border around caption box */
  hasBorder: boolean;
  /** Place exploration bar beside caption instead of below */
  isExplorationBarBeside: boolean;
}

/** @public */
export interface ControlPanelSettings extends SettingGroup {
  /** Open control panel by default */
  isControlPanelDefaultOpen: boolean;
  /** Style for tab labels (icon, text, or both) */
  tabLabelStyle: TabLabelStyle;
  /** Show chart caption */
  isCaptionVisible: boolean;
  /** Show exploration status bar */
  isExplorationBarVisible: boolean;
  /** Caption box configuration */
  caption: CaptionBoxSettings;
  /** Show spark braille display */
  isSparkBrailleVisible: boolean;
  /** Show data table tab */
  isDataTabVisible: boolean;
  /** Show colors/appearance tab */
  isColorsTabVisible: boolean;
  /** Show audio settings tab */
  isAudioTabVisible: boolean;
  /** Show controls/interaction tab */
  isControlsTabVisible: boolean;
  /** Show chart settings tab */
  isChartTabVisible: boolean;
  /** Show annotations tab */
  isAnnotationsTabVisible: boolean;
  /** Show MDR annotations */
  isMDRAnnotationsVisible: boolean;
  /** Show analysis tab */
  isAnalysisTabVisible: boolean;
  /** Show spark braille control */
  isSparkBrailleControlVisible: boolean;
  /** Show color palette control */
  isColorPaletteControlVisible: boolean;
  /** Show color vision deficiency control */
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
export interface TickLabelSettings extends SettingGroup {
  /** Draw labels on tick marks */
  isDrawTickLabels: boolean;
  /** Font size for tick labels */
  fontSize: string;
  /** Rotation angle for labels in degrees */
  angle: number;
  /** Offset distance from tick marks */
  offsetGap: number;
  /** Gap between adjacent labels */
  gap: number;
}

/** @public */
export interface TickSettings extends SettingGroup {
  /** Enable drawing of tick marks */
  isDrawTicks?: boolean;
  /** Padding around tick marks */
  padding: number;
  /** Opacity of tick marks (0-1) */
  opacity: number;
  /** Width of tick mark lines */
  strokeWidth: number;
  /** End cap style for tick lines */
  strokeLinecap: string;
  /** Length of tick marks in pixels */
  length: number;
  /** Format for tick labels */
  labelFormat: LabelFormat;
  /** Tick label settings */
  labels: TickLabelSettings;
  /** Interval between tick marks */
  step: number;
  /** Whether ticks align with data points (bar charts only) */
  isOnDatapoint: boolean;
}

/** @public */
export interface AxisLineSettings extends SettingGroup {
  /** Draw the main axis line */
  isDrawAxisLine: boolean;
  /** Draw overhang beyond data range */
  isDrawOverhang: boolean;
  /** Width of axis line stroke */
  strokeWidth: number;
  /** End cap style for axis line */
  strokeLinecap: string;
}

/** @public */
export interface AxisSettings extends SettingGroup {
  /** Minimum value for axis scale */
  minValue: number | 'unset';
  /** Maximum value for axis scale */
  maxValue: number | 'unset';
  /** Interval between major values */
  interval: number | 'unset';
}

/** @public */
export interface AxisTitleSettings extends SettingGroup {
  /** Draw axis title */
  isDrawTitle?: boolean;
  /** Title text content */
  text?: string;
  /** Gap between title and axis */
  gap: number;
  /** Font size for title */
  fontSize: string;
  /** Text alignment relative to axis */
  align?: 'start' | 'middle' | 'end';
  /** Position relative to chart */
  position?: 'top' | 'bottom';
}

/** Settings for horizontal or vertical axis orientation
 * @public
 */
export interface OrientedAxisSettings<T extends AxisOrientation> extends SettingGroup {
  /** Enable drawing this axis */
  isDrawAxis: boolean;
  /** Position relative to chart (north/south for horiz, east/west for vert) */
  position: T extends 'horiz'
    ? VertCardinalDirection
    : HorizCardinalDirection;
  /** Axis title configuration */
  title: AxisTitleSettings;
  /** Tick mark settings */
  ticks: TickSettings;
  /** Axis line settings */
  line: AxisLineSettings;
  /** Order of label values along axis */
  labelOrder: T extends 'horiz'
    ? 'westToEast' | 'eastToWest'
    : 'southToNorth' | 'northToSouth';
  /** Stagger labels to prevent overlap */
  isStaggerLabels: boolean;
  /** Wrap long labels to multiple lines */
  isWrapLabels: boolean;
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
  /** Horizontal axis display settings */
  horiz: OrientedAxisSettings<'horiz'>;
  /** Vertical axis display settings */
  vert: OrientedAxisSettings<'vert'>;
}

/** Order for legend items
 * @public
 */
export type LegendItemOrder = 'alphabetical' | 'series';

/** @public */
export interface LegendSettings extends SettingGroup {
  /** Draw chart legend */
  isDrawLegend: boolean;
  /** Draw legend only when multiple series present */
  isDrawLegendWhenNeeded: boolean; // NOTE: not yet implemented
  /** Always draw legend regardless of data */
  isAlwaysDrawLegend: boolean;
  /** Visual styling for legend box */
  boxStyle: BoxStyle;
  /** Internal padding within legend box */
  padding: number;
  /** Gap between symbol and label */
  symbolLabelGap: number;
  /** Gap between legend items */
  pairGap: number;
  /** Position relative to chart */
  position: CardinalDirection;
  /** Margin around legend */
  margin: number;
  /** Ordering of legend items */
  itemOrder: LegendItemOrder;
  /** Font size for legend text */
  fontSize: string;
}

/** Plot area dimensions
 * @public
 */
export interface PlotAreaSettings extends SettingGroup {
  /** Size of the plot area */
  size: Size2d;
}

/** Popup tooltip settings
 * @public
 */
export interface PopupSettings extends SettingGroup {
  /** Background opacity (0-1) */
  opacity: number;
  /** Left padding inside popup */
  leftPadding: number;
  /** Right padding inside popup */
  rightPadding: number;
  /** Top padding inside popup */
  upPadding: number;
  /** Bottom padding inside popup */
  downPadding: number;
  /** Margin around popup */
  margin: number;
  /** Maximum width before text wraps */
  maxWidth: number;
  /** Visual style of popup */
  shape: "box" | "boxWithArrow";
  /** When popup appears */
  activation: "onHover" | "onFocus" | "onSelect";
  /** Corner radius for rounded popups */
  borderRadius: number;
  /** Background color scheme */
  backgroundColor: "dark" | "light"
  /** Show crosshair */
  isShowCrosshair: boolean;
  /** Make crosshair follow pointer */
  isCrosshairFollowPointer: boolean;

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
export interface BarSettings extends PlaneChartSettings {
  /** How bars are stacked */
  stacking: 'none' | 'standard'; // | '100%';
  /** Width of individual bars */
  barWidth: number;
  /** Color each bar individually vs by series */
  colorByDatapoint: boolean;
  /** Show total value labels on stacked bars */
  isDrawTotalLabels: boolean;
  /** Gap between total value labels and stacks */
  totalLabelGap: number;
  /** Gap between stack labels and bars */
  stackLabelGap: number;
  /** Show record name labels */
  isDrawRecordLabels: boolean;
  /** Show data value labels on bars */
  isDrawDataLabels: boolean;
  /** Position of data value labels */
  dataLabelPosition: BarDataLabelPosition;
  /** How to cluster related bars */
  clusterBy?: BarClusterMode;
  /** Field to sort bars by */
  orderBy?: string;
  /** Gap between bar clusters */
  clusterGap: number;
  /** Gap between individual bars */
  barGap: number;
  /** Gap inside stacked bars */
  stackInsideGap: number;
  /** Abbreviate series names */
  isAbbrevSeries: boolean;
  /** Format for cluster labels */
  clusterLabelFormat: LabelFormat;
  /** Width of bar outlines */
  lineWidth: number;
  /** Enable popup tooltips */
  isShowPopups: boolean;
  /** Font size for bar labels */
  labelFontSize: string;
}

/** Lollipop chart settings (extends bar settings)
 * @public
 */
export interface LollipopSettings extends BarSettings {
}

/** @public */
export interface WaterfallSettings extends PlaneChartSettings {
  /** Width of waterfall bars */
  barWidth: number;
  /** Color each bar individually */
  colorByDatapoint: boolean;
  /** Draw value labels on bars */
  isDrawLabels: boolean;
  /** Position of value labels */
  labelPosition: BarDataLabelPosition;
  /** Gap between labels and bars */
  barLabelGap: number;
  /** Gap between adjacent bars */
  barGap: number;
  /** Enable popup tooltips */
  isShowPopups: boolean;
  /** Font size for labels */
  labelFontSize: string;
}

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
export interface PointSettings extends PlaneChartSettings {
  /** Format for individual point labels */
  pointLabelFormat: LabelFormat;
  /** Size of selected point marker */
  selectedPointMarkerSize: Size2d;
}

/** @public */
export interface LineSettings extends PointSettings {
  /** Width of line strokes */
  lineWidth: number;
  /** Maximum line width */
  lineWidthMax: number;
  /** Line width in low vision mode */
  lowVisionLineWidth: number;
  /** Scale factor for highlighted lines */
  lineHighlightScale: number;
  /** Base size for point symbols */
  baseSymbolSize: number;
  /** Padding around series labels */
  seriesLabelPadding: number; // also used after leader lines
  /** Length of leader lines to labels */
  leaderLineLength: number;
  /** Always show series labels regardless of space */
  isAlwaysShowSeriesLabel?: boolean;
  /** Enable popup tooltips */
  isShowPopups: boolean;
  /** Enable trend-following navigation mode */
  isTrendNavigationModeEnabled: boolean;
}

/** @public */
export interface StepLineSettings extends PointSettings {
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
export interface ScatterSettings extends PointSettings {
  /** Draw trend/regression line */
  isDrawTrendLine: boolean;
  /** Highlight statistical outliers */
  isShowOutliers: boolean;
}

/** @public */
export interface HeatmapSettings extends PointSettings {
  /** Grid resolution for heat map */
  resolution: number;
}

/** Histogram chart settings
 * @public
 */
export interface HistogramSettings extends PointSettings {
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

/** Settings for labels outside radial charts
 * @public
 */
export interface RadialOutsideLabelSettings extends SettingGroup {
  /** Vertical gap between labels */
  vertGap: number;
  /** Gap between arc and label */
  arcGap: number;
  /** Horizontal shift for label positioning */
  horizShift: number;
  /** Horizontal padding around labels */
  horizPadding: number;
  /** Style of leader line to label */
  leaderStyle: 'direct' | 'underline';
  /** Label value format */
  format: LabelFormat;
  /** Gap for underline leader style */
  underlineGap: number;
  /** Label content template */
  contents: string;
}

/** Settings for labels inside radial charts
 * @public
 */
export interface RadialInsideLabelSettings extends SettingGroup {
  /** Label value format */
  format: LabelFormat;
  /** Position as distance along radius (0-1) */
  position: number;
  /** Label content template */
  contents: string;
}

/** @public */
export interface RadialSettings extends SettingGroup {
  /** Outside label configuration */
  outsideLabels: RadialOutsideLabelSettings;
  /** Inside label configuration */
  insideLabels: RadialInsideLabelSettings;
  /** Show label in center of chart */
  isRenderCenterLabel: boolean;
  /** Thickness of donut/gauge ring */
  annularThickness: number;
  /** What to show in center label */
  centerLabel: 'none' | 'title';
  /** Padding around center label */
  centerLabelPadding: number;
  /** Rotation offset for slice orientation */
  orientationAngleOffset: number;
  /** Which slices to separate from chart */
  explode: string;
  /** Distance for exploded slices */
  explodeDistance: number;
}

/** Chart type-specific settings collection
 * @public
 */
export interface ChartTypeSettings extends SettingGroup {
  /** Bar chart settings */
  bar: BarSettings;
  /** Column chart settings */
  column: BarSettings;
  /** Line chart settings */
  line: LineSettings;
  /** Scatter plot settings */
  scatter: ScatterSettings;
  /** Histogram settings */
  histogram: HistogramSettings;
  /** Heat map settings */
  heatmap: HeatmapSettings;
  /** Pie chart settings */
  pie: RadialSettings;
  /** Donut chart settings */
  donut: RadialSettings;
  /** Gauge chart settings */
  gauge: RadialSettings;
  /** Step line chart settings */
  stepline: StepLineSettings;
  /** Lollipop chart settings */
  lollipop: LollipopSettings;
  /** Waterfall chart settings */
  waterfall: WaterfallSettings;
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

/** Grid line display settings
 * @public
 */
export interface GridSettings extends SettingGroup {
  /** Draw horizontal grid lines */
  isDrawHorizLines: boolean;
  /** Draw vertical grid lines */
  isDrawVertLines: boolean;
  /** Draw line opposite horizontal axis */
  isDrawHorizAxisOppositeLine: boolean;
  /** Draw line opposite vertical axis */
  isDrawVertAxisOppositeLine: boolean;
}

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

/** Audio sonification settings
 * @public
 */
export interface SonificationSettings extends SettingGroup {
  /** Enable sonification audio feedback */
  isSoniEnabled: boolean;
  /** Enable musical riff playback */
  isRiffEnabled: boolean;
  /** Enable audio notifications */
  isNotificationEnabled: boolean;
  /** Lower frequency bound in Hz */
  hertzLower: number;
  /** Upper frequency bound in Hz */
  hertzUpper: number;
  /** Sonification playback speed multiplier */
  soniPlaySpeed?: number;
  /** Speed for musical riffs */
  riffSpeed?: riffSpeeds;
  /** Numeric index for riff speed */
  riffSpeedIndex: number;
  /** Play chords as arpeggios */
  isArpeggiateChords: boolean;
}

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
  /** Chart display and behavior settings */
  chart: ChartSettings;
  /** Axis configuration */
  axis: AxesSettings;
  /** Legend configuration */
  legend: LegendSettings;
  /** Popup tooltip settings */
  popup: PopupSettings;
  /** Plot area settings */
  plotArea: PlotAreaSettings;
  /** Chart type-specific settings */
  type: ChartTypeSettings;
  /** Grid line settings */
  grid: GridSettings;
  /** User interface settings */
  ui: UISettings;
  /** Animation settings */
  animation: AnimationSettings;
  /** Scrollytelling settings */
  scrollytelling: ScrollytellingSettings;
  /** Control panel settings */
  controlPanel: ControlPanelSettings;
  /** Color and appearance settings */
  color: ColorSettings;
  /** Navigation assistance settings */
  jim: JimSettings;
  /** Data table settings */
  dataTable: DataTableSettings;
  /** Status bar settings */
  statusBar: StatusBarSettings;
  /** Audio sonification settings */
  sonification: SonificationSettings;
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