/* ParaCharts: Grid Layout
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { View, type SnapLocation, type PaddingInput, type Padding } from '../base_view';
import { ParaView } from '../../paraview';
import { Layout } from './layout';
import { Logger, getLogger } from '../../common/logger';
import { nothing, svg, TemplateResult } from 'lit';
import { RectShape } from '../shape/rect';

import { mapn } from '@fizz/chart-classifier-utils';
import { HorizAxis } from '../axis';
import { Label } from '../label';

export interface GridOptionsInput {
  numCols: number;
  rowGaps?: number | number[];
  colGaps?: number | number[];
  rowAligns?: SnapLocation | SnapLocation[];
  colAligns?: SnapLocation | SnapLocation[];
  canWidthFlex?: boolean;
  canHeightFlex?: boolean;
  width?: number;
  height?: number;
  isAutoWidth?: boolean;
  isAutoHeight?: boolean;
}

export interface GridTerritoryInput {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rowAlign?: SnapLocation;
  colAlign?: SnapLocation;
  // margin?: PaddingInput | number;
}

export interface GridTerritory extends GridTerritoryInput {
  x: number;
  y: number;
  width: number;
  height: number;
  // margin: Padding;
}

// interface ChildResizeInfo {
//   viewToResize: Map<View, {width: number, height: number}>;
//   rowShrinkage: Map<number, number>;
//   columnShrinkage: Map<number, number>;
// }

/**
 * Attempt to round a number to the nearest hundredth, whether or not
 * the result has an exact binary representation.
 * @param n
 * @returns
 */
function roundHundredths(n: number): number {
  return Math.round(n*100)/100;
}


/**
 * Grid layout for views.
 */
export class GridLayout extends Layout {

  private _numCols: number;
  private _rowGaps: number[];
  private _colGaps: number[];
  private _rowAligns: SnapLocation[];
  private _colAligns: SnapLocation[];
  private _rows: (View | null)[][] = [];
  private _territories = new Map<View, GridTerritory>();
  private _hRules: number[] = [];
  private _vRules: number[] = [];
  private _isAutoWidth: boolean;
  private _isAutoHeight: boolean;

  constructor(paraview: ParaView, options: GridOptionsInput, id?: string) {
    super(paraview, id);
    this.log = getLogger("GridLayout ");
    this._canWidthFlex = !!options.canWidthFlex;
    this._canHeightFlex = !!options.canHeightFlex;
    this._width = options.width ?? this._width;
    this._height = options.height ?? this._height;
    this._isAutoWidth = !!options.isAutoWidth;
    this._isAutoHeight = !!options.isAutoHeight;
    this._numCols = options.numCols;
    this._rowGaps = options.rowGaps !== undefined
      ? this._expandRowGaps(options.rowGaps)
      : [0];
    this._colGaps = options.colGaps !== undefined
      ? this._expandColGaps(options.colGaps)
      : new Array(this._numCols - 1).fill(0);
    this._rowAligns = options.rowAligns !== undefined
      ? this._expandRowAligns(options.rowAligns)
      : ['center'];
    this._colAligns = options.colAligns !== undefined
      ? this._expandColAligns(options.colAligns)
      : new Array(this._numCols).fill('center');
    this._rows.push(new Array(this._numCols).fill(null));
    this._resetRules();
  }

  get padding(): Padding {
    return super.padding;
  }

  set padding(padding: PaddingInput | number) {
    super.padding = padding;
    this.layoutViews();
  }

  get numRows() {
    return this._rows.length;
  }

  get numCols() {
    return this._numCols;
  }

  get rowGaps() {
    return Array.from(this._rowGaps);
  }

  get colGaps() {
    return Array.from(this._colGaps);
  }

  get rowAligns() {
    return Array.from(this._rowAligns);
  }

  get colAligns() {
    return Array.from(this._colAligns);
  }

  set numCols(numCols: number) {
    this._numCols = numCols;
    this._arrangeChildren();
    this.layoutViews();
  }

  set rowGaps(rowGaps: number | number[]) {
    this._rowGaps = this._expandRowGaps(rowGaps);
    this.setSize(...this.computeSize());
    this.layoutViews();
  }

  get hRules() {
    return this._hRules;
  }

  get vRules() {
    return this._vRules;
  }

  setRowGap(i: number, gap: number) {
    if (i >= this._rowGaps.length) {
      throw new Error(`row gap index '${i}' out of bounds`);
    }
    const oldGap = this._rowGaps[i];
    this._rowGaps[i] = gap;
    const gapHRule = i + 1;

    const shifted = this._hRules.slice(gapHRule + 1).map(hr => hr - (gap - oldGap));
    this._hRules.splice(gapHRule + 1, shifted.length, ...shifted);
    this._hRules[gapHRule] -= gap;
    this._territories.keys().forEach(view => {
      this._adjustViewToRules(view);
    })
    this.layoutViews();
  }

  protected _expandRowGaps(rowGaps: number | number[]) {
    return typeof rowGaps === 'object'
      ? Array.from(rowGaps)
      : [rowGaps];
  }

  set colGaps(colGaps: number | number[]) {
    this._colGaps = this._expandColGaps(colGaps);
    this.setSize(...this.computeSize());
    this.layoutViews();
  }

  setColGap(i: number, gap: number) {
    if (i < 0 || i >= this._colGaps.length) {
      throw new Error(`col gap index '${i}' out of bounds`);
    }
    const oldGap = this._colGaps[i];
    this._colGaps[i] = gap;
    const gapVRule = i + 1; // vrule where the gap fits
    const shifted = this._vRules.slice(gapVRule + 1).map(vr => vr - (gap - oldGap));
    this._vRules.splice(gapVRule + 1, shifted.length, ...shifted);
    this._vRules[gapVRule] -= gap;
    this._territories.keys().forEach(view => {
      this._adjustViewToRules(view);
    })
    this.layoutViews();
  }

  protected _expandColGaps(colGaps: number | number[]) {
    return typeof colGaps === 'object'
      ? Array.from(colGaps)
      : new Array(this._numCols - 1).fill(colGaps);
  }

  set rowAligns(rowAligns: SnapLocation | SnapLocation[]) {
    this._rowAligns = this._expandRowAligns(rowAligns);
    this.layoutViews();
  }

  protected _expandRowAligns(rowAligns: SnapLocation | SnapLocation[]) {
    return typeof rowAligns === 'object'
      ? Array.from(rowAligns)
      : [rowAligns];
  }

  set colAligns(colAligns: SnapLocation | SnapLocation[]) {
    this._colAligns = this._expandColAligns(colAligns);
    this.layoutViews();
  }

  /** Contents of each cell in the given column. */
  col(index: number): (View | null)[] {
    return this._rows.map(row => row[index]);
  }

