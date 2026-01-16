/* ParaCharts: XY Charts
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

import { Logger, getLogger } from '@fizz/logger';
import {
  DataLayer,
} from '../data_layer';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { ParaView } from '../../../../paraview';
import { Setting } from '../../../../state';

import { PlaneDatapoint, Datapoint } from '@fizz/paramodel';

export type DatapointViewType<T extends PlaneDatapointView> =
  (new (...args: any[]) => T);

/**
 * Abstract base class for charts with X and Y axes.
 */
export abstract class PlanePlotView extends DataLayer {
  constructor(
    paraview: ParaView,
    width: number,
    height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this.log = getLogger("PlanePlotView");
  }

  get datapointViews() {
    return super.datapointViews as PlaneDatapointView[];
  }

  get visitedDatapointViews() {
    return super.visitedDatapointViews as PlaneDatapointView[];
  }

  get selectedDatapointViews() {
    return super.selectedDatapointViews as PlaneDatapointView[];
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if ([`type.${this.paraview.store.type}.minYValue`, `type.${this.paraview.store.type}.maxYValue`].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  /*
  protected get _eventActions(): Actions<this> {
    return {
      ...super._eventActions,
      // User attempted to move past series endpoint in chord mode
      series_endpoint_reached: function() {
        todo().controller.announce('On final point.');
      },
      // User attempted to move past endpoint of final series
      final_series_endpoint_reached: function() {
        todo().controller.appendAnnouncement('Press the up arrow to go to the previous series, or the left arrow to go to the previous point in this series');
        todo().controller.announce('On final point of final series.');
      },
      // User attempted to move up from first series
      first_series_reached: function() {
        todo().controller.appendAnnouncement('Press the down arrow to go to the next series, or the left or right arrow to explore this series');
        todo().controller.announce('On first series.');
      },
      // User attempted to move down from final series
      final_series_reached: function() {
        todo().controller.appendAnnouncement('Press the up arrow to go to the previous series, or the left or right arrow to explore this series');
        todo().controller.announce('On final series.');
      },
      // User attempted to move up or down while on the root nav point
      no_series: function() {
        todo().controller.announce('No series selected.');
      },
      chord_mode_no_up_down: function() {
        todo().controller.announce('Cannot switch series in chord mode.');
      },
    };
  }*/

  /*compareDatapoints(datapoint1: XYDatapointView, datapoint2: XYDatapointView) :
    {
      comparator: string,
      diff: number
    }
  {
    // TODO: localize this text output
    // TODO: move this to some statistical / NLP module
    const value1 = datapoint1.datapoint.y;
    const value2 = datapoint2.datapoint.y;
    const result = value1.compare(value2);
    let comparator = '';
    if (result.relationship === 'equal') {
      comparator = 'equal to';
    } else {
      comparator = (result.relationship === 'greater') ? 'greater than' : 'less than';
    }
    return {
      comparator,
      diff: result.diff!
    };
  }

  capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }*/

}

type Mutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};

/**
 * Abstract base class for a view representing an entire series on an XYChart.
 * @public
 */
export class PlaneSeriesView extends SeriesView {

  declare protected _children: PlaneDatapointView[];
  declare chart: PlanePlotView;

  get children(): readonly PlaneDatapointView[] {
    return super.children as PlaneDatapointView[];
  }

  get siblings(): readonly this[] {
    return super.siblings as this[];
  }

}

/**
 * Abstract base class for chart views representing XYChart datapoint values
 * (e.g., points, bars, etc.).
 * @public
 */
export abstract class PlaneDatapointView extends DatapointView {

  declare readonly chart: PlanePlotView;
  declare _datapoint: PlaneDatapoint;

  protected centroid?: string;

  constructor(seriesView: SeriesView) {
    super(seriesView);
  }

  protected _addedToParent() {
    super._addedToParent();
    // this._extraAttrs = [
    //   {
    //     attr: literal`data-series`,
    //     value: this.series.key
    //   },
    //   {
    //     attr: literal`data-index`,
    //     value: this.index
    //   },
    //   {
    //     attr: literal`data-label`,
    //     value:
    //     formatXYDatapointX(this.datapoint, this.paraview.store.getFormatType('domId')),
    //   },
    //   {
    //     attr: literal`data-centroid`,
    //     value: this.centroid
    //   }
    // ];
  }

  // override to get more specific return type
  get datapoint(): PlaneDatapoint {
    return super.datapoint as PlaneDatapoint;
  }

  // get styleInfo() {
  //   const styles = super.styleInfo;
  //   styles['--datapoint-centroid'] = this.centroid;
  //   return styles;
  // }

  /*protected get _eventActions(): Actions<this> {
    return {
      datapoint_focused: function(focusInfo: FocusInfo) {
        todo().controller.announce(this.summary(focusInfo));
      },
      datapoint_selected: function(selectionInfo: XYSelectionInfo) {
        todo().controller.announce(this.chart.composeDatapointSelectionAnnouncement(selectionInfo));
      },
    };
  }*/

  //abstract computeLayout(): void;

  /*summary(focusInfo: FocusInfo) {
    if (focusInfo.visited.length > 1) {
      return `${this.datapoint.formatX('statusBar')}, all points`;
    } else {
      // Don't include the series name unless the previously-visited point
      // was in a different series
      const datapoint = this.datapoint.format('statusBar');
      /*if (!focusInfo.isSeriesChange) {
        return datapoint;
      } else if (todo().seriesSummaries[focusInfo.visited[0].series.name!]) {
        return `${todo().controller.todo.seriesSummaries[focusInfo.visited[0].series.name!]} ${datapoint}`;
      } else {
        return `${focusInfo.visited[0].series.name!}: ${datapoint}`;
      }*/
  //  }
  //}

  async onFocus(isNewComponentFocus = false) {
    await super.onFocus(isNewComponentFocus);
    // let data = []
    // for (let point of this.series.rawData){
    //   data.push(point.y)
    // }
    // if (this.paraview.store.type == "bar" || this.paraview.store.type == "column"){
    //   this.paraview.store.updateSettings(draft => {
    //   draft.controlPanel.isSparkBrailleBar = true
    // })};
    // this.paraview.store.sparkBrailleData = data.join(' ');
    /*todo().deets!.sparkBrailleData = this.series.data.join(' ');
    if (todo().controller.settingStore.settings.sonification.isSoniEnabled) {
      this.chart.sonifier.playDatapoints(...visited.map(v => v.datapoint));
    }
    setTimeout(() => {
      this.eventActionManager!.dispatch('datapoint_focused', {
        visited,
        isSeriesChange:
          this.chart.isChordModeEnabled ? false :
          !(todo().canvas.prevFocusLeaf instanceof DataView) ? true :
          (todo().canvas.prevFocusLeaf as DataView).series.name !== visited[0].series.name ? true :
          false
      });
    }, NOTE_LENGTH*1000);*/
  }

}
