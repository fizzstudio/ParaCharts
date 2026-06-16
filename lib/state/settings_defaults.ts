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

import { type Settings } from './settings_types';
import { SettingsInput } from '../config/config_types';
import { ChartType } from '@fizz/paramanifest';

// Per-chart-type default settings outside of the chart's own setting group
export const chartTypeDefaults: Partial<{[Property in ChartType]: SettingsInput}> = {
  bar: {
    'chart.orientation': 'east',
    'axis.vert.labelOrder': 'northToSouth',
    'axis.horiz.ticks.isDrawTicks': false,
    'grid.isDrawHorizLines': false,
    'legend.position': 'south',
    'legend.isAlwaysDrawLegend' : true
  },
  column: {
    'axis.horiz.ticks.isDrawTicks': true,
    'axis.vert.line.isDrawOverhang': true,
    'grid.isDrawVertLines': false,
    'legend.isAlwaysDrawLegend' : true
  },
  line: {
    'grid.isDrawVertLines': false
  },
  waterfall: {
    //'axis.horiz.ticks.isDrawTicks': false,
    'grid.isDrawVertLines': false
  },
  scatter: { 'legend.isAlwaysDrawLegend': true,
    'legend.position': 'north' }
};

/**
 * Default values for all settings.
 * @public
 */
export const defaults: Settings = {
  type: {
  	venn: {
      orientationAngleOffset: 0,
      insideLabels: { contents: '' },
      outsideLabels: { contents: '' },
      explode: ''
    }
  },
};
