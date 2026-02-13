/* ParaCharts: Direct Label Strips
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
import { Label } from './label';
import { fixed } from '../common/utils';
import { View, Container } from './base_view';

import { svg, TemplateResult } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';
import { ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type ParaView } from '../paraview';
import { type PlaneChartInfo } from '../chart_types';
import { type DocumentView } from './document_view';

interface CollisionRec {
  label: Label,
  seriesKey: string,
  endpointY: number
}

/**
 * Strip of series labels and leader lines.
 * @public
 */
export class DirectLabelStrip extends Container(View) {
  declare protected _parent: DocumentView;

  protected _seriesLabels!: Label[];
  protected _leaders!: LineLabelLeader[];

  constructor(paraview: ParaView, height: number) {
    super(paraview);
    this.log = getLogger('DirectLabelStrip');
    this._id = 'direct-label-strip';
    this._height = height;
    // this._hidden = !(
    //   paraview.paraChart.headless ||
    //   paraview.paraChart.paraState.settings.ui.isLowVisionModeEnabled
    // );
    this._createInitialLabels();
  }

  protected _createInitialLabels() {
    const directLabelPadding = this.paraview.paraState.settings.chart.isDrawSymbols
      ? this.paraview.paraState.settings.type.line.seriesLabelPadding*2
      : this.paraview.paraState.settings.type.line.seriesLabelPadding;
    const endpoints = this.paraview.paraState.model!.series.map(series => series.datapoints.at(-1)!);
    endpoints.sort((a, b) => b.facetValueAsNumber('y')! - a.facetValueAsNumber('y')!);
    this._seriesLabels?.forEach(label => {
      label.remove();
    });
    this._seriesLabels = [];
    // Create labels
    endpoints.forEach((ep, i) => {
      const yInterval = (this.paraview.documentView!.chartInfo as PlaneChartInfo).yInterval!;
      const pxPerYUnit = this._height / (yInterval.end - yInterval.start);
      const labelY = this._height - (ep.facetValueNumericized('y')! - yInterval.start) * pxPerYUnit;
      this._seriesLabels.push(new Label(this.paraview, {
        text: this.paraview.paraState.model!.atKey(ep.seriesKey)!.getLabel(),
        left: directLabelPadding,
        y: labelY,
        classList: ['direct-label'],
      }));
      this.append(this._seriesLabels.at(-1)!);
    });
  }

  createLabels() {
    const directLabelPadding = this.paraview.paraState.settings.chart.isDrawSymbols
      ? this.paraview.paraState.settings.type.line.seriesLabelPadding*2
      : this.paraview.paraState.settings.type.line.seriesLabelPadding;
    // const endpoints = this._parent.chartLayers.dataLayer.chartLandingView.children.map(seriesView => seriesView.children.at(-1)!);
    const endpoints = this._parent.chartLayers.dataLayer.datapointViews
      .filter(datapoint =>
        datapoint.index === this.paraview.paraState.model!.series[0].length - 1
      );
    // Sort points from highest to lowest onscreen
    endpoints.sort((a, b) => a.y - b.y);
    this._seriesLabels?.forEach(label => {
      label.remove();
    });
    this._seriesLabels = [];
    const endpointYs: number[] = [];
    // Create labels
    endpoints.forEach((ep, i) => {
      endpointYs.push(ep.y);
      this._seriesLabels.push(new Label(this.paraview, {
        text: this.paraview.paraState.model!.atKey(ep.seriesKey)!.getLabel(),
        left: directLabelPadding,
        y: ep.y, // labelY,
        classList: ['direct-label'],
        pointerEnter: (e) => {
          this.paraview.paraState.lowlightOtherSeries(ep.seriesKey);
        },
        pointerLeave: (e) => {
          this.paraview.paraState.clearAllSeriesLowlights();
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
    // Same for the lowest label
    const botLabel = this._seriesLabels.at(-1)!;
    const diff = botLabel.bottom - this.height;
    if (diff > 0) {
      botLabel.y -= diff;
    }
    // We only want to add a leader one time to each label involved in a collision.
    // However, multiple CollisionRecs for the same label may get created, so
    // we use labels as map keys (rather than storing CollisionRecs in a set)
    const allColliders = new Map<Label, CollisionRec>();
    while (true) {
      const colliders = this._resolveSeriesLabelCollisions(endpoints.map(e => e.seriesKey), endpointYs);
      if (!colliders.length) break;
      colliders.forEach(c => {
        allColliders.set(c.label, c);
      })
    }
    const leaderLabelOffset = this.paraview.paraState.settings.chart.isDrawSymbols
      ? -this.paraview.paraState.settings.type.line.seriesLabelPadding
      : 0;
    this._leaders?.forEach(leader => {
      leader.remove();
    });
    this._leaders = [];
    allColliders.forEach(c => {
      // NB: this value already includes the series label padding
      c.label.x += (this.paraview.paraState.settings.type.line.leaderLineLength + leaderLabelOffset);
      this._leaders.push(new LineLabelLeader(this.paraview, c.seriesKey, c.label, c.endpointY));
      this.prepend(this._leaders.at(-1)!);
    });
  }

  protected _addedToParent(): void {
    this.observeNotices();
    this.createLabels();
  }

  noticePosted(key: string, value: any): void {
    if (['animRevealStep', 'animRevealEnd'].includes(key)) {
      this.createLabels();
      // if (key === 'animRevealEnd') {
      //   this._hidden = false;
      // }
    }
  }

  computeSize(): [number, number] {
    // XXX also need to support label strip on left, top, bottom
    return [
      Math.max(...this._seriesLabels.map(label => label.right))
        + this.paraview.paraState.settings.type.line.leaderLineLength,
      this._height
    ];
  }

  protected _resolveSeriesLabelCollisions(seriesKeys: string[], endpointYs: number[]) {
    const colliders: CollisionRec[] = [];
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
    if (colliders.length) {
      // Re-sort colliders from lowest to highest onscreen.
      colliders.reverse().slice(1).forEach((c, i) => {
        // Move each label up out of collision with the one onscreen below it.
        c.label.bottom = colliders[i].label.top; // - c.label.height;
      });
    }
    return colliders;
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
    this._endX = this.paraview.paraState.settings.type.line.leaderLineLength;
    this._endY = label.y - label.height / 4;
    this._lineD = fixed`
      M${0},${pointY}
      L${this._endX},${this._endY}`;
  }

  get styleInfo(): StyleInfo {
    const styles: StyleInfo = {};
    // const colorValue = this._controller.colors.colorValue(
    //   this._controller.seriesManager.series(this.endpoint.seriesKey).color);
    let colorValue = this.paraview.paraState.colors.colorValueAt(
      this.paraview.paraState.seriesProperties!.properties(this._seriesKey).color);
    styles.fill = colorValue;
    styles.stroke = colorValue;
    return styles;
  }

  get classInfo(): ClassInfo {
    return {
      'label-leader': true,
      'lowlight': this.paraview.paraState.isSeriesLowlighted(this._seriesKey)
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
