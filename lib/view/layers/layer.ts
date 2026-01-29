/* ParaCharts: Chart Layers
Copyright (C) 2025 Fizz Studio

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

import { Container, View } from '../base_view';
import { type PlotLayerManager } from '.';
import { ParaView } from '../../paraview';

export abstract class PlotLayer extends Container(View) {

  declare protected _parent: PlotLayerManager;

  constructor(paraview: ParaView, width: number, height: number) {
    super(paraview);
    this._width = width;
    this._height = height;
  }

  protected _createId(id: string) {
    return `${id}-layer`;
  }

  protected _addedToParent() {
    this.setSize(this._parent.logicalWidth, this._parent.logicalHeight, false);
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: PlotLayerManager) {
    super.parent = parent;
  }

}