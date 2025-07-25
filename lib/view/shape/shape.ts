
import { View } from '../base_view';
import { fixed } from '../../common/utils';
import { type ParaView } from '../../paraview';

import { svg, css } from 'lit';
import { styleMap, type StyleInfo } from 'lit/directives/style-map.js';
import { classMap, type ClassInfo } from 'lit/directives/class-map.js';
import { type Ref, ref } from 'lit/directives/ref.js';

export interface ShapeOptions {
  x?: number;
  y?: number;
  fill?: string;
  stroke?: string; // black
  strokeWidth?: number; // 2,
  scale?: number;
  isPattern?: boolean;
}

export abstract class Shape extends View {
  protected _scale: number;
  protected _role = '';
  protected _ref: Ref<SVGElement> | null = null;
  protected _isPattern: boolean = false

  constructor(paraview: ParaView, options: ShapeOptions) {
    super(paraview);
    this._x = options.x ?? this._x;
    this._y = options.y ?? this._y;
    this._scale = options.scale ?? 1;
    // Don't create the fields in `_styleInfo` unless the options are
    // actually set
    if (options.strokeWidth) {
      this._styleInfo.strokeWidth = options.strokeWidth;
    }
    if (options.stroke) {
      this._styleInfo.stroke = options.stroke;
    }
    if (options.fill) {
      this._styleInfo.fill = options.fill;
    }
  }

  protected get _options(): ShapeOptions {
    return {
      x: this._x,
      y: this._y,
      fill: this._styleInfo.fill as string | undefined,
      stroke: this._styleInfo.stroke as string | undefined,
      strokeWidth: this._styleInfo.strokeWidth as number | undefined,
      scale: this._scale
    }
  }

  get role() {
    return this._role;
  }

  set role(role: string) {
    this._role = role;
  }

  get stroke(): string {
    if (this._styleInfo.stroke) {
      return this._styleInfo.stroke as string;
    }
    let cursor = this._parent;
    while (cursor) {
      if (cursor.styleInfo.stroke) {
        return cursor.styleInfo.stroke as string;
      }
      cursor = cursor.parent;
    }
    return this.paraview.store.settings.chart.stroke;
  }

  set stroke(stroke: string) {
    this._styleInfo.stroke = stroke;
  }

  get strokeWidth(): number {
    if (this._styleInfo.strokeWidth !== undefined) {
      return this._styleInfo.strokeWidth as number;
    }
    let cursor = this._parent;
    while (cursor) {
      if (cursor.styleInfo.strokeWidth !== undefined) {
        return cursor.styleInfo.strokeWidth as number;
      }
      cursor = cursor.parent;
    }
    return this.paraview.store.settings.chart.strokeWidth;
  }

  set strokeWidth(strokeWidth: number) {
    this._styleInfo.strokeWidth = strokeWidth;
  }

  get effectiveStrokeWidth(): number {
    return this.stroke === 'none' ? 0 : this.strokeWidth;
  }

  get fill() {
    return this._styleInfo.fill as string | undefined;
  }

  set fill(fill: string | undefined) {
    this._styleInfo.fill = fill;
  }

  get outerBbox() {
    return new DOMRect(
      this.left - this.effectiveStrokeWidth/2,
      this.top - this.effectiveStrokeWidth/2,
      this.width + this.effectiveStrokeWidth,
      this.height + this.effectiveStrokeWidth
    );
  }

  get scale() {
    return this._scale;
  }

  set scale(scale: number) {
    this._scale = scale;
  }

  get ref() {
    return this._ref;
  }

  set ref(ref: Ref<SVGElement> | null) {
    this._ref = ref;
  }

  abstract clone(): Shape;

}