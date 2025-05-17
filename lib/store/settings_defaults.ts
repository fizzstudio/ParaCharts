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

import { type Settings } from './settings_types';
import { HERTZ } from '../common/constants';

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
      margin: 40,
      fontSize: 22,
      align: 'center',
      position: 'top',
    },
    orientation: 'north',
    padding: 15,
    //chartType: 'line'
    fontFamily: 'Helvetica, sans-serif',
    fontWeight: '300',
    strokeWidth: 4,
    strokeHighlightScale: 1.5,
    symbolStrokeWidth: 2,
    symbolHighlightScale: 1.5,
    hasDirectLabels: true,
    hasLegendWithDirectLabels: false,
    isDrawSymbols: true
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
          angle: -45,
          offsetPadding: 8,
          gap: 0
        },
        step: 1
      },
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
          angle: 0,
          offsetPadding: 0,
          gap: 0
        },
        step: 1,
      },
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
    itemOrder: 'chart'
  },
  type: {
    bar: {
      barWidth: 20,
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      stackLabelGap: 10,
      isDrawBarLabels: true,
      clusterBy: undefined,
      clusterGap: 5,
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
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      isDrawBarLabels: true,
      stackLabelGap: 10,
      clusterBy: undefined,
      clusterGap: 5,
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
      baseSymbolSize: 10,
      seriesLabelPadding: 5,
      pointLabelFormat: 'raw',
      leaderLineLength: 30,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      }
    },
    scatter: {
      pointLabelFormat: 'raw',
      symbolStrokeWidth: 2,
      selectedPointMarkerSize: {
        width: 20,
        height: 20,
      }
    },
    pie: {
      categoryLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      valueLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      isRenderCenterLabel: true,
      annularThickness: 1,
      categoryLabelPosition: 'outside',
      categoryLabelFormat: 'raw',
      categoryLabelUnderlineGap: 4,
      sliceValueFormat: 'raw'
    },
    donut: {
      categoryLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      valueLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      categoryLabelPosition: 'outside',
      categoryLabelFormat: 'raw',
      categoryLabelUnderlineGap: 4,
      sliceValueFormat: 'raw'
    },
    gauge: {
      categoryLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      valueLabel: {
        isDrawEnabled: true,
        margin: 3,
        fontSize: 15,
        color: 'black',
      },
      isRenderCenterLabel: true,
      annularThickness: 0.5,
      categoryLabelPosition: 'outside',
      categoryLabelFormat: 'raw',
      categoryLabelUnderlineGap: 4,
      sliceValueFormat: 'raw'
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
      colorByDatapoint: false,
      isDrawStackLabels: false,
      isStackLabelInsideBar: true,
      stackLabelGap: 10,
      isDrawBarLabels: true,
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
    isFullScreenEnabled: false,
    isLowVisionModeEnabled: false
  },
  controlPanel: {
    isControlPanelDefaultOpen: true,
    tabLabelStyle: 'label',
    isCaptionVisible: true,
    isStatusBarVisible: true,
    isSparkBrailleVisible: false,
    isSparkBrailleControlVisible: true,
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
    isChordModeEnabled: false,
    hertzLower: 35,
    hertzUpper: HERTZ.length - 12,
    soniPlaySpeed: 3,
    riffSpeed: 'medium'
  },
  dev: {
    isDebug: false
  }
};
