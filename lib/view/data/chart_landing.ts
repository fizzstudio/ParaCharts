
import { View } from '../base_view';
import { type DataLayer } from '../datalayer';
import { type DataView, type SeriesView, type DatapointView } from '.';

import { svg } from 'lit';

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

  /*protected get _eventActions(): Actions<this> {
    //let count = 1;
    return {
      chart_focused: function() {
        todo().controller.announce(this.chartSummary());
      },
      selection_cleared: function() {
        todo().controller.announce('No items selected.');
      },
    };
  }*/

  get focusLeaf() {
    return super.focusLeaf as DataView;
  }

  onFocus(isNewComponentFocus = false) {
    // Set browser focus on our SVG group
    this.parent.dataset.focus();
    this.paraview.store.visit([]);
    this.paraview.store.announce(this.paraview.summarizer.getChartSummary(), isNewComponentFocus);
  }

  getSeriesView(seriesName: string) {
    return this._children.find(view => view.series.key === seriesName);
  }
  
  chartSummary() {
    return 'At top level.'
  }

  content() {
    return svg`${this.children.map(kid => kid.render())}`;
  }

}
