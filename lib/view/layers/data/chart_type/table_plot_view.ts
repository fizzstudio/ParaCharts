import { DataLayer } from '../data_layer';
import { type ParaView } from '../../../../paraview';
import { type BaseChartInfo } from '../../../../chart_types';
import { GridLayout } from '../../../layout';
import { Label } from '../../../label';

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
    const model = this.paraview.store.model!;
    // TODO: Assumes exactly 1 indep facet
    const xHeading = model.getFacet(model.independentFacetKeys[0])!.label;
    const xLabel = new Label(this.paraview, {
      text: xHeading
    });
    this._grid.append(xLabel, {
      x: 0,
      y: 0
    });
    model.dependentFacetKeys.forEach((depKey, i) => {
      const yHeading = model.getFacet(depKey)!.label;
      const yLabel = new Label(this.paraview, {
        text: yHeading
      });
      this._grid.append(yLabel, {
        x: i + 1,
        y: 0
      });
    })
    model.series[0].datapoints.forEach((dp, i) => {
      const xValue = dp.facetValue(model.independentFacetKeys[0])!.toLocaleString();
      const xLabel = new Label(this.paraview, {
        text: xValue
      });
      this._grid.append(xLabel, {
        x: 0,
        y: i + 1
      });
      model.series.forEach((s, j) => {
        const yValue = s[i].facetValue(model.dependentFacetKeys[j])!.toLocaleString();
        const yLabel = new Label(this.paraview, {
          text: yValue
        });
        this._grid.append(yLabel, {
          x: j + 1,
          y: i + 1
        });
      });
    });

    this._grid.layoutViews();

  }
}