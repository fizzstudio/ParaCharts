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
  SONI_PLAY_SPEEDS, SONI_RIFF_SPEEDS 
} from './datalayer';
import { ChartLandingView, DatapointView, SeriesView } from './data';
import { type Setting } from '../store/settings_types';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { ParaView } from '../paraview';
import { XYDatapoint, strToId } from '@fizz/paramodel';
import { formatXYDatapointX, formatXYDatapointY } from '@fizz/parasummary';
import { HotkeyEvent } from '../store/keymap_manager';

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

  //private _isChordModeEnabled = false;

  constructor(paraview: ParaView, dataLayerIndex: number) {
    super(paraview, dataLayerIndex);
    paraview.store.keymapManager.addEventListener('hotkeypress', (e: HotkeyEvent) => {
      if (e.action === 'chord_mode_toggle') {
        paraview.store.updateSettings(draft => {
          draft.sonification.isChordModeEnabled = !draft.sonification.isChordModeEnabled;
        });
        if (paraview.store.settings.sonification.isChordModeEnabled) {
          paraview.store.prependAnnouncement('Chord mode enabled');
        } else {
          paraview.store.prependAnnouncement('Chord mode disabled');
        }      
      }
    });
  }

  protected _addedToParent() {
    super._addedToParent();  
    // this.maxDatapointSize = this.width/2.5;
    // this._isChordModeEnabled = this.paraview.store.settings.sonification.isChordModeEnabled;
    // this.paraview.store.settingControls.add({
    //   type: 'checkbox',
    //   key: 'sonification.isChordModeEnabled',
    //   label: 'Chord mode',
    //   parentView: 'controlPanel.tabs.audio.sonification.dialog',
    // });
    // this.paraview.store.settingControls.add({
    //   type: 'checkbox',
    //   key: 'sonification.isRiffEnabled',
    //   label: 'Series riff enabled',
    //   parentView: 'controlPanel.tabs.audio.sonification.dialog',
    // });
  }

  get managedSettingKeys() {
    return super.managedSettingKeys.concat('sonification.isChordModeEnabled');
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

  // get isChordModeEnabled() {
  //   return this._isChordModeEnabled;
  // }
  
  // set isChordModeEnabled(isChordModeEnabled) {
  //   this._isChordModeEnabled = isChordModeEnabled;
  //   this._chartLandingView.focusLeaf.focus();
  // }
  
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

  // settingDidChange(key: string, value: Setting) {
  //   if (key === 'sonification.isChordModeEnabled') {
  //     this.isChordModeEnabled = value as boolean;
  //     return true;
  //   }
  //   return false;
  // }

  //protected abstract _layoutDatapoints(): void;

  // init() {
  //   this._layoutDatapoints();
  // }

  moveRight() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      if (!leaf.next) {
        if (this.paraview.store.settings.sonification.isChordModeEnabled) {
          //this._eventActionManager!.dispatch('series_endpoint_reached');
        } else if (leaf.nextSeriesLanding) {
          // Make sure we don't get focused if we return to the landing for this series
          leaf.blur(false);
          leaf.nextSeriesLanding.focus();
        } else {
          //this._eventActionManager!.dispatch('final_series_endpoint_reached');
        }
      } else {
        leaf.next!.focus();
      }
    } else if (leaf instanceof SeriesView) {
      // Move to the first datapoint
      leaf.children[0].focus();
    } else {
      this._chartLandingView.children[0].focus();
    }
  }

  moveLeft() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      if (!leaf.prev) {
        leaf.blur();
      } else {
        leaf.prev!.focus();
      }
    } else if (leaf instanceof SeriesView) {
      if (!leaf.prev) {
        leaf.blur();
      } else {
        // Move to the last datapoint of the previous series
        leaf.prev!.children.at(-1)!.focus();
      }
    } else {
      // At chart root, so move to the first series landing
      this._chartLandingView.children[0].focus();
    }
  }

  moveUp() {
    if (this.paraview.store.settings.sonification.isChordModeEnabled) {
      //this._eventActionManager!.dispatch('chord_mode_no_up_down');
      return;
    }
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      const psi = leaf.prevSameIndexer;
      if (psi) {
        leaf.blur(false);
        psi.focus();
        //this._sonifier.playNotification('series');
      } else {
        //this._eventActionManager!.dispatch('first_series_reached');
        return;
      }
    } else if (leaf instanceof SeriesView) {
      if (!leaf.prev) {
        //this._eventActionManager!.dispatch('first_series_reached');
        return;
      } else {
        leaf.prev!.focus();
        //this._sonifier.playNotification('series');
      }
    } else {
      // At chart root, so move to the first series landing
      this._chartLandingView.children[0].focus();
    }
  }

  moveDown() {
    if (this.paraview.store.settings.sonification.isChordModeEnabled) {
      //this._eventActionManager!.dispatch('chord_mode_no_up_down');
      return;
    }
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      const nsi = leaf.nextSameIndexer;
      if (nsi) {
        leaf.blur(false);
        nsi.focus();
        //this._sonifier.playNotification('series');
      } else {
        //this._eventActionManager!.dispatch('final_series_reached');
        return;
      }
    } else if (leaf instanceof SeriesView) {
      if (!leaf.next) {
        //this._eventActionManager!.dispatch('final_series_reached');
        return;
      } else {
        leaf.next!.focus();
        //this._sonifier.playNotification('series');
      }
    } else {
      // At chart root, so move to the first series landing 
      this._chartLandingView.children[0].focus(); 
    }
  }

  /**
   * Navigate to the series minimum/maximum datapoint
   * @param isMin If true, go the the minimum. Otherwise, go to the maximum
   */
  protected _goSeriesMinMax(isMin: boolean) {
    const currView = this.focusLeaf;
    if (currView instanceof ChartLandingView) {
      this._goChartMinMax(isMin);
    } else {
      let seriesChildren = null;
      let seriesKey = null;
      let index: number | null = null;

      if (currView instanceof SeriesView) {
        seriesKey = currView.seriesKey;
        seriesChildren = currView.children;
      } else if (currView instanceof DatapointView) {
        seriesKey = currView.seriesKey;
        index = currView.index;
        seriesChildren = currView.parent!.children;
      }

      if (seriesChildren && seriesKey) {
        const stats = this.paraview.store.model!.getFacetStats('y')!;
        // Indices of min/max values
        const seriesMatchArray = isMin 
          ? stats.min.datapoints.map(dp => dp.datapointIndex)   
          : stats.max.datapoints.map(dp => dp.datapointIndex);
        if (index !== null && seriesMatchArray.length > 1) {
          // TODO: If there is more than one datapoint that has the same series minimum value, find the next one to nav to:
          //       Find the current x label, if it matches one in `seriesMins`, 
          //       remove all entries up to and including that point,
          //       and use the next item on the list.
          //       But also cycle around if it's the last item in the list
          const currentRecordIndex = seriesMatchArray.indexOf(index);
          if (currentRecordIndex !== -1 && currentRecordIndex !== seriesMatchArray.length + 1) {
            seriesMatchArray.splice(0, currentRecordIndex);
          }
        }
        const newViews = seriesChildren.filter(view => 
          seriesMatchArray.includes(view.index));
        newViews[0]?.focus();
      }
    }
  }

  /**
   * Navigate to (one of) the chart minimum/maximum datapoint(s)
   * @param isMin If true, go the the minimum. Otherwise, go to the maximum
   */
  protected _goChartMinMax(isMin: boolean) {
    const currView = this.focusLeaf;
    const stats = this.paraview.store.model!.getFacetStats('y')!;
    const matchTarget = isMin ? stats.min.value : stats.max.value;
    const chartMatchArray = this._chartLandingView.datapointViews.filter(view =>
      // @ts-ignore
      view.datapoint.data.y.value === matchTarget);
    chartMatchArray[0].focus();
  }

  raiseSeries(_series: string) {
  }

  playSeriesRiff() {
    if (!(this.focusLeaf instanceof SeriesView)) {
      return;
    }
    if (this.paraview.store.settings.sonification.isSoniEnabled
      && this.paraview.store.settings.sonification.isRiffEnabled) {
      const currentSeries = this.focusLeaf;

      let seriesDatapoints = currentSeries.children;
      let datapointArray = Array.from(seriesDatapoints)

      if (this.paraview.store.settings.sonification.isChordModeEnabled) {
      }

      const noteCount = datapointArray.length;
      if (noteCount) {
        if (this._soniRiffInterval!) {
          clearInterval(this._soniRiffInterval!);
        }
        this.soniSequenceIndex++;

        this._soniRiffInterval = setInterval(() => {
          const datapointNavPoint = datapointArray.shift();
  
          if (!datapointNavPoint) {
            clearInterval(this._soniRiffInterval!);
          } else {
            const datapoint = datapointNavPoint.datapoint;
            //this._sonifier.playDatapoints(datapoint);
            this.soniNoteIndex++;
          }
        }, SONI_RIFF_SPEEDS.at(this._soniRiffSpeedRateIndex));
      }
    }
  }

  /**
   * Play all datapoints to the right, if there are any
   */
  playRight() {
    if (this.focusLeaf instanceof ChartLandingView) {
      return;
    }
    this._soniInterval = setInterval(() => {
      if (!this.focusLeaf.next && this.focusLeaf instanceof DatapointView) {
        this.clearPlay();
      } else {
        this.moveRight();
      }
    }, SONI_PLAY_SPEEDS.at(this._soniSpeedRateIndex));
    this._chartLandingView.focusLeaf.focus();
  }
  
  /**
   * Play all datapoints to the left, if there are any
   */
  playLeft() {
    if (!(this.focusLeaf instanceof DatapointView)) {
      return;
    }
    this._soniInterval = setInterval(() => {
      if (!this.focusLeaf.prev) {
        this.clearPlay();
      } else {
        this.moveLeft();
      }
    }, SONI_PLAY_SPEEDS.at(this._soniSpeedRateIndex));
    this._chartLandingView.focusLeaf.focus();
  }

  queryData() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof ChartLandingView) {
      return;
    }

    const msgArray = [];
    const seriesKey = leaf.series.key!;
    const seriesLength = leaf.series.length;

    if (leaf instanceof XYDatapointView) {
      const record = leaf.index;

      //msgArray.push(
      //  `${seriesKey} (${leaf.datapoint.format('statusBar')}). Datapoint ${record + 1} of ${seriesLength}.`);
      
      /*if (this.selectedDatapointViews.length) {
        const alreadySelected = leaf.isSelected; 
        if (this.selectedDatapointViews.length > 1 || !alreadySelected) {
          msgArray.push(`Comparison to ${alreadySelected ? 'other' : ''} selected datapoints:`);
          this.selectedDatapointViews.forEach(datapoint => {
            if (datapoint !== leaf) {
              const comparisonResult = this.compareDatapoints(leaf, datapoint);
              const comparison = (comparisonResult.diff) 
                ? `${comparisonResult.diff} ${comparisonResult.comparator}`
                : `${this.capitalize(comparisonResult.comparator)}`;
              msgArray.push(
                `${comparison} ${datapoint.series.key} (${datapoint.datapoint.format('statusBar')})`);
            }
          });
        }
      }*/
    } else if (leaf instanceof XYSeriesView) {
      // TODO: describe series?
      msgArray.push(`${seriesKey}. ${seriesLength} datapoints.`);
    }

    //todo().controller.announce(msgArray);
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

  setLowVisionMode(_lvm: boolean): void {
  }

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

  /*protected get _eventActions(): Actions<this> {
    return {
      series_focused: function(_focusInfo: FocusInfo) {
        todo().controller.announce(this._focusSummary());
        this.chart.playSeriesRiff();
      },
      series_selected: function(selectionInfo: XYSelectionInfo) {
        todo().controller.announce(selectionInfo.chordMode 
          ? 'Selected all datapoints.' 
          : `Selected all datapoints in series ${selectionInfo.selected[0].series.name}.`);
      },    
    };
  }

  protected _focusSummary() {
    return todo().seriesSummaries[this.series.name!] ?? this.series.name!;
  }*/

  protected _visit() {
    const visited = this.paraview.store.settings.sonification.isChordModeEnabled 
      ? this.withSiblings.flatMap(sib => sib.children) 
      : this._children;
    this.paraview.store.visit(visited.map(v => ({seriesKey: v.seriesKey, index: v.index})));
    if (!this.paraview.store.settings.sonification.isChordModeEnabled) {
      this.chart.raiseSeries(this.series.key!);
    }    
  }

  onFocus() {
    super.onFocus();
    /*todo().deets!.sparkBrailleData = this.series.data.join(' ');
    this.eventActionManager!.dispatch('series_focused', {
      visited,
      isSeriesChange: 
        this.chart.isChordModeEnabled
          ? false
          : !(todo().canvas.prevFocusLeaf instanceof DataView)
            ? true
            : (todo().canvas.prevFocusLeaf as DataView).series.name !== visited[0].series.name
              ? true
              : false
    });*/
  }

  onBlur() {
    //this.paraview.store.clearVisited();
  }

}