  protected _expandColAligns(colAligns: SnapLocation | SnapLocation[]) {
    return typeof colAligns === 'object'
      ? Array.from(colAligns)
      : new Array(this._numCols).fill(colAligns);
  }

  // getAvailableSpace(territory: GridTerritory): {width: number, height: number} {
  //   // all cells must be empty
  //   for (let i = territory.x; i < territory.x + territory.width; i++) {
  //     for (let j = territory.y; j < territory.y + territory.height; j++) {
  //       if (this._rows[j][i]) {
  //         throw new Error(`grid row=${j} col=${i} already occupied`);
  //       }
  //     }
  //   }

  // }

  addColumnLeft() {
    this._numCols++;
    this._colGaps.unshift(0);
    this._colAligns.unshift('center');
    this._rows.forEach(row => row.unshift(null));
    this._territories.values().forEach(t => {
      t.x++;
    });
    this._vRules.unshift(0);
  }

  addColumnRight() {
    this._numCols++;
    this._colGaps.push(0);
    this._colAligns.push('center');
    this._rows.forEach(row => row.push(null));
    this._vRules.push(this._vRules.at(-1)!);
  }

  splitColumnRight(idx: number, colGap = 0, colAlign: SnapLocation = 'center') {
    // All views spanning the column that end on the column-right vrule
    const colViews = this.col(idx)
      .filter(view => {
        if (view) {
          const t = this._territories.get(view)!;
          return t.x + t.width === idx + 1;
        }
        return false;
      });

    // Any territory with x > idx gets x++
    this._territories.values().forEach(t => {
      if (t.x > idx) {
        t.x++;
      }
    });
    this._numCols++;
    this._colGaps.splice(idx, 0, colGap);
    this._colAligns.splice(idx + 1, 0, colAlign);
    this._rows.forEach(row => {
      row.splice(idx + 1, 0, null);
    });
    this._vRules.splice(idx + 1, 0, colViews.length
      ? Math.max(...colViews.map(v => v!.paddedRight))
      : this._vRules[idx + 1]);
  }

  addRowTop() {
    this._rowGaps.unshift(0);
    this._rowAligns.unshift('center');
    this._rows.unshift(new Array(this._numCols).fill(null));
    this._territories.values().forEach(t => {
      t.y++;
    });
    this._hRules.unshift(0);
  }

  addRowBottom() {
    this._rowGaps.push(0);
    this._rowAligns.push('center');
    this._rows.push(new Array(this._numCols).fill(null));
    this._hRules.push(this._hRules.at(-1)!);
  }

  splitRowTop(idx: number, rowAlign: SnapLocation = 'center') {
    // all views whose territories start on the row-top hrule
    const rowViews = this._rows[idx]
      .filter(view => {
        if (view) {
          const t = this._territories.get(view)!;
          return t.y === idx;
        }
        return false;
      });
    // Any territory with y >= idx gets y++
    this._territories.values().forEach(t => {
      if (t.y >= idx) {
        t.y++;
      }
    });
    this._rowGaps.splice(idx - 1, 0, 0);
    this._rowAligns.splice(idx, 0, rowAlign);
    this._rows.splice(idx, 0, this._rows[0].map(_ => null));
    this._hRules.splice(idx + 1, 0, rowViews.length
      ? Math.min(...rowViews.map(v => v!.paddedTop))
      : this._hRules[idx]);
  }

  insertRow(index: number, rowGap = 0, rowAlign: SnapLocation = 'center') {
    this._rowGaps.splice(index, 0, rowGap);
    this._rowAligns.splice(index, 0, rowAlign);
    this._rows.splice(index, 0, new Array(this._numCols).fill(null));
    this._territories.values().forEach(t => {
      if (t.y >= index) {
        t.y++;
      }
    });
    this._hRules.splice(index, 0, this._hRules[index] ?? this._hRules.at(-1));
    if (rowGap) {
      for (let i = index + 2; i < this._hRules.length; i++) {
        this._hRules[i] -= rowGap;
      }
    }
  }

  protected _resetRules() {
    this._hRules = [0, this._isAutoHeight
      ? 0
      : (this._height - this._rowGaps.reduce((a, b) => a + b, 0))]; // grid top and bottom borders
    this._vRules = new Array(this._numCols).fill(0);
    this._vRules.push(this._isAutoWidth
      ? 0
      : (this._width - this._colGaps.reduce((a, b) => a + b, 0)));
  }

  protected _defaultMargin(x: number, y: number): Padding {
    return {
      left: this._colGaps[this._leftGapIndex(x)] ?? 0,
      right: this._colGaps[this._rightGapIndex(x)] ?? 0,
      top: this._rowGaps[this._topGapIndex(y)] ?? 0,
      bottom: this._rowGaps[this._bottomGapIndex(y)] ?? 0
    };
  }

  protected _createTerritory(input: GridTerritoryInput): GridTerritory {
    const x = input.x ?? 0;
    const y = input.y ?? 0;
    return {
      x,
      y,
      width: input.width ?? 1,
      height: input.height ?? 1,
      rowAlign: input.rowAlign,
      colAlign: input.colAlign,
      // margin: input.margin !== undefined
      //   ? this._expandPadding(input.margin, this._defaultMargin(x, y))
      //   : this._defaultMargin(x, y)
    };
  }

  protected _claimTerritory(child: View, territoryInput?: GridTerritoryInput) {
    if (this._territories.has(child)) {
      throw new Error('view already present in grid');
    }
    if (territoryInput) {
      this._territories.set(child, this._createTerritory(territoryInput));
    }
  }

  protected _territoryView(territory: GridTerritory): View | undefined {
    return this._territories.keys().find(view => this._territories.get(view) === territory);
  }

  protected _territoryPhysWidth(territory: GridTerritory, includeGaps = true): number {
    return this._vRuleDist(territory.x, territory.x + territory.width, includeGaps);
  }

  protected _territoryPhysHeight(territory: GridTerritory, includeGaps = true): number {
    return this._hRuleDist(territory.y, territory.y + territory.height, includeGaps);
  }

  /** Physical distance between two hRules, possibly inclusive of gaps */
  protected _hRuleDist(a: number, b: number, includeGaps = true): number {
    //const startGap = this._rowGaps[a - 1] ?? 0;
    return this._hRules[b] - (this._hRules[a] /*+ startGap*/)
      + (includeGaps ? this._rowGaps.slice(a, b).reduce((c, d) => c + d, 0) : 0);
  }

