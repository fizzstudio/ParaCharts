
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { Shape, type ShapeOptions } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface PathOptions extends ShapeOptions {
  points: Vec2[];
}

export class PathShape extends Shape {
  protected _points: Vec2[];

  constructor(paraview: ParaView, options: PathOptions) {
    super(paraview, options);
    this._points = options.points.map(p => p.clone());
  }

  protected get _options(): PathOptions {
    let options = super._options as PathOptions;
    options.points = this._points.map(p => p.clone());
    return options;
  }

  clone(): PathShape {
    return new PathShape(this.paraview, this._options);
  }

  get styleInfo(): StyleInfo {
    const style = super.styleInfo;
    style.fill = 'none'
    return style;
  }

  set styleInfo(styleInfo: StyleInfo) {
    super.styleInfo = styleInfo;
  }

  get points() {
    return this._points.map(p => p.clone());
  }

  set points(points: Vec2[]) {
    this._points = points.map(p => p.clone());
  }

  get xs() {
    return this._points.map(point => point.x);
  }

  get ys() {
    return this._points.map(point => point.y);
  }

  get width() {
    return Math.max(...this.xs) - Math.min(...this.xs); 
  }

  get height() {
    return Math.max(...this.ys) - Math.min(...this.ys); 
  }

  get left() {
    return this._x + Math.min(...this.xs);
  }

  set left(left: number) {
    this._x += left - this.left;
  }

  get right() {
    return this._x + Math.max(...this.xs);
  }

  set right(right: number) {
    this._x += right - this.right;
  }

  get top() {
    return this._y + Math.min(...this.ys);
  }

  set top(top: number) {
    this._y += top - this.top;
  }

  get bottom() {
    return this._y + Math.max(...this.ys);
  }

  set bottom(bottom: number) {
    this._y += bottom - this.bottom;
  }

  protected get _pathD() {
    const relPoints = this._points.map(p => p.add(this._loc));
    let d = fixed`M${relPoints[0].x},${relPoints[0].y}`;
    relPoints.slice(1).forEach(p => {
      d += fixed`L${p.x},${p.y}`;
    });
    return d;
  }

  render() {
    if (this.parent instanceof DatapointView){
      return svg`
      <defs>
        <clipPath id="chartbox">
          <rect x="0" y="0" width=${this.parent.chart.parent.logicalWidth} height=${this.parent.chart.parent.logicalHeight} />
        </clipPath>
      </defs>
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this.styleInfo)}
        class=${classMap(this._classInfo)}
        role=${this._role || nothing}
        d=${this._pathD}
        clip-path="url(#chartbox)"
      ></path>
    `;
    }
    else{
      return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this.styleInfo)}
        class=${classMap(this._classInfo)}
        role=${this._role || nothing}
        d=${this._pathD}
      ></path>
    `;
    }
  }

}