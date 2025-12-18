/* ParaCharts: Direct Label Strips
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

import { Logger, getLogger } from '../common/logger';
import { Label } from './label';
import { fixed } from '../common/utils';
import { View, Container } from './base_view';

import { svg, TemplateResult } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';
import { type LinePlotView, type LineSection } from './layers';
import { ClassInfo, classMap } from 'lit/directives/class-map.js';
import { ParaView } from '../paraview';
import { Datapoint } from '@fizz/paramodel';

/**
 * Strip of series labels and leader lines.
 * @public
 */
export class DirectLabelStrip extends Container(View) {
  protected _seriesLabels!: Label[];
  protected _leaders!: LineLabelLeader[];

  constructor(paraview: ParaView, height: number) {
    super(paraview);
    this.log = getLogger('DirectLabelStrip');
    this._id = 'direct-label-strip';
    this._height = height;
    this._hidden = !(paraview.store.paraChart.headless || paraview.store.settings.ui.isLowVisionModeEnabled);
    this._createLabels();
  }

  protected _createLabels() {
    const directLabelPadding = this.paraview.store.settings.chart.isDrawSymbols
      ? this.paraview.store.settings.type.line.seriesLabelPadding*2
      : this.paraview.store.settings.type.line.seriesLabelPadding;
    // Sort points from highest to lowest onscreen
    const endpoints = this.paraview.store.model!.series.map(series => series.datapoints.at(-1)!);
    // const endpoints = this._chart.datapointViews.
    //   filter(datapoint =>
    //     datapoint.index === this.paraview.store.model!.series[0].length - 1
    //   );
    endpoints.sort((a, b) => b.facetValueAsNumber('y')! - a.facetValueAsNumber('y')!);
    this._seriesLabels?.forEach(label => {
      label.remove();
    });
    this._seriesLabels = [];
    const endpointYs: number[] = [];
    // Create labels
    endpoints.forEach((ep, i) => {
      const yLabelInfo = this.paraview.documentView!.chartInfo.axisInfo!.yLabelInfo;
      const pxPerYUnit = this._height / yLabelInfo.range!;
      const labelY = this._height - (ep.facetValueNumericized('y')! - yLabelInfo.min!) * pxPerYUnit;
      endpointYs.push(labelY);
      this._seriesLabels.push(new Label(this.paraview, {
        text: this.paraview.store.model!.atKey(ep.seriesKey)!.getLabel(),
        left: directLabelPadding,
        y: labelY,
        classList: ['direct-label'],
        pointerEnter: (e) => {
          this.paraview.store.lowlightOtherSeries(ep.seriesKey);
        },
        pointerLeave: (e) => {
          this.paraview.store.clearAllSeriesLowlights();
        }
      }));
      this.append(this._seriesLabels.at(-1)!);
    });
    this._seriesLabels.forEach(label => {
      // Roughly center each label on its series endpoint
        label.y += label.locOffset.y/2;
    });
    // If the highest label is offscreen at all, push it back onscreen
    const topLabel = this._seriesLabels[0];
    if (topLabel.top < 0) {
      topLabel.top = 0;
    }
    // // Same for the lowest label
    const botLabel = this._seriesLabels.at(-1)!;
    const diff = botLabel.bottom - this.height;
    if (diff > 0) {
      botLabel.y -= diff;
    }
    this._resolveSeriesLabelCollisions(endpoints.map(e => e.seriesKey), endpointYs);
  }

  protected _addedToParent(): void {
    this.observeNotices();
  }

  noticePosted(key: string, value: any): void {
    if (['animRevealStep', 'animRevealEnd'].includes(key)) {
      this._createLabels();
      if (key === 'animRevealEnd') {
        this._hidden = false;
      }
    }
  }

  computeSize(): [number, number] {
    // XXX also need to support label strip on left, top, bottom
    return [
      Math.max(...this._seriesLabels.map(label => label.right)),
      this._height
    ];
  }