  /** Physical distance between two vRules, possibly inclusive of gaps */
  protected _vRuleDist(a: number, b: number, includeGaps = true): number {
    //const startGap = this._colGaps[a - 1] ?? 0;
    return this._vRules[b] - (this._vRules[a] /*+ startGap*/)
      + (includeGaps ? this._colGaps.slice(a, b).reduce((c, d) => c + d, 0) : 0);
  }

  /**
   * View's unused horizontal space in its territory
   */
  protected _viewAvailWidth(view: View): number {
    return this._territoryPhysWidth(this._territories.get(view)!, false) - view.paddedWidth;
  }

  /**
   * View's unused vertical space in its territory
   */
  protected _viewAvailHeight(view: View): number {
    return this._territoryPhysHeight(this._territories.get(view)!, false) - view.paddedHeight;
  }

  protected _territoryBbox(territory: GridTerritory): DOMRect {
    let colLeft = this.left; // + this._padding.left;
    const colWidths = this._vRules.slice(1).map((vr, i) => vr - this._vRules[i]);
    const colGaps = this._colGaps;
    for (let i = 0; i < territory.x; i++) {
      colLeft += colWidths[i] + colGaps[i];
    }
    const spanWidth =
      colWidths
        .slice(territory.x, territory.x + territory.width)
        .reduce((a, b) => a + b, 0) +
      colGaps
        .slice(territory.x, territory.x + territory.width - 1)
        .reduce((a, b) => a + b, 0);
    const right = colLeft + spanWidth;

    let rowTop = this.top; // + this._padding.top;
    const rowHeights = this._hRules.slice(1).map((hr, i) => hr - this._hRules[i]);
    const rowGaps = this._rowGaps;
    for (let i = 0; i < territory.y; i++) {
      rowTop += rowHeights[i] + rowGaps[i];
    }
    const spanHeight =
      rowHeights
        .slice(territory.y, territory.y + territory.height)
        .reduce((a, b) => a + b, 0) +
      rowGaps
        .slice(territory.y, territory.y + territory.height - 1)
        .reduce((a, b) => a + b, 0);
    const bottom = rowTop + spanHeight;
    return new DOMRect(colLeft, rowTop, right - colLeft, bottom - rowTop);
  }

  append(child: View, territory?: GridTerritoryInput) {
    this._claimTerritory(child, territory);
    super.append(child);
  }

  prepend(child: View, territory?: GridTerritoryInput) {
    this._claimTerritory(child, territory);
    super.prepend(child);
  }

  insert(child: View, i: number, territory?: GridTerritoryInput) {
    this._claimTerritory(child, territory);
    super.insert(child, i);
  }

  protected _didAddChild(kid: View) {
    this._arrangeChild(kid);
    this._adjustRules(kid);
    // this._adjustGaps(kid);
    if (this._isAutoWidth || this._isAutoHeight) {
      this.updateSize();
    }
    this.layoutViews();
    super._didAddChild(kid);
  }

  protected _didRemoveChild(kid: View): void {
    this._rows = this._rows.map(row =>
      row.map(v => v === kid ? null : v));
    this._territories.delete(kid);
    this._contractRules();
    // this._updateGaps();
    super._didRemoveChild(kid);
  }

  protected _firstEmptyCell() {
    for (let i = 0; i < this._rows.length; i++) {
      const row = this._rows[i];
      for (let j = 0; j < row.length; j++) {
        if (!row[j]) {
          return [i, j];
        }
      }
    }
    return [this._rows.length, 0];
  }

  protected _arrangeChild(kid: View) {
    const territory = this._territories.get(kid);
    let rows: number[] = [];
    let cols: number[] = [];
    if (territory) {
      if (territory.x < 0) {
        territory.x = this._numCols + territory.x;
      }
      if (territory.y < 0) {
        territory.y = this._rows.length + territory.y;
      }
      rows = mapn(territory.height, n => territory.y + n);
      cols = mapn(territory.width, n => territory.x + n);
    } else {
      const [row, col] = this._firstEmptyCell();
      rows = [row];
      cols = [col];
      this._territories.set(kid, {
        x: col,
        y: row,
        width: 1,
        height: 1,
        // margin: this._defaultMargin(col, row)
      });
    }
    // Ensure the grid isn't missing any rows
    rows.filter(i => i > this._rows.length - 1).forEach(_ => {
      this._rows.push(mapn(this._numCols, _n => null));
      this._rowGaps.push(0);
      this._hRules.push(this._hRules.at(-1)!);
    });
    rows.forEach(row =>
      cols.forEach(col => {
        if (this._rows[row][col]) {
          throw new Error('grid children cannot overlap');
        }
        this._rows[row][col] = kid;
      })
    );
  }

  colWidth(col: number): number {
    if (col > this._rows[0].length - 1) {
      throw new Error(`col index '${col}' out of bounds`);
    }
    return this._vRuleDist(col, col + 1, false);
  }

  rowHeight(row: number): number {
    if (row > this._rows.length - 1) {
      throw new Error(`row index '${row}' out of bounds`);
    }
    return this._hRuleDist(row, row + 1, false);
  }

  /** Whether a row can expand vertically. */
  protected _rowCanGrow(row: number): boolean {
    const rowHeight = this.rowHeight(row);
    if (!rowHeight) {
      return false;
    }
    // Row is non-empty
    return this._rows[row].every(item => !item || item.canWidthFlex);
  }

  /**
   * How much a row can shrink vertically;
   * max value is the current row height
   */
  protected _rowShrinkability(row: number): number {
    const rowHeight = this.rowHeight(row);
    if (!rowHeight) {
      return 0;
    }
    // views that start on row top hrule or end on row bottom hrule
    const rowViews = this._rows[row]
      .filter(view => {
        if (view) {
          const t = this._territories.get(view)!;
          return t.y === row || t.y + t.height === row + 1;
        }
      }
    ) as View[];
    if (!rowViews.length) {
      return rowHeight;
    }
    const viewFlexVals = rowViews.map(view => view.canHeightFlex
      ? rowHeight
      // A non-shrinking view with grid height > 1 cell may have more
      // available space than rowHeight
      : Math.min(rowHeight, this._viewAvailHeight(view)));
    return roundHundredths(Math.min(...viewFlexVals));
    // const canShrink = rowViews.filter(view => view.isHeightCanShrink);
    // const cantShrink = rowViews.filter(view => !view.isHeightCanShrink);
    // if (canShrink.length === 0) {
    //   return 0;
    // } else if (cantShrink.length === 0) {
    //   return Math.max(...canShrink.map(view => view.paddedHeight));
    // } else {
    //   const rowCanFlex = Math.max(...canShrink.map(view => view.paddedHeight));
    //   const rowCantFlex = Math.max(...cantShrink.map(view => view.paddedHeight));
    //   return Math.max(0, rowCanFlex - rowCantFlex);
    // }
  }

