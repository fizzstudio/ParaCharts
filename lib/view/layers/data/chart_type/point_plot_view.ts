/* ParaCharts: Point Charts
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

import { SeriesView } from '../../../data';
import { PlanePlotView, PlaneDatapointView, PlaneSeriesView } from '.';
import { AxisInfo } from '../../../../common/axisinfo';
import { Setting, type PointChartType } from '../../../../store/settings_types';

import { enumerate } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { svg } from 'lit';
import { linearRegression } from 'simple-statistics';
import { View } from '../../../base_view';
import { strToId } from '@fizz/paramanifest';
import { Bezier } from '../../../../common';
import { Logger, getLogger } from '../../../../common/logger';

/**
 * Abstract base class for charts that represent data values as points
 * (connected or not).
 */
export abstract class PointPlotView extends PlanePlotView {
  private log: Logger = getLogger("PointPlotView");
  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
      // this._axisInfo!.updateYRange();
      // for (const datapointView of this.datapointViews) {
      //   datapointView.computeLocation();
      // }
      // for (const datapointView of this.datapointViews) {
      //   datapointView.completeLayout();
      // }
      this.paraview.createDocumentView();
      this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  async storeDidChange(key: string, value: any) {
    await super.storeDidChange(key, value);
    if (key === 'frontSeries') {
      this._raiseSeries(value);
    }
  }

  get datapointViews() {
    return super.datapointViews as PointDatapointView[];
  }

  protected _newSeriesView(seriesKey: string) {
    return new PointSeriesView(this, seriesKey);
  }

  protected _newDatapointView(seriesView: SeriesView) {
    return new PointDatapointView(seriesView);
  }

  protected _createDatapoints() {
    const xs: string[] = [];
    for (const [p, i] of enumerate(this.paraview.store.model!.series[0].datapoints)) {
      xs.push(formatBox(p.facetBox('x')!, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
      const xId = strToId(xs.at(-1)!);
      // if (this.selectors[i] === undefined) {
      //   this.selectors[i] = [];
      // }
      // this.selectors[i].push(`tick-x-${xId}`);
    }
    for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
      const seriesView = this._newSeriesView(col.key);
      this._chartLandingView.append(seriesView);
      for (const [value, j] of enumerate(col)) {
        const datapointView = this._newDatapointView(seriesView);
        seriesView.append(datapointView);
        // the `index` property of the datapoint view will equal j
      }
    }
    // NB: This only works properly because we haven't added series direct labels
    // yet, which are also direct children of the chart.
    this._chartLandingView.sortChildren((a: PlaneSeriesView, b: PlaneSeriesView) => {
      return (b.children[0].datapoint.facetValueNumericized(b.children[0].datapoint.depKey)!) - (a.children[0].datapoint.facetValueNumericized(a.children[0].datapoint.depKey)!);
    });
  }

  // protected _layoutDatapoints() {
  //   ChartPoint.computeSize(this);
  //   for (const datapointView of this.datapointViews) {
  //      datapointView.computeLayout();
  //   }
  // }

  seriesRef(series: string) {
    return this.paraview.ref<SVGGElement>(`series.${series}`);
  }

  _raiseSeries(series: string) {
    this.log.info('RAISING', series);
    const seriesG = this.seriesRef(series).value!;
    this.dataset.append(seriesG);
  }

  getDatapointGroupBbox(labelText: string) {
    const labels = this.paraview.store.model!.allFacetValues('x')!.map(
      (box) => formatBox(box, this.paraview.store.getFormatType('horizTick'))
    );
    const idx = labels.findIndex(label => label === labelText);
    if (idx === -1) {
      throw new Error(`no such datapoint with label '${labelText}'`);
    }
    const g = this.paraview.ref<SVGGElement>('dataset').value!.children[idx] as SVGGElement;
    return g.getBBox();
  }

  getTickX(idx: number) {
    return this.datapointViews[idx].x;
  }

}

export class PointSeriesView extends PlaneSeriesView {

}


/**
 * Basic point marker.
 */
export class PointDatapointView extends PlaneDatapointView {

  declare readonly chart: PointPlotView;
  protected _currentAnimationFrame: number | null = null;
  _isAnimating: boolean = false;
  _hasAnimated: boolean = false;

  static width: number;

  // static computeSize(chart: PointChart) {
  //   const axisDivisions = chart.paraview.store.model!.allFacetValues('x')!.length - 1;
  //   this.width = chart.parent.contentWidth/axisDivisions;
  // }

