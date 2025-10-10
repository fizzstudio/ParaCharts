/* ParaCharts: Datapoint Symbols
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

import { View } from './base_view';
import { fixed } from '../common/utils';
import { Colors } from '../common/colors';
import { ParaView } from '../paraview';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { DatapointView } from './data';

export type DataSymbolShape =
'circle' | 'square' | 'triangle_up' | 'diamond' | 'plus' | 'star' | 'triangle_down' | 'x';

// empty == no fill at all
export type DataSymbolFill = 'outline' | 'solid' | 'empty';
export type DataSymbolType = `${DataSymbolShape}.${DataSymbolFill}` | 'default';

interface ShapeInfo {
  path: string;
  baseWidth: number;
  baseHeight: number;
}

const AREA = 100;

function circleInfo(): ShapeInfo {
  const r = Math.sqrt(AREA/Math.PI);
  const d = r*2;
  return {
    path: fixed`m0,${-r} a${r},${r} 0 1,1 0,${d} a${r},${r} 0 1,1 0,${-d}`,
    baseWidth: d,
    baseHeight: d
  };
}

function squareInfo(): ShapeInfo {
  const side = Math.sqrt(AREA);
  const apothem = side/2;
  return {
    path: `m${-apothem},${-apothem} h${side} v${side} h${-side} z`,
    baseWidth: side,
    baseHeight: side
  };
}

/*
 * For an equilateral triangle with side length A, the length of a line
 * segment B from one vertex to the opposite edge that bisects the edge
 * is: B = A*sqrt(3/4). We can use this fact to compute the side length of
 * an equilateral triangle with area = 100: approx 15.1967
 * The height of such a triangle will be: approx 13.161
 */
function triangleUpInfo(): ShapeInfo {
  // 2*AREA == side*height == side*side*sqrt(3/4)
  // 2*AREA/sqrt(3/4) == side**2
  // side == sqrt(2*AREA/sqrt(3/4))
  const sqrt34 = Math.sqrt(3/4);
  const side = Math.sqrt(2*AREA/sqrt34);
  const height = side*sqrt34;
  return {
    path: fixed`m${-side/2},${height/2.5} h${side} l${-side/2},${-height} z`,
    baseWidth: side,
    baseHeight: height
  };
}

function triangleDownInfo(): ShapeInfo {
  const sqrt34 = Math.sqrt(3/4);
  const side = Math.sqrt(2*AREA/sqrt34);
  const height = side*sqrt34;
  return {
    path: fixed`m${-side/2},-${height/2.5} h${side} l${-side/2},${height} z`,
    baseWidth: side,
    baseHeight: height
  };
}

function diamondInfo(): ShapeInfo {
  const side = Math.sqrt(AREA);
  const radius = Math.sqrt(2*side**2)/2;
  return {
    path: fixed`
      m0,-${radius}
      l${radius},${radius}
      l-${radius},${radius}
      l-${radius},-${radius} z`,
    baseWidth: radius*2,
    baseHeight: radius*2
  };
}

/*
 * The plus is made up of 5 squares, each with area AREA/5. So the side of
 * each small square is sqrt(AREA/5).
 */
