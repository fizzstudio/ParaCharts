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
  chart: {
    type: 'bar',
    size: {
      width: 600,
      height: 450
    },
    title: {
      isDrawTitle: true,
      margin: 40,
      fontSize: '12pt',
      align: 'center',
      position: 'top',
    },
    orientation: 'north',
    padding: '8 30',
    //chartType: 'line'
    fontFamily: 'Helvetica, sans-serif',
    fontWeight: '300',
    fontScale: 1,
    stroke: 'purple',
    strokeWidth: 4,
    strokeHighlightScale: 1.5,
    symbolStrokeWidth: 2,
    symbolHighlightScale: 1.5,
    hasDirectLabels: true,
    directLabelFontSize: '10pt',
    hasLegendWithDirectLabels: false,
    isDrawSymbols: true,
    isStatic: false,
    isShowVisitedDatapointsOnly: false,
    isShowPopups: false,
  },
  axis: {
    minInterval: 25,
    datapointMargin: 3,
    horiz: {
      isDrawAxis: true,
      position: 'south',
      title: {
        isDrawTitle: false,
        gap: 8,
        fontSize: '12pt'
      },
      ticks: {
        isDrawTicks: true,
        padding: 3,
        opacity: 1,
        strokeWidth: 2,
        strokeLinecap: 'round',
        length: 10,
        labelFormat: 'raw',
        labels: {
          isDrawTickLabels: true,
          fontSize: '10pt',
          angle: 0, //-45,
          offsetGap: 4,
          gap: 10
        },
        step: 1,
        isOnDatapoint: true
      },
      line: {
        isDrawAxisLine: true,
        isDrawOverhang: true,
        strokeWidth: 2,
        strokeLinecap: 'round',
      },
      labelOrder: 'westToEast',
      isStaggerLabels: false,
      isWrapLabels: true,
      interval: 'unset',
    },
    vert: {
      isDrawAxis: true,
      position: 'west',
      title: {
        isDrawTitle: true,
        gap: 8,
        fontSize: '12pt'
      },
      ticks: {
        isDrawTicks: true,
        padding: 3,
        opacity: 1,
        strokeWidth: 2,
        strokeLinecap: 'round',
        length: 10,
        labelFormat: 'raw',
        labels: {
          isDrawTickLabels: true,
          fontSize: '10pt',
          angle: 0,
          offsetGap: 0,
          gap: 0
        },
        step: 1,
        isOnDatapoint: true
      },
      line: {
        isDrawAxisLine: true,
        isDrawOverhang: true,
        strokeWidth: 2,
        strokeLinecap: 'round',
      },
      labelOrder: 'southToNorth',
      isStaggerLabels: false,
      isWrapLabels: false
    },
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
  legend: {
    isDrawLegend: true,
    isDrawLegendWhenNeeded: true,
    isAlwaysDrawLegend: false,
    boxStyle: {
      outline: 'none',
      //outline: 'gray',
      outlineWidth: 1,
      fill: 'none',
      //fill: 'aliceblue',
    },
    padding: 10,
    symbolLabelGap: 4,
    pairGap: 10,
    position: 'east',
    margin: 20,
    itemOrder: 'series',
    fontSize: '10pt'
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
      clusterGap: 2,
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
      isDrawTrendLine: false,
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
    pie: {
      outsideLabels: {
        vertGap: 10,
        arcGap: 10,
        horizShift: 15,
        horizPadding: 10,
        leaderStyle: 'direct',
        format: 'raw',
        underlineGap: 2,
        contents: 'percentage:(value)'
      },
      insideLabels: {
        format: 'raw',
        position: 0.9,
        contents: 'category'
      },
      isRenderCenterLabel: true,
      annularThickness: 1,
      centerLabel: 'none',
      centerLabelPadding: 10,
      orientationAngleOffset: 90,
      explode: '',
      explodeDistance: 20
    },
    donut: {
      outsideLabels: {
        vertGap: 10,
        arcGap: 10,
        horizShift: 15,
        horizPadding: 10,
        leaderStyle: 'direct',
        format: 'raw',
        underlineGap: 2,
        contents: 'percentage:(value)'
      },
      insideLabels: {
        format: 'raw',
        position: 0.85,
        contents: 'category'
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      centerLabel: 'title',
      centerLabelPadding: 15,
      orientationAngleOffset: 90,
      explode: '',
      explodeDistance: 20
    },
    gauge: {
      outsideLabels: {
        vertGap: 4,
        arcGap: 10,
        horizShift: 15,
        horizPadding: 10,
        leaderStyle: 'direct',
        format: 'raw',
        underlineGap: 6,
        contents: 'percentage:(value)'
      },
      insideLabels: {
        format: 'raw',
        position: 0.85,
        contents: 'category'
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      centerLabel: 'none',
      centerLabelPadding: 10,
      orientationAngleOffset: 90,
      explode: '',
      explodeDistance: 20
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
  grid: {
    isDrawHorizLines: true,
    isDrawVertLines: true,
    isDrawHorizAxisOppositeLine: true,
    isDrawVertAxisOppositeLine: true
  },
  ui: {
    isVoicingEnabled: false,
  	isNarrativeHighlightEnabled: false,
	  isNarrativeHighlightPaused: false,
    isAnnouncementEnabled: true,
    speechRate: 1,
    isFullscreenEnabled: false,
    isLowVisionModeEnabled: false,
    isFocusRingEnabled: false,
    focusRingGap: 10,
    navRunTimeoutMs: 125,
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
  color: {
    colorVisionMode: 'normal',
    isDarkModeEnabled: false,
    contrastLevel: 1,
    colorPalette: 'diva',
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
  sonification: {
    isSoniEnabled: false,
    isRiffEnabled: true,
    isNotificationEnabled: true,
    hertzLower: 35,
    hertzUpper: HERTZ.length - 12,
    soniPlaySpeed: 3,
    riffSpeed: 'medium',
	  riffSpeedIndex: 2,
    isArpeggiateChords: true
  },
  dev: {
    isDebug: false,
    isShowGridTerritories: false
  }
};
