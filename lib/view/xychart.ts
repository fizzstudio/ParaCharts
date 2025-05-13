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
import { ChartLandingView, type DataView, DatapointView, SeriesView } from './data';
import { type Setting } from '../store/settings_types';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { type ClassInfo } from 'lit/directives/class-map.js';
import { ParaView } from '../paraview';
import { strToId } from '../common/utils';
import { formatXYDatapointX, formatXYDatapointY } from './formatter';
import { literal } from 'lit/static-html.js';
import { XYDatapointDF } from '../store/modelDF';
import { HotkeyEvent } from '../store/keymap_manager';
import { capitalize, join, interpolate as replace } from '@fizz/templum';
import { ComparisonRelationship} from '@fizz/dataframe';
import { NumberBox } from '../store/dataframe/box';

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

  private _isChordModeEnabled = false;

  constructor(paraview: ParaView, dataLayerIndex: number) {
    super(paraview, dataLayerIndex);
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

  //protected abstract _layoutDatapoints(): void;

  // init() {
  //   this._layoutDatapoints();
  // }

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
  queryData(e: HotkeyEvent): void {
    e.preventDefault();
    // TODO: localize this text output
    // focused view: e.options!.focus
    // all visited datapoint views: e.options!.visited
    // const focusedDatapoint = e.targetView;
    let msgArray: string[] = [];
    //console.log(this.paraview.store)
    //const targetView = e.targetView;
    if (!this.paraview.store.visitedDatapoints.length){
      console.log("no visited datapoints")
      return
    }
    const selectedDatapoints = this.paraview.store.selectedDatapoints;
    const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
    const targetSeries = this.chartLandingView.children.filter(series => series.seriesKey === visitedDatapoint.seriesKey)[0];
    const targetView = targetSeries.children[visitedDatapoint.index]
    //console.log('queryData: DatapointView:', targetView);
    //console.log(targetView.series[visitedDatapoint.index])
    msgArray.push(replace(
      //Sam: replacing message string temporarily
      '${seriesKey:string} ${datapointXY:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
      {
        seriesKey: targetView.seriesKey,
        datapointXY: `${targetView.series[visitedDatapoint.index].x.raw}, ${targetView.series[visitedDatapoint.index].y.raw}`,
        datapointIndex: targetView.index + 1,
        datapointCount: targetView.series.length
      }
    ));
    //console.log(msgArray)
    if (selectedDatapoints.length) {
      const selectedDatapointViews = []

      for (let datapoint of selectedDatapoints){
        const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
        selectedDatapointViews.push(selectedDatapointView)
      }
      // if there are selected datapoints, compare the current datapoint against each of those
      console.log(targetView.series.rawData)
      const selectionMsgArray = this.describeSelections(targetView, selectedDatapointViews as DatapointView[]);
      msgArray = msgArray.concat(selectionMsgArray);
    } else {
      console.log('tv', targetView)
      // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
      const datapointMsgArray = this.describeAdjacentDatapoints(targetView);
      msgArray = msgArray.concat(datapointMsgArray);
    }
    // also add the high or low indicators
    const minMaxMsgArray = this.getDatapointMinMax(
      targetView.series[visitedDatapoint.index].y.raw as unknown as number, targetView.seriesKey);
    console.log('minMaxMsgArray', minMaxMsgArray)
    //this.paraview.store.announce(minMaxMsgArray.join('. '));
    msgArray = msgArray.concat(minMaxMsgArray)
    /*
    
    

    if (targetView instanceof ChartLandingView) {
      console.log('queryData: ChartLandingView:', targetView);
    } else if (targetView instanceof SeriesView) {
      if (e.options!.isChordMode) {
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } else {
        msgArray.push(replace(
          this.messages.seriesKeyLength,
          { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
        ));
        console.log('queryData: SeriesView:', targetView);
      }
    } else if (targetView instanceof DatapointView) {
      if (e.options!.isChordMode) {
        // focused view: e.options!.focus
        // all visited datapoint views: e.options!.visited
        // const focusedDatapoint = e.targetView;
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } else {
        // console.log('queryData: DatapointView:', targetView);

        msgArray.push(replace(
          this.messages.datapointKeyLength,
          {
            seriesKey: targetView.seriesKey,
            datapointXY: targetView.datapoint.format('statusBar'),
            datapointIndex: targetView.index + 1,
            datapointCount: targetView.series.length
          }
        ));

        if (selectedDatapoints.length) {
          // if there are selected datapoints, compare the current datapoint against each of those
          const selectionMsgArray = this.describeSelections(targetView, selectedDatapoints);
          msgArray = msgArray.concat(selectionMsgArray);
        } else {
          console.log('tv', targetView)
          // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
          const datapointMsgArray = this.describeAdjacentDatapoints(targetView);
          msgArray = msgArray.concat(datapointMsgArray);
        }
        // also add the high or low indicators
        const minMaxMsgArray = await this.getDatapointMinMax(
          targetView.datapoint.y.number, targetView.seriesKey);
        console.log('minMaxMsgArray', minMaxMsgArray)
        this.todo.controller.appendAnnouncement(minMaxMsgArray.join('. '));
      }
    }

    
    // msgArray.push(`queryData: END`);

    // TODO: Move this and other line-chart specific actions to a dedicated module in ParaCharts
    // TODO: Find out how to see if the current datapoint is in `_selectedDatapoints`
    // TODO: Add method to datapoint object to compare 2 datapoints for equality
    */
   this.paraview.store.announce(msgArray);
  }

  public /*for tests*/ describeSelections(targetView: DatapointView, selectedDatapoints: DatapointView[]) : string[] {
    //console.log('queryData: DatapointView:', targetView);
    const msgArray: string[] = [];
    
    // if there are selected datapoints other than the focused datapoint (which may or may not be 
    // selected), compare the current datapoint against each of those
    //console.log(this.paraview.store.selectedDatapoints)
    //const selfSelected = targetView.isSelected;
    const visitedDatapoint = this.paraview.store.visitedDatapoints[0]
    const selfSelected = selectedDatapoints.filter(point => point.seriesKey === visitedDatapoint.seriesKey && point.index === visitedDatapoint.index).length > 0;
    const othersSelected = selectedDatapoints.length >= (selfSelected ? 2 : 1);
    if (othersSelected) {
      const other = selfSelected ? 'this.messages.other' : undefined;
      msgArray.push(replace(this.messages.comparisonSelectedDatapoints, { other }));
      const sortedDatapoints = selectedDatapoints.toSorted((a, b) => 
        a.datapoint.y.value > b.datapoint.y.value ? -1 : 1);
      for (const view of sortedDatapoints) {
        if (view !== targetView) {
          const result = targetView.datapoint.y.compare(view.datapoint.y as NumberBox);
          const comparatorMsg = this.comparisonMsgs[result.relationship].msg;
          const diff = result.diff! !== 0 ? replace('${diff:number} ', {diff: result.diff!}) : undefined;
          msgArray.push(capitalize(replace(
            '${diff:string?}${comparatorMsg:string} ${seriesName:string} ${datapointXY:string}', 
            { diff, comparatorMsg, seriesName: view.seriesKey, 
              datapointXY: `${view.series[view.index].x.raw}, ${view.series[view.index].y.raw}` }
          )));
        }
      };
    }
    return msgArray;
  }

  public getDatapointMinMax(value: number, seriesKey: string): string[] {
    const msgArray: string[] = [];

    //const metadata = await this.getMetadata();
    const targetSeries = this.paraview.store.model!.series.filter(series => series.key === seriesKey)[0];
    let seriesData = [];
    let chartData = [];
    //console.log("model")
    //console.log(this.paraview.store.model!)
    //console.log("targetSeries")
    //console.log(targetSeries)
    for (let point of targetSeries.rawData){
      seriesData.push(Number(point.y))
    }
    for (let series of this.paraview.store.model!.series) {
      for (let point of series.rawData) {
        chartData.push(Number(point.y))
      }
    }
    //console.log(seriesData)
    //console.log(chartData)
    //console.log(value)
    //console.log(seriesKey)
    //console.log(this.paraview.store.model?.getFacetStats("y"))
    const seriesMin = Math.min(...seriesData);
    const chartMin = Math.min(...chartData);
    const seriesMax = Math.max(...seriesData);
    const chartMax = Math.max(...chartData);
    //console.log(value)
    //console.log(chartMin)
    //console.log(chartMax)
    if (value == chartMin) {
      msgArray.push(this.messages.seriesChartMin);
    } else if (value == seriesMin) {
      msgArray.push(this.messages.seriesMin);
    }

    if (value == chartMax) {
      msgArray.push(this.messages.seriesChartMax);
    } else if (value == seriesMax) {
      msgArray.push(this.messages.seriesMax);
    }
    console.log(msgArray)
    return msgArray;
  }

  
/*
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
      }
    } else if (leaf instanceof XYSeriesView) {
      // TODO: describe series?
      msgArray.push(`${seriesKey}. ${seriesLength} datapoints.`);
    }

    //todo().controller.announce(msgArray);
  }
*/
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


  private messages = {
    'compare': {
      'prev': {
        'verb': {
          'less': 'shrank from',
          'greater': 'grew from',
          'equal': 'remained the same',
        },
        'than': {
          'less': 'less than',
          'greater': 'more than',
          'equal': 'equal to',
        }
      },
      'next': {
        'verb': {
          'less': 'will grow to',
          'greater': 'will shrink to',
          'equal': 'will remain the same',
        } 
      }
    },
    'instructions': {
      'intro': 'Explore the chart with the arrow keys. Press "h" for help',
      'firstNav': 'Press the right arrow to explore this line',
      'firstNavBar': 'Press the right arrow to explore this category',
      'firstNavMultiseries': 'Press the down arrow to change lines',
      'firstNavMultiseriesBar': 'Press the down arrow to change categories',
      'firstSoni': 'Press "s" to toggle sonification off or on',
    },

    'datapoint': 'Datapoint', //Not currently used
    'firstDatapoint': 'First datapoint in ${seriesKey:string}',
    'lastDatapoint': 'Last datapoint in ${seriesKey:string}',
    'comparisonSelectedDatapoints': 'Comparison to${other:string?} selected datapoints',
    'other': ' other',
    'seriesMin': 'Series low',
    'seriesChartMin': 'Series low and chart low.',
    'seriesMax': 'Series high',
    'seriesChartMax': 'Series high and chart high.',
    'chordDataContext': '${datapointCount:number} datapoints at ${xLabel:string}',
    'chordHigh': 'High: ${yValue:number} in ${seriesKeys:string[]}.',
    'chordLow': 'Low: ${yValue:number} in ${seriesKeys:string[]}',
    'chordRange': 'Range: ${yRange:number#.2}.',
    'seriesSummary': '${seriesKey:string} summary: ${seriesSummary:string}',
    'seriesKeyLength': '${seriesKey:string}. ${datapointCount:number} datapoints',
    'datapointKeyLength': '${seriesKey:string} ${datapointXY:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
    'greaterThan': 'more than', //Not currently used
    'lessThan': 'less than', //Not currently used
    'equalTo': 'equal to', //Not currently used
    'compareGreater': 'more than',
    'compareLess': 'less than',
    'compareEqual': 'equal to',
    'compareGreaterPrev': 'grew by',
    'compareLessPrev': 'decreased by',
    'compareEqualPrev': 'stayed the same from',
    'compareGreaterNext': 'will decrease by',
    'compareLessNext': 'will grow by',
    'compareEqualNext': 'will stay the same in',
  } as const;

  private comparisonMsgs: Record<ComparisonRelationship, ComparisonMsgs> = {
    equal: {
      msg: 'equal to',
      prev: 'stayed the same from',
      next: 'will stay the same in'
    },
    greater: {
      msg: 'more than',
      prev: 'grew by',
      next: 'will decrease by'
    },
    less: {
      msg: 'less than',
      prev: 'decreased by',
      next: 'will grow by'
    }
  }
}

