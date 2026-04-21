/* ParaCharts: Layout Utility Functions
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

/**
 * Minimal shape needed for flex-layout size calculations.
 */
export type SizeChild = { paddedWidth: number; paddedHeight: number };

/**
 * Computes the bounding size of a horizontal row of child views separated by
 * a fixed gap. Returns `[totalWidth, maxHeight]`.
 *
 * Width = sum of all padded widths + gap between each adjacent pair.
 * Height = maximum padded height among children (0 when there are no children).
 */
export function computeRowSize(children: SizeChild[], gap: number): [number, number] {
  if (!children.length) {
    return [0, 0];
  }

  return [
    children.reduce((sum, kid) => sum + kid.paddedWidth, 0)
      + gap * (children.length - 1),
    children.length
      ? Math.max(...children.map(kid => kid.paddedHeight))
      : 0,
  ];
}

/**
 * Computes the bounding size of a vertical column of child views separated by
 * a fixed gap. Returns `[maxWidth, totalHeight]`.
 *
 * Width = maximum padded width among children (0 when there are no children).
 * Height = sum of all padded heights + gap between each adjacent pair.
 */
export function computeColumnSize(children: SizeChild[], gap: number): [number, number] {
  if (!children.length) {
    return [0, 0];
  }

  return [
    children.length
      ? Math.max(...children.map(kid => kid.paddedWidth))
      : 0,
    children.reduce((sum, kid) => sum + kid.paddedHeight, 0)
      + gap * (children.length - 1),
  ];
}