function plusInfo(): ShapeInfo {
  const squareArea = AREA/5;
  const side = Math.sqrt(squareArea);
  return {
    path: fixed`
      m${-side*1.5},${side/2}
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
    baseWidth: side*3,
    baseHeight: side*3
  };
}

function xInfo(): ShapeInfo {
  const squareArea = AREA/5;
  const side = Math.sqrt(squareArea);
  const squareCircumRad = Math.sqrt(2*side**2)/2;
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
    baseWidth: squareCircumRad*3,
    baseHeight: squareCircumRad*3
  };
}

/**
 * Generate the perimeter of a non-regular pentagram, specifying the
 * area occupied by the inner pentagon vs the outer triangles.
 */
function starInfo(): ShapeInfo {
  const pentArea = AREA/2;
  const t = Math.sqrt(pentArea/1.72); // pentagon side length
  const triArea = (100 - pentArea)/5;
  const h = triArea*2/t;                // triangle height
  const s = Math.sqrt((t/2)**2 + h**2); // triangle side
  const triPeakAngle = 2*180*Math.atan((t/2)/h)/Math.PI;
  // NB: This may be > 180!
  const interTriAngle = triPeakAngle + 72;
  const alpha = interTriAngle - triPeakAngle/2 - 90;
  const m = Math.cos(alpha*Math.PI/180)*s;
  const n = Math.sin(alpha*Math.PI/180)*s;
  const beta = 180 - 90 - alpha;
  const gamma = 180 - beta - triPeakAngle;
  const delta = 180 - 90 - gamma;
  const epsilon = interTriAngle - delta;
  const p = Math.sin(gamma*Math.PI/180)*s;
  const q = Math.cos(gamma*Math.PI/180)*s;
  const u = Math.cos(epsilon*Math.PI/180)*s;
  const v = Math.sin(epsilon*Math.PI/180)*s;
  const w = Math.sin(interTriAngle/2*Math.PI/180)*s;
  const z = Math.cos(interTriAngle/2*Math.PI/180)*s;
  const pentApothem = 0.6682*t; // dist from pentagon center to middle of side
  return {
    path: fixed`
      m-${t/2},-${pentApothem}
      l${t/2},-${h}
      l${t/2},${h}
      l${m},${n}
      l-${p},${q}
      l${u},${v}
      l-${w},-${z}
      l-${w},${z}
      l${u},-${v}
      l-${p},-${q} z`,
    baseWidth: m*2 + t,
    baseHeight: h + n + + q + v
  }
}

const triSide = 15.1967;
const triHeight = 13.161;

const xSquareCircumRad = 3.162;

const diamondRadius = 7.071;


const plusSide = 4.472;

/**
 * Generate the perimeter of a regular pentagram.
 */
function starPath() {
  /*
  * Star perimenter vertices will be named A-J starting at the top and moving
  * clockwise.
  */
  const PHI = 1.618; // golden ratio
  const t = 4.165;  // inner pentagon side length
  const s = PHI*t;  // equilateral side length of triangles pointing out from pentagon
  const pentCircumRad = 0.8507*t; // dist from pentagon center to pentagon vert
  const pentApothem = 0.6682*t; // dist from pentagon center to middle of side
  const h = Math.sqrt(s**2 - (t/2)**2); // triangle height
  const n = t*Math.sin(72*Math.PI/180); // vert dist from C to D
  const m = s*Math.cos(Math.asin(n/s)); // horiz dist from C to D
  const oppVertDist = s*2 + t; // distance between opposite star outer vertices (e.g., A to E)
  const height = oppVertDist*Math.cos(18*Math.PI/180); // total height of star
  const q = height - h - n;                    // vert dist from D to E
  const p = s*Math.sin(Math.acos(q/s));        // horiz dist from D to E
  const r = s*Math.sin(54*Math.PI/180);        // horiz dist from E to F
  const pentHeight = pentApothem + pentCircumRad;  // pentagon height
  // Traverse vertices clockwise starting with J
  return fixed`
    m-${t/2},-${pentApothem}
    l${t/2},-${h}
    l${t/2},${h}
    h${s}
    l-${m},${n}
    l${p},${q}
    l-${r},-${height - h - pentHeight}
    l-${r},${height - h - pentHeight}
    l${p},-${q}
    l-${m},-${n} z
  `;
}

const shapeInfo = {
  circle: circleInfo(),
  square: squareInfo(),
  triangle_up: triangleUpInfo(),
  triangle_down: triangleDownInfo(),
  diamond: diamondInfo(),
  plus: plusInfo(),
  x: xInfo(),
  star: starInfo()
};

export interface DataSymbolOptions {
  strokeWidth: number;
  scale: number;
  color?: number;
  opacity?: number;
  dashed: boolean;
  lighten?: boolean;
}

/**
 * @remarks
 * Unlike the default for `Views`, `x` and `y` here locate the center of
 * the shape, rather than the top left corner.
 */
export class DataSymbol extends View {

  protected _type!: DataSymbolType;
  protected _options: DataSymbolOptions;
  protected _defsKey!: string;
  protected _role = '';

  static fromType(
    paraview: ParaView,
    type: DataSymbolType,
    options?: Partial<DataSymbolOptions>,
  ) {
    let shape: DataSymbolShape, fill: DataSymbolFill;
    if (type === 'default') {
      shape = 'circle';
      fill = 'outline';
      options ??= {};
      options.dashed = true;
    } else {
      [shape, fill] = type.split('.') as [DataSymbolShape, DataSymbolFill];
    }
    return new DataSymbol(paraview, shape, fill, options);
  }

  constructor(
    paraview: ParaView,
    shape: DataSymbolShape,
    fill: DataSymbolFill,
    options?: Partial<DataSymbolOptions>,
  ) {
    super(paraview);
    this._options = {
      strokeWidth: options?.strokeWidth ?? this.paraview.store.settings.chart.symbolStrokeWidth,
      scale: options?.scale ?? 1,
      color: options?.color,
      opacity: options?.opacity,
      dashed: options?.dashed ?? false,
      lighten: options?.lighten ?? false
    };
    this.type = `${shape}.${fill}`;
    this._locOffset.x = this.width/2;
    this._locOffset.y = this.height/2;
    this._updateStyleInfo();
    this._classInfo = {
      symbol: true,
      [fill]: true
    };
  }

  get type(): DataSymbolType {
    return this._type;
  }

  set type(type: DataSymbolType) {
    this._type = type;
    const [shape, fill] = type.split('.');
    this._defsKey = `sym-${shape}-${fill}`;
    if (!this.paraview.defs[this._defsKey]) {
      this.paraview.addDef(this._defsKey, svg`
        <path
          id=${this._defsKey}
          d=${shapeInfo[this.shape].path}
        />
      `);
    }
    this._updateStyleInfo();
  }

  get width() {
    return shapeInfo[this.shape].baseWidth*this._options.scale;
  }

  get height() {
    return shapeInfo[this.shape].baseHeight*this._options.scale;
  }

  get outerBbox() {
    return new DOMRect(
      this._x - this.width/2 - this._options.scale*this._options.strokeWidth/2,
      this._y - this.height/2 - this._options.scale*this._options.strokeWidth/2,
      this.width + this._options.scale*this._options.strokeWidth,
      this.height + this._options.scale*this._options.strokeWidth
    );
  }

  get shape() {
    return this._type.split('.')[0] as DataSymbolShape;
  }

  set shape(shape: DataSymbolShape) {
    this.type = (shape + '.' + this._type.split('.')[1]) as DataSymbolType;
  }

  get fill() {
    return this._type.split('.')[1] as DataSymbolFill;
  }

  set fill(fill: DataSymbolFill) {
    this.type = (this._type.split('.')[0] + '.' + fill) as DataSymbolType;
    this._updateStyleInfo();
  }

  get color() {
    return this._options.color;
  }

  set color(color: number | undefined) {
    this._options.color = color;
    this._updateStyleInfo();
  }

  get opacity() {
    return this._options.opacity;
  }

  set opacity(opacity: number | undefined) {
    this._options.opacity = opacity;
    this._updateStyleInfo();
  }

  get scale() {
    return this._options.scale;
  }

  set scale(scale: number) {
    this._options.scale = scale;
  }

  get role() {
    return this._role;
  }

  set role(role: string) {
    this._role = role;
  }

  clone(): DataSymbol {
    const sym = DataSymbol.fromType(this.paraview, this._type, this._options);
    sym.x = this._x;
    sym.y = this._y;
    return sym;
  }

  protected _updateStyleInfo() {
    this._styleInfo = {
      strokeWidth: this._options.strokeWidth,
    };
    if (this._options.dashed) {
      this._styleInfo.strokeDasharray = '1px 2px';
    }
    if (this._options.color !== undefined) {
      if (this.fill === 'solid') {
        if (this._options.lighten) {
          const col = this.paraview.store.colors.colorValueAt(
            this._options.color).match(/\d+/g)!.map(Number);
          //10 and 25 are magic numbers
          col[1] -= Math.min(10, col[1]);
          col[2] += Math.min(25, 100 - col[2]);
          this._styleInfo.fill = `hsl(${col[0]}, ${col[1]}%, ${col[2]}%)`;
        }
        else {
          this._styleInfo.fill = this.paraview.store.colors.colorValueAt(
            this._options.color);
        }
      }
      else if (this.fill === 'outline') {
        this._styleInfo.fill = 'white';
      } else {
        this._styleInfo.fill = 'none';
      }
      if (this._options.opacity !== undefined) {
        this._styleInfo.opacity = this._options.opacity;
      }
      this._styleInfo.stroke = this.paraview.store.colors.colorValueAt(
        this._options.color);
    }
  }

  content() {
    let transform = fixed`translate(${this._x},${this._y})`;
    if (this._options.scale !== 1) {
      transform += fixed` scale(${this._options.scale})`;
    }
    let type = this.paraview.store.type
    if (this.parent instanceof DatapointView){
      if (this._y < 0 || this._y > this.parent.chart.parent.logicalHeight){
        this.hidden = true;
      }
    }
    return this.hidden ? svg`` : svg`
      <use
        href="#${this._defsKey}"
        id=${this._id || nothing}
        role=${this._role || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        transform=${transform}
      />
    `;
  }

}

export class DataSymbols {

  readonly shapes: readonly DataSymbolShape[] = [
    'circle', 'square', 'triangle_up', 'diamond', 'plus', 'star', 'triangle_down', 'x'
  ];

  readonly fills: readonly DataSymbolFill[] = [
    'outline', 'solid'
  ];

  // TODO: confirm with Josh that this doesn't have to be readonly
  // readonly types: readonly DataSymbolType[] =
  //   this.fills.flatMap(fill =>
  //     this.shapes.map(shape => `${shape}.${fill}` as DataSymbolType));

  types: readonly DataSymbolType[] =
    this.fills.flatMap(fill =>
      this.shapes.map(shape => `${shape}.${fill}` as DataSymbolType));

  symbolAt(index: number) {
    return this.types[index] ?? 'default';
  }

}