interface ComparisonMsgs {
  msg: string,
  prev: string,
  next: string
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
    const visited = this.chart.isChordModeEnabled 
      ? this.withSiblings.flatMap(sib => sib.children) 
      : this._children;
    this.paraview.store.visit(visited.map(v => ({seriesKey: v.seriesKey, index: v.index})));
    if (!this.chart.isChordModeEnabled) {
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
  declare _datapoint: XYDatapointDF;

  protected centroid?: string;
  _extraAttrs: any;

  constructor(seriesView: SeriesView) { 
    super(seriesView);
  }

  protected _createId(..._args: any[]): string {
    return [
      'datapoint',
      strToId(this.series.key),
      formatXYDatapointX(this.datapoint, 'domId', this.paraview.store),
      formatXYDatapointY(this.datapoint, 'domId', this.paraview.store),
      `${this.index}`
    ].join('-'); 
  }

  protected _addedToParent() {
    super._addedToParent();
    this._extraAttrs = [
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
        formatXYDatapointX(this.datapoint, 'domId', this.paraview.store),
      },
      {
        attr: literal`data-centroid`,
        value: this.centroid
      }
    ];
  }

  // override to get more specific return type
  get datapoint(): XYDatapointDF {
    return super.datapoint as XYDatapointDF;
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

  protected _visit() {
    const visited = this.chart.isChordModeEnabled ? this.withSameIndexers : [this];
    this.paraview.store.visit(visited.map(v => ({seriesKey: v.seriesKey, index: v.index})));
    if (!this.chart.isChordModeEnabled) {
      this.chart.raiseSeries(this.series.key!);
    }    
  }

  onFocus() {
    super.onFocus();
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
