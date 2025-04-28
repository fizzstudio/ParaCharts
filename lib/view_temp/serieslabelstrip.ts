/* ParaCharts: Series Label Strips
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

import { Label } from './label';
import { fixed } from '../common/utils';
import { View, Container } from './base_view';

import { svg } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';
import { type LineChart, type LineSection } from './line';
import { OrderedModel2D } from '../store/model2D';
import { Datatype } from '@fizz/paramanifest';

/**
 * Strip of series labels and leader lines.
 * @public
 */
export class SeriesLabelStrip extends Container(View) {

  protected seriesLabels: Label[] = [];
  protected leaders: LineLabelLeader[] = [];

  constructor(private _chart: LineChart) {
    super(_chart.paraview);
    const directLabelPadding = this._chart.settings.isDrawSymbols 
      ? this._chart.settings.seriesLabelPadding*2
      : this._chart.settings.seriesLabelPadding;
    // Sort points from highest to lowest onscreen
    const endpoints = this._chart.datapointViews.
      filter(datapoint => 
        datapoint.index === this._chart.paraview.store.model!.allFacetValues('x')!.length - 1
      );
    endpoints.sort((a, b) => a.y - b.y);
    // Create labels
    endpoints.forEach((ep, i) => {
      this.seriesLabels.push(new Label({
        text: ep.series.key!,
        x: directLabelPadding,
        y: ep.y,
        classList: ['serieslabel'],
      }, this._chart.paraview));
      this.append(this.seriesLabels.at(-1)!);
    });
    this.seriesLabels.forEach(label => {
      // Roughly center each label on its series endpoint
      label.y -= 2*label.anchorYOffset/3;
    });
    // If the highest label is offscreen at all, push it back onscreen
    const topLabel = this.seriesLabels[0];
    // XXX This is rough: because when measured, labels may not get rendered with the
    // same font settings they will ultimately be displayed with.
    if (topLabel.y < 0) {
      topLabel.y = 0;
    }
    // Same for the lowest label 
    const botLabel = this.seriesLabels.at(-1)!;
    const diff = botLabel.bottom - this.height;
    if (diff > 0) {
      botLabel.y -= diff;
    }
    this.resolveSeriesLabelCollisions(endpoints);
  }

  computeSize(): [number, number] {
    // XXX also need to support label strip on left, top, bottom
    return [
      Math.max(...this.seriesLabels.map(label => label.right)),
      this._chart.height
    ];
  }

  // XXX I don't think this method will get the job done in all cases
  private resolveSeriesLabelCollisions(endpoints: LineSection[]) {
    const colliders: {label: Label, endpoint: LineSection}[] = [];
    // NB: It looks like all labels will have the same bbox height, although
    // I don't know whether that will hold for all possible diacritics
    // (I suspect not).
    for (let i = 1; i < this.seriesLabels.length; i++) { 
      if (this.seriesLabels[i].y < this.seriesLabels[i - 1].bottom) {
        if (colliders.at(-1)?.label !== this.seriesLabels[i - 1]) {
          colliders.push({label: this.seriesLabels[i - 1], endpoint: endpoints[i - 1]});
        }
        colliders.push({label: this.seriesLabels[i], endpoint: endpoints[i]});
      }
    }
    if (colliders.length) {
      const leaderLabelOffset = this._chart.settings.isDrawSymbols 
        ? -this._chart.settings.seriesLabelPadding 
        : 0;

      // Re-sort colliders from lowest to highest onscreen.
      colliders.reverse().slice(1).forEach((c, i) => {
        // Move each label up out of collision with the one onscreen below it.
        c.label.y = colliders[i].label.y! - c.label.height;
      });
      // Test for collision with labels that weren't originally in collision.
      //If all collisions can't be resolved, switch to a different labeling approach.

      // Sort non-collider labels, if any, from lowest to highest onscreen
      const nonColliderLabels = this.seriesLabels
        .filter(label => !colliders.map(c => c.label).includes(label))
        .toReversed();
      if (nonColliderLabels.length) {
        const topColliderLabel = colliders.at(-1)!.label;
        const gapDiff = topColliderLabel.bottom - nonColliderLabels[0].y;
        if (gapDiff < 0) {
          nonColliderLabels.forEach(nc => nc.y -= gapDiff);
          if (nonColliderLabels.at(-1)!.y < 0) {
            console.warn('unable to resolve series label collision');
          }
        }
      }
      colliders.forEach(c => {
        // NB: this value already includes the series label padding
        c.label.x += (this._chart.settings.leaderLineLength + leaderLabelOffset); 
        this.leaders.push(new LineLabelLeader(c.endpoint, c.label, this._chart));
        this.prepend(this.leaders.at(-1)!);
      });
    }
  }

}

/**
 * Leader lines drawn from the endpoint of a series to its label.
 */
class LineLabelLeader extends View {

  private lineD: string;
  private endX: number;
  private endY: number;

  constructor(private endpoint: LineSection, label: Label, private chart: LineChart) {
    super(chart.paraview);
    this.endX = this.chart.paraview.store.settings.type.line.leaderLineLength;
    this.endY = label.y + 2*label.anchorYOffset/3;
    this.lineD = fixed`
      M${0},${endpoint.y}
      L${this.endX},${this.endY}`;
  }

  get styles(): StyleInfo {
    const styles: StyleInfo = {};
    // const colorValue = this._controller.colors.colorValue(
    //   this._controller.seriesManager.series(this.endpoint.seriesKey).color);
    let colorValue = this.chart.paraview.store.colors.colorValueAt(this.endpoint.seriesProps.color);
    styles.fill = colorValue;
    styles.stroke = colorValue;
    return styles;
  }

  content() {
    const styles = {
      strokeWidth: 2, //this.chart.settings.lineWidth
    };
    const seriesIdx = this.endpoint.parent.index;
    return svg`
      <g
        class="label-leader-line"
        style=${styleMap(this.styles)}
      >
        <path
          d=${this.lineD}
          style=${styleMap(styles)}
          />
        <circle 
          cx=${this.endX}
          cy=${this.endY}
          r="1.8"
        />
      </g>
    `;
  }
}
