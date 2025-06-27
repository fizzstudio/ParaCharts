
import { Shape, type ShapeOptions } from './shape';
import { type ParaView } from '../../paraview';
import { fixed } from '../../common/utils';

import { svg, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DatapointView } from '../data';

export interface RectOptions extends ShapeOptions {
  width: number;
  height: number;
}

export class RectShape extends Shape {

  constructor(paraview: ParaView, options: RectOptions) {
    super(paraview, options);
    this._width = options.width;
    this._height = options.height;
  }

  protected get _options(): RectOptions {
    let options = super._options as RectOptions;
    options.width = this._width;
    options.height = this._height;
    return options;
  }

  clone(): RectShape {
    return new RectShape(this.paraview, this._options);
  }

  render() {
    if (this.paraview.store.colors.palette.isPattern && this.parent! instanceof DatapointView) {
      let index = 0
      if (this.parent! instanceof DatapointView){
        index = this.parent!.parent!.index
      }
      this._styleInfo.fill = `url(#Pattern${index})`
      return svg`
      <defs>${this.paraview.store.colors.patternValueAt(index)}</defs>
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
    else{
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

}