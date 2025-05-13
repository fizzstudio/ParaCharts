
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

  protected _composeSelectionAnnouncement() {
    // This method assumes only a single series was visited when the select
    // command was issued (i.e., we know nothing about chord mode here)
    const newTotalSelected = this.paraview.store.selectedDatapoints.length;
    const oldTotalSelected = this.paraview.store.prevSelectedDatapoints.length;
    const justSelected = this.paraview.store.selectedDatapoints.filter(dc =>
      !this.paraview.store.wasSelected(dc.seriesKey, dc.index));
  
    let s = newTotalSelected === 1 ? '' : 's';
    const newTotSelText = `${newTotalSelected} point${s} selected.`;
    s = justSelected.length === 1 ? '' : 's';
    const justSelText = `Selected ${justSelected.length} point${s}.`;

    if (oldTotalSelected === 0) {
      return justSelText;
    } else {
      return `${justSelText} ${newTotSelText}`;
    }
  }

  select(isExtend: boolean) {
    if (isExtend) {
      this.paraview.store.extendSelection(this.paraview.store.visitedDatapoints);
    } else {
      this.paraview.store.select(this.paraview.store.visitedDatapoints);
    }
    this.paraview.store.announce(this._composeSelectionAnnouncement());
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