  constructor(seriesView: SeriesView) {
    super(seriesView);
  }

  get width() {
    const axisDivisions = this.paraview.store.model!.series[0].length - 1;
    return this.chart.width / axisDivisions;
  }

  get height() {
    return 0;
  }

  get _selectedMarkerX() {
    return this._x - this.width / 2;
  }

  get _selectedMarkerY() {
    return this._y - this.height / 2;
  }

  get hasAnimated() {
    return this._hasAnimated
  }

  computeX() {
    return this.width * this.index;
  }

  computeY() {
    const yLabelInfo = this.chart.parent.docView.chartInfo.axisInfo!.yLabelInfo;
    const pxPerYUnit = this.chart.height / yLabelInfo.range!;
    return this.chart.height - (this.datapoint.facetValueNumericized('y')! - yLabelInfo.min!) * pxPerYUnit;
  }

  computeLocation() {
    this._x = this.computeX();
    if (this.paraview.store.settings.animation.isAnimationEnabled && this.paraview.store.settings.animation.expandPoints) {
      if (this.paraview.store.settings.animation.animationOrigin === 'initialValue') {
        this._animStartState.y = (this._parent.children[0] as PointDatapointView).computeY();
      } else if (this.paraview.store.settings.animation.animationOrigin === 'baseline') {
        this._animStartState.y = this.chart.height;
      } else if (this.paraview.store.settings.animation.animationOrigin === 'top') {
        this._animStartState.y = 0;
      } else {
        this._animStartState.y = this.paraview.store.settings.animation.animationOriginValue;;
      }
      this._animEndState.y = this.computeY();
      this._y = this._animStartState.y;
    } else {
      this._y = this.computeY();
      this._animStartState.y = this._y;
      this._animEndState.y = this._y;
    }
  }

  beginAnimStep(t: number): void {
    if (this.paraview.store.settings.animation.symbolPopIn) {
      if (t + .01 >= this.x / this.chart.width && !this._isAnimating && !this._hasAnimated) {
        this.popInAnimation(t)
      }
    }
    this._y = this._animStartState.y * (1 - t) + this._animEndState.y * t;
    super.beginAnimStep(t);
  }

  protected _animEnd() {
    //this._parent.docView.postNotice('animRevealEnd', null);
    this._currentAnimationFrame = null;
    this._isAnimating = false;
    this._hasAnimated = true;
    //this._animateRevealComplete = true;
  }

  popInAnimation(t: number) {
    this._isAnimating = true
    let start = -1;
    this._baseSymbolScale = 0
    const bez = new Bezier(.2, 6, 1, 1, 10)
    const step = (timestamp: number) => {
      if (start === -1) {
        start = timestamp;
      }
      const elapsed = timestamp - start;
      // We can't really disable the animation, but setting the reveal time to 0
      // will result in an imperceptibly short animation duration
      const revealTime = Math.max(1, this.paraview.store.settings.animation.popInAnimateRevealTimeMs);
      const t = Math.min(elapsed / revealTime, 1);
      const bezT = bez.eval(t)!;
      this._baseSymbolScale = bezT * .25 + .75
      this._contentUpdateSymbol()
      if (elapsed < revealTime) {
        this._currentAnimationFrame = requestAnimationFrame(step);
      } else {
        this._animEnd();
      }
    };
    this._currentAnimationFrame = requestAnimationFrame(step);
  }

}

export class TrendLineView extends View {
  protected x1: number = 0;
  protected x2: number = 0;
  protected y1: number = 0;
  protected y2: number = 0;

  constructor(private chart: PlanePlotView) {
    super(chart.paraview);
    this._generateEndpoints()
  }

  protected _generateEndpoints() {
    const pointsArray: number[][] = [];
    for (const child of this.chart.datapointViews) {
      pointsArray.push([child.x, child.y])
    }
    const linReg: { m: number; b: number; } = linearRegression(pointsArray);
    this.y1 = linReg.b
    this.x2 = this.chart.parent.width
    this.y2 = this.x2 * linReg.m + linReg.b
    if (this.y2 < 0) {
      this.x2 = -1 * linReg.b / linReg.m
      this.y2 = 0;
    }
    if (this.y2 > this.chart.parent.height) {
      this.x2 = (this.chart.parent.height - linReg.b) / linReg.m
      this.y2 = this.chart.parent.height;
    }
  }

  render() {
    return svg`
    <line x1=${this.x1} x2=${this.x2} y1=${this.y1} y2=${this.y2} style="stroke:red;stroke-width:3"/>
    `}
}