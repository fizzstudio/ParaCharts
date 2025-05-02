
import { View } from '../base_view';
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';

import { svg, css } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';

export interface SectorOptions {
  x?: number;
  y?: number;
  r: number;
  /** Angle measure of sector arc */
  centralAngle: number;
  /** Rotation of sector; 0=left radius at 3 o'clock; positive=clockwise */
  orientationAngle: number;
  fill?: string;
  stroke?: string, // black
  strokeWidth?: number // 2
}

function radians(deg: number) {
  return deg*Math.PI*2/360;
}

export class Sector extends View {
  protected _startX!: number;
  protected _startY!: number;
  protected _endX!: number;
  protected _endY!: number;
  protected _arcLarge!: number;
  protected _arcSweep = 1;

  constructor(paraview: ParaView, protected _options: SectorOptions) {
    super(paraview);
    this._x = _options.x ?? this._x;
    this._y = _options.y ?? this._y;
    this.computeLayout();
  }

  get options() {
    return this._options;
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
    return {
      x: this._x + this._options.r*Math.cos(
        radians(this._options.orientationAngle + this._options.centralAngle/2)),
      y: this._y + this._options.r*Math.sin(
        radians(this._options.orientationAngle + this._options.centralAngle/2))
    };
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
    return fixed`
      M${this._x},${this._y}
      L${this._startX},${this._startY} 
      A${this._options.r},${this._options.r}
        0 ${this._arcLarge} ${this._arcSweep}
        ${this._endX},${this._endY}
      Z`;
  }

  render() {
    const styles: StyleInfo = { 
      strokeWidth: this._options.strokeWidth,
      stroke: this._options.stroke,
      fill: this._options.fill
    };
    return svg`
      <path
        style=${styleMap(styles)}
        d=${this._pathD}
      ></path>
    `;
  }

}