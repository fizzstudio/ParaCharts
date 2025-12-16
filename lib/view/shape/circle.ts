
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { type ShapeOptions, Shape } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface CircleOptions extends ShapeOptions {
  r: number;
}

export class CircleShape extends Shape {
  protected _r: number;

  constructor(paraview: ParaView, private options: CircleOptions) {
    super(paraview, options);
    this._r = options.r;
  }

  protected get _options(): CircleOptions {
    let options = super._options as CircleOptions;
    options.r = this._r;
    return options;
  }

  clone(): CircleShape {
    return new CircleShape(this.paraview, this._options);
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    super.y = y;
  }

  set loc(loc: Vec2) {
    this._loc = loc;
  }

  get r() {
    return this._r;
  }

  set r(r: number) {
    this._r = r;
  }

  render() {
    let index = this.parent?.index;
    if (this._options.isPattern && index !== undefined) {
      let parent = this.parent as DatapointView;
      this._styleInfo.fill = `url(#Pattern${index})`;

      if (this.paraview.store.isVisited(parent.seriesKey, index)) {
        this._styleInfo.stroke = this.paraview.store.colors.colorValue('visit');
        this._styleInfo.strokeWidth = 6;
      }

      return svg`
      <defs>${this.paraview.store.colors.patternValueAt(index)}</defs>
      <circle
        cx=${this._x}
        cy=${this._y}
        r=${this._r}
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role || nothing}
        transform=${this._scale !== 1
          ? `translate(${this._x},${this._y}) scale(${this._scale}) translate(${-this._x},${-this._y})`
          : nothing}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
      ></circle>
    `;
    } else {
      return svg`
      <circle
        cx=${this._x}
        cy=${this._y}
        r=${this._r}
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role || nothing}
        transform=${this._scale !== 1
          ? `translate(${this._x},${this._y}) scale(${this._scale}) translate(${-this._x},${-this._y})`
          : nothing}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
      ></circle>
    `;
    }
  }
}