  /** Whether a column can expand horizontally. */
  protected _columnCanGrow(col: number): boolean {
    const colWidth = this.colWidth(col);
    if (!colWidth) {
      return false;
    }
    // Column is non-empty
    return this.col(col).every(item => !item || item.canWidthFlex);
  }

  /**
   * How much a column can shrink horizontally;
   * max value is the current column width
   */
  protected _columnShrinkability(col: number): number {
    const colWidth = this.colWidth(col);
    if (!colWidth) {
      return 0;
    }
    // views that start on column left vrule or end on column right vrule
    const colViews = this._rows.map(row => row[col])
      .filter(view => {
        if (view) {
          const t = this._territories.get(view)!;
          return t.x === col || t.x + t.width === col + 1;
        }
      }
    ) as View[];
    if (colViews.length === 0) {
      return colWidth;
    }
    return roundHundredths(Math.min(...colViews.map(view => view.canWidthFlex
      ? colWidth
      // A non-shrinking view with grid width > 1 cell may have more
      // available space than colWidth
      : Math.min(colWidth, this._viewAvailWidth(view)))));
  }

  // protected _hRuleUpFlexibility(hRule: number): number {
  //   // views that end on hRule
  //   const prevRowViews = this._rows[hRule - 1]
  //     .filter(view => {
  //       if (view) {
  //         const t = this._territories.get(view)!;
  //         return t.y + t.height === hRule;
  //       }
  //     }
  //   ) as View[];
  //   if (prevRowViews.length) {
  //     const canShrink = prevRowViews.filter(view => view.isHeightCanShrink);
  //     const cantShrink = prevRowViews.filter(view => !view.isHeightCanShrink);
  //     if (canShrink.length === 0) {
  //       if (hRule > 1) {
  //         return this._hRuleUpFlexibility(hRule - 1);
  //       } else {
  //         return 0;
  //       }
  //     } else if (cantShrink.length === 0) {
  //       const rowFlex = Math.max(...canShrink.map(view => view.paddedHeight));
  //       if (hRule > 1) {
  //         return rowFlex + this._hRuleUpFlexibility(hRule - 1);
  //       } else {
  //         return rowFlex;
  //       }
  //     } else {
  //       const rowCanFlex = Math.max(...canShrink.map(view => view.paddedHeight));
  //       const rowCantFlex = Math.max(...cantShrink.map(view => view.paddedHeight));
  //       const rowFlex = Math.max(0, rowCanFlex - rowCantFlex);
  //       if (hRule > 1) {
  //         return rowFlex + this._hRuleUpFlexibility(hRule - 1);
  //       } else {
  //         return rowFlex;
  //       }
  //     }
  //   } else if (hRule > 1) {
  //     return this._hRuleUpFlexibility(hRule - 1);
  //   } else {
  //     return 0;
  //   }
  // }

  // canChildResize(kid: View, newWidth: number, newHeight: number): boolean {
  //   const territory = this._territories.get(kid)!;
  //   const hRuleStart = territory.y;
  //   const hRuleEnd = hRuleStart + territory.height;
  //   const vRuleStart = territory.x;
  //   const vRuleEnd = vRuleStart + territory.width;

  //   let rowShrinkage = new Map<number, number>();
  //   let columnShrinkage = new Map<number, number>();
  //   let kidWidthShrink = 0;
  //   let kidHeightShrink = 0;
  //   if (!this._canWidthFlex) {
  //     const territoryPhysWidth = this._territoryPhysWidth(territory);
  //     this.log.info('TPW', territoryPhysWidth, this._hRules, this._vRules);
  //     const widthDiff = kid.paddedWidth - territoryPhysWidth;
  //     this.log.info('WIDTH DIFF', widthDiff);
  //     if (widthDiff > 0) {
  //       let otherCols = this._rows[0].map((_, i) => i).filter(i =>
  //         i < territory.x || i >= territory.x + territory.width);
  //       let availShrink = otherCols.map(i => this._columnShrinkability(i));
  //       otherCols = otherCols.filter((_rowIdx, i) => availShrink[i]);
  //       availShrink = availShrink.filter(avail => avail).map(avail => avail);
  //       this.log.info('AVAIL COL SHRINK', otherCols, availShrink);
  //       // NB: otherCols may be empty
  //       const availShrinkSum = availShrink.reduce((a, b) => a + b, 0);
  //       if (availShrinkSum < widthDiff) {
  //         // we can shrink as much as possible, but kid must be able to shrink
  //         // XXX any view resizing should be queued and performed after all new sizes
  //         // are determined, in case a view needs to resize in both width and height
  //         if (availShrinkSum) {
  //           columnShrinkage = this._apportionShrinkage(
  //             availShrinkSum, availShrinkSum,
  //             availShrink, otherCols);
  //         }
  //         kidWidthShrink = widthDiff - availShrinkSum;
  //         this.log.info('KIDWIDTHSHRINK', kidWidthShrink, columnShrinkage);
  //       } else {
  //         // apportion space among shrinkable columns
  //         columnShrinkage = this._apportionShrinkage(
  //           widthDiff, availShrinkSum,
  //           availShrink, otherCols);
  //         this.log.info('COL SHRINK', columnShrinkage);
  //       }
  //     }
  //   } else {
  //     // All territories spanning the previous column that end on vRuleEnd
  //     const prevColTerritories = this._rows
  //       .map(row => row[vRuleEnd - 1])
  //       .filter(view => view)
  //       .map(view => this._territories.get(view!)!)
  //       .filter(t => t.x + t.width === vRuleEnd);
  //     const territoryDiffs = prevColTerritories.map(t => {
  //       const vRuleStart = t.x;
  //       const vRuleEnd = vRuleStart + t.width;
  //       const vDiff = this._vRules[vRuleEnd] - this._vRules[vRuleStart];
  //       const tView = this._rows[t.y][t.x];
  //       return tView!.paddedWidth - vDiff;
  //     });
  //     const vShift = Math.max(...territoryDiffs);
  //     if (vShift) {
  //       this._vRules[vRuleEnd] += vShift;
  //       this._vRules.slice(vRuleEnd + 1).forEach((vRule, i) => {
  //         this._vRules[vRuleEnd + 1 + i] += vShift;
  //       });
  //     }
  //   }

