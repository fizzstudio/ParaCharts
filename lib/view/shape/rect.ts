
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

export class RectShape extends Shape {

  constructor(paraview: ParaView, public options: RectOptions) {
    super(paraview, options);
    this._width = options.width;
    this._height = options.height;
    if (options.isPattern){
      this._isPattern = options.isPattern;
    }
  }

  protected get _options(): RectOptions {
    let options = super._options as RectOptions;
    options.width = this._width;
    options.height = this._height;
    options.isPattern = this._isPattern
    return options;
  }

  clone(): RectShape {
    return new RectShape(this.paraview, this._options);
  }

  render() {
    if (this._options.isPattern) {
      let index = this.parent!.parent!.index
      this._styleInfo.fill = `url(#Pattern${index})`
      return svg`
      <defs>${this.paraview.store.colors.patternValueAt(index)}</defs>
      <rect
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        width=${fixed`${this.width}`}
        height=${fixed`${this.height}`}
        fill="white"
        stroke-width=2
      ></rect>
      <rect
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role ||  nothing}
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        width=${fixed`${this.width}`}
        height=${fixed`${this.height}`}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
      ></rect>
    `;
    }
    else{
      return svg`
      <rect
        ${this._ref ? ref(this._ref) : undefined}
        id=${this._id || nothing}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this._role ||  nothing}
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        width=${fixed`${this.width}`}
        height=${fixed`${this.height}`}
        clip-path=${this._options.isClip ? 'url(#clip-path)' : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
      ></rect>
    `;
    }
  }

}