  // XXX I don't think this method will get the job done in all cases
  protected _resolveSeriesLabelCollisions(seriesKeys: string[], endpointYs: number[]) {
    const colliders: {label: Label, seriesKey: string, endpointY: number}[] = [];
    // NB: It looks like all labels will have the same bbox height, although
    // I don't know whether that will hold for all possible diacritics
    // (I suspect not).
    for (let i = 1; i < this._seriesLabels.length; i++) {
      if (this._seriesLabels[i].top < this._seriesLabels[i - 1].bottom) {
        if (colliders.at(-1)?.label !== this._seriesLabels[i - 1]) {
          colliders.push({
            label: this._seriesLabels[i - 1],
            seriesKey: seriesKeys[i - 1],
            // endpoint screen y value
            endpointY: endpointYs[i - 1]
          });
        }
        colliders.push({
          label: this._seriesLabels[i],
          seriesKey: seriesKeys[i],
          endpointY: endpointYs[i]
        });
      }
    }
    this._leaders?.forEach(leader => {
      leader.remove();
    });
    this._leaders = [];

    if (colliders.length) {
      const leaderLabelOffset = this.paraview.store.settings.chart.isDrawSymbols
        ? -this.paraview.store.settings.type.line.seriesLabelPadding
        : 0;

      // Re-sort colliders from lowest to highest onscreen.
      colliders.reverse().slice(1).forEach((c, i) => {
        // Move each label up out of collision with the one onscreen below it.
        c.label.bottom = colliders[i].label.top; // - c.label.height;
      });
      // Test for collision with labels that weren't originally in collision.
      //If all collisions can't be resolved, switch to a different labeling approach.

      // Sort non-collider labels, if any, from lowest to highest onscreen
      const nonColliderLabels = this._seriesLabels
        .filter(label => !colliders.map(c => c.label).includes(label))
        .toReversed();
      if (nonColliderLabels.length) {
        const topColliderLabel = colliders.at(-1)!.label;
        const gapDiff = topColliderLabel.bottom - nonColliderLabels[0].y;
        if (gapDiff < 0) {
          nonColliderLabels.forEach(nc => nc.y -= gapDiff);
          if (nonColliderLabels.at(-1)!.y < 0) {
            this.log.warn('unable to resolve series label collision');
          }
        }
      }
      colliders.forEach(c => {
        // NB: this value already includes the series label padding
        c.label.x += (this.paraview.store.settings.type.line.leaderLineLength + leaderLabelOffset);
        this._leaders.push(new LineLabelLeader(this.paraview, c.seriesKey, c.label, c.endpointY));
        this.prepend(this._leaders.at(-1)!);
      });
    }
  }

  // content(): TemplateResult {
  //   for (const label of this._seriesLabels) {
  //     const classInfo = label.classInfo;

  //   }
  //   return super.content();
  // }

}

/**
 * Leader lines drawn from the endpoint of a series to its label.
 */
class LineLabelLeader extends View {
  protected _lineD: string;
  protected _endX: number;
  protected _endY: number;

  constructor(paraview: ParaView, protected _seriesKey: string, label: Label, pointY: number) {
    super(paraview);
    this._endX = this.paraview.store.settings.type.line.leaderLineLength;
    this._endY = label.y - label.locOffset.y/2;
    this._lineD = fixed`
      M${0},${pointY}
      L${this._endX},${this._endY}`;
  }

  get styleInfo(): StyleInfo {
    const styles: StyleInfo = {};
    // const colorValue = this._controller.colors.colorValue(
    //   this._controller.seriesManager.series(this.endpoint.seriesKey).color);
    let colorValue = this.paraview.store.colors.colorValueAt(
      this.paraview.store.seriesProperties!.properties(this._seriesKey).color);
    styles.fill = colorValue;
    styles.stroke = colorValue;
    return styles;
  }

  get classInfo(): ClassInfo {
    return {
      'label-leader': true,
      'lowlight': this.paraview.store.isSeriesLowlighted(this._seriesKey)
    }
  }

  content() {
    return svg`
      <g
        class=${classMap(this.classInfo)}
        style=${styleMap(this.styleInfo)}
      >
        <path
          d=${this._lineD}
          />
        <circle
          cx=${fixed`${this._endX}`}
          cy=${fixed`${this._endY}`}
          r="1.8"
        />
      </g>
    `;
  }
}
