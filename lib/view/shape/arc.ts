import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { type ShapeOptions, Shape } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface ArcOptions extends ShapeOptions {
  r: number;
  points: Vec2[];
}

export class ArcShape extends Shape {
  protected _r: number;
  protected _points: Vec2[];

  constructor(paraview: ParaView, private options: ArcOptions) {
    super(paraview, options);
    this._points = options.points.map(p => p.clone());
    this._r = options.r;
  }

  protected get _options(): ArcOptions {
    const options = super._options as ArcOptions;
    options.points = this._points.map(p => p.clone());
    options.r = this._r;
    return options;
  }
  clone(): ArcShape {
    return new ArcShape(this.paraview, this._options);
  }

  get r() {
    return this._r;
  }

  set r(r: number) {
    this._r = r;
  }

  protected get _pathD() {
    const relPoints = this._points;
    if (!relPoints.length) {
      return '';
    }
    let d = fixed`M${relPoints[0].x},${relPoints[0].y}`;
    for (let i = 1; i < relPoints.length; i++) {
      const p = relPoints[i];
      d += fixed` A${this._r},${this._r} 0 0,0 ${p.x},${p.y}`;
    }
    return d;
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
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role || nothing}
        d=${this._pathD}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
      ></path>
    `;
    } else {
      return svg`
      <path
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role || nothing}
        d=${this._pathD}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
      ></path>
    `;
    }
  }
}