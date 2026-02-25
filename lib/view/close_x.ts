
import { View, Container } from './base_view';
import { type ParaView } from '../paraview';
import { CircleShape, PathShape } from './shape';
import { Vec2 } from '../common';
import { svg, TemplateResult } from 'lit';

const R = 20;

export class CloseXView extends Container(View) {
  protected _circle: CircleShape;
  protected _x1: PathShape;
  protected _x2: PathShape;

  constructor(paraview: ParaView, protected _onClick: () => void) {
    super(paraview);
    this._locOffset.x = R;
    this._locOffset.y = R;
    this._circle = new CircleShape(paraview, {r: R, fill: 'cornflowerblue'});
    this._x1 = new PathShape(paraview, {
      x: this._x,
      y: this._y,
      points: [new Vec2(-R/2, -R/2), new Vec2(R/2, R/2)],
      stroke: 'white',
      strokeWidth: 2,
    });
    this._x2 = new PathShape(paraview, {
      x: this._x,
      y: this._y,
      points: [new Vec2(-R/2, R/2), new Vec2(R/2, -R/2)],
      stroke: 'white',
      strokeWidth: 2,
    });
    this.append(this._circle);
    this.append(this._x1);
    this.append(this._x2);
  }

  computeSize(): [number, number] {
    return [2*R, 2*R];
  }

  content(): TemplateResult {
    return svg`
      <g @click=${this._onClick}>
        ${super.content()}
      </g>
    `;
  }
}