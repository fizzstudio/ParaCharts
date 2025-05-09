
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { Shape, type ShapeOptions } from './shape';

import { type Point } from '@fizz/chart-classifier-utils';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

export interface PathOptions extends ShapeOptions {
  points: Point[];
}

export class Path extends Shape {
  declare protected _options: PathOptions;

  constructor(paraview: ParaView, options: PathOptions) {
    super(paraview, options);
  }

  protected get _pathD() {
    const relPoints = this._options.points.map(p => ({x: p.x + this._x, y: p.y + this._y}));
    let d = fixed`M${relPoints[0].x},${relPoints[0].y}`;
    relPoints.slice(1).forEach(p => {
      d += fixed`L${p.x},${p.y}`;
    });
    return d;
  }

  render() {
    return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this._styleInfo)}
        class=${classMap(this._classInfo)}
        d=${this._pathD}
      ></path>
    `;
  }

}