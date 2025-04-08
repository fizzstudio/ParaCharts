/* ParaCharts: Datapoint Formatter
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

import { Datatype } from "../common/types";
import { strToId } from "../common/utils";
import { Box, Datapoint2D } from "../store/model2D";
import { ParaStore } from "../store/parastore";
import { SettingsManager } from "../store/settings_manager";

export function formatBox(
  box: Box<Datatype>, 
  context: FormatContext, 
  store: ParaStore
) {
  const settingVal = context === 'domId' 
    ? 'domId' 
    : SettingsManager.get(formatContextSettings[context], store.settings);
  if (settingVal === 'raw') {
    return box.raw;
  } else if (settingVal === 'domId') {
    return strToId(box.raw);
  } else {
    return box.value.toString();
  }
}

export function formatDatapointValue(
  datapoint: Datapoint2D<Datatype>, 
  dimension: 'x' | 'y',
  context: FormatContext, 
  store: ParaStore
) {
  const settingVal = context === 'domId' 
    ? 'domId' 
    : SettingsManager.get(formatContextSettings[context], store.settings);
  if (settingVal === 'raw') {
    return dimension === 'x' ? datapoint.xRaw : datapoint.yRaw;
  } else if (settingVal === 'domId') {
    return strToId(dimension === 'x' ? datapoint.xRaw : datapoint.yRaw);
  } else if (dimension === 'y') {
    return datapoint.y.toString();
  } else {
    return datapoint.xToString();
  }
}

export function formatDatapointX(
  datapoint: Datapoint2D<Datatype>, 
  context: FormatContext, 
  store: ParaStore
): string {
  return formatDatapointValue(datapoint, 'x', context, store);
}

export function formatDatapointY(
  datapoint: Datapoint2D<Datatype>, 
  context: FormatContext, 
  store: ParaStore
): string {
  return formatDatapointValue(datapoint, 'y', context, store);
}

export function formatDatapoint(
  datapoint: Datapoint2D<Datatype>, 
  context: FormatContext, 
  store: ParaStore
): string {
  const x = formatDatapointValue(datapoint, 'x', context, store);
  const y = formatDatapointValue(datapoint, 'y', context, store);
  return `${x}, ${y}`;
}

/** 
 * Context where a particular value appears. 
 * @public
 */
export type FormatContext = keyof typeof formatContextSettings;
// Settings that control the format for each context
const formatContextSettings = {
  xTick: 'axis.x.tick.labelFormat',
  yTick: 'axis.y.tick.labelFormat',
  linePoint: 'type.line.pointLabelFormat',
  scatterPoint: 'type.scatter.pointLabelFormat',
  barCluster: 'type.bar.clusterLabelFormat',
  pieChunk: 'type.pie.chunkLabelFormat',
  donutChunk: 'type.donut.chunkLabelFormat',
  gaugeChunk: 'type.gauge.chunkLabelFormat',
  steplinePoint: 'type.stepline.pointLabelFormat',
  lollipopPoint: 'type.lollipop.pointLabelFormat',
  lollipopCluster: 'type.lollipop.clusterLabelFormat',
  jimX: 'jim.xValueFormat',
  dataTableX: 'dataTable.xValueFormat',
  dataTableY: 'dataTable.yValueFormat',
  statusBar: 'statusBar.valueFormat',
  domId: 'NA'
};