  //   if (!this._canHeightFlex) {
  //     const territoryPhysHeight = this._territoryPhysHeight(territory);
  //     this.log.info('TPH', territoryPhysHeight, kid.paddedHeight);
  //     const heightDiff = kid.paddedHeight - territoryPhysHeight;
  //     this.log.info('HEIGHT DIFF', heightDiff);
  //     if (heightDiff > 0) {
  //       let otherRows = this._rows.map((_, i) => i).filter(i =>
  //         i < territory.y || i >= territory.y + territory.height);
  //       this.log.info('OTHER ROWS', otherRows);
  //       let availShrink = otherRows.map(i => this._rowShrinkability(i));
  //       this.log.info('AVAIL SHRINK', availShrink);
  //       otherRows = otherRows.filter((_rowIdx, i) => availShrink[i]);
  //       availShrink = availShrink.filter(avail => avail).map(avail => avail);
  //       const availShrinkSum = availShrink.reduce((a, b) => a + b, 0);
  //       if (availShrinkSum < heightDiff) {
  //         if (availShrinkSum) {
  //           rowShrinkage = this._apportionShrinkage(
  //             availShrinkSum, availShrinkSum,
  //             availShrink, otherRows);
  //         }
  //         kidHeightShrink = heightDiff - availShrinkSum;
  //       } else {
  //         rowShrinkage = this._apportionShrinkage(
  //           heightDiff, availShrinkSum,
  //           availShrink, otherRows);
  //         this.log.info('ROW SHRINK', rowShrinkage);
  //       }
  //     }
  //   } else {
  //     // views in bottom-most row of territory that end on hRuleEnd
  //     const prevRowTerritories = this._rows[hRuleEnd - 1]
  //       .filter(view => view)
  //       .map(view => this._territories.get(view!)!)
  //       .filter(t => t.y + t.height === hRuleEnd);
  //     const rowTerritoryDiffs = prevRowTerritories.map(t => {
  //       const hRuleStart = t.y;
  //       const hRuleEnd = hRuleStart + t.height;
  //       const hDiff = this._hRules[hRuleEnd] - this._hRules[hRuleStart];
  //       const tView = this._rows[t.y][t.x];
  //       // XXX not all views here will necessarily start at hRuleStart!
  //       return tView!.paddedHeight - hDiff;
  //     });
  //     const hShift = Math.max(...rowTerritoryDiffs);
  //     if (hShift) {
  //       this._hRules[hRuleEnd] += hShift;
  //       this._hRules.slice(hRuleEnd + 1).forEach((hRule, i) => {
  //         this._hRules[hRuleEnd + 1 + i] += hShift;
  //       });
  //     }
  //   }

  //   const toResize = new Map<View, {width: number, height: number}>();
  //   if (rowShrinkage.size) {
  //     this.log.info('ROWS WILL SHRINK');
  //     rowShrinkage.entries().forEach(([idx, shrink]) => {
  //       this._rows[idx].forEach(view => {
  //         if (view) {
  //           toResize.set(view, {width: view.width, height: view.height - shrink});
  //         }
  //       });
  //     });
  //     this.log.info('TO RESIZE', toResize);
  //     const rowsAbove = new Map(rowShrinkage.entries().filter(([idx, shrink]) =>
  //       idx < territory.y));
  //     const rowsBelow = new Map(rowShrinkage.entries().filter(([idx, shrink]) =>
  //       idx >= territory.y + territory.height));
  //     this.log.info('ROWS ABOVE', rowsAbove, rowsBelow);
  //     this.log.info('HRULES BEFORE', [...this._hRules]);
  //     // Move hrules above territory up
  //     rowsAbove.forEach((shrink, idx) => {
  //       this._hRules.splice(idx + 1, rowsAbove.size,
  //         ...this._hRules.slice(idx + 1, idx + 1 + rowsAbove.size).map(hr => hr - shrink));
  //     });
  //     // Move hrules below territory down
  //     rowsBelow.forEach((shrink, idx) => {
  //       this._hRules.splice(idx, rowsBelow.size,
  //         ...this._hRules.slice(idx).map(hr => hr + shrink));
  //     });
  //     this.log.info('HRULES', this._hRules);
  //   }
  //   if (columnShrinkage.size) {
  //     this.log.info('COLS WILL SHRINK');
  //     columnShrinkage.entries().forEach(([idx, shrink]) => {
  //       this._rows.map(row => row[idx]).forEach(view => {
  //         if (view) {
  //           toResize.set(view, {width: view.width - shrink, height: view.height});
  //         }
  //       });
  //     });
  //     this.log.info('TO RESIZE', toResize);
  //     const colsLeft = columnShrinkage.entries().filter(([idx, shrink]) =>
  //       idx < territory.x).toArray();
  //     const colsRight = columnShrinkage.entries().filter(([idx, shrink]) =>
  //       idx >= territory.x + territory.width).toArray().toReversed();
  //     this.log.info('VRULES BEFORE', [...this._vRules]);
  //     // Move vrules at territory left
  //     colsLeft.forEach(([idx, shrink]) => {
  //       this._vRules.splice(idx + 1, territory.x - (idx + 1),
  //         ...this._vRules.slice(idx + 1, territory.x).map(vr => vr - shrink));
  //     });
  //     // Move vrules at territory right
  //     colsRight.forEach(([idx, shrink]) => {
  //       const start = territory.x + territory.width;
  //       this._vRules.splice(start, idx + 1 - start,
  //         ...this._vRules.slice(start, idx + 1).map(vr => vr + shrink)
  //       );
  //     });
  //     this.log.info('VRULES', this._vRules);
  //   }
  //   toResize.forEach((newSize, view) => {
  //     // Set the size without notifying the parent of the size change
  //     this.log.info('RESIZING VIEWS', [...this._hRules]);
  //     // view.constrainSize(newSize.width, newSize.height);
  //     view.setSize(newSize.width, newSize.height, false);
  //     .log('RESIZING VIEWS COMPLETE', [...this._hRules]);
  //   });
  //   if (kidWidthShrink || kidHeightShrink) {
  //     this.log.info('KID CONSTRAIN', kid.width - kidWidthShrink, kid.height - kidHeightShrink);
  //     // kid.constrainSize(kid.width - kidWidthShrink, kid.height - kidHeightShrink);
  //     kid.setSize(kid.width - kidWidthShrink, kid.height - kidHeightShrink, false);
  //   }
  //   // XXX Don't forget to resize any other views in the kid's territory's row(s)/col(s),
  //   // if necessary
  // }

