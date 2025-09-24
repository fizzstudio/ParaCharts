
import { strToId } from '@fizz/paramanifest';
import { DataView, type ChartLandingView, type DatapointView } from '.';
import { Container } from '../base_view';
import { type DataLayer } from '../layers';

import { ref } from 'lit/directives/ref.js';
import { type StyleInfo } from 'lit/directives/style-map.js';
import { type ClassInfo } from 'lit/directives/class-map.js';
import { TemplateResult } from 'lit';
import { datapointIdToCursor } from '../../store';

/**
 * Abstract base class for a view representing an entire series.
 * @public
 */
export class SeriesView extends Container(DataView) {

  declare protected _parent: ChartLandingView;
  declare protected _children: DatapointView[];

  constructor(chart: DataLayer, seriesKey: string, isStyleEnabled?: boolean) {
    super(chart, seriesKey);
    this._isStyleEnabled = isStyleEnabled ?? true;
  }

  protected _createId() {
    return `series-${strToId(this.seriesKey)}`;
  }

  protected _seriesRef(series: string) {
    return this.chart.paraview.ref<SVGGElement>(`series.${series}`);
  }

  get ref() {
    return ref(this._seriesRef(this._series.key));
  }

  get class() {
    return 'series';
  }

  get classInfo(): ClassInfo {
    return {
      series: true,
      lowlight: !!(this.paraview.store.soloSeries && (this.paraview.store.soloSeries !== this._series.key)),
      hidden: this.paraview.store.hiddenSeriesList.includes(this._series.key)
    };
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: ChartLandingView) {
    super.parent = parent;
  }

  // @ts-ignore
  get children(): readonly DatapointView[] {
    return this._children;
  }

  get modelIndex() {
    // This is used by datapoint views to extract the correct ID from the JIM
    // (series views may reorder their children)
    return this.paraview.store.model!.seriesKeys.indexOf(this.seriesKey);
  }

  protected _updateStyleInfo(styleInfo: StyleInfo): void {
    super._updateStyleInfo(styleInfo);
    this.chart.updateSeriesStyle(styleInfo);
  }

  nextSeriesLanding() {
    return this._next;
  }

  prevSeriesLanding() {
    return this._prev;
  }

}
