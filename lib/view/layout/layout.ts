/* ParaCharts: Layouts
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

import { View } from '../base_view';
import { Logger, getLogger } from '../../common/logger';
import { ParaView } from '../../paraview';

/**
 * Abstract base class for views that lay out multiple views but
 * otherwise create no DOM themselves.
 */
export abstract class Layout extends View {
  constructor(paraview: ParaView, id?: string) {
    super(paraview);
    if (id) {
      this._id = id;
    }
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  set x(x: number) {
    this._children.forEach(kid => {
      kid.x += (x - this._x);
    });
    super.x = x;
  }

  set y(y: number) {
    this._children.forEach(kid => {
      kid.y += (y - this._y);
    });
    super.y = y;
  }

  // setSize(width: number, height: number, isBubble = true) {
  //   super.setSize(width, height, isBubble);
  //   this.layoutViews();
  // }

  // constrainSize(maxWidth: number, maxHeight: number, isBubble = false) {
  //   this.log.info('CONSTRAIN', this.id || this.constructor.name, maxWidth, maxHeight, isBubble);
  //   this.setSize(Math.min(this._width, maxWidth), Math.min(this._height, maxHeight), isBubble);
  //   this._children.forEach(kid => {
  //     kid.constrainSize(this._width, this._height, false);
  //   });
  //   this._adjustToSizeConstraint();
  // }

  // protected _adjustToSizeConstraint() {
  //   this.layoutViews();
  // }

  protected _didAddChildToList(kid: View) {
    kid.isBubbleSizeChange = true;
  }

  protected _childDidResize(_kid: View) {
    this.updateSize();
  }

  protected _didAddChild(_kid: View) {
    //this.updateSize();
  }

  protected _didRemoveChild(_kid: View) {
    this.updateSize();
  }

  abstract layoutViews(): void;

}