  protected _adjustRules(kid: View) {
    const territory = this._territories.get(kid)!;
    const hRuleStart = territory.y;
    const hRuleEnd = hRuleStart + territory.height;
    const vRuleStart = territory.x;
    const vRuleEnd = vRuleStart + territory.width;

    let rowShrinkage = new Map<number, number>();
    let columnShrinkage = new Map<number, number>();
    let kidWidthShrink = 0;
    let kidHeightShrink = 0;
    if (this._isAutoWidth) {
      // Diff between kid width and the width of its territory
      const territoryDiff = kid.paddedWidth - this._territoryPhysWidth(territory);
      if (territoryDiff > 0) {
        this._vRules[vRuleEnd] += territoryDiff;
        this._vRules.slice(vRuleEnd + 1).forEach((vRule, i) => {
          this._vRules[vRuleEnd + 1 + i] += territoryDiff;
        });
      }
    } else {
      const territoryPhysWidth = this._territoryPhysWidth(territory, false);
      const widthDiff = kid.paddedWidth - territoryPhysWidth;
      if (widthDiff > 0) {
        let otherCols = this._rows[0].map((_, i) => i).filter(i =>
          i < territory.x || i >= territory.x + territory.width);
        let availShrink = otherCols.map(i => this._columnShrinkability(i));
        otherCols = otherCols.filter((_rowIdx, i) => availShrink[i]);
        availShrink = availShrink.filter(avail => avail).map(avail => avail);
        // NB: otherCols may be empty
        const availShrinkSum = availShrink.reduce((a, b) => a + b, 0);
        if (availShrinkSum < widthDiff) {
          // we can shrink as much as possible, but kid must be able to shrink
          // XXX any view resizing should be queued and performed after all new sizes
          // are determined, in case a view needs to resize in both width and height
          if (availShrinkSum) {
            columnShrinkage = this._apportionShrinkage(
              availShrinkSum, availShrinkSum,
              availShrink, otherCols);
          }
          kidWidthShrink = widthDiff - availShrinkSum;
        } else {
          // apportion space among shrinkable columns
          columnShrinkage = this._apportionShrinkage(
            widthDiff, availShrinkSum,
            availShrink, otherCols);
        }
      }
    }

    if (this._isAutoHeight) {
      // views in bottom-most row of territory that end on hRuleEnd
      const prevRowTerritories = this._rows[hRuleEnd - 1]
        .filter(view => view)
        .map(view => this._territories.get(view!)!)
        .filter(t => t.y + t.height === hRuleEnd);
      const rowTerritoryDiffs = prevRowTerritories.map(t => {
        const hRuleStart = t.y;
        const hRuleEnd = hRuleStart + t.height;
        const hDiff = this._hRules[hRuleEnd] - this._hRules[hRuleStart];
        const tView = this._rows[t.y][t.x];
        // XXX not all views here will necessarily start at hRuleStart!
        return tView!.paddedHeight - hDiff;
      });
      const hShift = Math.max(...rowTerritoryDiffs);
      if (hShift) {
        this._hRules[hRuleEnd] += hShift;
        this._hRules.slice(hRuleEnd + 1).forEach((hRule, i) => {
          this._hRules[hRuleEnd + 1 + i] += hShift;
        });
      }
    } else {
      const territoryPhysHeight = this._territoryPhysHeight(territory, false);
      const heightDiff = kid.paddedHeight - territoryPhysHeight;
      if (heightDiff > 0) {
        let otherRows = this._rows.map((_, i) => i).filter(i =>
          i < territory.y || i >= territory.y + territory.height);
        // shrinkability for each row in `otherRows`
        let availShrink = otherRows.map(i => this._rowShrinkability(i));
        otherRows = otherRows.filter((_rowIdx, i) => availShrink[i]);
        availShrink = availShrink.filter(avail => avail);
        const availShrinkSum = availShrink.reduce((a, b) => a + b, 0);
        if (availShrinkSum < heightDiff) {
          if (availShrinkSum) {
            rowShrinkage = this._apportionShrinkage(
              availShrinkSum, availShrinkSum,
              availShrink, otherRows);
          }
          kidHeightShrink = heightDiff - availShrinkSum;
        } else {
          rowShrinkage = this._apportionShrinkage(
            heightDiff, availShrinkSum,
            availShrink, otherRows);
        }
      }
    }

    const toResize = new Map<View, {width: number, height: number}>();
    if (rowShrinkage.size) {
      rowShrinkage.entries().forEach(([idx, shrink]) => {
        this._rows[idx].forEach(view => {
          if (view) {
            toResize.set(view, {width: view.width, height: view.height - shrink});
          }
        });
      });
      const rowsAbove = new Map(rowShrinkage.entries().filter(([idx, shrink]) =>
        idx < territory.y));
      const rowsBelow = new Map(rowShrinkage.entries().filter(([idx, shrink]) =>
        idx >= territory.y + territory.height));
      // Move hrules above territory up
      rowsAbove.forEach((shrink, idx) => {
        this._hRules.splice(idx + 1, rowsAbove.size,
          ...this._hRules.slice(idx + 1, idx + 1 + rowsAbove.size).map(hr => hr - shrink));
      });
      // Move hrules below territory down
      rowsBelow.entries().forEach(([idx, shrink]) => {
        this._hRules[idx] += shrink;
      });
      // rowsBelow.forEach((shrink, idx) => {
      //   this._hRules.splice(idx, rowsBelow.size,
      //     ...this._hRules.slice(idx).map(hr => hr + shrink));
      // });
    }
    if (columnShrinkage.size) {
      columnShrinkage.entries().forEach(([idx, shrink]) => {
        this._rows.map(row => row[idx]).forEach(view => {
          if (view) {
            toResize.set(view, {width: view.width - shrink, height: view.height});
          }
        });
      });
      const colsLeft = columnShrinkage.entries().filter(([idx, shrink]) =>
        idx < territory.x).toArray();
      const colsRight = columnShrinkage.entries().filter(([idx, shrink]) =>
        idx >= territory.x + territory.width).toArray().toReversed();
      // Move vrules at territory left
      colsLeft.forEach(([idx, shrink]) => {
        const shrunk = this._vRules.slice(idx + 1, territory.x + 1).map(vr => vr - shrink);
        this._vRules.splice(idx + 1, shrunk.length, ...shrunk);
      });
      // Move vrules at territory right
      colsRight.forEach(([idx, shrink]) => {
        const start = territory.x + territory.width;
        this._vRules.splice(start, idx + 1 - start,
          ...this._vRules.slice(start, idx + 1).map(vr => vr + shrink)
        );
      });
    }
    toResize.forEach((newSize, view) => {
      // Set the size without notifying the parent of the size change
      // view.constrainSize(newSize.width, newSize.height);
      view.resize(newSize.width, newSize.height);
    });
    if (kidWidthShrink || kidHeightShrink) {
      // kid.constrainSize(kid.width - kidWidthShrink, kid.height - kidHeightShrink);
      kid.resize(kid.width - kidWidthShrink, kid.height - kidHeightShrink);
    }
    // XXX Don't forget to resize any other views in the kid's territory's row(s)/col(s),
    // if necessary
  }

