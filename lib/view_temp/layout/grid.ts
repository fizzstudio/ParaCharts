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
import { ParaView } from '../paraview';
import { Layout } from './layout';

import { mapn } from '@fizz/chart-classifier-utils';

export interface GridOptionsInput {
  numCols: number;
  rowGaps?: number | number[];
  colGaps?: number | number[]; 
  rowAligns?: SnapLocation | SnapLocation[];
  colAligns?: SnapLocation | SnapLocation[];
}

export interface GridTerritoryInput {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rowAlign?: SnapLocation;
  colAlign?: SnapLocation;
  margin?: PaddingInput | number;
}

export interface GridTerritory extends GridTerritoryInput {
  width: number;
  height: number;
  margin: Padding;
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

  constructor(paraview: ParaView, options: GridOptionsInput, id?: string) {
    super(paraview, id);
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

  protected _expandColAligns(colAligns: SnapLocation | SnapLocation[]) {
    return typeof colAligns === 'object'
      ? Array.from(colAligns)
      : new Array(this._numCols).fill(colAligns);
  }

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

  addRowBottom() {
    this._rowGaps.push(0);
    this._rowAligns.push('center');
    this._rows.push(new Array(this._numCols).fill(null));
    this._hRules.push(0);
  }

  insertRow(index: number) {
    this._rowGaps.splice(index, 0, 0);
    this._rowAligns.splice(index, 0, 'center');
    this._rows.splice(index, 0, new Array(this._numCols).fill(null));
    this._territories.values().forEach(t => {
      if (t.y >= index) {
        t.y++;
      }
    });
    this._hRules.splice(index, 0, this._hRules[index] ?? this._hRules.at(-1));
  }

  protected _resetRules() {
    this._hRules = [0, 0]; // grid top and bottom borders
    this._vRules = new Array(this._numCols + 1).fill(0);
  }

  protected _defaultMargin(x: number, y: number): Padding {
    return {
      left: this._colGaps[this._leftGapIndex(x)] ?? 0,
      right: this._colGaps[this._rightGapIndex(x)] ?? 0,
      top: this._rowGaps[this._topGapIndex(y)] ?? 0,
      bottom: this._rowGaps[this._bottomGapIndex(y)] ?? 0
    };
  }

  protected _claimTerritory(child: View, territory?: GridTerritoryInput) {
    if (this._territories.has(child)) {
      throw new Error('view already present in grid');
    }
    if (territory) {
      const terr: GridTerritory = {
        x: territory.x,
        y: territory.y,
        width: territory.width ?? 1,
        height: territory.height ?? 1,
        rowAlign: territory.rowAlign,
        colAlign: territory.colAlign,
        margin: territory.margin !== undefined
          ? this._expandPadding(territory.margin, this._defaultMargin(territory.x, territory.y))
          : this._defaultMargin(territory.x, territory.y)
      };
      this._territories.set(child, terr);
    }
  }

  append(child: View, territory?: GridTerritoryInput) {
    this._claimTerritory(child, territory);
    super.append(child);
  }

  prepend(child: View, territory?: GridTerritory) {
    this._claimTerritory(child, territory);
    super.prepend(child);
  }

  protected _didAddChild(kid: View) {
    this._arrangeChild(kid);
    this._adjustRules(kid);
    this._adjustGaps(kid);
    super._didAddChild(kid);
  }

  protected _didRemoveChild(kid: View): void {
    this._rows = this._rows.map(row =>
      row.map(v => v === kid ? null : v));
    this._territories.delete(kid);
    this._contractRules();
    this._updateGaps();
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
        margin: this._defaultMargin(col, row)
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

  protected _adjustRules(kid: View) {
    const territory = this._territories.get(kid)!;
    const hRuleStart = territory.y;
    const hRuleEnd = hRuleStart + territory.height;
    const hDiff = this._hRules[hRuleEnd] - this._hRules[hRuleStart];
    if (hDiff < kid.boundingHeight) {
      this._hRules[hRuleEnd] = this._hRules[hRuleStart] + kid.boundingHeight;
      this._hRules.slice(hRuleEnd + 1).forEach((hRule, i) => {
        this._hRules[hRuleEnd + 1 + i] += kid.boundingHeight - hDiff;
      });
    }
    const vRuleStart = territory.x;
    const vRuleEnd = vRuleStart + territory.width;
    const vDiff = this._vRules[vRuleEnd] - this._vRules[vRuleStart];
    if (vDiff < kid.boundingWidth) {
      this._vRules[vRuleEnd] = this._vRules[vRuleStart] + kid.boundingWidth;
      this._vRules.slice(vRuleEnd + 1).forEach((vRule, i) => {
        this._vRules[vRuleEnd + 1 + i] += kid.boundingWidth - vDiff;
      });
    }  
  }

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

  protected _computeColGap(index: number) {
    if (index < 0 || index > this._colGaps.length - 1) {
      return 0;
    }
    const leftViewMargins = this._rows
      .flatMap(row => row.filter((v, i) => v && (i === index)) as View[])
      .map(v => this._territories.get(v)!.margin.right);
    const rightViewMargins = this._rows
      .flatMap(row => row.filter((v, i) => v && (i === index + 1)) as View[])
      .map(v => this._territories.get(v)!.margin.left);
    const margins = leftViewMargins.concat(rightViewMargins);
    return margins.length ? Math.max(...margins) : 0;
  }

  protected _computeRowGap(index: number) {
    if (index < 0 || index > this._rowGaps.length - 1) {
      return 0;
    }
    const topViewMargins = ((this._rows[index]
      ?.filter(v => v) ?? []) as View[])
      .map(v => {
        return this._territories.get(v)!.margin.bottom;
      });
    const bottomViewMargins = ((this._rows[index + 1]
      ?.filter(v => v) ?? []) as View[])
      .map(v => this._territories.get(v)!.margin.top);
    const margins = topViewMargins.concat(bottomViewMargins);
    return margins.length ? Math.max(...margins) : 0;
  }

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

  protected _adjustGaps(kid: View) {
    const territory = this._territories.get(kid)!;
    const leftIndex = this._leftGapIndex(territory.x);
    if (leftIndex >= 0) {
      this._colGaps[leftIndex] = this._computeColGap(leftIndex);
    }
    const rightIndex = this._rightGapIndex(territory.x);
    if (rightIndex < this._colGaps.length) {
      this._colGaps[rightIndex] = this._computeColGap(rightIndex);
    }
    const topIndex = this._topGapIndex(territory.y);
    if (topIndex >= 0) {
      this._rowGaps[topIndex] = this._computeRowGap(topIndex);
    }
    const bottomIndex = this._bottomGapIndex(territory.y);
    if (bottomIndex < this._rowGaps.length) {
      this._rowGaps[bottomIndex] = this._computeRowGap(bottomIndex);
    }
  }

  protected _updateGaps() {
    for (const index of this._colGaps) {
      this._colGaps[index] = this._computeColGap(index);
    }
    for (const index of this._rowGaps) {
      this._rowGaps[index] = this._computeRowGap(index);
    }
  }

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

  layoutViews() {
    this._children.forEach((kid, i) => {
      this._snapChildX(kid);
      this._snapChildY(kid);
    });
  }

  protected _snapChildX(kid: View) {
    const territory = this._territories.get(kid)!;
    let colLeft = this.left + this._padding.left;
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
      kid.x = colLeft;
    } else if (align === 'end') {
      kid.x = colLeft + spanWidth - kid.boundingWidth;
    } else {
      kid.x = colLeft + spanWidth/2 - kid.width/2 - kid.padding.left;
    }
  }

  protected _snapChildY(kid: View) {
    const territory = this._territories.get(kid)!;
    let rowTop = this.top + this._padding.top;
    const rowHeights = this._hRules.slice(1).map((hr, i) => hr - this._hRules[i]);
    const rowGaps = this._rowGaps;
    for (let i = 0; i < territory.y; i++) {
      rowTop += rowHeights[i] + rowGaps[i];
    }
    const align = territory.rowAlign ??  this._rowAligns[territory.y];
    const spanHeight =
      rowHeights
        .slice(territory.y, territory.y + territory.height)
        .reduce((a, b) => a + b, 0) +
      rowGaps
        .slice(territory.y, territory.y + territory.height - 1)
        .reduce((a, b) => a + b, 0);
    if (align === 'start') {
      kid.y = rowTop;
    } else if (align === 'end') {
      kid.y = rowTop + spanHeight - kid.boundingHeight;
    } else {
      kid.y = rowTop + spanHeight/2 - kid.height/2 - kid.padding.top;
    }
  }

}
