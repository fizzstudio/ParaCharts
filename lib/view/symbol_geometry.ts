/* ParaCharts: Datapoint Symbol Geometry
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

import { fixed } from '../common/utils';

export interface ShapeInfo {
  path: string;
  baseWidth: number;
  baseHeight: number;
}

export interface CircleMetrics {
  r: number;
  d: number;
}

export interface SquareMetrics {
  side: number;
  apothem: number;
}

export interface TriangleMetrics {
  sqrt34: number;
  side: number;
  height: number;
}

export interface DiamondMetrics {
  side: number;
  radius: number;
}

export const AREA = 100;

export function circleMetrics(area?: number): CircleMetrics {
  const r = Math.sqrt((area ?? AREA) / Math.PI);
  const d = r * 2;
  return { r, d };
}

export function squareMetrics(area?: number): SquareMetrics {
  const side = Math.sqrt((area ?? AREA));
  const apothem = side / 2;
  return { side, apothem };
}

export function triangleMetrics(area?: number): TriangleMetrics {
  const sqrt34 = Math.sqrt(3 / 4);
  const side = Math.sqrt(2 * (area ?? AREA) / sqrt34);
  const height = side * sqrt34;
  return { sqrt34, side, height };
}

export function diamondMetrics(area?: number): DiamondMetrics {
  const side = Math.sqrt((area ?? AREA));
  const radius = Math.sqrt(2 * side ** 2) / 2;
  return { side, radius };
}

export function circleInfo(area?: number): ShapeInfo {
  const { r, d } = circleMetrics(area);
  return {
    path: fixed`m0,${-r} a${r},${r} 0 1,1 0,${d} a${r},${r} 0 1,1 0,${-d}`,
    baseWidth: d,
    baseHeight: d
  };
}

export function squareInfo(area?: number): ShapeInfo {
  const { side, apothem } = squareMetrics(area);
  return {
    path: `m${-apothem},${-apothem} h${side} v${side} h${-side} z`,
    baseWidth: side,
    baseHeight: side
  };
}

export function triangleUpInfo(area?: number): ShapeInfo {
  const { sqrt34, side, height } = triangleMetrics(area);
  return {
    path: fixed`m${-side / 2},${height / 2.5} h${side} l${-side / 2},${-height} z`,
    baseWidth: side,
    baseHeight: height
  };
}

export function triangleDownInfo(area?: number): ShapeInfo {
  const { sqrt34, side, height } = triangleMetrics(area);
  return {
    path: fixed`m${-side / 2},-${height / 2.5} h${side} l${-side / 2},${height} z`,
    baseWidth: side,
    baseHeight: height
  };
}

export function diamondInfo(area?: number): ShapeInfo {
  const { radius } = diamondMetrics(area);
  return {
    path: fixed`
      m0,-${radius}
      l${radius},${radius}
      l-${radius},${radius}
      l-${radius},-${radius} z`,
    baseWidth: radius * 2,
    baseHeight: radius * 2
  };
}

export function plusInfo(area?: number): ShapeInfo {
  const squareArea = (area ?? AREA) / 5;
  const side = Math.sqrt(squareArea);
  return {
    path: fixed`
      m${-side * 1.5},${side / 2}
      h${side}
      v${side}
      h${side}
      v${-side}
      h${side}
      v${-side}
      h${-side}
      v${-side}
      h${-side}
      v${side}
      h${-side} z`,
    baseWidth: side * 3,
    baseHeight: side * 3
  };
}

export function xInfo(area?: number): ShapeInfo {
  const squareArea = (area ?? AREA) / 5;
  const side = Math.sqrt(squareArea);
  const squareCircumRad = Math.sqrt(2 * side ** 2) / 2;
  return {
    path: fixed`
      m-${squareCircumRad},0
      l-${squareCircumRad},-${squareCircumRad}
      l${squareCircumRad},-${squareCircumRad}
      l${squareCircumRad},${squareCircumRad}
      l${squareCircumRad},-${squareCircumRad}
      l${squareCircumRad},${squareCircumRad}
      l-${squareCircumRad},${squareCircumRad}
      l${squareCircumRad},${squareCircumRad}
      l-${squareCircumRad},${squareCircumRad}
      l-${squareCircumRad},-${squareCircumRad}
      l-${squareCircumRad},${squareCircumRad}
      l-${squareCircumRad},-${squareCircumRad} z`,
    baseWidth: squareCircumRad * 3,
    baseHeight: squareCircumRad * 3
  };
}

export function starInfo(area?: number): ShapeInfo {
  const pentArea = (area ?? AREA) / 2;
  const t = Math.sqrt(pentArea / 1.72);
  const triArea = (100 - pentArea) / 5;
  const h = triArea * 2 / t;
  const s = Math.sqrt((t / 2) ** 2 + h ** 2);
  const triPeakAngle = 2 * 180 * Math.atan((t / 2) / h) / Math.PI;
  const interTriAngle = triPeakAngle + 72;
  const alpha = interTriAngle - triPeakAngle / 2 - 90;
  const m = Math.cos(alpha * Math.PI / 180) * s;
  const n = Math.sin(alpha * Math.PI / 180) * s;
  const beta = 180 - 90 - alpha;
  const gamma = 180 - beta - triPeakAngle;
  const delta = 180 - 90 - gamma;
  const epsilon = interTriAngle - delta;
  const p = Math.sin(gamma * Math.PI / 180) * s;
  const q = Math.cos(gamma * Math.PI / 180) * s;
  const u = Math.cos(epsilon * Math.PI / 180) * s;
  const v = Math.sin(epsilon * Math.PI / 180) * s;
  const w = Math.sin(interTriAngle / 2 * Math.PI / 180) * s;
  const z = Math.cos(interTriAngle / 2 * Math.PI / 180) * s;
  const pentApothem = 0.6682 * t;
  return {
    path: fixed`
      m-${t / 2},-${pentApothem}
      l${t / 2},-${h}
      l${t / 2},${h}
      l${m},${n}
      l-${p},${q}
      l${u},${v}
      l-${w},-${z}
      l-${w},${z}
      l${u},-${v}
      l-${p},-${q} z`,
    baseWidth: m * 2 + t,
    baseHeight: h + n + +q + v
  };
}