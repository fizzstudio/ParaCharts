/* ParaCharts: Line Charts
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

import { XYSeriesView, PointChart, ChartPoint } from '.';
import { type LineSettings, type DeepReadonly } from '../../../../store/settings_types';
import { PathShape } from '../../../shape/path';
import { Vec2 } from '../../../../common/vector';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../../../../store/query_utils';
import { ChartLandingView, SeriesView, DatapointView } from '../../../data';
import { bboxOfBboxes } from '../../../../common/utils';

import { interpolate } from '@fizz/templum';

import { type StyleInfo } from 'lit/directives/style-map.js';

/**
 * Class for drawing line charts.
 * @public
 */
export class LineChart extends PointChart {

  protected _addedToParent() {
    super._addedToParent();
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'type.line.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number', 
        min: 1, 
        max: this.paraview.store.settings.type.line.lineWidthMax as number
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'type.line.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  get datapointViews() {
    return super.datapointViews as LineSection[];
  }

  get settings() {
    return super.settings as DeepReadonly<LineSettings>;
  }

  updateSeriesStyle(styleInfo: StyleInfo) {
    super.updateSeriesStyle(styleInfo);
    styleInfo.strokeWidth = this.effectiveLineWidth;
  }

  get effectiveLineWidth() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? this.paraview.store.settings.type.line.lowVisionLineWidth
      : this.paraview.store.settings.type.line.lineWidth;
  }

  get effectiveVisitedScale() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? 1
      : this.paraview.store.settings.type.line.lineHighlightScale;

  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new LineSection(seriesView);
  }

  queryData(): void {
    const targetView = this.chartLandingView.focusLeaf
    // TODO: localize this text output
    // focused view: e.options!.focus
    // all visited datapoint views: e.options!.visited
    // const focusedDatapoint = e.targetView;
    let msgArray: string[] = [];
    let seriesLengths = [];
    for (let series of this.paraview.store.model!.series) {
      seriesLengths.push(series.rawData.length)
    }
    if (targetView instanceof ChartLandingView) {
      this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
      return
    }
    else if (targetView instanceof SeriesView) {
      /*
      if (e.options!.isChordMode) {
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
      ));
      //console.log('queryData: SeriesView:', targetView);
    }
    else if (targetView instanceof DatapointView) {
      /*
      if (e.options!.isChordMode) {
        // focused view: e.options!.focus
        // all visited datapoint views: e.options!.visited
        // const focusedDatapoint = e.targetView;
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      }
        */
      const selectedDatapoints = this.paraview.store.selectedDatapoints;
      const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
      msgArray.push(interpolate(
        queryMessages.datapointKeyLength,
        {
          seriesKey: targetView.seriesKey,
          datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
          datapointIndex: targetView.index + 1,
          datapointCount: targetView.series.length
        }
      ));
      //console.log(msgArray)
      if (selectedDatapoints.length) {
        const selectedDatapointViews = []

        for (let datapoint of selectedDatapoints) {
          const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
          selectedDatapointViews.push(selectedDatapointView)
        }
        // if there are selected datapoints, compare the current datapoint against each of those
        //console.log(targetView.series.rawData)
        const selectionMsgArray = describeSelections(this.paraview, targetView, selectedDatapointViews as DatapointView[]);
        msgArray = msgArray.concat(selectionMsgArray);
      } else {
        //console.log('tv', targetView)
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        const datapointMsgArray = describeAdjacentDatapoints(this.paraview, targetView);
        msgArray = msgArray.concat(datapointMsgArray);
      }
      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(this.paraview,
        targetView.series[visitedDatapoint.index].facetBox("y")!.raw as unknown as number, targetView.seriesKey);
      //console.log('minMaxMsgArray', minMaxMsgArray)z
      msgArray = msgArray.concat(minMaxMsgArray)
    }
    this.paraview.store.announce(msgArray);
  }

}

/**
 * A visual indicator of a line chart datapoint, plus line segments
 * drawn halfway to its neighbors. 
 */
export class LineSection extends ChartPoint {

  declare readonly chart: LineChart;

  protected _prevMidX?: number;
  protected _prevMidY?: number;
  protected _nextMidX?: number;
  protected _nextMidY?: number;

  get height() {
    // apparently this can get called before the shape is created
    return this._shape?.height ?? 0;
  }

  get left() {
    return this._shape!.left;
  }

