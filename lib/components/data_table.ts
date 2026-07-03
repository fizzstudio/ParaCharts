
import { ParaComponent } from '.';

import { Logger, getLogger } from '@fizz/logger';
import { PlaneDatapoint, type Model } from '@fizz/paramodel';
import { formatXYDatapointX, formatXYDatapointY } from '@fizz/parasummary';

import { html, css, nothing, render, type PropertyValues } from 'lit';
import { property, state, queryAssignedElements, customElement } from 'lit/decorators.js';
import {type Ref, ref, createRef} from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Unsubscribe } from '@lit-app/state';
import { datapointIdToCursor } from '../state';
import { type ParaChart } from '../parachart/parachart';

interface GridCell {
  datapoint: PlaneDatapoint;
  x: string;
  y: string;
}

interface CellCursor {
  row: number;
  col: number;
}

function cellCursorEq(cursor: CellCursor, other: CellCursor): boolean {
  return cursor.row === other.row && cursor.col === other.col;
}

/**
 * Data table view.
 * @internal
 */
@customElement('para-data-table')
export class DataTable extends ParaComponent {
  paraChart!: ParaChart;
  @property({type: Boolean}) isVisible = false;
  protected _log: Logger = getLogger('DataTable');
  protected _grid!: GridCell[][];
  protected _gridEls: Ref<HTMLElement>[][] = [];
  protected _paraStateChangeUnsub!: Unsubscribe;
	// @state() protected _tabTargetCellCursor: CellCursor = {row: 0, col: 0};

  constructor() {
    super();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._paraStateChangeUnsub = this._paraState.subscribe(async (key, value) => {
      if (key === 'dataState') {
        if (value === 'complete') {
          this._initGrid();
        }
      }
      // await this._documentView?.storeDidChange(key, value);
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._paraStateChangeUnsub();
  }

  protected _initGrid() {
    this._grid = this._paraState.model!.series[0].datapoints.map((dp, i) => {
      this._gridEls[i] = [];
      return this._paraState.model!.series.map((s, j) => {
        this._gridEls[i][j] = createRef();
        return {
          datapoint: s.datapoints[i] as PlaneDatapoint,
          x: formatXYDatapointX(dp as PlaneDatapoint, 'raw'),
          y: formatXYDatapointY(s[i] as PlaneDatapoint, 'value')
        };
      })
    });
  }

  protected _visitedCells(): GridCell[] {
    return Array.from(this._paraState.visitedDatapoints).map(id => {
      const cursor = datapointIdToCursor(id);
      const row = cursor.index;
      const col = this._keyToCol(cursor.seriesKey);
      return this._grid[row][col];
    });
  }

  protected get _numRows() {
    return this._grid.length;
  }

  protected get _numCols() {
    return this._grid[0].length;
  }

  protected _keyToCol(seriesKey: string): number {
    return this._paraState.model!.seriesKeys.indexOf(seriesKey);
  }

  protected _colToKey(col: number): string {
    return this._paraState.model!.seriesKeys[col];
  }

  protected _onKeydown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    const cells = this._visitedCells();
    const row = cells[0].datapoint.datapointIndex;
    const col = this._keyToCol(cells[0].datapoint.seriesKey);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      if ((delta === -1 && col > 0) || (delta === 1 && col < this._numCols - 1)) {
        // this._tabTargetCellCursor = {row, col: col + delta};
        this._paraState.chartInfo.navMap!.root.updateCursor([this._grid[row][col + delta].datapoint]);
        this._gridEls[row][col + delta].value!.focus();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const delta = event.key === 'ArrowUp' ? -1 : 1;
      if ((delta === -1 && row > 0) || (delta === 1 && row < this._numRows - 1)) {
        // this._tabTargetCellCursor = {row: row + delta, col};
        this._paraState.chartInfo.navMap!.root.updateCursor([this._grid[row + delta][col].datapoint]);
        this._gridEls[row + delta][col].value!.focus();
      }
    } else if (event.key === 'Home') {
      const row = cells[0].datapoint.datapointIndex;
      // this._tabTargetCellCursor = {row, col: 0};
      this._paraState.chartInfo.navMap!.root.updateCursor([this._grid[row][0].datapoint]);
      this._gridEls[row][0].value!.focus();
    } else if (event.key === 'End') {
      const row = cells[0].datapoint.datapointIndex;
      // this._tabTargetCellCursor = {row, col: this._numCols - 1};
      this._paraState.chartInfo.navMap!.root.updateCursor([this._grid[row][this._numCols - 1].datapoint]);
      this._gridEls[row][this._numCols - 1].value!.focus();
    } else if (event.key === 'd' || event.key === 'D') {
      this.paraChart.isDataTableVisible = ! this.paraChart.isDataTableVisible;
    } else if (event.key === ' ' || event.key === 'Enter') {
      this._paraState.chartInfo.selectCurrent(event.shiftKey);
    } else if (event.key === 'u' || event.key === 'U') {
      this._paraState.chartInfo.clearDatapointSelection();
    }
  }

  protected _onClick(cell: GridCell, row: number, col: number) {
    this._paraState.visit([cell.datapoint]);
    this._paraState.chartInfo.navMap!.root.updateCursor([cell.datapoint]);
    this._gridEls[row][col].value!.focus();
  }

  static styles = [
    css`
      th, td {
        padding: 0.25rem;
      }
      thead {
        position: sticky;
        top: 0;
        background: var(--theme-color-light);
      }
      .wrapper {
        overflow: scroll;
        max-height: 15rem;
      }
      .visited {
        background: red;
        color: white;
      }
      .selected {
        outline: solid 2px black;
      }
    `
  ];

  protected render() {
    return (this._paraState.model && this._paraState.model.facetKeys.length > 1)
    ? html`
      <div
        class="wrapper"
        tabindex="-1"
        ?hidden=${!this.isVisible}
      >
        <table
          role="grid"
          tabindex="-1"
          @keydown=${(event: KeyboardEvent) => this._onKeydown(event)}
        >
          <thead>
            <tr>
              <th role="columnheader">
                ${this._paraState.model.getFacet(this._paraState.model.independentFacetKeys[0])!.label} <!-- TODO: Assumes exactly 1 indep facet -->
              </th>
              ${this._paraState.model.series.map(s => html`
                <th role="columnheader" scope="col">
                  ${s.label}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${this._grid?.map((row, i) => html`
              <tr>
                <td>
                  ${row[0].x}
                </td>
                ${row.map((cell, j) => {
                  const isVisited = this._paraState.isVisited(cell.datapoint.seriesKey, i);
                  const isSelected = this._paraState.isSelected(cell.datapoint.seriesKey, i);
                  return html`
                    <td
                      ${ref(this._gridEls[i][j])}
                      tabindex=${isVisited ? 0 : -1}
                      aria-selected=${isSelected ? 'true' : nothing}
                      class="${(isVisited ? 'visited' : '') + (isSelected ? ' selected' : '')}"
                      @click=${() => this._onClick(cell, i, j)}
                    >
                      ${cell.y}
                    </td>
                  `;})}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
    : html``;
  }
}

declare global {

  interface HTMLElementTagNameMap {
    'para-data-table': DataTable;
  }

}