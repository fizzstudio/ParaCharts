/* ParaCharts: Utility Functions
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

import { ParaStore } from "../store/parastore";

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
 * Template tag function to convert all expressions in a string
 * (assumed to be numbers) to fixed-point string representations.
 */
export function fixed(strings: TemplateStringsArray, ...exprs: number[]) {
  if (exprs.length === 0) {
    return strings[0];
  }
  if (exprs.some((expr) => isNaN(expr))) {
    throw new Error('Cannot format NaNs in `fixed`');
  }
  const out = strings.slice(0, -1).map((s, i) => s + toFixed(exprs[i]));
  out.push(strings.at(-1)!);
  return out.join('');
}

export function generateUniqueId(baseId: string, store: ParaStore): string {
  // remove non-word characters and replace spaces
  baseId = baseId.replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
  let i = 0;
  let uid = baseId;
  while (store.idList[uid]) {
    uid = baseId + '-' + ++i;
  }
  store.idList[uid] = true;
  return uid;
}

export function strToId(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
}

export function enumerate<T>(iterable: Iterable<T>): [T, number][] {
  const enumerations: [T, number][] = [];
  let index = 0;
  for (const member of iterable) {
    enumerations.push([member, index]);
    index++;
  }
  return enumerations;
}

export function mergeUnique<T>(...arrays: T[][]): T[] {
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
}

// This marks a series of if/then options as exhaustive
export function exhaustive(): never {
  return null as never; 
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}