  get right() {
    return this._shape!.right;
  }

  get top() {
    return this._shape!.top;
  }

  get bottom() {
    return this._shape!.bottom;
  }

  get outerBbox() {
    return this._symbol
      ? bboxOfBboxes(this._shape!.outerBbox, this._symbol!.outerBbox)
      : this._shape!.outerBbox;
  }

  completeLayout() {
    // find midpoint between values for next and previous, draw line as 2 segments

    // find midpoint between values for this and previous
    if (this.index) {
      this._computePrev();
    }

    // find midpoint between values for this and next
    if (this.index < this.chart.paraview.store.model!.series[0].length - 1) {
      this._computeNext();
    }

    // calculate centroid for scale transforms
    this._computeCentroid();

    // create shape and symbol
    super.completeLayout();
  }

  protected _computePrev() {
    this._prevMidX = -this.width/2; // - 0.1;
    this._prevMidY = (this._prev!.y - this.y)/2;
}

  protected _computeNext() {
    this._nextMidX = this.width/2; // + 0.1;
    this._nextMidY = (this._next!.y - this.y)/2; 
  }

  protected _computeCentroid() {
    const symWidth = this._symbol?.width ?? 0;
    const symHeight = this._symbol?.height ?? 0;
    let centroidX = '50%';
    if (!this._prevMidX) {
      centroidX = `${symWidth/2}px`;
    } else if (!this._nextMidX) {
      centroidX = `calc(100% - ${symWidth/2}px)`;
    }

    let centroidY = '50%';
    if (!this._prevMidY && this._nextMidY) {
      centroidY = (this._y > this._nextMidY) 
        ? `calc(100% - ${symHeight/2}px)` 
        : `${symHeight/2}px`;
    } else if (!this._nextMidY && this._prevMidY) {
      centroidY = (this._y > this._prevMidY) 
        ? `calc(100% - ${symHeight/2}px)`
        : `${symHeight/2}px`;
    } else if (this._nextMidY && this._prevMidY) {
      // NB: layoutSymbol() hasn't been called yet, so we can't refer,
      // directly or indirectly, to the symbol's location
      const symTop = this._y - symHeight/2;
      const symBot = this._y + symHeight/2;
      // NB: Strokes aren't taken into account here when computing the
      // element size, I think because we're using box-sizing: content-box. 
      if (symBot > this._nextMidY && symBot > this._prevMidY) {
        centroidY = `calc(100% - ${symHeight/2}px)`;
      } else if (symTop < this._nextMidY && symTop < this._prevMidY) {
        centroidY = `${symHeight/2}px`;
      } else {
        centroidY = `${this._y - Math.min(this._prevMidY, this._nextMidY)}px`;
      }
    }
    this.centroid = `${centroidX} ${centroidY}`;
  }

  protected get _points(): Vec2[] {
    if (this._prevMidY !== undefined && this._nextMidY !== undefined) {
      return [
        new Vec2(this._prevMidX!, this._prevMidY),
        new Vec2(), 
        new Vec2(this._nextMidX!, this._nextMidY)
      ];
    } else if (this._prevMidY === undefined && this._nextMidY !== undefined) {
      return [
        new Vec2(),
        new Vec2(this._nextMidX!, this._nextMidY)
      ];
    } else if (this._prevMidY !== undefined && this._nextMidY === undefined) {
      return [
        new Vec2(this._prevMidX!, this._prevMidY),
        new Vec2()
      ];
    } else {
      // default case assumes there's only 1 datapoint (no lines on either side)
      return [
        new Vec2()
      ];
    }
  }

  get classInfo() {
    return {
      'data-line': true,
      ...super.classInfo
    };
  }

  get styleInfo() {
    // Need to clear the fill for visiting
    const style = super.styleInfo;
    style.fill = 'none';
    return style;
  }

  protected _addVisitedStyleInfo(styleInfo: StyleInfo) {
    super._addVisitedStyleInfo(styleInfo);
    styleInfo.strokeWidth = this.chart.effectiveLineWidth*this.chart.effectiveVisitedScale;
  }

  protected _createShape() {
    // If datapoints are layed out again after the initial layout,
    // we need to replace the original shape and symbol
    this._shape?.remove();
    this._shape = new PathShape(this.paraview, {
      x: this._x,
      y: this._y,
      points: this._points,
    });
    super._createShape();
  }

  
}

