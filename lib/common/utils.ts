/* ParaCharts: Utility Functions
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

import { ParaState } from "../state/parastate";
import { BboxAnchor, type View } from '../view/base_view';
import { DatapointView } from "../view/data";
import { ParaView } from "../paraview";
import { Popup } from "../view/popup";

const bboxOppositeAnchors: Record<BboxAnchor, BboxAnchor> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  topLeft: 'bottomRight',
  topRight: 'bottomLeft',
  bottomRight: 'topLeft',
  bottomLeft: 'topRight'
};

// String Formatting

/**
 * Convert a number to a string with a given number of digits after the
 * decimal.
 * @param n - Number.
 * @param digits  - Number of digits after the decimal.
 * @param bareInt - Represent integers without a decimal.
 * @returns Number converted to string.
 * @internal
 */
export function toFixed(n: number, digits = 2, bareInt = true) {
  if (bareInt && Math.trunc(n) === n) {
    return n.toString();
  }
  return n.toFixed(digits);
}

/**
 * Template tag function to convert expressions in a string
 * (if numeric) to fixed-point string representations.
 */
export function fixed(strings: TemplateStringsArray, ...exprs: (number | string)[]) {
  if (exprs.length === 0) {
    return strings[0];
  }
  // if (exprs.some((expr) => typeof expr === 'number' && isNaN(expr))) {
  //   throw new Error('Cannot format NaNs in `fixed`; ' + 'strings: ' + strings + '; exprs: ' + exprs);
  // }
  const out = strings.slice(0, -1).map((s, i) =>
    s + (typeof exprs[i] === 'number' ? toFixed(exprs[i]) : exprs[i]));
  out.push(strings.at(-1)!);
  return out.join('');
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function joinStrArray(strArray: string[], linebreak?: string): string {
  strArray = strArray.filter(line => /\S/.test(line));
  // if the string array only contains blank strings, ignore it
  if (strArray.length) {
    const strArrayLen = strArray.length - 1;
    return strArray.reduce((acc, line, i) => {
      const lineEnd = (i === strArrayLen) ? '.' : '';
      const linebreakstr = (acc) ? ` ${linebreak}` : '';
      const accStr = acc.match(/[.,?:;]$/) ? acc : `${acc}.`;
      return `${accStr} ${linebreakstr}${line}${lineEnd}`;
    });
  }
  return '';
}

// ID Generation

export function generateUniqueId(baseId: string, paraState: ParaState): string {
  // remove non-word characters and replace spaces
  baseId = baseId.replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
  let i = 0;
  let uid = baseId;
  while (paraState.idList[uid]) {
    uid = baseId + '-' + ++i;
  }
  paraState.idList[uid] = true;
  return uid;
}

// Type System Magic

// This marks a series of if/then options as exhaustive
export function exhaustive(): never {
  return null as never;
}

export function groupBbox(...views: View[]) {
  return new DOMRect(
    Math.min(...views.map(v => v.left)),
    Math.min(...views.map(v => v.top)),
    Math.max(...views.map(v => v.width)),
    Math.max(...views.map(v => v.height))
  );
}

export function bboxOfBboxes(...bboxes: DOMRect[]) {
  const left = Math.min(...bboxes.map(b => b.left));
  const right = Math.max(...bboxes.map(b => b.right));
  const top = Math.min(...bboxes.map(b => b.top));
  const bottom = Math.max(...bboxes.map(b => b.bottom));
  return new DOMRect(
    left,
    top,
    right - left,
    bottom - top
  );
}

/*export function boxToNumber(box: Box<Datatype>, allBoxes: Box<Datatype>[]): number {
    if (box.isNumber()) {
        return box.value;
    }
    if (box.isDate()) {
        return calendarNumber(box.value);
    }
    return allBoxes.findIndex((otherBox) => otherBox.value === box.value);
}*/

export function datapointMatchKeyAndIndex(datapoint: DatapointView, key: string, index: number): boolean {
  return datapoint.seriesKey === key && datapoint.index === index;
}

export function bboxOppositeAnchor(anchor: BboxAnchor): BboxAnchor {
  return bboxOppositeAnchors[anchor];
}

// Simon: These functions were used for Model2D but have no use currently.
//  However, they are general utility functions which might be useful later
/*export function mergeUnique<T>(...arrays: T[][]): T[] {
  let set = new Set<T>();
  for (const arr of arrays) {
    set = set.union(new Set(arr));
  }
  return Array.from(set);
}

export function dedupPrimitive<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function mergeUniqueBy<T>(
  by: (lhs: T, rhs: T) => boolean = (lhs, rhs) => lhs === rhs, ...arrs: T[][]
): T[] {
  if (arrs.length === 0) {
    return [];
  }
  const res = [...arrs.shift()!];
  for (const otherArr of arrs) {
    loop: for (const newElement of otherArr) {
      for (const element of res) {
        if (by(newElement, element)) {
          break loop;
        }
      }
      res.push(newElement)
    }
  }
  return res;
}*/

export function isPointerInbounds(paraview: ParaView, e: PointerEvent | MouseEvent) {
  if (!paraview.documentView) {
    return true;
  }
  if (e.offsetX - paraview.documentView!.padding.left - paraview.documentView!.chartLayers.x < 0
    || e.offsetX - paraview.documentView!.padding.left - paraview.documentView!.chartLayers.x > paraview.documentView!.chartLayers.width
    || e.offsetY - paraview.documentView!.padding.top - paraview.documentView!.chartLayers.y < 0
    || e.offsetY - paraview.documentView!.padding.top - paraview.documentView!.chartLayers.y > paraview.documentView!.chartLayers.height
  ) {
    return false;
  }
  else {
    return true;
  }
}

export function loopParaviewRefresh(paraview: ParaView, duration: number, interval: number) {
  const start = Date.now();
  const loop = () => {
    let timestamp = setTimeout(() => {
      paraview.requestUpdate();
      loop();
    }, interval);
    if (Date.now() - start > duration) {
      clearTimeout(timestamp);
    }
  };
  loop();
}

export function vertAdjust(label: Popup) {
  label.grid.y += (label.grid.height) + 11;
  label.box.y += (label.grid.height) + 11;
};
export function horizAdjust(label: Popup) {
  label.grid.x -= (label.grid.width / 2) + 11;
  label.box.x -= (label.grid.width / 2) + 11;
  label.grid.y -= (label.grid.height / 2);
  label.box.y -= (label.grid.height / 2);
};