/**
 * Abstract base class for chart views representing XYChart datapoint values
 * (e.g., points, bars, etc.).
 * @public
 */
export abstract class XYDatapointView extends DatapointView {

  declare readonly chart: XYChart;
  declare _datapoint: XYDatapoint;

  protected centroid?: string;

  constructor(seriesView: SeriesView) { 
    super(seriesView);
  }

  protected _createId(..._args: any[]): string {
    return [
      'datapoint',
      strToId(this.series.key),
      // formatXYDatapointX(this.datapoint, this.paraview.store.getFormatType('domId')),
      // formatXYDatapointY(this.datapoint, this.paraview.store.getFormatType('domId')),
      `${this.index}`
    ].join('-'); 
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
  get datapoint(): XYDatapoint {
    return super.datapoint as XYDatapoint;
  }

  get styleInfo() {
    const styles = super.styleInfo;
    styles['--datapointCentroid'] = this.centroid;
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

  protected _visit(isNewComponentFocus = false) {
    super._visit(isNewComponentFocus);
    const visited = this.paraview.store.settings.sonification.isChordModeEnabled
      ? this.withSameIndexers
      : [this];
    this.paraview.store.visit(visited.map(v => ({seriesKey: v.seriesKey, index: v.index})));
    if (!this.paraview.store.settings.sonification.isChordModeEnabled) {
      this.chart.raiseSeries(this.series.key!);
    }
    //todo().deets!.sparkBrailleData = this.series.data.join(' ');
    if (this.paraview.store.settings.sonification.isSoniEnabled && !isNewComponentFocus) {
      this.chart.sonifier.playDatapoints(...visited.map(v => v.datapoint));
    }  
    // setTimeout(() => {
    //   this.eventActionManager!.dispatch('datapoint_focused', {
    //     visited,
    //     isSeriesChange: 
    //       this.chart.isChordModeEnabled ? false : 
    //       !(todo().canvas.prevFocusLeaf instanceof DataView) ? true :
    //       (todo().canvas.prevFocusLeaf as DataView).series.name !== visited[0].series.name ? true :
    //       false
    //   });
    // }, NOTE_LENGTH*1000);
  }

  onFocus(isNewComponentFocus = false) {
    super.onFocus(isNewComponentFocus);
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
