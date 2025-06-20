/* ParaCharts: Flex Layout
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

import { View, type SnapLocation } from '../base_view';
import { ParaView } from '../../paraview';
import { Layout } from './layout';

/**
 * Abstract base class for flexbox-style row and column layouts.
 */
export abstract class FlexLayout extends Layout {

  constructor(paraview: ParaView, public readonly gap: number, public readonly alignViews: SnapLocation, id?: string) {
    super(paraview, id);
  }

}

/**
 * Horizontal row of views.
 */
export class RowLayout extends FlexLayout {

  constructor(paraview: ParaView, gap: number, alignViews: SnapLocation, id?: string) {
    super(paraview, gap, alignViews, id);
  }

  computeSize(): [number, number] {
    return [
      this._children.reduce((sum, kid) => sum + kid.boundingWidth, 0) 
        + this.gap*(this._children.length - 1),
      Math.max(...this._children.map(kid => kid.boundingHeight))
    ];
  }

  protected _snapChildY(kid: View) {
    if (this.alignViews === 'start') {
      kid.top = this.top + this._padding.top;
    } else if (this.alignViews === 'end') {
      kid.bottom = this.bottom - this._padding.bottom;
    } else {
      kid.centerY = this.top + this._padding.top 
        + this.height/2;
    }
  }

  layoutViews() {
    if (!this._children.length) {
      return;
    }
    this._children[0].left = this._x + this._padding.left;
    this._snapChildY(this._children[0]);
    // Lay out child views from left to right
    this._children.slice(1).forEach((kid, i) => {
      kid.left = this._children[kid.index - 1].right + this.gap;
      this._snapChildY(kid);
    });
  }

}

/**
 * Vertical column of views.
 */
export class ColumnLayout extends FlexLayout {

  constructor(paraview: ParaView, gap: number, alignViews: SnapLocation, id?: string) {
    super(paraview, gap, alignViews, id);
  }

  computeSize(): [number, number] {
    return [
      Math.max(...this._children.map(kid => kid.boundingWidth)),
      this._children.reduce((sum, kid) => sum + kid.boundingHeight, 0) 
        + this.gap*(this._children.length - 1)
    ];
  }

  protected _snapChildX(kid: View) {
    if (this.alignViews === 'start') {
      kid.left = this.left + this._padding.left;
    } else if (this.alignViews === 'end') {
      kid.right = this.right - this._padding.right;
    } else {
      kid.centerX = this.left + this._padding.left 
        + this.width/2;
    }
  }

  layoutViews() {
    if (!this._children.length) {
      return;
    }
    this._snapChildX(this._children[0]);
    this._children[0].top = this._y + this._padding.top;
    // Lay out child views from top to bottom
    this._children.slice(1).forEach((kid, i) => {
      this._snapChildX(kid);
      kid.top = this._children[kid.index - 1].bottom + this.gap;
    });
  }

}