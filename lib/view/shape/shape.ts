
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