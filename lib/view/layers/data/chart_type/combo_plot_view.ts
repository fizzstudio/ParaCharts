import { TemplateResult, svg } from 'lit';
import { DataLayer } from '../data_layer';
import { BarPlotView } from './bar_plot_view';
import { LinePlotView } from './line_plot_view';
import { DatapointView } from '../../../data';

export class ComboPlotView extends DataLayer {
  protected _barPlotView!: BarPlotView;
  protected _linePlotView!: LinePlotView;

  protected _createDatapoints(): void {
    this._barPlotView = new BarPlotView(
      this.paraview, this.width, this.height, 0, this._chartInfo);
    this.append(this._barPlotView);
    this._barPlotView.init();
    this._linePlotView = new LinePlotView(
      this.paraview, this.width, this.height, 0, this.paraview.paraState.comboChartInfo!);
    this.append(this._linePlotView);
    this._linePlotView.init();
  }

  get datapointDomIds() {
    const a1 = Array.from(this._barPlotView.datapointDomIds.entries());
    const a2 = Array.from(this._linePlotView.datapointDomIds.entries());
    return new Map([...a1, ...a2]);
  }

  datapointView(seriesKey: string, index: number): DatapointView | undefined {
    return this._barPlotView.datapointView(seriesKey, index) ?? this._linePlotView.datapointView(seriesKey, index);
  }

  datapointViewForId(id: string) {
    return this._barPlotView.datapointViewForId(id) ?? this._linePlotView.datapointViewForId(id);
  }

  render(): TemplateResult {
    // If we simply render the children, they'll get wrapped in an extraneous
    // <g>
    return svg`
      ${this._barPlotView.render()}
      ${this._linePlotView.render()}
    `;
  }
}