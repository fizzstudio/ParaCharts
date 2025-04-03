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