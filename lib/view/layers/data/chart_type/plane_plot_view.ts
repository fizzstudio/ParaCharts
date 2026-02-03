/* ParaCharts: XY Charts
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

import { Logger, getLogger } from '@fizz/logger';
import {
  DataLayer,
} from '../data_layer';
import { PlaneChartInfo, type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
//import { keymaps } from '../input';
//import { hotkeyActions } from '../input/defaultactions';
//import { NOTE_LENGTH } from '../audio/sonifier';
//import { type Actions, type Action } from '../input/actions';

import { ParaView } from '../../../../paraview';
import { Setting } from '../../../../state';

import { PlaneDatapoint, Datapoint } from '@fizz/paramodel';
import { Popup } from '../../../popup';
import { PathShape } from '../../../shape';
import { horizAdjust, Vec2, vertAdjust } from '../../../../common';

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
    if ([`type.${this.paraview.paraState.type}.minYValue`, `type.${this.paraview.paraState.type}.maxYValue`].includes(path)) {
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  pointerMove() {
    const coords = this.paraview.paraState.pointerCoords;
    const type = this.paraview.paraState.type;
    if (this.paraview.paraState.settings.chart.isShowPopups
      && this.paraview.paraState.settings.popup.activation === "onHover"
      && !this.paraview.paraState.settings.ui.isNarrativeHighlightEnabled
    ) {
      if (coords.x > 0 && coords.x < this.width && coords.y > 0 && coords.y < this.height) {
        const points = this.datapointViews;
        let distances;
        if (['line'].includes(type)) {
          distances = points.map((dp, i) => Number(Math.abs((dp.x - coords.x) ** 2)));
        }
        else if (['column', 'waterfall'].includes(type)) {
          distances = points.map((dp, i) => Number(Math.abs((dp.x + dp.width / 2 - coords.x) ** 2)));
        }
        else if (['bar'].includes(type)) {
          distances = points.map((dp, i) => Number(Math.abs((dp.x - coords.y) ** 2)));
        }
        else {
          distances = points.map((dp, i) => Number(Math.abs((dp.x - coords.x) ** 2 + (dp.y - coords.y) ** 2)));
        }
        let nearestPoint = points[distances.indexOf(Math.min(...distances))];
        if (nearestPoint.cousins.length > 0) {
          nearestPoint = nearestPoint.withCousins.sort((a, b) => Math.abs(a.y - coords.y) - Math.abs(b.y - coords.y))[0];
        }
        if (this.paraview.paraState.settings.popup.isShowCrosshair) {
          if (!this.paraview.paraState.settings.popup.isCrosshairFollowPointer) {
            nearestPoint.popup?.remove();
            const isChord = (type == 'line') && (this.paraview.paraState.model!.series.length > 1);
            this.removeDatapointPopup(nearestPoint);
            this.makeCrosshairsLocked(nearestPoint, false, isChord);
          }
          else {
            this.makeCrosshairsFree(nearestPoint);
          }
        }
      }
    }
  }

  makeCrosshairsLocked(nearestPoint: DatapointView, focus?: boolean, chord?: boolean) {
    const chartInfo = this.chartInfo as PlaneChartInfo;
    const type = this.paraview.paraState.type;
    if (chord) {
      this.addChordPopup(nearestPoint, focus);
    }
    else {
      nearestPoint.addDatapointPopup({ focus: focus });
    }

    let horizLines: PathShape[] = [];
    const vertLabels: Popup[] = [];
    const horizLabels: Popup[] = [];
    let vert = new PathShape(this.paraview, {
      points: [new Vec2(nearestPoint.x, 0),

      new Vec2(nearestPoint.x, this.height),],
      fill: "black",
      stroke: "black"
    });
    if (['bar', 'waterfall', 'column'].includes(type)) {
      vert = new PathShape(this.paraview, {
        points: [new Vec2(nearestPoint.x + nearestPoint.width / 2, 0),
        new Vec2(nearestPoint.x + nearestPoint.width / 2, this.height),],
        fill: "black",
        stroke: "black"
      });
    }
    let horiz = new PathShape(this.paraview, {
      points: [
        new Vec2(0, nearestPoint.y),
        new Vec2(this.width, nearestPoint.y),
      ],
      fill: "black",
      stroke: "black"
    });
    horizLines.push(horiz);
    if (type == 'bar') {
      const vertLabel = new Popup(this.paraview, {
        text: String(nearestPoint.datapoint.facetBox("y")!.raw),
        x: this.height - nearestPoint.y,
        y: this.width,
        margin: 0,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      const horizLabel = new Popup(this.paraview, {
        text: String(nearestPoint.datapoint.facetBox("x")!.raw),
        x: 0,
        y: nearestPoint.x,
        margin: 0,
        inbounds: false,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      vertLabels.push(vertLabel);
      horizLabels.push(horizLabel);
    }
    else if (type == 'waterfall') {
      let sum = 0
      for (let i = 0; i < nearestPoint.index + 1; i++) {
        sum += Number(this.paraview.paraState.model!.series[0].rawData[i]!.y)
      }
      const semanticHeight = nearestPoint.datapoint.facetValueAsNumber('y')! >= 0
        ? nearestPoint.y
        : nearestPoint.y + nearestPoint.height
      horizLines = []
      let horiz = new PathShape(this.paraview, {
        points: [
          new Vec2(0, semanticHeight),
          new Vec2(this.width, semanticHeight),
        ],
        fill: "black",
        stroke: "black"
      });
      horizLines.push(horiz);
      const vertLabel = new Popup(this.paraview, {
        text: String(chartInfo.facetTickLabelValues("x")[nearestPoint.index]),
        x: nearestPoint.x + nearestPoint.width / 2,
        y: this.height,
        margin: 0,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      const horizLabel = new Popup(this.paraview, {
        text: `${sum.toFixed(1)} (${String(nearestPoint.datapoint.facetBox("y")!.raw)})`,
        x: 0,
        y: semanticHeight,
        margin: 0,
        inbounds: false,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      vertLabels.push(vertLabel);
      horizLabels.push(horizLabel);
    }
    else {
      const vertLabelText = String(nearestPoint.datapoint.facetBox("x")!.raw);
      const horizLabelText = String(nearestPoint.datapoint.facetBox("y")!.raw);
      const vertLabel = new Popup(this.paraview, {
        text: vertLabelText,
        x: nearestPoint.x,
        y: this.height,
        margin: 0,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      const horizLabel = new Popup(this.paraview, {
        text: horizLabelText,
        x: 0,
        y: nearestPoint.y,
        margin: 0,
        inbounds: false,
        fill: "black"
      }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
      vertLabels.push(vertLabel);
      horizLabels.push(horizLabel);
      if (chord) {
        for (let cousin of nearestPoint.cousins) {
          const horizLabelCousin = new Popup(this.paraview, {
            text: String(cousin.datapoint.facetBox("y")!.raw),
            x: 0,
            y: cousin.y,
            margin: 0,
            inbounds: false,
            fill: "black"
          }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
          let horizCousin = new PathShape(this.paraview, {
            points: [
              new Vec2(0, cousin.y),
              new Vec2(this.width, cousin.y),
            ],
            fill: "black",
            stroke: "black"
          });
          horizLines.push(horizCousin);
          horizLabels.push(horizLabelCousin);
        }
      }
    }
    vertLabels.forEach(l => vertAdjust(l));
    horizLabels.forEach(l => horizAdjust(l));
    this.paraview.paraState.crossHair.splice(0, this.paraview.paraState.crossHair.length);
    this.paraview.paraState.crossHair.push(vert, ...horizLines);
    this.paraview.paraState.crossHairLabels.splice(0, this.paraview.paraState.crossHairLabels.length);
    this.paraview.paraState.crossHairLabels.push(...vertLabels, ...horizLabels);
    this.paraview.requestUpdate();
  }

  makeCrosshairsFree(nearestPoint: DatapointView) {
    const chartInfo = this.chartInfo as PlaneChartInfo;
    const coords = this.paraview.paraState.pointerCoords;
    const isBar = this.paraview.paraState.type == 'bar' ? true : false;
    let x = coords.x
    let y = coords.y
    if (isBar) {
      x = coords.y;
      y = this.height - coords.x;
    }
    const vert = new PathShape(this.paraview, {
      points: [new Vec2(x, 0),
      new Vec2(x, this.height),],
      fill: "black",
      stroke: "black"
    });
    let horiz = new PathShape(this.paraview, {
      points: [
        new Vec2(0, y),
        new Vec2(this.width, y),
      ],
      fill: "black",
      stroke: "black"
    });
    const vertProportion = ((this.height - y) / this.height) * (chartInfo.yInterval!.end - chartInfo.yInterval!.start) + chartInfo.yInterval!.start;
    let horizText = '';
    if (chartInfo.xInterval) {
      horizText = ((x / this.width) * (chartInfo.xInterval.end - chartInfo.xInterval.start) + chartInfo.xInterval.start).toFixed(2);
    }
    else {
      horizText = String(nearestPoint.datapoint.facetBox("x")!.raw);
    }
    this.paraview.paraState.crossHair.splice(0, this.paraview.paraState.crossHair.length);
    this.paraview.paraState.crossHair.push(vert, horiz);
    const vertLabel = new Popup(this.paraview, {
      text: horizText,
      x: coords.x,
      y: isBar ? this.width : this.height,
      margin: 0,
      fill: "black"
    }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
    const horizLabel = new Popup(this.paraview, {
      text: vertProportion.toFixed(2),
      x: 0,
      y: coords.y,
      margin: 0,
      inbounds: false,
      fill: "black"
    }, { shape: "box", fill: "hsl(0, 0%, 100%)" });
    vertAdjust(vertLabel);
    horizAdjust(horizLabel);
    this.paraview.paraState.crossHairLabels.splice(0, this.paraview.paraState.crossHairLabels.length);
    this.paraview.paraState.crossHairLabels.push(vertLabel, horizLabel);
  }

  addChordPopup(datapoint: DatapointView, focus?: boolean) {
    let datapointViews = datapoint.withCousins;
    let text = '';
    for (let dpView of datapointViews) {
      text = text.concat(`${dpView.series.getLabel()}: ${this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.summarizer.getDatapointSummary(dpView.datapoint, 'statusBar')}\n`);
    }
    const dpView = datapointViews[0];
    const items = this.paraview.documentView?.chartLayers.dataLayer.chartInfo.popuplegend()!;
    this.paraview.documentView?.chartLayers.backgroundAnnotationLayer.render()!;
    const popup = new Popup(this.paraview,
      {
        text,
        x: dpView!.x,
        y: dpView!.y,
        id: this.id,
        color: dpView!.color,
        type: "chord",
        items,
        points: datapointViews
      },
      {
        fill: "hsl(0, 0%, 100%)"
        ,
        stroke: "hsl(0, 0%, 0%)"
      });
    focus ? this.paraview.paraState.focusPopups.push(popup) : this.paraview.paraState.popups.push(popup);
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
    //     formatXYDatapointX(this.datapoint, this.paraview.paraState.getFormatType('domId')),
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
    // if (this.paraview.paraState.type == "bar" || this.paraview.paraState.type == "column"){
    //   this.paraview.paraState.updateSettings(draft => {
    //   draft.controlPanel.isSparkBrailleBar = true
    // })};
    // this.paraview.paraState.sparkBrailleData = data.join(' ');
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
