/* ParaCharts: Default Settings
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

import { type SettingsInput, type Settings } from './settings_types';
import { HERTZ } from '../common/constants';
import { ChartType } from '@fizz/paramanifest';

export const chartTypeDefaults: Partial<{[Property in ChartType]: SettingsInput}> = {
  bar: {
    'chart.orientation': 'east',
    'axis.vert.labelOrder': 'northToSouth',
    'axis.x.tick.isDrawEnabled': false,
    'grid.isDrawHorizLines': false,
  },
  column: {
    'axis.x.tick.isDrawEnabled': false,
    'axis.y.line.isDrawOverhangEnabled': false,
    'grid.isDrawVertLines': false,
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
      width: 360,
      height: 360
    },
    title: {
      isDrawTitle: true,
      margin: 40,
      fontSize: 22,
      align: 'center',
      position: 'top',
    },
    orientation: 'north',
    padding: '8 10',
    //chartType: 'line'
    fontFamily: 'Helvetica, sans-serif',
    fontWeight: '300',
    stroke: 'purple',
    strokeWidth: 4,
    strokeHighlightScale: 1.5,
    symbolStrokeWidth: 2,
    symbolHighlightScale: 1.5,
    hasDirectLabels: true,
    hasLegendWithDirectLabels: false,
    isDrawSymbols: true,
    isStatic: false
  },
  axis: {
    minInterval: 25,
    datapointMargin: 3,
    horiz: {
      position: 'south',
      labelOrder: 'westToEast'
    },
    vert: {
      position: 'west',
      labelOrder: 'southToNorth'
    },
    x: {
      title: {
        isDrawTitle: true,
        gap: 8,
        fontSize: 15
      },
      line: {
        isDrawEnabled: true,
        isDrawOverhangEnabled: true,
        strokeWidth: 2,
        strokeLinecap: 'round',
      },
      tick: {
        isDrawEnabled: true,
        padding: 3,
        fontSize: 13,
        opacity: 1,
        strokeWidth: 2,
        strokeLinecap: 'round',
        length: 10,
        labelFormat: 'raw',
        tickLabel: {
          isDrawEnabled: true,
          angle: -45,
          offsetGap: 8,
          gap: 0
        },
        step: 1
      },
      minValue: 'unset',
      maxValue: 'unset',
    },
    y: {
      title: {
        isDrawTitle: true,
        gap: 8,
        fontSize: 15
      },
      line: {
        isDrawEnabled: true,
        isDrawOverhangEnabled: true,
        strokeWidth: 2,
        strokeLinecap: 'round',
      },
      tick: {
        isDrawEnabled: true,
        padding: 3,
        fontSize: 13,
        opacity: 1,
        strokeWidth: 2,
        strokeLinecap: 'round',
        length: 10,
        labelFormat: 'raw',
        tickLabel: {
          isDrawEnabled: true,
          angle: 0,
          offsetGap: 0,
          gap: 0
        },
        step: 1,
      },
      minValue: 'unset',
      maxValue: 'unset',
    },
  },
  legend: {
    isDrawLegend: true,
    isDrawLegendWhenNeeded: true,
    isAlwaysDrawLegend: false,
    boxStyle: {
      outline: 'none',
      // outline: 'gray',
      outlineWidth: 1,
      fill: 'none',
      // fill: 'aliceblue',
    },
    padding: 10,
    symbolLabelGap: 5,
    pairGap: 30,
    position: 'east',
    margin: 20,
    itemOrder: 'series'
  },
  type: {
    bar: {
      barWidth: 20,
      minBarWidth: 20,
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      stackLabelGap: 10,
      isDrawRecordLabels: false,
      isDrawValueLabels: false,
      clusterBy: undefined,
      clusterGap: 10,
      stackContent: 'all',
      stackCount: 1,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 0.25,
      clusterLabelFormat: 'raw',
      lineWidth: 5,
    },
    column: {
      barWidth: 10,
      minBarWidth: 20,
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      isDrawRecordLabels: false,
      isDrawValueLabels: true,
      stackLabelGap: 10,
      clusterBy: undefined,
      clusterGap: 10,
      stackContent: 'all',
      stackCount: 1,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 0.25,
      clusterLabelFormat: 'raw',
      lineWidth: 5,
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
      isDrawSymbols: true
    },
    scatter: {
      isDrawTrendLine: false,
      isShowOutliers: false,
      pointLabelFormat: 'raw',
      symbolStrokeWidth: 2,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      }
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
      relativeAxes: "Counts"
    },
    heatmap: {
      pointLabelFormat: 'raw',
      resolution: 20,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      }
    },
    pie: {
      categoryLabel: {
        isDrawEnabled: true,
        position: 'outside',
        outsideLabelGap: 10,
        outsideArcDistance: 10,
        outsideHorizShift: 5,
        format: 'raw',
        underlineGap: 2,
      },
      valueLabel: {
        isDrawEnabled: true,
        format: 'raw',
        position: 0.85,
      },
      isRenderCenterLabel: true,
      annularThickness: 1,
      centerLabel: 'none',
      centerLabelPadding: 10
    },
    donut: {
      categoryLabel: {
        isDrawEnabled: true,
        position: 'outside',
        outsideLabelGap: 10,
        outsideArcDistance: 10,
        outsideHorizShift: 5,
        format: 'raw',
        underlineGap: 2,
      },
      valueLabel: {
        isDrawEnabled: true,
        format: 'raw',
        position: 0.85,
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      centerLabel: 'title',
      centerLabelPadding: 15
    },
    gauge: {
      categoryLabel: {
        isDrawEnabled: true,
        position: 'outside',
        outsideLabelGap: 4,
        outsideArcDistance: 10,
        outsideHorizShift: 5,
        format: 'raw',
        underlineGap: 6,
      },
      valueLabel: {
        isDrawEnabled: true,
        format: 'raw',
        position: 0.85,
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      centerLabel: 'none',
      centerLabelPadding: 10
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
      }
    },
    lollipop: {
      barWidth: 10,
      minBarWidth: 6,
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      stackLabelGap: 10,
      isDrawRecordLabels: false,
      isDrawValueLabels: true,
      lineWidth: 5,
      clusterBy: undefined,
      clusterGap: 5,
      stackContent: 'all',
      stackCount: 1,
      isAbbrevSeries: true,
      orderBy: undefined,
      barGap: 0.25,
      clusterLabelFormat: 'raw',
    },
    graph: {
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
      isDrawSymbols: false,
      equation: '',
      xMin: -10,
      xMax: 10,
      preset: '',
      renderPts: 100
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
    isAnnouncementEnabled: true,
    speechRate: 1,
    isFullscreenEnabled: false,
    isLowVisionModeEnabled: false,
    isFocusRingEnabled: false,
    focusRingGap: 10
  },
  controlPanel: {
    isControlPanelDefaultOpen: true,
    tabLabelStyle: 'label',
    isCaptionVisible: true,
    isStatusBarVisible: true,
    isSparkBrailleVisible: false,
    isSparkBrailleControlVisible: true,
    isMDRAnnotationsVisible: false,
    isDataTabVisible: true,
    isColorsTabVisible: true,
    isAudioTabVisible: true,
    isControlsTabVisible: true,
    isChartTabVisible: true,
    isAnnotationsTabVisible: true,
    isGraphingTabVisible: true,
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
    isArpeggiateChords: true
  },
  dev: {
    isDebug: false
  }
};
