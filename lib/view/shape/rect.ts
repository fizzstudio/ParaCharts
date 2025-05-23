
import { Shape, type ShapeOptions } from './shape';
import { type ParaView } from '../../paraview';
import { fixed } from '../../common/utils';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

export interface RectOptions extends ShapeOptions {
  width: number;
  height: number;
}

export class Rect extends Shape {

  constructor(paraview: ParaView, options: RectOptions) {
    super(paraview, options);
    this._width = options.width;
    this._height = options.height;
  }

  render() {
    return svg`
      <rect
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${styleMap(this._styleInfo)}
        class=${classMap(this._classInfo)}    
        role=${this._role ||  nothing}  
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        width=${fixed`${this.width}`}
        height=${fixed`${this.height}`}
      ></rect>
    `;
  }

}