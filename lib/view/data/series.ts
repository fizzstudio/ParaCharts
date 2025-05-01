
import { DataView, type ChartLandingView, type DatapointView } from '.';
import { Container } from '../base_view';
import { type DataLayer } from '../datalayer';
import { strToId } from '../../common/utils';

import { ref } from 'lit/directives/ref.js';
import { type StyleInfo } from 'lit/directives/style-map.js';

/**
 * Abstract base class for a view representing an entire series.
 * @public
 */
export class SeriesView extends Container(DataView) {

  declare protected _parent: ChartLandingView;
  declare protected _children: DatapointView[];

  constructor(chart: DataLayer, seriesKey: string) {
    super(chart, seriesKey);
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

  get style(): StyleInfo {
    const style: StyleInfo = {};
    let colorValue = this.chart.paraview.store.colors.colorValueAt(this.seriesProps.color);
    // if (this.paraview.store.isVisitedSeries(this.seriesKey)) {
    //   colorValue = this.chart.paraview.store.colors.colorValue('highlight');
    // }
    style.fill = colorValue;
    style.stroke = colorValue;
    return style;
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
      view.datapoint.x.raw === label
    );
  }

}