  protected _adjustViewToRules(view: View) {
    const territory = this._territories.get(view)!;
    let viewWidthShrink = 0;
    let viewHeightShrink = 0;
    const territoryPhysWidth = this._territoryPhysWidth(territory, false);
    const widthDiff = view.paddedWidth - territoryPhysWidth;
    if (widthDiff > 0) {
      viewWidthShrink = widthDiff;
    }
    const territoryPhysHeight = this._territoryPhysHeight(territory, false);
    const heightDiff = view.paddedHeight - territoryPhysHeight;
    if (heightDiff > 0) {
      viewHeightShrink = heightDiff;
    }
    if (viewWidthShrink || viewHeightShrink) {
      view.resize(view.width - viewWidthShrink, view.height - viewHeightShrink);
    }
  }

  /**
   * Apportion shrinkage of rows or columns
   * @param toApportion - Total amount of shrinkage to apportion
   * @param availShrinkSum - Total shrinkage available in rows/columns
   * @param availShrink - Amount of shrinkage available in each row/column
   * @param indices - Row/column indices
   * @returns Map of row/column index to amount of shrinkage
   */
  protected _apportionShrinkage(
    toApportion: number, availShrinkSum: number,
    availShrink: number[], indices: number[]
  ): Map<number, number> {
    const shrinkage = new Map<number, number>();
    const apportionPct = toApportion/availShrinkSum;
    indices.forEach((idx, i) => {
      shrinkage.set(idx, availShrink[i]*apportionPct);
    });
    return shrinkage;
  }

  // protected _apportionColumnShrinkage(
  //   toApportion: number, availShrinkSum: number,
  //   availShrink: number[], cols: number[]
  // ): Map<number, number> {
  //   const shrinkage = new Map<number, number>();
  //   const apportionPct = toApportion/availShrinkSum;
  //   cols.forEach((colIdx, i) => {
  //     shrinkage.set(colIdx, availShrink[i]*apportionPct);
  //   });
  //   return shrinkage;
  // }

  protected _contractRules() {
    this._rows.forEach((row, i) => {
      if (row.every(v => v === null)) {
        const diff = this._hRules[i + 1] - this._hRules[i];
        this._hRules.splice(i + 1, this._hRules.length - (i + 1),
          ...this._hRules.slice(i + 1).map(r => r - diff));
      }
    });
    const cols: typeof this._rows = [];
    this._rows.forEach((row, i) => {
      row.forEach((v, j) => {
        if (!cols[j]) {
          cols[j] = [];
        }
        cols[j][i] = v;
      });
    });
    cols.forEach((col, i) => {
      if (col.every(v => v === null)) {
        const diff = this._vRules[i + 1] - this._vRules[i];
        this._vRules.splice(i + 1, this._vRules.length - (i + 1),
          ...this._vRules.slice(i + 1).map(r => r - diff));
      }
    });
  }

  // protected _computeColGap(index: number) {
  //   if (index < 0 || index > this._colGaps.length - 1) {
  //     return 0;
  //   }
  //   const leftViewMargins = this._rows
  //     .flatMap(row => row.filter((v, i) => v && (i === index)) as View[])
  //     .map(v => this._territories.get(v)!.margin.right);
  //   const rightViewMargins = this._rows
  //     .flatMap(row => row.filter((v, i) => v && (i === index + 1)) as View[])
  //     .map(v => this._territories.get(v)!.margin.left);
  //   const margins = leftViewMargins.concat(rightViewMargins);
  //   return margins.length ? Math.max(...margins) : 0;
  // }

  // protected _computeRowGap(index: number) {
  //   if (index < 0 || index > this._rowGaps.length - 1) {
  //     return 0;
  //   }
  //   const topViewMargins = ((this._rows[index]
  //     ?.filter(v => v) ?? []) as View[])
  //     .map(v => {
  //       return this._territories.get(v)!.margin.bottom;
  //     });
  //   const bottomViewMargins = ((this._rows[index + 1]
  //     ?.filter(v => v) ?? []) as View[])
  //     .map(v => this._territories.get(v)!.margin.top);
  //   const margins = topViewMargins.concat(bottomViewMargins);
  //   return margins.length ? Math.max(...margins) : 0;
  // }

  protected _leftGapIndex(x: number) {
    // NB: Returns -1 if x === 0
    return x - 1;
  }

  protected _rightGapIndex(x: number) {
    // NB: Returns this._colGaps.length (out of bounds)
    // if x === the rightmost column
    return x;
  }

  protected _topGapIndex(y: number) {
    // NB: Returns -1 if y === 0
    return y - 1;
  }

  protected _bottomGapIndex(y: number) {
    // NB: Returns this._rowGaps.length (out of bounds)
    // if y === the bottommost row
    return y;
  }

  // protected _adjustGaps(kid: View) {
  //   const territory = this._territories.get(kid)!;
  //   const leftIndex = this._leftGapIndex(territory.x);
  //   if (leftIndex >= 0) {
  //     this._colGaps[leftIndex] = this._computeColGap(leftIndex);
  //   }
  //   const rightIndex = this._rightGapIndex(territory.x);
  //   if (rightIndex < this._colGaps.length) {
  //     this._colGaps[rightIndex] = this._computeColGap(rightIndex);
  //   }
  //   const topIndex = this._topGapIndex(territory.y);
  //   if (topIndex >= 0) {
  //     this._rowGaps[topIndex] = this._computeRowGap(topIndex);
  //   }
  //   const bottomIndex = this._bottomGapIndex(territory.y);
  //   if (bottomIndex < this._rowGaps.length) {
  //     this._rowGaps[bottomIndex] = this._computeRowGap(bottomIndex);
  //   }
  // }

  // protected _updateGaps() {
  //   for (const index of this._colGaps) {
  //     this._colGaps[index] = this._computeColGap(index);
  //   }
  //   for (const index of this._rowGaps) {
  //     this._rowGaps[index] = this._computeRowGap(index);
  //   }
  // }

  protected _arrangeChildren() {
    this._rows = [];
    this._territories.clear();
    this._resetRules();
    this._children.forEach(kid => {
      this._arrangeChild(kid);
      this._adjustRules(kid);
    });
    this.setSize(...this.computeSize());
  }

  protected _childDidResize(kid: View) {
    this._adjustRules(kid);
    super._childDidResize(kid);
  }

  computeSize(): [number, number] {
    const colGapSum = this._colGaps.reduce((a, b) => a + b, 0);
    const rowGapSum = this._rowGaps.reduce((a, b) => a + b, 0);
    return [
      this._vRules.at(-1)! + colGapSum,
      this._hRules.at(-1)! + rowGapSum
    ];
  }

  protected _adjustToSizeConstraint() {

  }

