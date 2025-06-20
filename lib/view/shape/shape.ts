
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
  stroke?: string, // black
  strokeWidth?: number // 2
}

export abstract class Shape extends View {
  protected _role = '';
  protected _styleInfo: StyleInfo;
  protected _classInfo: ClassInfo = {};
  protected _ref: Ref<SVGElement> | null = null;

  constructor(paraview: ParaView, protected _options: ShapeOptions) {
    super(paraview);
    this._x = _options.x ?? this._x;
    this._y = _options.y ?? this._y;
    this._styleInfo = { 
      strokeWidth: this._options.strokeWidth,
      stroke: this._options.stroke,
      fill: this._options.fill
    };
  }

  get options() {
    return this._options;
  }

  get role() {
    return this._role;
  }

  set role(role: string) {
    this._role = role;
  }

  get stroke(): string {
    if (this._options.stroke) {
      return this._options.stroke;
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

  get strokeWidth(): number {
    if (this._options.strokeWidth !== undefined) {
      return this._options.strokeWidth;
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

  get effectiveStrokeWidth(): number {
    return this.stroke === 'none' ? 0 : this.strokeWidth;
  }

  get outerBbox() {
    return new DOMRect(
      this.left - this.effectiveStrokeWidth/2,
      this.top - this.effectiveStrokeWidth/2,
      this.width + this.effectiveStrokeWidth,
      this.height + this.effectiveStrokeWidth
    );
  }

  get styleInfo() {
    return this._styleInfo;
  }

  set styleInfo(styleInfo: StyleInfo) {
    this._styleInfo = styleInfo;
  }

  get classInfo() {
    return this._classInfo;
  }

  set classInfo(classInfo: ClassInfo) {
    this._classInfo = classInfo;
  }

  get ref() {
    return this._ref;
  }

  set ref(ref: Ref<SVGElement> | null) {
    this._ref = ref;
  }

}