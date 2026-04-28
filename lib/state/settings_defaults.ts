/* ParaCharts: Default Settings
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

import { type SettingsInput, type Settings } from './settings_types';
import { HERTZ } from '../common/constants';
import { ChartType } from '@fizz/paramanifest';

// Per-chart-type default settings outside of the chart's own setting group
export const chartTypeDefaults: Partial<{[Property in ChartType]: SettingsInput}> = {
  bar: {
    'chart.orientation': 'east',
    'axis.vert.labelOrder': 'northToSouth',
    'axis.horiz.ticks.isDrawTicks': false,
    'grid.isDrawHorizLines': false,
  },
  column: {
    'axis.horiz.ticks.isDrawTicks': true,
    'axis.vert.line.isDrawOverhang': true,
    'grid.isDrawVertLines': false,
  },
  line: {
    'grid.isDrawVertLines': false
  },
  waterfall: {
    //'axis.horiz.ticks.isDrawTicks': false,
    'grid.isDrawVertLines': false
  }
};

/**
 * Default values for all settings.
 * @public
 */
export const defaults: Settings = {
  axis: {
    minInterval: 25,
    datapointMargin: 3,
    x: {
      minValue: 'unset',
      maxValue: 'unset',
      interval: 'unset'
    },
    y: {
      minValue: 'unset',
      maxValue: 'unset',
      interval: 'unset'
    },
  },
  plotArea: {
    size: {
      width: 600,
      height: 250
    }
  },
  popup :{
    opacity: 1,
    leftPadding: 10,
    rightPadding: 10,
    upPadding: 10,
    downPadding: 10,
    margin: 40,
    maxWidth: 175,
    shape: "boxWithArrow",
    activation: "onHover",
    borderRadius: 5,
    backgroundColor: "dark",
    isShowCrosshair: true,
    isCrosshairFollowPointer: false,
  },
  type: {
    bar: {
      stacking: 'standard',
      barWidth: 0,
      colorByDatapoint: false,
      isDrawTotalLabels: true,
      totalLabelGap: 5,
      stackLabelGap: 10,
      isDrawRecordLabels: false,
      isDrawDataLabels: false,
      dataLabelPosition: 'center',
      clusterBy: undefined,
      clusterGap: 0,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 2,
      stackInsideGap: 2,
      clusterLabelFormat: 'raw',
      lineWidth: 5,
      isShowPopups: false,
      labelFontSize: '8pt',
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    column: {
      stacking: 'standard',
      barWidth: 0,
      colorByDatapoint: false,
      isDrawTotalLabels: false,
      totalLabelGap: 10,
      isDrawRecordLabels: false,
      isDrawDataLabels: false,
      dataLabelPosition: 'center',
      stackLabelGap: 10,
      clusterBy: undefined,
      clusterGap: 5,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 20,
      stackInsideGap: 2,
      clusterLabelFormat: 'raw',
      lineWidth: 5,
      isShowPopups: false,
      labelFontSize: '8pt',
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    line: {
      lineWidth: 5,
      lineWidthMax: 25,
      lowVisionLineWidth: 15,
      lineHighlightScale: 1.5,
      baseSymbolSize: 10,
      seriesLabelPadding: 5,
      pointLabelFormat: 'raw',
      leaderLineLength: 30,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      },
      isDrawSymbols: true,
      isShowPopups: false,
      isTrendNavigationModeEnabled: false,
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    scatter: {
      isShowTrendLine: false,
      isShowOutliers: false,
      pointLabelFormat: 'raw',
      symbolStrokeWidth: 2,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      },
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    histogram: {
      pointLabelFormat: 'raw',
      bins: 20,
      displayAxis: `x`,
      groupingAxis: ``,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      },
      relativeAxes: "Counts",
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    heatmap: {
      pointLabelFormat: 'raw',
      resolution: 20,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      },
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    stepline: {
      lineWidth: 5,
      lineWidthMax: 25,
      baseSymbolSize: 10,
      seriesLabelPadding: 5,
      pointLabelFormat: 'raw',
      leaderLineLength: 30,
      symbolStrokeWidth: 2,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      },
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    lollipop: {
      stacking: 'standard',
      barWidth: 10,
      minBarWidth: 6,
      colorByDatapoint: false,
      isDrawTotalLabels: false,
      totalLabelGap: 10,
      stackLabelGap: 10,
      isDrawRecordLabels: false,
      isDrawDataLabels: false,
      dataLabelPosition: 'end',
      lineWidth: 5,
      clusterBy: undefined,
      clusterGap: 5,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 0.25,
      stackInsideGap: 4,
      clusterLabelFormat: 'raw',
      isShowPopups: false,
      labelFontSize: '8pt',
      minYValue: 'unset',
      maxYValue: 'unset'
    },
    waterfall: {
      barWidth: 10,
      colorByDatapoint: false,
      isDrawLabels: true,
      labelPosition: 'outside',
      barLabelGap: 10,
      barGap: 10,
      isShowPopups: false,
      labelFontSize: '10pt',
      minYValue: 'unset',
      maxYValue: 'unset'
    },
	venn: {
      orientationAngleOffset: 0,
      insideLabels: { contents: '' },
      outsideLabels: { contents: '' },
      explode: ''
    }
  },
  animation: {
    isAnimationEnabled: false,
    animateRevealTimeMs: 2500,
    popInAnimateRevealTimeMs: 750,
    animationType: 'yAxis',
    animationOrigin: 'initialValue',
    animationOriginValue: 0,
    expandPoints: true,
    lineSnake: false,
    symbolPopIn: false
  },
  scrollytelling: {
    isScrollytellingEnabled: true,
    isScrollyAnnouncementsEnabled: true,
    isScrollySoniEnabled: true,
  },
  controlPanel: {
    isControlPanelDefaultOpen: true,
    tabLabelStyle: 'label',
    isCaptionVisible: true,
    isExplorationBarVisible: true,
    caption: {
      isCaptionExternalWhenControlPanelClosed: true,
      hasBorder: false,
      isExplorationBarBeside: true
    },
    isSparkBrailleVisible: false,
    isSparkBrailleControlVisible: true,
    isMDRAnnotationsVisible: false,
    isDataTabVisible: true,
    isColorsTabVisible: true,
    isAudioTabVisible: true,
    isControlsTabVisible: true,
    isChartTabVisible: true,
    isAnnotationsTabVisible: true,
    isAnalysisTabVisible: true,
    isColorPaletteControlVisible: true,
    isCVDControlVisible: true,
  },
  jim: {
    xValueFormat: 'raw'
  },
  dataTable: {
    xValueFormat: 'raw',
    yValueFormat: 'raw'
  },
  statusBar: {
    valueFormat: 'raw'
  },
  dev: {
    isDebug: false,
    isShowGridTerritories: false
  }
};
