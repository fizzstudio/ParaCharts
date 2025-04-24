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

import { svg } from 'lit';
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

  setSize(width: number, height: number): void {
    super.setSize(width, height);
    this.layoutViews();
  }

  abstract layoutViews(): void;

  render() {
    return svg`
      ${this._children.map(kid => kid.render())}
    `;
  }

}
