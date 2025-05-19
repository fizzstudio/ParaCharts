/* ParaCharts: Labels
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { nothing, svg } from 'lit';
import {type Ref, ref, createRef} from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { View, type SnapLocation } from '../view/base_view';
import { generateUniqueId, fixed } from '../common/utils';
import { ParaView } from '../paraview';
import { SVGNS } from '../common/constants';
import { type Vec2 } from '../common/vector';

export type LabelTextAnchor = 'start' | 'middle' | 'end';

export interface LabelOptions {
  id?: string;
  classList?: string[];
  role?: string;
  text: string;
  loc?: Vec2;
  x?: number;
  y?: number;
  angle?: number;
  textAnchor?: LabelTextAnchor;
  isPositionAtAnchor?: boolean;
  justify?: SnapLocation;
  wrapWidth?: number;
}

interface TextLine {
  text: string;
  offset: number;
}

export class Label extends View {

  public readonly classList: string[];

  protected _elRef: Ref<SVGTextElement> = createRef();
  protected _angle: number;
  protected _textAnchor: LabelTextAnchor;
  protected _justify: SnapLocation;
  protected _anchorXOffset!: number;
  protected _anchorYOffset!: number;
  protected _text: string;
  protected _textLines: TextLine[] = [];
  protected _styleInfo: StyleInfo = {};

  constructor(paraview: ParaView, private options: LabelOptions) {
    super(paraview);
    this.classList = options.classList ?? [];
    if (!this.classList.includes('label')) {
      this.classList.push('label');
    }
    if (this.options.loc) {
      this._loc = this.options.loc;
    }
    if (this.options.x) {
      this._x = this.options.x;
    }
    if (this.options.y) {
      this._y = this.options.y;
    }
    this._angle = this.options.angle ?? 0;
    this._textAnchor = this.options.textAnchor ?? (options.wrapWidth ? 'start' : 'middle');
    this._justify = this.options.justify ?? 'start';
    this._text = this.options.text;
    // It should be okay to go ahead and compute our size here, rather than
    // waiting to be parented
    this.updateSize();
  }

  protected _createId() {
    return this.options.id || generateUniqueId(this._text, this.paraview.store);
  }

  get el() {
    return this._elRef.value!;
  }

  get text() {
    return this._text;
  }

  set text(text: string) {
    this._text = text;
    this.updateSize();
    // updateSize() only requests an update if the size has changed
    this.paraview.requestUpdate();
  }

  get angle() {
    return this._angle;
  }

  set angle(newAngle: number) {
    this._angle = newAngle;
    this.updateSize();
  }

  get anchorXOffset() {
    return this._anchorXOffset;
  }

  get anchorYOffset() {
    return this._anchorYOffset;
  }

  get anchorX() {
    return this.options.isPositionAtAnchor ? this._x :  this._x + this._anchorXOffset;
  }

  get anchorY() {
    return this.options.isPositionAtAnchor ? this._y :  this._y + this._anchorYOffset;
  }

  get textAnchor() {
    return this._textAnchor;
  }

  set textAnchor(textAnchor: LabelTextAnchor) {
    this._textAnchor = textAnchor;
    this.updateSize();
  }

  get bbox() {
    return this._elRef.value!.getBBox();
  }

  get left() {
    return this.options.isPositionAtAnchor ? this._x - this._anchorXOffset : this._x;
  }

  get right() {
    return this.left + this.boundingWidth;
  }

  get top() {
    return this.options.isPositionAtAnchor ? this._y - this._anchorYOffset : this._y;
  }

  get bottom() {
    return this.top + this.boundingHeight;
  }

  get styleInfo() {
    return this._styleInfo;
  }

  set styleInfo(styleInfo: StyleInfo) {
    this._styleInfo = styleInfo;
  }
  
  computeSize() {
    // XXX Need to make sure the label gets rendered here with the
    // same font settings it will ultimately be displayed with
    const text = document.createElementNS(SVGNS, 'text');
    if (this.options.classList) {
      text.classList.add(...this.options.classList);
    }
    text.setAttribute('text-anchor', this._textAnchor);
    text.style.visibility = 'hidden';
    if (this._text) {
      // Don't insert arbitrary HTML
      text.textContent = this._text;
    } else {
      text.innerHTML = '&nbsp;';
    }

    // Any rotation seems to be ignored by getBbox().
    // However, it is taken into account for getBoundingClientRect().
    if (this._angle) {
      // No need for extra translations since we're at the origin
      text.setAttribute('transform', `rotate(${this._angle})`);
    }
    // WAS `root`
    //this.paraview.renderRoot!.append(text);
    this.paraview.root!.append(text);

    const canvasRect = this.paraview.root?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    const clientRect = text.getBoundingClientRect();
    let width = clientRect.width;
    let height = clientRect.height;
    // E.g., suppose text-anchor is middle. The text baseline center will be
    // positioned at the origin of the view box, and the left half of the label
    // will extend into the negative x-axis. 
    this._anchorXOffset = -(clientRect.x - canvasRect.x);
    this._anchorYOffset = -(clientRect.y - canvasRect.y);
    //console.log('LABEL', this._text, this._anchorXOffset, this._anchorYOffset, clientRect);

    if (this.options.wrapWidth !== undefined && width > this.options.wrapWidth) {
      text.textContent = '';
      const tokens = this._text.split(' ');
      const tspans: SVGTSpanElement[] = [document.createElementNS(SVGNS, 'tspan')];
      tspans.at(-1)!.textContent = tokens.shift()!;
      text.append(tspans.at(-1)!);
      while (tokens.length) {
        const tok = tokens.shift()!;
        const tspan = tspans.at(-1)!;
        const oldContent = tspan.textContent!;
        tspan.textContent += ' ' + tok;
        let rect = tspan.getBoundingClientRect();
        if (rect.width >= this.options.wrapWidth) {
          tspan.textContent = oldContent;
          tspans.push(document.createElementNS(SVGNS, 'tspan'));
          text.append(tspans.at(-1)!);
          tspans.at(-1)!.textContent = tok;
          tspans.at(-1)!.setAttribute('x', '0');
          tspans.at(-1)!.setAttribute('dy', '1.5rem');
        }
      }

      const clientRect = text.getBoundingClientRect();
      width = clientRect.width;
      height = clientRect.height;

      this._anchorXOffset = -(clientRect.x - canvasRect.x);
      this._anchorYOffset = -(clientRect.y - canvasRect.y);
  
      this._textLines = tspans.map(t => ({text: t.textContent!, offset: 0}));

      if (this._justify !== 'start') {
        tspans.forEach((tspan, i) => {
          const spanRect = tspan.getBoundingClientRect();
          let x = width - spanRect.width;
          if (this._justify === 'center') {
            x = x/2;
          }
          this._textLines[i].offset = x;
        });
      }
  
      tspans.forEach(t => t.remove());
    } else {
      this._textLines = [];
    }

    text.remove();
    return [width, height] as [number, number];
  }

  protected _makeTransform() {
    let t: string | undefined;
    if (this._angle) {
      t = fixed`
        translate(${this.anchorX},${this.anchorY})
        rotate(${this._angle})
        translate(${-this.anchorX},${-this.anchorY})`;
    }
    return t;
  }

  render() {
    // TODO: figure out why `this._y` is larger here than for single line titles
    // HACK: divide `this._y` by 2 for `y` attribute value
    if (this.options!.classList?.includes('radial-value-label') || this.options!.classList?.includes('bar-label')){
      this.styleInfo.fill = this.paraview.store.colors.contrastValueAt(this.parent!.index)
    }
    return svg`
      <text 
        ${ref(this._elRef)}
        class=${this.options.classList?.join(' ') ?? nothing} 
        role=${this.options.role ?? nothing}
        x=${fixed`${this.anchorX}`}
        y=${fixed`${this.anchorY}`}
        text-anchor=${this._textAnchor}
        transform=${this._makeTransform() ?? nothing}
        id=${this.id}
        style=${styleMap(this._styleInfo)}
      >
        ${this._textLines.length
          ? this._textLines.map((line, i) => 
            svg`
              <tspan x=${fixed`${this._x + line.offset}`} dy=${i === 0 ? '0' : '1.5rem'}>
                ${line.text}
              </tspan>
            `)
          : this._text ? this._text : unsafeHTML('&nbsp;')}
      </text>
    `;
  }

}
