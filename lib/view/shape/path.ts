
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { Shape, type ShapeOptions } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

export interface PathOptions extends ShapeOptions {
  points: Vec2[];
}

export class Path extends Shape {
  declare protected _options: PathOptions;

  constructor(paraview: ParaView, options: PathOptions) {
    super(paraview, options);
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
    return this._options.points.map(p => p.clone());
  }

  set points(points: Vec2[]) {
    this._options.points = points;
  }

  protected get _pathD() {
    const relPoints = this._options.points.map(p => p.add(this._loc));
    let d = fixed`M${relPoints[0].x},${relPoints[0].y}`;
    relPoints.slice(1).forEach(p => {
      d += fixed`L${p.x},${p.y}`;
    });
    return d;
  }

  render() {
    this.styleInfo.strokeWidth = this.options.strokeWidth
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