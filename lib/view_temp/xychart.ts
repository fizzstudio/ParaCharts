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
  DataLayer, ChartLandingView, DataView, DatapointView, SeriesView, 
  SONI_PLAY_SPEEDS, SONI_RIFF_SPEEDS 
} from './datalayer';
import { type Setting } from '../store/settings_types';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { type ClassInfo } from 'lit/directives/class-map.js';
//import { literal } from 'lit/static-html.js';
import { ParaView } from '../paraview';
import { strToId } from '../common/utils';
import { formatDatapointX, formatDatapointY } from './formatter';
import { literal } from 'lit/static-html.js';

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
 * Information about the results of a datapoint selection operation.
 * @public
 */
export interface XYSelectionInfo {
  /** Datapoint views that just got selected. */
  selected: XYDatapointView[];
  /** Datapoint views that just got deselected. */
  deselected: XYDatapointView[];
  /** Total number of datapoints that were previously selected. */
  oldTotalSelected: number;
  /** Total number of datapoints that are now selected. */
  newTotalSelected: number;
  /** Whether the selection was an extension. */
  extend: boolean;
  /** Whether chord mode was enabled. */
  chordMode: boolean;
}

/**
 * Abstract base class for charts with X and Y axes.
 */
export abstract class XYChart extends DataLayer {

  protected isGrouping = false;
  protected isConnector = false;
  protected maxDatapointSize!: number;

  private _isChordModeEnabled = false;

  constructor(dataLayerIndex: number, paraview: ParaView) {
    super(dataLayerIndex, paraview);
  }

