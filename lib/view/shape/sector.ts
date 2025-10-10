
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
  /** Rotation of sector */
  orientationAngle: number;
  /** Whether increasing the orientation angle moves counterclockwise */
  orientationAngleCounterclockwise?: boolean;
  /** Set to a value < 1 for an annular sector */
  annularThickness?: number;
  /** Default is arc counterclockwise endpoint */
  arcCenterIsOrientationAnchor?: boolean;
  /** Default is 90 (midnight) */
  orientationAngleOffset?: number;
}

function radians(deg: number) {
  return deg*Math.PI/180;
}

function degrees(rad: number) {
  return rad*180/Math.PI;
}

function normalizeAngle(angle: number) {
  angle %= 360;
  return angle < 0 ? 360 + angle : angle;
}

function interp(a: number, b: number, t: number) {
  return a*(1 - t) + b*t;
}

export class SectorShape extends Shape {
  protected _r: number;
  protected _centralAngle: number;
  protected _orientationAngle: number;
  protected _orientationAngleCounterclockwise: boolean;
  protected _annularThickness: number | null = null;
  protected _arcCenterIsOrientationAnchor: boolean;
  protected _orientationAngleOffset: number;
  protected _startX!: number;
  protected _startY!: number;
  protected _endX!: number;
  protected _endY!: number;
  protected _arcLarge!: number;
  protected _arcSweep = 1;

  constructor(paraview: ParaView, private options: SectorOptions) {
    super(paraview, options);
    this._r = options.r;
    this._centralAngle = options.centralAngle;
    this._orientationAngle = options.orientationAngle;
    this._orientationAngleCounterclockwise = !!options.orientationAngleCounterclockwise;
    if (options.annularThickness) {
      this._annularThickness = options.annularThickness;
    }
    this._arcCenterIsOrientationAnchor = !!options.arcCenterIsOrientationAnchor;
    this._orientationAngleOffset = options.orientationAngleOffset ?? 90;
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
    options.orientationAngleCounterclockwise = this._orientationAngleCounterclockwise;
    if (this._annularThickness) {
      options.annularThickness = this._annularThickness;
    }
    options.arcCenterIsOrientationAnchor = this._arcCenterIsOrientationAnchor;
    options.orientationAngleOffset = this._orientationAngleOffset;
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

  protected _orientationAngleToPolar(angle: number) {
    return normalizeAngle((this._orientationAngleCounterclockwise
      ? angle
      : 360 - angle) + this._orientationAngleOffset);
  }

  protected _polarAngleToOrientation(angle: number) {
    const theta = angle - this._orientationAngleOffset;
    const normed = normalizeAngle(this._orientationAngleCounterclockwise
      ? theta
      : 360 - theta);
    return normed;
  }

  /**
   * Convert polar angle to Cartesian vector.
   * @returns Vector with origin at circle center, positive y UP
   */
  protected _angleToVector(angle: number): Vec2 {
    return new Vec2(
      this._r*Math.cos(radians(angle)),
      this._r*Math.sin(radians(angle))
    );
  }

  /**
   * Convert Cartesian vector to polar angle.
   */
  protected _vectorToAngle(v: Vec2): number {
    // Don't assume the vector is of radius length
    v = v.normalize();
    // xAngle will be between -90 and +90, so drop sign
    const xAngle = Math.abs(degrees(Math.asin(v.y)));
    if (v.x >= 0 && v.y >= 0) {
      return xAngle;
    } else if (v.x < 0 && v.y >= 0) {
      return 180 - xAngle;
    } else if (v.x < 0 && v.y < 0) {
      return 180 + xAngle;
    } else {
      return 360 - xAngle;
    }
  }

  get arcCenterAngle() {
    return this._orientationAngleToPolar(this._arcCenterIsOrientationAnchor
      ? this._orientationAngle
      : this._orientationAngle + this._centralAngle/2);
  }

  get arcCenter() {
    return this._angleToVector(this.arcCenterAngle).multiply(new Vec2(1, -1)).add(this._loc);
  }

  get arcLeftAngle() {
    return this._orientationAngleToPolar(this._arcCenterIsOrientationAnchor
      ? this._orientationAngle + this._centralAngle/2
      : this._orientationAngle);
  }

  get arcLeft() {
    return this._angleToVector(this.arcLeftAngle).multiply(new Vec2(1, -1)).add(this._loc);
  }

  get arcRightAngle() {
    return this._orientationAngleToPolar(this._arcCenterIsOrientationAnchor
      ? this._orientationAngle + this._centralAngle/2
      : this._orientationAngle + this._centralAngle);
  }

  get arcRight() {
    return this._angleToVector(this.arcRightAngle).multiply(new Vec2(1, -1)).add(this._loc);
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

  get orientationAngle() {
    return this._orientationAngle;
  }

  set orientationAngle(orientationAngle: number) {
    this._orientationAngle = orientationAngle;
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
    // Convert to polar coords
    const v = point.subtract(this._loc);
    v.y = -v.y;
    //let theta = v.y >= 0 ? Math.acos(v.x/v.length()) : -Math.acos(v.x/v.length());
    const theta = this._polarAngleToOrientation(this._vectorToAngle(v));
    const left = this._polarAngleToOrientation(this.arcLeftAngle);
    const right = this._polarAngleToOrientation(this.arcRightAngle);
    const withinArc = theta >= left
      && theta <= (right === 0 ? 360 : right);
    return (this._annularThickness === null || this._annularThickness === 1)
      ? withinArc && (v.length() <= this._r)
      : withinArc && (v.length() >= this._r - this._annularThickness*this._r);
  }

  computeLayout() {
    const thetaLeft = radians(this.arcLeftAngle);
    const thetaRight = radians(this.arcRightAngle);
    this._startX = this._x + this._r*Math.cos(thetaLeft);
    this._startY = this._y - this._r*Math.sin(thetaLeft);
    this._endX = this._x + this._r*Math.cos(thetaRight);
    this._endY = this._y - this._r*Math.sin(thetaRight);
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
        this._styleInfo.stroke = this.paraview.store.colors.colorValue('visit');
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
            clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
          ></path>
          <path
            ${this._ref ? ref(this._ref) : undefined}
            id=${this._id || nothing}
            style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
            class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
            role=${this._role || nothing}
            d=${this._pathD}
            transform=${this._scale !== 1
              ? `translate(${this._x},${this._y})
                    scale(${this._scale})
                    translate(${-this._x},${-this._y})`
              : nothing}
            clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
            @pointerenter=${this.options.pointerEnter ?? nothing}
            @pointerleave=${this.options.pointerLeave ?? nothing}
          ></path>
        `;
    }
    else {
      return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role || nothing}
        d=${this._pathD}
        transform=${this._scale !== 1
          ? `translate(${this._x},${this._y})
             scale(${this._scale})
             translate(${-this._x},${-this._y})`
          : nothing}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
      ></path>
    `;
    }
  }
}