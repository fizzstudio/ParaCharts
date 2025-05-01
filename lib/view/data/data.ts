
import { View } from '../base_view';
import { type DataLayer } from '../datalayer';
import { type SeriesDF, type SeriesProperties } from '../../store';

/**
 * Abstract base class for datapoint and series views.
 * @public
 */
export class DataView extends View {
  declare protected _children: DataView[];
  declare protected _prev: this | null;
  declare protected _next: this | null;
  declare protected _currFocus: DataView | null;
  declare protected _prevFocus?: DataView;

  protected _series!: SeriesDF;

  constructor(
    public readonly chart: DataLayer, 
    public readonly seriesKey: string,
  ) {
    super(chart.paraview);
  }

  protected _addedToParent() {
    super._addedToParent();
    this._series = this.chart.paraview.store.model!.atKey(this.seriesKey)!;
  }

  get series() {
    return this._series;
  }

  get seriesProps(): SeriesProperties {
    return this.chart.paraview.store.seriesProperties!.properties(this.seriesKey);
  }

  get children(): readonly DataView[] {
    return this._children;
  }

  get siblings(): readonly this[] {
    return super.siblings.filter(sib => sib instanceof DataView) as this[];
  }

  get withSiblings(): this[] {
    return super.withSiblings.filter(sib => sib instanceof DataView) as this[];
  }

  get prev() {
    return super.prev as this | null; 
  }

  get next()  {
    return super.next as this | null; 
  }

  get currFocus() {
    return this._currFocus;
  }

  set currFocus(view: View | null) {
    super.currFocus = view;
  }

  get prevFocus() {
    return this._prevFocus;
  }

  onFocus() {
    //this.paraview.store.clearVisited();
  }

  select(_extend: boolean) {}

}
