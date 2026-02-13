/* ParaCharts: Simple Grid Layout
Copyright (C) 2026 Fizz Studios

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

import { mapn } from '@fizz/chart-classifier-utils';

export interface SimpleGridOptionsInput {
  numCols: number;
  rowGaps?: number | number[];
  colGaps?: number | number[];
  rowAligns?: SnapLocation | SnapLocation[];
  colAligns?: SnapLocation | SnapLocation[];
}

export interface SimpleGridTerritoryInput {
  x: number;
  y: number;
}

/**
 * Simple grid layout for views.
 */
export class SimpleGridLayout extends Layout {
  protected _numCols: number;
  protected _rowGaps: number[];
  protected _colGaps: number[];
  protected _rowAligns: SnapLocation[];
  protected _colAligns: SnapLocation[];
  protected _rows: (View | null)[][] = [];
  protected _hRules: number[] = [];
  protected _vRules: number[] = [];

  constructor(paraview: ParaView, options: SimpleGridOptionsInput, id?: string) {
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

  protected _expandRowGaps(rowGaps: number | number[]) {
    return typeof rowGaps === 'object'
      ? Array.from(rowGaps)
      : [rowGaps];
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

  protected _findView(view: View): [number, number] | null {
    for (let i = 0; i < this._rows.length; i++) {
      for (let j = 0; j < this._numCols; j++) {
        if (this._rows[i][j] === view) {
          return [i, j];
        }
      }
    }
    return null;
  }

  append(child: View, territory?: SimpleGridTerritoryInput) {
    if (this._findView(child)) {
      throw new Error('view already present in grid');
    }
    this._arrangeChild(child, territory);
    super.append(child);
  }

  prepend(child: View, territory?: SimpleGridTerritoryInput) {
    if (this._findView(child)) {
      throw new Error('view already present in grid');
    }
    this._arrangeChild(child, territory);
    super.prepend(child);
  }

  protected _didAddChild(kid: View) {
    this._adjustRules(kid);
    super._didAddChild(kid);
  }

  protected _didRemoveChild(kid: View): void {
    this._rows = this._rows.map(row =>
      row.map(v => v === kid ? null : v));
    this._contractRules();
    this._updateGaps();
    super._didRemoveChild(kid);
  }

  protected _firstEmptyCell(): [number, number] {
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

  protected _arrangeChild(kid: View, territory?: SimpleGridTerritoryInput) {
    let row: number;
    let col: number;
    if (territory) {
      if (territory.x < 0) {
        territory.x = this._numCols + territory.x;
      }
      if (territory.y < 0) {
        territory.y = this._rows.length + territory.y;
      }
      row = territory.y;
      col = territory.x;
    } else {
      [row, col] = this._firstEmptyCell();
    }
    // Ensure row is present in the grid
    for (let r = 0; r <= row - this._rows.length; r++) {
      this._rows.push(mapn(this._numCols, _n => null));
      this._rowGaps.push(0);
      this._hRules.push(this._hRules.at(-1)!);
    }
    if (this._rows[row][col]) {
      throw new Error(`grid cell row=${row} col=${col} already occupied`);
    }
    this._rows[row][col] = kid;
  }

  protected _adjustRules(kid: View) {
    const [row, col] = this._findView(kid)!;
    const hRuleStart = row;
    const hRuleEnd = hRuleStart + 1;
    const hDiff = this._hRules[hRuleEnd] - this._hRules[hRuleStart];
    if (hDiff < kid.paddedHeight) {
      this._hRules[hRuleEnd] = this._hRules[hRuleStart] + kid.paddedHeight;
      this._hRules.slice(hRuleEnd + 1).forEach((hRule, i) => {
        this._hRules[hRuleEnd + 1 + i] += kid.paddedHeight - hDiff;
      });
    }
    const vRuleStart = col;
    const vRuleEnd = vRuleStart + 1;
    const vDiff = this._vRules[vRuleEnd] - this._vRules[vRuleStart];
    if (vDiff < kid.paddedWidth) {
      this._vRules[vRuleEnd] = this._vRules[vRuleStart] + kid.paddedWidth;
      this._vRules.slice(vRuleEnd + 1).forEach((vRule, i) => {
        this._vRules[vRuleEnd + 1 + i] += kid.paddedWidth - vDiff;
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

  protected _updateGaps() {
    for (const index of this._colGaps) {
      this._colGaps[index] = 0;
    }
    for (const index of this._rowGaps) {
      this._rowGaps[index] = 0;
    }
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
    const [row, col] = this._findView(kid)!;
    let colLeft = this.left; // + this._padding.left;
    const colWidths = this._vRules.slice(1).map((vr, i) => vr - this._vRules[i]);
    const colGaps = this._colGaps;
    for (let i = 0; i < col; i++) {
      colLeft += colWidths[i] + colGaps[i];
    }
    const align = this._colAligns[col];
    const spanWidth = colWidths[col];
    if (align === 'start') {
      kid.left = colLeft;
    } else if (align === 'end') {
      kid.right = colLeft + spanWidth;
    } else {
      kid.centerX = colLeft + spanWidth/2;
    }
  }

  protected _snapChildY(kid: View) {
    const [row, col] = this._findView(kid)!;
    let rowTop = this.top; // + this._padding.top;
    const rowHeights = this._hRules.slice(1).map((hr, i) => hr - this._hRules[i]);
    const rowGaps = this._rowGaps;
    for (let i = 0; i < row; i++) {
      rowTop += rowHeights[i] + rowGaps[i];
    }
    const align = this._rowAligns[row];
    const spanHeight = rowHeights[row];
    if (align === 'start') {
      kid.top = rowTop;
    } else if (align === 'end') {
      kid.bottom = rowTop + spanHeight;
    } else {
      kid.centerY = rowTop + spanHeight/2;
    }
  }

}
