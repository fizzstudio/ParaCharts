
import { DataView, type ChartLandingView, type DatapointView } from '.';
import { Container } from '../base_view';
import { type DataLayer } from '../datalayer';
import { strToId } from '@fizz/paramodel';

import { ref } from 'lit/directives/ref.js';
import { type StyleInfo } from 'lit/directives/style-map.js';

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

  nextSeriesLanding() {
    return this._next;    
  }

  prevSeriesLanding() {
    return this._prev;
  }

  protected _visit() {
    this.paraview.store.visit(this._children.map(v => ({seriesKey: v.seriesKey, index: v.index})));
  }

  onFocus() {
    super.onFocus();
    this._visit();
    this.paraview.store.announce(this.paraview.summarizer.getSeriesSummary(this.seriesKey));
  }

  getDatapointViewForLabel(label: string) {
    return this._children.find(view => 
      view.datapoint.facetBox('x')!.raw === label
    );
  }

}
