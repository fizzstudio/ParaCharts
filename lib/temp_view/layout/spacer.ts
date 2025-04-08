/* ParaCharts: Layout Spacers
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

/**
 * Invisible spacer that creates space between views.
 */
export class Spacer extends View {

  constructor(public readonly size: number) {
    super();
  }

  computeSize(): [number, number] {
    return [this.size, this.size];
  }

  render() {
    return svg``;
  }

}

/**
 * Horizontal spacer for row layouts.
 */
export class RowSpacer extends Spacer {

  computeSize(): [number, number] {
    return [this.size, 0];
  }

}

/**
 * Vertical spacer for view columns.
 */
export class ColumnSpacer extends Spacer {

  computeSize(): [number, number] {
    return [0, this.size];
  }

}