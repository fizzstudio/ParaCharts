
import { View } from '../base_view';
import { type DataLayer } from '../layers';
import { type DataView, type SeriesView, type DatapointView } from '.';

/**
 * Contains all chart series views.
 * @public
 */
export class ChartLandingView extends View {

  declare protected _parent: DataLayer;
  declare protected _children: SeriesView[];

  protected _createId() {
    return 'chart-landing';
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: DataLayer) {
    super.parent = parent;
  }

  get children(): readonly SeriesView[] {
    return this._children;
  }

  get datapointViews() {
    // This assumes that our immediate children are
    // series views, and their children are datapoint views
    return this._children.flatMap(kid => kid.children) as any as DatapointView[];
  }

  get focusLeaf() {
    return super.focusLeaf as DataView;
  }

  getSeriesView(seriesName: string) {
    return this._children.find(view => view.series.key === seriesName);
  }

  chartSummary() {
    return 'At top level.'
  }

}
