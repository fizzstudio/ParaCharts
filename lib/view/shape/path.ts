
import { View } from '../base_view';
import { fixed, toFixed } from '../../common/utils';
import { type ParaView } from '../../paraview';

import { type Point } from '@fizz/chart-classifier-utils';

import { svg, css, nothing } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';

export interface PathOptions {
  x?: number;
  y?: number;
  points: Point[];
  style?: StyleInfo;
}

export class Path extends View {

  constructor(paraview: ParaView, protected _options: PathOptions) {
    super(paraview);
    this._x = _options.x ?? this._x;
    this._y = _options.y ?? this._y;
  }

  get options() {
    return this._options;
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
        style=${this._options.style ? styleMap(this._options.style) : nothing}      
        d=${this._pathD}
      ></path>
    `;
  }

}