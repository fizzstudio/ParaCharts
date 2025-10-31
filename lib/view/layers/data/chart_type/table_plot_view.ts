import { DataLayer } from '../data_layer';
import { type ParaView } from '../../../../paraview';
import { type BaseChartInfo } from '../../../../chart_types';
import { Label } from '../../../label';
import { type View } from '../../../base_view';

import { TemplateResult, svg } from 'lit';
import { TableInfo } from '../../../../chart_types/table';

export interface TableOptions {
  numRows: number;
  numCols: number;
}

export class TablePlotView extends DataLayer {
  declare protected _chartInfo: TableInfo;

  protected _table: (View | null)[][];

  constructor(
    paraview: ParaView,
    width: number, height: number,
    dataLayerIndex: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, dataLayerIndex, chartInfo);
    this._table = [];
    this._clear();
  }

  protected _clear() {
    this._table.forEach(row => {
      row.forEach(cell => {
        cell?.remove();
      });
    });
    this._table = [];
    for (let i = 0; i < this._chartInfo.numRows; i++) {
      this._table.push(new Array(this._chartInfo.numCols).fill(null));
    }
  }

  protected _createDatapoints(): void {
    console.log('CREATING TABLE DATAPOINTS');
    this._clear();
    for (let i = 0; i < this._chartInfo.numRows; i++) {
      for (let j = 0; j < this._chartInfo.numCols; j++) {
        this._table[i][j] = new Label(this.paraview, {
          text: this._chartInfo.contents[i][j],
          classList: ['table-cell-label']
        });
      }
    }
    this._layoutTable();
  }

  protected _layoutTable() {
    const cellWidth = this._width/this._chartInfo.numCols;
    const cellHeight = this._height/this._chartInfo.numRows;
    for (let i = 0; i < this._chartInfo.numRows; i++) {
      for (let j = 0; j < this._chartInfo.numCols; j++) {
        const contents = this._table[i][j];
        if (contents) {
          if (this._chartInfo.settings.colAlign === 'start') {
            contents.left = j*cellWidth;
          } else if (this._chartInfo.settings.colAlign === 'center') {
            contents.centerX = j*cellWidth + cellWidth/2;
          } else {
            contents.right = j*cellWidth + cellWidth;
          }

          if (this._chartInfo.settings.rowAlign === 'start') {
            contents.top = i*cellHeight;
          } else if (this._chartInfo.settings.rowAlign === 'center') {
            contents.centerY = i*cellHeight + cellHeight/2;
          } else {
            contents.bottom = i*cellHeight + cellHeight;
          }
          this.append(contents);
        }
      }
    }
  }

  content(..._options: any[]): TemplateResult {
    const cellWidth = this._width/this._chartInfo.numCols;
    const cellHeight = this._height/this._chartInfo.numRows;
    return svg`
      <rect
        x="0"
        y="0"
        width=${cellWidth}
        height=${cellHeight}
        fill="lightgray"
      >
      </rect>
      <rect
        x=${cellWidth}
        y="0"
        width=${cellWidth}
        height=${cellHeight}
        fill="lightgray"
      >
      </rect>
      <rect
        x="0"
        y="0"
        width=${this._width}
        height=${this._height}
        stroke="darkgray"
        fill="none">
      </rect>
      ${this._table.slice(1).map((row, i) => svg`
        <line
          x1="0"
          y1=${(i + 1)*cellHeight}
          x2=${this._width}
          y2=${(i + 1)*cellHeight}
          stroke="darkgray"
        >
        </line>
      `)}
      ${this._table[0].slice(1).map((content, i) => svg`
        <line
          x1=${(i + 1)*cellWidth}
          y1="0"
          x2=${(i + 1)*cellWidth}
          y2=${this._height}
          stroke="darkgray"
        >
        </line>
      `)}
      ${this._chartInfo.navMap?.cursor.isNodeType('tableCell')
        ? svg`
          <rect
            x=${this._chartInfo.navMap!.cursor.options.column*cellWidth}
            y=${this._chartInfo.navMap!.cursor.options.row*cellHeight}
            width=${cellWidth}
            height=${cellHeight}
            stroke="red"
            stroke-width="10"
            fill="none"
          >
          </rect>
        `
        : ''
      }
      ${super.content()}
    `;
  }
}