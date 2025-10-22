import { DataLayer } from '../data_layer';
import { type ParaView } from '../../../../paraview';
import { type BaseChartInfo } from '../../../../chart_types';
import { GridLayout } from '../../../layout';

export class TablePlotView extends DataLayer {
  protected _grid: GridLayout;

  constructor(paraview: ParaView, width: number, height: number, dataLayerIndex: number, chartInfo: BaseChartInfo) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this._grid = new GridLayout(this.paraview, {
      width: this._width,
      height: this._height,
      canWidthFlex: false,
      canHeightFlex: false,
      numCols: this.paraview.store.model!.facetKeys.length,
      rowAligns: 'start',
      colAligns: 'start',
    }, 'table-grid');
    this.append(this._grid);
  }

  protected _createDatapoints(): void {
    this._grid.layoutViews();

  }
}