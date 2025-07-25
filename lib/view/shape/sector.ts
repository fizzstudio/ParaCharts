
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { type ShapeOptions, Shape } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface SectorOptions extends ShapeOptions {
  r: number;
  /** Angle measure of sector arc */
  centralAngle: number;
  /** Rotation of sector; 0=center of arc is at 3 o'clock; positive=clockwise */
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

export class SectorShape extends Shape {
  protected _r: number;
  protected _centralAngle: number;
  protected _orientationAngle: number;
  protected _annularThickness: number | null = null;
  protected _startX!: number;
  protected _startY!: number;
  protected _endX!: number;
  protected _endY!: number;
  protected _arcLarge!: number;
  protected _arcSweep = 1;

  constructor(paraview: ParaView, options: SectorOptions) {
    super(paraview, options);
    this._r = options.r;
    this._centralAngle = options.centralAngle;
    this._orientationAngle = options.orientationAngle;
    if (options.annularThickness) {
      this._annularThickness = options.annularThickness;
    }
    if (options.isPattern){
      this._isPattern = options.isPattern;
    }
    this.computeLayout();
  }

  protected get _options(): SectorOptions {
    let options = super._options as SectorOptions;
    options.r = this._r;
    options.centralAngle = this._centralAngle;
    options.orientationAngle = this._orientationAngle;
    if (this._annularThickness) {
      options.annularThickness = this._annularThickness;
    }
    if (this._isPattern){
      options.isPattern = this._isPattern
    }
    return options;
  }

  clone(): SectorShape {
    return new SectorShape(this.paraview, this._options);
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

  get loc() {
    return this._loc;
  }

  set loc(loc: Vec2) {
    this._loc = loc;
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
      this._x + this._r*Math.cos(radians(this._orientationAngle)),
      this._y + this._r*Math.sin(radians(this._orientationAngle))
    );
  }

  get arcLeft() {
    return new Vec2(
      this._x + this._r*Math.cos(radians(this._orientationAngle - this._centralAngle/2)),
      this._y + this._r*Math.sin(radians(this._orientationAngle - this._centralAngle/2))
    );
  }

  get arcRight() {
    return new Vec2(
      this._x + this._r*Math.cos(radians(this._orientationAngle + this._centralAngle/2)),
      this._y + this._r*Math.sin(radians(this._orientationAngle + this._centralAngle/2))
    );
  }

  get r() {
    return this._r;
  }

  set r(r: number) {
    this._r = r;
    this.computeLayout();
  }

  get centralAngle() {
    return this._centralAngle;
  }

  set centralAngle(centralAngle: number) {
    this._centralAngle = centralAngle;
    this.computeLayout();
  }

  get annularThickness() {
    return this._annularThickness;
  }

  set annularThickness(annularThickness: number | null) {
    this._annularThickness = annularThickness;
    this.computeLayout();
  }

  get orientationVector() {
    return this.arcCenter.subtract(this._loc).normalize();
  }

  containsPoint(point: Vec2) {
    const v = point.subtract(this._loc);
    let theta = v.y >= 0 ? Math.acos(v.x/v.length()) : -Math.acos(v.x/v.length());
    // if (theta < 0) {
    //   theta = 2*Math.PI + theta;
    // }
    const withinArc = theta >= radians(this._orientationAngle - this._centralAngle/2)
      && theta <= radians(this._orientationAngle + this._centralAngle/2);
    return (this._annularThickness === null || this._annularThickness === 1)
      ? withinArc
      : withinArc && (v.length() >= this._r - this._annularThickness*this._r);
  }

  computeLayout() {
    const thetaLeft = this._orientationAngle - this._centralAngle/2;
    const thetaRight = this._orientationAngle + this._centralAngle/2;
    this._startX = this._x + this._r*Math.cos(radians(thetaLeft));
    this._startY = this._y + this._r*Math.sin(radians(thetaLeft));
    this._endX = this._x + this._r*Math.cos(radians(thetaRight));
    this._endY = this._y + this._r*Math.sin(radians(thetaRight));
    this._arcLarge = this._centralAngle >= 180 ? 1 : 0;
  }

  protected get _pathD() {
    let mx = this._x, my = this.y;
    let innerR = 0;
    if (this._annularThickness !== null && this._annularThickness < 1) {
      innerR = this._r*(1 - this._annularThickness);
      mx = interp(this._x, this._startX, 1 - this._annularThickness);
      my = interp(this._y, this._startY, 1 - this._annularThickness);
    }
    return fixed`
      M${mx},${my}
      L${this._startX},${this._startY} 
      A${this._r},${this._r}
        0 ${this._arcLarge} ${this._arcSweep}
        ${this._endX},${this._endY}
      ${(this._annularThickness !== null && this._annularThickness < 1)
        ? fixed`
          L${interp(this._endX, this._x, this._annularThickness)},
          ${interp(this._endY, this._y, this._annularThickness)}
          A${innerR},${innerR}
            0 ${this._arcLarge} ${1 - this._arcSweep}
            ${mx},${my}
        `
        : ''
      }
      Z`;
  }

  render() {
    if (this._options.isPattern) {
      let index = this.parent!.index
      let parent = this.parent! as DatapointView
      this._styleInfo.fill = `url(#Pattern${index})`
      //I can't figure out why the visited styles don't auto-apply, so I'm doing it manually here
      if (this.paraview.store.isVisited(parent.seriesKey, index)) {
        this._styleInfo.stroke = this.paraview.store.colors.colorValue('highlight');
        this._styleInfo.strokeWidth = 6
      }
      return svg`
          <defs>${this.paraview.store.colors.patternValueAt(index)}</defs>
          <path
            d=${this._pathD}
            transform=${this._scale !== 1
          ? `translate(${this._x},${this._y})
                scale(${this._scale})
                translate(${-this._x},${-this._y})`
          : nothing}
            fill="white"
          stroke="black"
          stroke-width=4
          ></path>
          <path
            ${this._ref ? ref(this._ref) : undefined}
            id=${this._id || nothing}
            style=${styleMap(this._styleInfo)}
            class=${classMap(this._classInfo)}
            role=${this._role || nothing}
            d=${this._pathD}
            transform=${this._scale !== 1
          ? `translate(${this._x},${this._y})
                scale(${this._scale})
                translate(${-this._x},${-this._y})`
          : nothing}
          ></path>
        `;
    }
    else {
      return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this._styleInfo)}
        class=${classMap(this._classInfo)}
        role=${this._role || nothing}
        d=${this._pathD}
        transform=${this._scale !== 1
          ? `translate(${this._x},${this._y})
             scale(${this._scale})
             translate(${-this._x},${-this._y})`
          : nothing}
      ></path>
    `;
    }
  }
}