  resize(width: number, height: number) {
    const toResize = new Map<View, {width: number, height: number}>();

    if (this._width !== width) {
      const indices = mapn(this.numCols, i => i);
      if (this._width > width) {
        const colShrinkability = indices.map(i => this._columnShrinkability(i));
        const apportioned = this._apportionShrinkage(
          this._width - width,
          colShrinkability.reduce((a, b) => a + b, 0),
          colShrinkability, indices);
        indices.forEach(i => {
          this._vRules[i + 1] -= apportioned.get(i)!;
          indices.slice(i + 1).forEach(j => {
            this._vRules[j + 1] -= apportioned.get(i)!;
          });
        });

        apportioned.entries().forEach(([idx, shrink]) => {
          this._rows.map(row => row[idx]).forEach(view => {
            if (view && shrink && view.canWidthFlex) {
              toResize.set(view, {width: view.width - shrink, height: view.height});
            }
          });
        });
      } else if (this._width < width) {
        const colGrowability = indices.map(i => this._columnCanGrow(i));
        const numGrowers = colGrowability.reduce((a, b) => (a ? 1 : 0) + (b ? 1 : 0), 0);
        const apportioned = colGrowability.map(canGrow => canGrow
          ? (width - this._width)/numGrowers
          : 0);
        indices.forEach(i => {
          this._vRules[i + 1] += apportioned[i];
          indices.slice(i + 1).forEach(j => {
            this._vRules[j + 1] += apportioned[i];
          });
        });

        apportioned.forEach((grow, idx) => {
          this._rows.map(row => row[idx]).forEach(view => {
            if (view && grow) {
              toResize.set(view, {width: view.width + grow, height: view.height});
            }
          });
        });
      }
      this._width = width;
    }

    if (this._height > height) {
      const indices = mapn(this.numRows, i => i);
      const shrinkability = indices.map(i => this._rowShrinkability(i));
      const apportioned = this._apportionShrinkage(
        this._height - height,
        shrinkability.reduce((a, b) => a + b, 0),
        shrinkability, indices);
      indices.forEach(i => {
        this._hRules[i + 1] -= apportioned.get(i)!;
        indices.slice(i + 1).forEach(j => {
          this._hRules[j + 1] -= apportioned.get(i)!;
        });
      });

      apportioned.entries().forEach(([idx, shrink]) => {
        this._rows[idx].forEach(view => {
          if (view && shrink && view.canHeightFlex) {
            toResize.set(view, {width: view.width, height: view.height - shrink});
          }
        });
      });
      this._height = height;
    } else if (this._height < height) {
      const indices = mapn(this.numRows, i => i);
      const growability = indices.map(i => this._rowCanGrow(i));
      const numGrowers = growability.reduce((a, b) => (a ? 1 : 0) + (b ? 1 : 0), 0);
      const apportioned = growability.map(canGrow => canGrow
        ? (height - this._height)/numGrowers
        : 0);
      indices.forEach(i => {
        this._hRules[i + 1] += apportioned[i];
        indices.slice(i + 1).forEach(j => {
          this._hRules[j + 1] += apportioned[i];
        });
      });

      apportioned.forEach((grow, idx) => {
        this._rows[idx].forEach(view => {
          if (view && grow) {
            toResize.set(view, {width: view.width, height: view.height + grow});
          }
        });
      });

      this._height = height;
    }

    // if (oldHeight > this._height) {
    //   const indices = mapn(this.numRows, i => i);
    //   const rowShrinkability = indices.map(i => this._rowShrinkability(i));
    //   const apportioned = this._apportionShrinkage(
    //     oldHeight - this._height,
    //     rowShrinkability.reduce((a, b) => a + b, 0),
    //     rowShrinkability, indices);
    //   indices.forEach(i => {
    //     this._hRules[i + 1] -= apportioned.get(i)!;
    //     indices.slice(i + 1).forEach(j => {
    //       this._hRules[j + 1] -= apportioned.get(i)!;
    //     });
    //   });
    // }

    toResize.forEach((newSize, view) => {
      if (! (view instanceof Label)) {
        // Resizing a label does nothing except incorrectly set the size
        view.resize(newSize.width, newSize.height);
      }
    });
    // A view itself may not resize, but there may be empty space in its
    // cell that can be reduced, so we need to re-layout the grid children
    this.layoutViews();
  }

  layoutViews() {
    this._children.forEach((kid, i) => {
      this._snapChildX(kid);
      this._snapChildY(kid);
    });
  }

  protected _snapChildX(kid: View) {
    const territory = this._territories.get(kid)!;
    let colLeft = this.left; // + this._padding.left;
    const colWidths = this._vRules.slice(1).map((vr, i) => vr - this._vRules[i]);
    const colGaps = this._colGaps;
    for (let i = 0; i < territory.x; i++) {
      colLeft += colWidths[i] + colGaps[i];
    }
    const align = territory.colAlign ?? this._colAligns[territory.x];
    const spanWidth =
      colWidths
        .slice(territory.x, territory.x + territory.width)
        .reduce((a, b) => a + b, 0) +
      colGaps
        .slice(territory.x, territory.x + territory.width - 1)
        .reduce((a, b) => a + b, 0);
    if (align === 'start') {
      kid.left = colLeft;
    } else if (align === 'end') {
      kid.right = colLeft + spanWidth;
    } else {
      kid.centerX = colLeft + spanWidth/2;
    }
  }

  protected _snapChildY(kid: View) {
    const territory = this._territories.get(kid)!;
    let rowTop = this.top; // + this._padding.top;
    const rowHeights = this._hRules.slice(1).map((hr, i) => hr - this._hRules[i]);
    const rowGaps = this._rowGaps;
    for (let i = 0; i < territory.y; i++) {
      rowTop += rowHeights[i] + rowGaps[i];
    }
    const align = territory.rowAlign ?? this._rowAligns[territory.y];
    const spanHeight =
      rowHeights
        .slice(territory.y, territory.y + territory.height)
        .reduce((a, b) => a + b, 0) +
      rowGaps
        .slice(territory.y, territory.y + territory.height - 1)
        .reduce((a, b) => a + b, 0);
    if (align === 'start') {
      kid.paddedTop = rowTop;
    } else if (align === 'end') {
      kid.paddedBottom = rowTop + spanHeight;
    } else {
      kid.centerY = rowTop + spanHeight/2;
    }
  }

  content(..._options: any[]) {
    const rects = this._territories.values().map(t => {
      const bbox = this._territoryBbox(t);
      const rect = new RectShape(this.paraview, {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      });
      rect.classInfo = {'debug-grid-territory': true};
      return rect;
    });
    return svg`
      ${super.content()}
      ${this.paraview.store.settings.dev.isShowGridTerritories
        ? rects.map(r => r.render())
        : ''
      }
    `;
  }

}
