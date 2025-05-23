
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { type ShapeOptions, Shape } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

export interface SectorOptions extends ShapeOptions {
  r: number;
  /** Angle measure of sector arc */
  centralAngle: number;
  /** Rotation of sector; 0=left radius at 3 o'clock; positive=clockwise */
  orientationAngle: number;
  /** Set to a value < 1 for an annular sector */
  annularThickness?: number;
}

function radians(deg: number) {
  return deg*Math.PI*2/360;
}

function interp(a: number, b: number, t: number) {
  return a*(1 - t) + b*t;
}

export class Sector extends Shape {
  declare protected _options: SectorOptions;

  protected _startX!: number;
  protected _startY!: number;
  protected _endX!: number;
  protected _endY!: number;
  protected _arcLarge!: number;
  protected _arcSweep = 1;

  constructor(paraview: ParaView, options: SectorOptions) {
    super(paraview, options);
    this.computeLayout();
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    super.x = x;
    this.computeLayout();
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    super.y = y;
    this.computeLayout();
  }

  get startX() {
    return this._startX;
  }

  get startY() {
    return this._startY;
  }

  get endX() {
    return this._endX;
  }

  get endY() {
    return this._endY;
  }

  get arcCenter() {
    return new Vec2(
      this._x + this._options.r*Math.cos(
        radians(this._options.orientationAngle + this._options.centralAngle/2)),
      this._y + this._options.r*Math.sin(
        radians(this._options.orientationAngle + this._options.centralAngle/2))
    );
  }

  get orientationVector() {
    return this.arcCenter.subtract(new Vec2(this._x, this._y)).normalize();
  }

  computeLayout() {
    this._startX = this._x + this._options.r*Math.cos(
      radians(this._options.orientationAngle));
    this._startY = this._y + this._options.r*Math.sin(
      radians(this._options.orientationAngle));
    this._endX = this._x + this._options.r*Math.cos(
      radians(this._options.orientationAngle + this._options.centralAngle));
    this._endY = this._y + this._options.r*Math.sin(
      radians(this._options.orientationAngle + this._options.centralAngle));
    this._arcLarge = this._options.centralAngle >= 180 ? 1 : 0;
  }

  protected get _pathD() {
    let mx = this._x, my = this.y;
    let innerR = 0;
    if (this._options.annularThickness !== undefined) {
      innerR = this._options.r*(1 - this._options.annularThickness);
      mx = interp(this._x, this._startX, 1 - this._options.annularThickness);
      my = interp(this._y, this._startY, 1 - this._options.annularThickness);
    }
    return fixed`
      M${mx},${my}
      L${this._startX},${this._startY} 
      A${this._options.r},${this._options.r}
        0 ${this._arcLarge} ${this._arcSweep}
        ${this._endX},${this._endY}
      ${this._options.annularThickness !== undefined
        ? fixed`
          L${interp(this._endX, this._x, this._options.annularThickness)},
          ${interp(this._endY, this._y, this._options.annularThickness)}
          A${innerR},${innerR}
            0 ${this._arcLarge} ${1 - this._arcSweep}
            ${mx},${my}
        `
        : ''
      }
      Z`;
  }

  render() {
    return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this._styleInfo)}
        class=${classMap(this._classInfo)}
        role=${this._role || nothing}
        d=${this._pathD}
      ></path>
    `;
  }

}