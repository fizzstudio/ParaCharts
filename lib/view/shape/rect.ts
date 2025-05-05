
import { View } from '../base_view';

import { svg, css } from 'lit';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';
import { type ParaView } from '../../paraview';

export class Rect extends View {

  constructor(paraview: ParaView, width: number, height: number,
    protected _fill: string, protected _stroke: string = 'black', protected _strokeWidth: number = 2
  ) {
    super(paraview);
    this._width = width;
    this._height = height;
  }

  render() {
    const styles: StyleInfo = { 
      strokeWidth: this._strokeWidth,
      stroke: this._stroke,
      fill: this._fill
    };
    return svg`
      <rect
        style=${styleMap(styles)}
        x=${this._x}
        y=${this._y}
        width=${this.width}
        height=${this.height}
      ></rect>
    `;
  }

}