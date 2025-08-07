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

import {
  DataLayer,
  RiffOrder,
  SONI_PLAY_SPEEDS, SONI_RIFF_SPEEDS
} from '../data_layer';
import { ChartLandingView, DatapointView, SeriesView } from '../../../data';
import { HorizDirection, type Setting } from '../../../../store/settings_types';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { ParaView } from '../../../../paraview';
import { HotkeyEvent } from '../../../../store/keymap_manager';
import { NavNode } from '../navigation';

import { PlaneDatapoint, Datapoint } from '@fizz/paramodel';

export type DatapointViewType<T extends XYDatapointView> =
  (new (...args: any[]) => T);

/**
 * Information about a view focus action.
 * @public
 */
export interface FocusInfo {
  /** List of all visited datapoint views. */
  visited: XYDatapointView[];
  /** Whether the focused series has chnaged. */
  isSeriesChange?: boolean;
}

/**
 * Abstract base class for charts with X and Y axes.
 */
export abstract class XYChart extends DataLayer {

  protected isGrouping = false;
  protected isConnector = false;
  protected maxDatapointSize!: number;

  constructor(paraview: ParaView, dataLayerIndex: number) {
    super(paraview, dataLayerIndex);
  }

  protected _addedToParent() {
    super._addedToParent();
    // this.maxDatapointSize = this.width/2.5;
  }

  get datapointViews() {
    return super.datapointViews as XYDatapointView[];
  }

  get visitedDatapointViews() {
    return super.visitedDatapointViews as XYDatapointView[];
  }

  get selectedDatapointViews() {
    return super.selectedDatapointViews as XYDatapointView[];
  }

  /*protected get _hotkeyActions(): Actions<this> {
    return {...super._hotkeyActions, ...hotkeyActions['chart.xy']};
  }

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
  }

  get keymap() {
    return {...super.keymap, ...keymaps['chart.xy']};
  }*/

  protected _createNavMap() {
    super._createNavMap();
    this._createPrimaryNavNodes();
    if (this.paraview.store.model!.seriesKeys.length > 1) {
      this._createNavLinksBetweenSeries();
      this._createChordNavNodes();
    }
  }

  protected _createPrimaryNavNodes() {
    // Create series and datapoint nav nodes, and link them horizontally thusly:
    // - [SERIES-A]-[SERIES-A-POINT-0]- ... -[SERIES-A-POINT-(N-1)]-[SERIES-B]-[SERIES-B-POINT-0]- ...
    let left = this._navMap.root.get('top')!;
    this._chartLandingView.children.forEach((seriesView, i) => {
      const seriesNode = new NavNode(this._navMap.root, 'series', {
        seriesKey: seriesView.seriesKey
      });
      seriesNode.connect('left', left);
      left = seriesNode;
      seriesView.children.forEach(dp => seriesNode.addDatapointView(dp));
      seriesView.children.forEach((dp, j) => {
        const node = new NavNode(this._navMap.root, 'datapoint', {
          seriesKey: dp.seriesKey,
          index: dp.index
        });
        node.addDatapointView(dp);
        node.connect('left', left);
        left = node;
      });
    });
  }

  protected _createNavLinksBetweenSeries() {
    // Create vertical links between series and datapoints
    this._chartLandingView.children.slice(0, -1).forEach((seriesView, i) => {
      const seriesNode = this._navMap.root.get('series', i)!;
      const nextSeriesNode = this._navMap.root.get('series', i + 1)!;
      seriesNode.connect('down', nextSeriesNode);
      for (let j = 1; j <= seriesView.children.length; j++) {
        seriesNode.peekNode('right', j)!.connect(
          'down', nextSeriesNode.peekNode('right', j)!);
      }
    });
  }

  protected _createChordNavNodes() {
    // Create chord landings
    // NB: This will produce the nodes in insertion order
    this._navMap.root.query('datapoint', {
      seriesKey: this._chartLandingView.children[0].seriesKey
    }).forEach((node, i) => {
      const chordNode = new NavNode(this._navMap.root, 'chord', {});
      chordNode.connect('down', node);
      chordNode.connect('up', node.allNodes('down').at(-1)!);
      chordNode.allNodes('down', 'datapoint').forEach(node => chordNode.addDatapointView(node.at(0)!));
    });
    // Link chord landings
    this._navMap.root.query('chord').slice(0, -1).forEach((node, i) => {
      node.connect('right', this._navMap.root.get('chord', i + 1)!);
    });
  }

  protected _playRiff(order?: RiffOrder) {
    if (this.paraview.store.settings.sonification.isSoniEnabled
      && this.paraview.store.settings.sonification.isRiffEnabled) {
      const datapoints = this._navMap.cursor.datapointViews.map(view => view.datapoint);
      if (order === 'sorted') {
        datapoints.sort((a, b) => a.facetValueAsNumber('y')! - b.facetValueAsNumber('y')!);
      } else if (order === 'reversed') {
        datapoints.reverse();
      }
      const noteCount = datapoints.length;
      if (noteCount) {
        if (this._soniRiffInterval!) {
          clearInterval(this._soniRiffInterval!);
        }
        this.soniSequenceIndex++;
        this._soniRiffInterval = setInterval(() => {
          const datapoint = datapoints.shift();
          if (!datapoint) {
            clearInterval(this._soniRiffInterval!);
          } else {
            this._sonifier.playDatapoints(datapoint as PlaneDatapoint);
            this.soniNoteIndex++;
          }
        }, SONI_RIFF_SPEEDS.at(this.paraview.store.settings.sonification.riffSpeedIndex));
      }
    }
  }

  protected _playDatapoints(datapoints: PlaneDatapoint[]): void {
    this.sonifier.playDatapoints(...datapoints);
  }

  playDir(dir: HorizDirection) {
    if (this._navMap.cursor.type !== 'datapoint') {
      return;
    }
    let cursor = this._navMap.cursor;
    this._soniInterval = setInterval(() => {
      const next = cursor.peekNode(dir, 1);
      if (next && next.type === 'datapoint') {
        this._playDatapoints([next.at(0)!.datapoint as PlaneDatapoint]);
        cursor = next;
      } else {
        this.clearPlay();
      }
    }, SONI_PLAY_SPEEDS.at(this._soniSpeedRateIndex));
  }

  protected _sparkBrailleInfo() {
    return  {
      data: this._navMap.cursor.datapointViews[0].series.datapoints.map(dp =>
        dp.facetValueAsNumber('y')!).join(' '),
      isBar: this.paraview.store.type === 'bar' || this.paraview.store.type === 'column'
    };
  }

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
export class XYSeriesView extends SeriesView {

  declare protected _children: XYDatapointView[];
  declare chart: XYChart;

  get children(): readonly XYDatapointView[] {
    return super.children as XYDatapointView[];
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
export abstract class XYDatapointView extends DatapointView {

  declare readonly chart: XYChart;
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

  get styleInfo() {
    const styles = super.styleInfo;
    styles['--datapoint-centroid'] = this.centroid;
    return styles;
  }

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
