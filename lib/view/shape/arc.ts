import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';
import { type ShapeOptions, Shape } from './shape';
import { Vec2 } from '../../common/vector';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface ArcSegment {
  start: Vec2;
  end: Vec2;
  largeArc: 0 | 1;
  sweep: 0 | 1;
}

export interface ArcOptions extends ShapeOptions {
  r: number;
  segments: ArcSegment[];
}

export class ArcShape extends Shape {
  protected _r: number;
  protected _segments: ArcSegment[];

  constructor(paraview: ParaView, private options: ArcOptions) {
    super(paraview, options);
    this._r = options.r;
    this._segments = options.segments.map(seg => ({
      start: seg.start.clone(),
      end: seg.end.clone(),
      largeArc: seg.largeArc,
      sweep: seg.sweep
    }));
  }

  protected get _options(): ArcOptions {
    const options = super._options as ArcOptions;
    options.r = this._r;
    options.segments = this._segments.map(seg => ({
      start: seg.start.clone(),
      end: seg.end.clone(),
      largeArc: seg.largeArc,
      sweep: seg.sweep
    }));
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
    if (!this._segments.length) {
      return '';
    }

    const first = this._segments[0];
    let d = fixed`M${first.start.x},${first.start.y}`;

    for (const seg of this._segments) {
      d += fixed` A${this._r},${this._r} 0 ${seg.largeArc},${seg.sweep} ${seg.end.x},${seg.end.y}`;
    }

    return d;
  }

  render() {
    let index = this.parent?.index;

    if (this._options.isPattern && index !== undefined) {
      let parent = this.parent as DatapointView;
      this._styleInfo.fill = `url(#Pattern${index})`;

      if (this.paraview.paraState.isVisited(parent.seriesKey, index)) {
        this._styleInfo.stroke = this.paraview.paraState.colors.colorValue('visit');
        this._styleInfo.strokeWidth = 6;
      }

      return svg`
        <defs>${this.paraview.paraState.colors.patternValueAt(index)}</defs>
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
