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
import { fixed } from '../../common/utils';
import { Logger, getLogger } from '../../common/logger';

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
    this.log = getLogger("RowLayout");
  }

  computeSize(): [number, number] {
    return [
      this._children.reduce((sum, kid) => sum + kid.paddedWidth, 0)
        + this.gap*(this._children.length - 1),
      this._children.length
        ? Math.max(...this._children.map(kid => kid.paddedHeight))
        : 0
    ];
  }

  protected _snapChildY(kid: View) {
    kid.snapYTo(this, this.alignViews);
  }

  layoutViews() {
    this.log.info('LAYOUT ROW', this.id);
    if (!this._children.length) {
      return;
    }
    this._children[0].paddedLeft = this._x;
    this._snapChildY(this._children[0]);
    // Lay out child views from left to right
    this._children.slice(1).forEach(kid => {
      kid.paddedLeft = this._children[kid.index - 1].paddedRight + this.gap;
      this._snapChildY(kid);
    });
    this.log.info('LOCS', this._children.map(kid => fixed`(${kid.x},${kid.y})`).join(' '));
  }

}

/**
 * Vertical column of views.
 */
export class ColumnLayout extends FlexLayout {
  constructor(paraview: ParaView, gap: number, alignViews: SnapLocation, id?: string) {
    super(paraview, gap, alignViews, id);
    this.log = getLogger("ColumnLayout");
  }

  computeSize(): [number, number] {
    return [
      this._children.length
        ? Math.max(...this._children.map(kid => kid.paddedWidth))
        : 0,
      this._children.reduce((sum, kid) => sum + kid.paddedHeight, 0)
        + this.gap*(this._children.length - 1)
    ];
  }

  protected _snapChildX(kid: View) {
    kid.snapXTo(this, this.alignViews);
  }

  layoutViews() {
    this.log.info('LAYOUT COL', this.id);
    if (!this._children.length) {
      return;
    }
    this._snapChildX(this._children[0]);
    this._children[0].paddedTop = this._y;
    // Lay out child views from top to bottom
    this._children.slice(1).forEach(kid => {
      this._snapChildX(kid);
      kid.paddedTop = this._children[kid.index - 1].paddedBottom + this.gap;
    });
    this.log.info('LOCS', this._children.map(kid => fixed`(${kid.x},${kid.y}) ${kid.width}`).join(' '));
  }

}