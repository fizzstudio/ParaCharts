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

import { type ParaView } from '../../../../paraview';
import { XYSeriesView, PointChart, ChartPoint } from '.';
import { type LineSettings, type DeepReadonly } from '../../../../store/settings_types';
import { PathShape } from '../../../shape/path';
import { Vec2 } from '../../../../common/vector';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../../../../store/query_utils';
import { ChartLandingView, SeriesView, DatapointView, DataView } from '../../../data';
import { bboxOfBboxes, datapointMatchKeyAndIndex } from '../../../../common/utils';

import { interpolate } from '@fizz/templum';

import { type StyleInfo } from 'lit/directives/style-map.js';
import { NavNode } from '../navigation';
import { formatXYDatapoint } from '@fizz/parasummary';
import { RectShape } from '../../../shape';
import { Popup } from '../../../popup';

/**
 * Class for drawing line charts.
 * @public
 */
export class LineChart extends PointChart {

  protected _addedToParent() {
    super._addedToParent();
    if (this.paraview.store.type === "line") {
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
        key: 'chart.isDrawSymbols',
        label: 'Show symbols',
        parentView: 'controlPanel.tabs.chart.chart',
      });
      this.paraview.store.settingControls.add({
        type: 'checkbox',
        key: 'chart.showPopups',
        label: 'Show popups',
        parentView: 'controlPanel.tabs.chart.chart',
      });
    }
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

  get visitedStrokeWidth(): number {
    return this.effectiveLineWidth * this.effectiveVisitedScale;
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new LineSection(seriesView);
  }


  async storeDidChange(key: string, value: any) {
    await super.storeDidChange(key, value);
    if (key === 'seriesAnalyses') {
      // This gets called each time a series analysis completes after a
      // new manifest is loaded in AI mode. The following call will only
      // do anything once analyses have been generated for all series.
      this._createSequenceNavNodes();
    } else if (key === 'soloSeries') {
      //this._raiseSeries(value);
    }
  }

  protected _canCreateSequenceNavNodes(): boolean {
    return !!this._navMap && Object.keys(this.paraview.store.seriesAnalyses).length === this.paraview.store.model!.seriesKeys.length
      && !!this.paraview.store.seriesAnalyses[this.paraview.store.model!.seriesKeys[0]];
  }

  protected _createNavMap() {
    super._createNavMap();
    // In AI mode, the following call will only do anything when the doc view
    // has been recreated (so the series analyses already exist)
    this._createSequenceNavNodes();
  }

  protected _createSequenceNavNodes() {
    if (!this._canCreateSequenceNavNodes()) return;
    const seriesSeqNodes: NavNode<'sequence'>[][] = [];
    this._navMap!.root.query('series').forEach(seriesNode => {
      if (seriesSeqNodes.length) {
        seriesNode.connect('left', seriesSeqNodes.at(-1)!.at(-1)!);
      }
      const analysis = this.paraview.store.seriesAnalyses[seriesNode.options.seriesKey]!;
      const datapointNodes = seriesNode.allNodes('right', 'datapoint');
      const seqNodes: NavNode<'sequence'>[] = [];
      analysis.sequences.forEach(seq => {
        const seqNode = new NavNode(seriesNode.layer, 'sequence', {
          seriesKey: seriesNode.options.seriesKey,
          start: seq.start,
          end: seq.end
        });
        seqNodes.push(seqNode);
        seriesNode.datapointViews.slice(seq.start, seq.end).forEach(view => {
          seqNode.addDatapointView(view);
        });
      });
      seriesSeqNodes.push(seqNodes);
      seqNodes.slice(0, -1).forEach((seqNode, i) => {
        seqNode.connect('right', seqNodes[i + 1]);
      });
      // Replace series link to datapoints with link to sequences
      seriesNode.connect('right', seqNodes[0]);
      // Breaks first and last datapoint links with series landings
      datapointNodes[0].disconnect('left', false);
      datapointNodes.at(-1)!.disconnect('right');
      seqNodes.forEach(seqNode => {
        // Unless the first datapoint of the sequence already has an
        // 'out' link set (i.e., it's a boundary node), make a reciprocal
        // link to it
        seqNode.connect('in', datapointNodes[seqNode.options.start],
          !datapointNodes[seqNode.options.start].getLink('out'));
        for (let i = seqNode.options.start + 1; i < seqNode.options.end; i++) {
          // non-reciprocal 'out' links from remaining datapoints to sequence
          datapointNodes[i].connect('out', seqNode, false);
        }
        if (seqNode.peekNode('right', 1)) {
          // We aren't on the last sequence, so the final datapoint is a boundary point.
          // Make a non-reciprocal 'in' link to the next sequence
          datapointNodes[seqNode.options.end - 1].connect('in', seqNode.peekNode('right', 1)!, false);
        }
      });
    });
    // Make sequence node 'down' links
    seriesSeqNodes.slice(0, -1).forEach((seqNodes, i) => {
      seqNodes.forEach(node => {
        const nodeBelow = seriesSeqNodes[i + 1].find(otherNode =>
          otherNode.options.start <= node.options.start && otherNode.options.end > node.options.start)!;
        node.connect('down', nodeBelow, false);
      });
    });
    // Make sequence node 'up' links
    seriesSeqNodes.slice(1).forEach((seqNodes, i) => {
      seqNodes.forEach((node, j) => {
        const nodeAbove = seriesSeqNodes[i].find(otherNode =>
          otherNode.options.start <= node.options.start && otherNode.options.end > node.options.start)!;
        node.connect('up', nodeAbove, false);
      });
    });
  }

  legend() {
    if (this.paraview.store.settings.legend.itemOrder === 'series') {
      return this._chartLandingView.children.map(view => ({
        label: (view as SeriesView).seriesKey,
        color: (view as SeriesView).color  // series color
      }));
    } else {
      return this.paraview.store.model!.seriesKeys.toSorted().map(key => ({
        label: key,
        color: this.paraview.store.seriesProperties!.properties(key).color
      }));
    }
  }

  // TODO: localize this text output
  // focused view: e.options!.focus
  // all visited datapoint views: e.options!.visited
  queryData(): void {
    const msgArray: string[] = [];

    const queriedNode = this._navMap!.cursor;

    if (queriedNode.isNodeType('top')) {
      msgArray.push(`Displaying Chart: ${this.paraview.store.title}`);
    } else if (queriedNode.isNodeType('series')) {
      /*
      if (e.options!.isChordMode) {
        // console.log('focusedDatapoint', focusedDatapoint)
        const visitedDatapoints = e.options!.visited as XYDatapointView[];
        // console.log('visitedDatapoints', visitedDatapoints)
        msgArray = this.describeChord(visitedDatapoints);
      } */
      const seriesKey = queriedNode.options.seriesKey;
      const datapointCount = this.paraview.store.model!.atKey(seriesKey)!.length;
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey, datapointCount }
      ));
    } else if (queriedNode.isNodeType('datapoint')) {
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
      const visitedDatapoint = queriedNode.datapointViews[0];
      const seriesKey = queriedNode.options.seriesKey;
      msgArray.push(interpolate(
        queryMessages.datapointKeyLength,
        {
          seriesKey,
          datapointXY: formatXYDatapoint(visitedDatapoint.datapoint, 'raw'),
          datapointIndex: queriedNode.options.index + 1,
          datapointCount: this.paraview.store.model!.atKey(seriesKey)!.length
        }
      ));

      if (selectedDatapoints.length > 0) {
        // if there are selected datapoints, compare the current datapoint against each of those
        const selectedDatapointViews = selectedDatapoints.map((cursor) => cursor.datapointView);
        const selectionMsgArray = describeSelections(
          visitedDatapoint,
          selectedDatapointViews
        );
        msgArray.push(...selectionMsgArray);
      } else {
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        const datapointMsg = describeAdjacentDatapoints(this.paraview, visitedDatapoint);
        msgArray.push(datapointMsg);
      }

      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(
        this.paraview,
        visitedDatapoint.datapoint.facetValueAsNumber('y')!,
        seriesKey
      );
      msgArray.push(...minMaxMsgArray);
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

  // get height() {
  //   // apparently this can get called before the shape is created
  //   return bboxOfBboxes(...this._shapes.map(shape => shape.bbox)).height ?? 0;
  // }

  // get left() {
  //   return this._shape!.left;
  // }

  // get right() {
  //   return this._shape!.right;
  // }

  // get top() {
  //   return this._shape!.top;
  // }

  // get bottom() {
  //   return this._shape!.bottom;
  // }

  get outerBbox() {
    const shapeOuters = this._shapes.map(shape => shape.outerBbox);
    return this._symbol
      ? bboxOfBboxes(...shapeOuters, this._symbol!.outerBbox)
      : bboxOfBboxes(...shapeOuters);
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
    this._prevMidX = -this.width / 2; // - 0.1;
    this._prevMidY = (this._prev!.y - this.y) / 2;
  }

  protected _computeNext() {
    this._nextMidX = this.width / 2; // + 0.1;
    this._nextMidY = (this._next!.y - this.y) / 2;
  }

  protected _computeCentroid() {
    const symWidth = this._symbol?.width ?? 0;
    const symHeight = this._symbol?.height ?? 0;
    let centroidX = '50%';
    if (!this._prevMidX) {
      centroidX = `${symWidth / 2}px`;
    } else if (!this._nextMidX) {
      centroidX = `calc(100% - ${symWidth / 2}px)`;
    }

    let centroidY = '50%';
    if (!this._prevMidY && this._nextMidY) {
      centroidY = (this._y > this._nextMidY)
        ? `calc(100% - ${symHeight / 2}px)`
        : `${symHeight / 2}px`;
    } else if (!this._nextMidY && this._prevMidY) {
      centroidY = (this._y > this._prevMidY)
        ? `calc(100% - ${symHeight / 2}px)`
        : `${symHeight / 2}px`;
    } else if (this._nextMidY && this._prevMidY) {
      // NB: layoutSymbol() hasn't been called yet, so we can't refer,
      // directly or indirectly, to the symbol's location
      const symTop = this._y - symHeight / 2;
      const symBot = this._y + symHeight / 2;
      // NB: Strokes aren't taken into account here when computing the
      // element size, I think because we're using box-sizing: content-box.
      if (symBot > this._nextMidY && symBot > this._prevMidY) {
        centroidY = `calc(100% - ${symHeight / 2}px)`;
      } else if (symTop < this._nextMidY && symTop < this._prevMidY) {
        centroidY = `${symHeight / 2}px`;
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

  protected _shapeStyleInfo(shapeIndex: number): StyleInfo {
    if (this.chart.navMap!.cursor.isNodeType('sequence')) {
      const node = this.chart.navMap!.cursor;
      if ((this.index === node.options.start && this.index && !shapeIndex)
        || (this.index === node.options.end - 1 && shapeIndex)) {
        return {
          fill: this._parent.styleInfo.fill,
          stroke: this._parent.styleInfo.stroke,
          strokeWidth: this._parent.styleInfo.strokeWidth
        };
      }
    }
    return super._shapeStyleInfo(shapeIndex);
  }

  protected _createShapes() {
    // If datapoints are laid out again after the initial layout,
    // we need to replace the original shape and symbol
    this._shapes.forEach(shape => {
      shape.remove();
    });
    const points = this._points;
    let cousins = this.withCousins.map((c, i) => [c, i]).toSorted((a: this[], b: this[]) => a[0].y - b[0].y) as [this, number][]
    let y = 0;
    let height = 0;
    if (cousins.length === 1) {
      y = 0;
      height = this.chart.height;
    }
    else {
      if (cousins[0][1] === this.parent.index) {
        y = 0;
        height = (cousins[1][0].y - this.y) / 2 + this.y
      }
      else if (cousins[cousins.length - 1][1] === this.parent.index) {
        y = (this.y - cousins[cousins.length - 2][0].y) / 2 + cousins[cousins.length - 2][0].y
        height = this.chart.height - ((this.y - cousins[cousins.length - 2][0].y) / 2 + cousins[cousins.length - 2][0].y)
      }
      else {
        let index = cousins.findIndex(c => c[1] === this.parent.index)!
        y = (this.y - cousins[index - 1][0].y) / 2 + cousins[index - 1][0].y
        height = (cousins[index + 1][0].y - this.y) / 2 + this.y - ((this.y - cousins[index - 1][0].y) / 2 + cousins[index - 1][0].y)
      }
    }
    if (points.length === 3) {
      const slices = [points.slice(0, -1), points.slice(1)];
      // XXX We can't do this until the series analysis completes!
      // const seq = this.paraview.store.seriesAnalyses[this.seriesKey]?.sequences?.find(seqInfo =>
      //   seqInfo.start <= this.index && this.index < seqInfo.end);
      // if (seq) {
      //   if (this.index === seq.start) {
      //     slices.reverse();
      //   }
      // }
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: slices[0],
          isClip: true
        }),
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: slices[1],
          isClip: true
        })
      );
      let invis = new RectShape(this.paraview, {
        x: this._x + slices[0][0].x,
        y: y,
        width: slices[1][1].x - slices[0][0].x,
        height: height,
        stroke: "white",
        fill: "white",
        pointerEnter: (e) => {
          this.paraview.store.settings.chart.showPopups && this.paraview.store.settings.popup.activation === "onHover" ? this.addPopup() : undefined;
        },
        pointerLeave: (e) => {
          this.paraview.store.settings.chart.showPopups && this.paraview.store.settings.popup.activation === "onHover" ? this.removePopup(this.id) : undefined;
        }
      })
      this._shapes[0].classInfo = { 'leg-left': true };
      this._shapes[1].classInfo = { 'leg-right': true };
      invis.classInfo = { 'invis': true };
      this.append(invis)
    } else if (points.length === 2) {
      this._shapes.push(
        new PathShape(this.paraview, {
          x: this._x,
          y: this._y,
          points: points,
          isClip: true
        })
      );
      let invis = new RectShape(this.paraview, {
        x: points[0].x == 0 ? this._x : this._x + points[0].x,
        y: y,
        width: points[0].x == 0 ? points[1].x : this.x,
        height: height,
        stroke: "white",
        fill: "white",
        pointerEnter: (e) => {
          this.paraview.store.settings.chart.showPopups ? this.addPopup() : undefined;
        },
        pointerLeave: (e) => {
          this.paraview.store.settings.chart.showPopups ? this.removePopup(this.id) : undefined;
        }
      })
      this._shapes[0].classInfo = this._prevMidY !== undefined
        ? { 'leg-left': true }
        : { 'leg-right': true };
      invis.classInfo = { 'invis': true };
      this.append(invis)
    }
    this._shapes.forEach(shape => {
      (shape as PathShape).isClip = this.shouldClip;
    })
    super._createShapes();
  }

  addPopup() {
    let popup = new Popup(this.paraview,
      {
        text: this.paraview.summarizer.getDatapointSummary(this.datapoint, 'statusBar'),
        x: this.x,
        y: this.y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: this.id
      },
      {
        fill: this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(this.color), 6), 
        stroke: this.paraview.store.colors.colorValueAt(this.color),
      })
    this.paraview.store.popups.push(popup)
  }

  removePopup(id: string) {
    this.paraview.store.popups.splice(this.paraview.store.popups.findIndex(p => p.id === id), 1) 
  }
}

