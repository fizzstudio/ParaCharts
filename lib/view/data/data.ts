
import { View } from '../base_view';
import { type DataLayer } from '../layers';
import { type SeriesProperties } from '../../state';

import { type StyleInfo } from 'lit/directives/style-map.js';
import { Series } from '@fizz/paramodel';

/**
 * Abstract base class for datapoint and series views.
 * @public
 */
export class DataView extends View {
  declare protected _prev: this | null;
  declare protected _next: this | null;
  declare protected _currFocus: DataView | null;
  declare protected _prevFocus?: DataView;

  protected _series!: Series;
  protected _isStyleEnabled = false;

  constructor(
    public readonly chart: DataLayer,
    public readonly seriesKey: string,
  ) {
    super(chart.paraview);
    this._series = this.chart.paraview.paraState.model!.atKey(seriesKey)!;
  }

  get series() {
    return this._series;
  }

  get seriesProps(): SeriesProperties {
    return this.chart.paraview.paraState.seriesProperties!.properties(this.seriesKey);
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

  get color(): number {
    return this.seriesProps.color;
  }

  get styleInfo(): StyleInfo {
    const styleInfo = super.styleInfo;
    if (this._isStyleEnabled) {
      this._updateStyleInfo(styleInfo);
    }
    return styleInfo;
  }

  set styleInfo(styleInfo: StyleInfo) {
    super.styleInfo = styleInfo;
  }

  protected _updateStyleInfo(styleInfo: StyleInfo) {
    let colorValue = this.chart.paraview.paraState.colors.colorValueAt(this.color);
    // if (this.paraview.paraState.isVisitedSeries(this.seriesKey)) {
    //   colorValue = this.chart.paraview.paraState.colors.colorValue('highlight');
    // }
    styleInfo.fill = colorValue;
    styleInfo.stroke = colorValue;
    styleInfo.strokeWidth = this.paraview.paraState.settings.chart.strokeWidth;
  }

  async onFocus(_isNewComponentFocus = false) {
    //this.paraview.paraState.clearVisited();
  }

  select(_extend: boolean) {}

}