  protected _addedToParent() {
    super._addedToParent();  
    this.maxDatapointSize = this.width/2.5;
    this._isChordModeEnabled = this.paraview.store.settings.sonification.isChordModeEnabled;
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isChordModeEnabled',
      label: 'Chord mode',
      parentView: 'controlPanel.tabs.audio.sonification.dialog',
    });
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'sonification.isRiffEnabled',
      label: 'Series riff enabled',
      parentView: 'controlPanel.tabs.audio.sonification.dialog',
    });
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

  get isChordModeEnabled() {
    return this._isChordModeEnabled;
  }
  
  set isChordModeEnabled(isChordModeEnabled) {
    this._isChordModeEnabled = isChordModeEnabled;
    this._chartLandingView.focusLeaf.focus();
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

  settingDidChange(key: string, value: Setting) {
    if (key === 'sonification.isChordModeEnabled') {
      this.isChordModeEnabled = value as boolean;
      return true;
    }
    return false;
  }

  protected abstract _newDatapointView(seriesView: XYSeriesView, ...rest: any[]): XYDatapointView;

  protected abstract _layoutDatapoints(): void;

  protected _layoutComponents() {
    this._layoutDatapoints();
  }

  moveRight() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      if (!leaf.next) {
        if (this._isChordModeEnabled) {
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
    if (this._isChordModeEnabled) {
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
    if (this._isChordModeEnabled) {
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

      if (this._isChordModeEnabled) {
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

  selectCurrent(extend = false) {
    this._chartLandingView.focusLeaf.select(extend);
  }

  clearDatapointSelection(quiet = false) {
    this.selectedDatapointViews.forEach(p => {
      p.isSelected = false;
    });
    if (!quiet) {
      //this._chartLandingView.eventActionManager!.dispatch('selection_cleared');
    }
  }

  /*composeDatapointSelectionAnnouncement(selInfo: XYSelectionInfo) {
    const seriesAndVal = (view: DatapointView) => 
      `${view.series.key} (${view.datapoint.format('statusBar')})`;
    const recVal = (view: DatapointView) => 
      `${view.datapoint.formatX('statusBar')}`;
    const s = selInfo.newTotalSelected === 1 ? '' : 's';
    const newTotSel = `${selInfo.newTotalSelected} point${s} selected.`;
    if (this.paraview.store.settings.dev.isDebug) {
      console.log('SEL', selInfo);
    }
    if (selInfo.chordMode) {
      // XXX take hidden series into account
      const numSeries = this.paraview.store.model.numSeries;
      if (selInfo.oldTotalSelected === 0) {
        return `Selected all points at ${recVal(selInfo.selected[0])}`;
      } else if (selInfo.deselected.length === numSeries && selInfo.oldTotalSelected === numSeries) {
        return `Deselected all points at ${recVal(selInfo.deselected[0])}. No points selected.`;
      } else if (selInfo.selected.length) {
        return `Selected all points at ${recVal(selInfo.selected[0])}. ${newTotSel}`;
      } else if (selInfo.extend && selInfo.deselected.length) {
        return `Deselected all points at ${recVal(selInfo.deselected[0])}. ${newTotSel}`;
      } else {
        return 'ERROR';
      }
    } else {
      if (selInfo.oldTotalSelected === 0) {
        return `Selected ${seriesAndVal(selInfo.selected[0])}`;
      } else if (selInfo.oldTotalSelected === 1 && !selInfo.newTotalSelected) {
        return `Deselected ${seriesAndVal(selInfo.deselected[0])}. No points selected.`;
      } else if (!selInfo.extend && selInfo.selected.length && selInfo.oldTotalSelected) {
        return `Selected ${seriesAndVal(selInfo.selected[0])}. 1 point selected.`;
      } else if (selInfo.extend && selInfo.deselected.length) {
        return `Deselected ${seriesAndVal(selInfo.deselected[0])}. ${newTotSel}`;
      } else if (selInfo.extend && selInfo.selected.length) {
        return `Selected ${seriesAndVal(selInfo.selected[0])}. ${newTotSel}`;
      } else {
        return 'ERROR';
      }
    }
  }*/

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

  onFocus() {
    console.log('XY SERIES FOCUS');
    super.onFocus();
    const visited = this.chart.isChordModeEnabled 
      ? this.withSiblings.flatMap(sib => sib.children) 
      : this._children;
    this.paraview.store.visitedDatapoints = visited.map(v => v.id);
    if (!this.chart.isChordModeEnabled) {
      this.chart.raiseSeries(this.series.key!);
    }
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
    console.log('XY SERIES BLUR');
    this.paraview.store.visitedDatapoints = [];
  }

  select(extend: boolean) {
    const targets = this.chart.isChordModeEnabled ? this.chart.datapointViews : this.children;
    const oldSelected = Array.from(this.chart.selectedDatapointViews);
    if (!extend) {
      this.chart.clearDatapointSelection(true);
    }
    for (const target of targets) {
      target.isSelected = true;
    }
    const selected = Array.from(
      new Set(this.chart.selectedDatapointViews).difference(new Set(oldSelected)));
    const deselected = Array.from(
      new Set(oldSelected).difference(new Set(this.chart.selectedDatapointViews)));
    /*this.eventActionManager!.dispatch('series_selected', {
      selected,
      deselected,
      oldTotalSelected: oldSelected.length,
      newTotalSelected: this.chart.selectedDatapointViews.length,
      extend,
      chordMode: this.chart.isChordModeEnabled
    });*/
  }

}

/**
 * Abstract base class for chart views representing XYChart datapoint values
 * (e.g., points, bars, etc.).
 * @public
 */
export abstract class XYDatapointView extends DatapointView {

  declare readonly chart: XYChart;

  protected centroid?: string;

  constructor(seriesView: XYSeriesView) { 
    super(seriesView);
  }

  protected _createId(..._args: any[]): string {
    return [
      'datapoint',
      strToId(this.series.key),
      formatDatapointX(this.datapoint, 'domId', this.paraview.store),
      formatDatapointY(this.datapoint, 'domId', this.paraview.store),
      `${this.index}`
    ].join('-'); 
  }

  protected _addedToParent() {
    super._addedToParent();
    this.extraAttrs = [
      { 
        attr: literal`data-series`,
        value: this.series.key
      },
      {
        attr: literal`data-index`,
        value: this.index
      },
      {
        attr: literal`data-label`,
        value: 
        formatDatapointX(this.datapoint, 'domId', this.paraview.store),
      },
      {
        attr: literal`data-centroid`,
        value: this.centroid
      }
    ];
  }

  get classes() {
    const classes: Mutable<ClassInfo> = super.classes;
    return classes as Readonly<ClassInfo>;
  }

  get style() {
    const styles = super.style;
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

  abstract computeLayout(): void;

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

  onFocus() {
    console.log('XY DATAPOINT FOCUS');
    super.onFocus();
    const visited = this.chart.isChordModeEnabled ? this.withSameIndexers : [this];
    this.paraview.store.visitedDatapoints = visited.map(v => v.id);
    if (!this.chart.isChordModeEnabled) {
      this.chart.raiseSeries(this.series.key!);
    }
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

  select(extend: boolean) {
    const targets = this.chart.visitedDatapointViews;
    if (!targets.length) {
      throw new Error(`no visited datapoints for series: ${this.series.key}, index: ${this.index}`);
    }
    const oldNumSelected = targets.filter(v => v.isSelected).length;
    const oldSelected = Array.from(this.chart.selectedDatapointViews);
    const oldTotalSelected = oldSelected.length;

    if (targets.length > 1 && !extend && oldTotalSelected >= oldNumSelected) {
      this.chart.clearDatapointSelection(true);
    }
    let numSelected = 0;
    for (const target of targets) {
      const alreadySelected = this.chart.selectedDatapointViews.includes(target);
      if (extend || targets.length > 1) {
        if (alreadySelected) {
          target.isSelected = false;
        } else {
          target.isSelected = true;
          numSelected++;
        }  
      } else {
        // Not extending and only 1 target
        const prevSelected = this.chart.selectedDatapointViews;
        this.chart.clearDatapointSelection(true);
        if (!alreadySelected || prevSelected.length > 1) {
          target.isSelected = true;
          numSelected++;
        }
      } 
    }
    const selected = Array.from(
      new Set(this.chart.selectedDatapointViews).difference(new Set(oldSelected)));
    const deselected = Array.from(
      new Set(oldSelected).difference(new Set(this.chart.selectedDatapointViews)));
  
    /*this.eventActionManager!.dispatch('datapoint_selected', {
      selected,
      deselected,
      //oldNumSelected,
      oldTotalSelected,
      newTotalSelected: this.chart.selectedDatapointViews.length,
      extend,
      chordMode: this.chart.isChordModeEnabled
    });*/
  }

}
