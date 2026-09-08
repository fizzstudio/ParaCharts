/* ParaCharts: Datapoint Symbols
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

import { View } from './base_view';
import { fixed } from '../common/utils';
import { Colors } from '../common/colors';
import { type ViewContext } from './view_context';
import {
  circleInfo,
  squareInfo,
  triangleUpInfo,
  triangleDownInfo,
  diamondInfo,
  plusInfo,
  xInfo,
  starInfo,
  AREA,
  type ShapeInfo,
} from './symbol_geometry';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { Datapoint } from '@fizz/paramodel';
import { SettingsManager } from '../state';
import { MarkerConfig } from '../common_exports';

export type DataSymbolShape =
  'circle' | 'square' | 'triangle_up' | 'diamond' | 'plus' | 'star' | 'triangle_down' | 'x';

// empty == no fill at all
export type DataSymbolFillType = 'outline' | 'solid' | 'empty';
export type DataSymbolType = `${DataSymbolShape}.${DataSymbolFillType}` | 'default';

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
  const s = PHI * t;  // equilateral side length of triangles pointing out from pentagon
  const pentCircumRad = 0.8507 * t; // dist from pentagon center to pentagon vert
  const pentApothem = 0.6682 * t; // dist from pentagon center to middle of side
  const h = Math.sqrt(s ** 2 - (t / 2) ** 2); // triangle height
  const n = t * Math.sin(72 * Math.PI / 180); // vert dist from C to D
  const m = s * Math.cos(Math.asin(n / s)); // horiz dist from C to D
  const oppVertDist = s * 2 + t; // distance between opposite star outer vertices (e.g., A to E)
  const height = oppVertDist * Math.cos(18 * Math.PI / 180); // total height of star
  const q = height - h - n;                    // vert dist from D to E
  const p = s * Math.sin(Math.acos(q / s));        // horiz dist from D to E
  const r = s * Math.sin(54 * Math.PI / 180);        // horiz dist from E to F
  const pentHeight = pentApothem + pentCircumRad;  // pentagon height
  // Traverse vertices clockwise starting with J
  return fixed`
    m-${t / 2},-${pentApothem}
    l${t / 2},-${h}
    l${t / 2},${h}
    h${s}
    l-${m},${n}
    l${p},${q}
    l-${r},-${height - h - pentHeight}
    l-${r},${height - h - pentHeight}
    l${p},-${q}
    l-${m},-${n} z
  `;
}



export interface DataSymbolOptions {
  strokeWidth: number;
  scale: number;
  baseSize: number;
  colorIndex?: number;
  opacity?: number;
  dashed: boolean;
  lighten?: boolean;
  isClip?: boolean;
  blackBorder?: boolean;
  borderStrokeWidth: number;
  datapoint?: Datapoint;
  pointerEnter?: (e: PointerEvent) => void;
  pointerLeave?: (e: PointerEvent) => void;
  click?: (e: MouseEvent) => void;
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
  protected _fill?: DataSymbolFillType;
  protected _shape?: DataSymbolShape;
  protected shapeInfo: Partial<Record<DataSymbolShape, ShapeInfo>>;

  static fromType(
    paraview: ViewContext,
    type: DataSymbolType,
    options?: Partial<DataSymbolOptions>,
  ) {
    let shape: DataSymbolShape, fill: DataSymbolFillType;
    if (type === 'default') {
      shape = 'circle';
      fill = 'outline';
      options ??= {};
      options.dashed = true;
    } else {
      [shape, fill] = type.split('.') as [DataSymbolShape, DataSymbolFillType];
    }
    return new DataSymbol(paraview, shape, fill, options);
  }

  constructor(
    paraview: ViewContext,
    shape: DataSymbolShape,
    fill: DataSymbolFillType,
    options?: Partial<DataSymbolOptions>,
  ) {
    super(paraview);
    this._options = {
      strokeWidth: options?.strokeWidth ?? this.paraview.paraState.config.chart.symbolStrokeWidth,
      scale: options?.scale ?? 1,
      baseSize: options?.baseSize ?? 1,
      colorIndex: options?.colorIndex,
      opacity: options?.opacity,
      dashed: options?.dashed ?? false,
      lighten: options?.lighten ?? false,
      isClip: options?.isClip ?? false,
      blackBorder: options?.blackBorder ?? false,
      borderStrokeWidth: options?.borderStrokeWidth ?? 1,
      datapoint: options?.datapoint ?? undefined,
      pointerEnter: options?.pointerEnter,
      pointerLeave: options?.pointerLeave,
      click: options?.click
    };
    this.shapeInfo = {};
    this.type = `${shape}.${fill}`;
    this._locOffset.x = this.width / 2;
    this._locOffset.y = this.height / 2;
  }

  get type(): DataSymbolType {
    return this._type;
  }

  set type(type: DataSymbolType) {
    this._type = type;
    const [shape, fill] = type.split('.');
    const size = this._options.baseSize ?? 1;
    this._shape = shape as DataSymbolShape;
    this._fill = fill as DataSymbolFillType;
    this._defsKey = `sym-${shape}-${fill}-${size}`;
    if (!this.paraview.defs[this._defsKey]) {
      this.paraview.addDef(this._defsKey, svg`
        <path
          id=${this._defsKey}
          d=${this._getShapeInfo(this.shape).path}
        />
      `);
    }
    this._updateStyleInfo();
    this._updateClassInfo();
  }

  protected _getShapeInfo(shape: DataSymbolShape): ShapeInfo {
    if (!this.shapeInfo[shape]) {
      switch (shape) {
        case 'circle':
          this.shapeInfo[shape] = circleInfo(this._options.baseSize * AREA);
          break;
        case 'square':
          this.shapeInfo[shape] = squareInfo(this._options.baseSize * AREA);
          break;
        case 'triangle_up':
          this.shapeInfo[shape] = triangleUpInfo(this._options.baseSize * AREA);
          break;
        case 'triangle_down':
          this.shapeInfo[shape] = triangleDownInfo(this._options.baseSize * AREA);
          break;
        case 'diamond':
          this.shapeInfo[shape] = diamondInfo(this._options.baseSize * AREA);
          break;
        case 'plus':
          this.shapeInfo[shape] = plusInfo(this._options.baseSize * AREA);
          break;
        case 'x':
          this.shapeInfo[shape] = xInfo(this._options.baseSize * AREA);
          break;
        case 'star':
          this.shapeInfo[shape] = starInfo(this._options.baseSize * AREA);
          break;
      }
    }

    return this.shapeInfo[shape]!;
  }

  get width() {
    return this._getShapeInfo(this.shape).baseWidth * this._options.scale;
  }

  get height() {
    return this._getShapeInfo(this.shape).baseHeight * this._options.scale;
  }

  get outerBbox() {
    return new DOMRect(
      this._x - this.width / 2 - this._options.scale * this._options.strokeWidth / 2,
      this._y - this.height / 2 - this._options.scale * this._options.strokeWidth / 2,
      this.width + this._options.scale * this._options.strokeWidth,
      this.height + this._options.scale * this._options.strokeWidth
    );
  }

  get shape() {
    if (this._shape) {
      return this._shape;
    }
    else {
      return this._type.split('.')[0] as DataSymbolShape;
    }
  }

  set shape(shape: DataSymbolShape) {
    this.type = (shape + '.' + this._type.split('.')[1]) as DataSymbolType;
  }

  get fill() {
    if (this._fill) {
      return this._fill
    }
    else {
      return this._type.split('.')[1] as DataSymbolFillType;
    }
  }

  set fill(fillType: DataSymbolFillType) {
    this.type = (this._type.split('.')[0] + '.' + fillType) as DataSymbolType;
  }

  get colorIndex() {
    return this._options.colorIndex;
  }

  set colorIndex(colorIndex: number | undefined) {
    this._options.colorIndex = colorIndex;
    this._updateStyleInfo();
    this._updateClassInfo();
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

  protected _updateClassInfo() {
    const numColors = this.paraview.paraState.colors.numSeriesColors;
    this._classInfo = {
      symbol: true,
      [this.fill]: true,
      ...(this._options.lighten ? { lighten: true } : {}),
      ...(this._options.colorIndex !== undefined && this._options.colorIndex >= 0
        ? { [`series-${this._options.colorIndex % numColors}`]: true }
        : {}),
    };
  }

  protected _updateStyleInfo() {
    this._styleInfo = {
      strokeWidth: this._options.strokeWidth,
    };
    if (this._options.dashed) {
      this._styleInfo.strokeDasharray = '1px 2px';
    }
    if (this._options.opacity !== undefined) {
      this._styleInfo.opacity = this._options.opacity;
    }
  }

  protected _blackBorderStyleInfo() {
    return {
      stroke: 'black',
      strokeWidth: this._options.strokeWidth + this._options.borderStrokeWidth,
      fill: 'none',
      pointerEvents: 'none'
    };
  }

  content() {
    if (this._options.datapoint) {
      const thresholds = this.paraview.paraState.thresholds;
      if (thresholds.length) {
        const i = thresholds.filter(t => t.orientation == 'horiz' && t.clipHeight < this.centerY).length;
        const j = thresholds.filter(t => t.orientation == 'vert' && t.clipWidth < this.centerX).length;
        const markerRegionIndex = j + i * (thresholds.filter(t => t.orientation == 'vert').length + 1);
        const config = SettingsManager.getGroupLinkForInstance<MarkerConfig>('marker', this.paraview.paraState.config, `threshold-${markerRegionIndex}`);
        if (config.isChangeThresholdHighlightColor) {
          this._styleInfo.stroke = 'red';
        }
      }
    }
    this._updateClassInfo();
    let transform;
    let shouldTransform = false;
    if (this._options.scale !== 1) {
      shouldTransform = true;
      transform = fixed`translate(${this._x},${this._y})`;
      transform += fixed` scale(${this._options.scale})`;
    }

    if (this.parent) {
      if (this._y < 0 || this._y > this.paraview.documentView!.chartLayers.dataLayer.height) {
        this.hidden = true;
      }
    }
    if (this.hidden) return svg``;
    if (this.paraview.paraState.colors.palette.isPattern && this._options.colorIndex !== undefined) {
      const index = this._options.colorIndex;
      const x = this._x - this.width / 2;
      const y = this._y - this.height / 2;
      return svg`
        <rect x=${x} y=${y} width=${this.width} height=${this.height}
          fill="white" stroke="none" />
        <rect x=${x} y=${y} width=${this.width} height=${this.height}
          fill="url(#Pattern${index})" stroke="none"
          @pointerenter=${this._options.pointerEnter ?? nothing}
          @pointerleave=${this._options.pointerLeave ?? nothing}
          @click=${this._options.click ?? nothing} />
      `;
    }
    return svg`
      ${this._options.blackBorder ? svg`
        <use
          href="#${this._defsKey}"
          style=${styleMap(this._blackBorderStyleInfo())}
          transform=${shouldTransform ? transform : nothing}
          x=${shouldTransform ? nothing : this._x}
          y=${shouldTransform ? nothing : this._y}
          clip-path=${nothing}
        />
      ` : nothing}
      <use
        href="#${this._defsKey}"
        id=${this._id || nothing}
        role=${this._role || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        transform=${shouldTransform ? transform : nothing}
        x=${shouldTransform ? nothing : this._x}
        y=${shouldTransform ? nothing : this._y}
        @pointerenter=${this._options.pointerEnter ?? nothing}
        @pointerleave=${this._options.pointerLeave ?? nothing}
        @click=${this._options.click ?? nothing}
        clip-path=${/*this._options.isClip ? 'url(#clip-path)' :*/ nothing}
      />
    `;
  }

}

export class DataSymbols {

  readonly shapes: readonly DataSymbolShape[] = [
    'circle', 'square', 'triangle_up', 'diamond', 'plus', 'star', 'triangle_down', 'x'
  ];

  readonly fills: readonly DataSymbolFillType[] = [
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