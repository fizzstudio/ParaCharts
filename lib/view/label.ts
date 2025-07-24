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
import { Vec2 } from '../common/vector';

export type LabelTextAnchor = 'start' | 'middle' | 'end';

export interface LabelOptions {
  id?: string;
  classList?: string[];
  role?: string;
  text: string;
  loc?: Vec2;
  x?: number;
  y?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  centerX?: number;
  centerY?: number;
  topLeft?: Vec2;
  topRight?: Vec2;
  bottomRight?: Vec2;
  bottomLeft?: Vec2;
  angle?: number;
  textAnchor?: LabelTextAnchor;
  justify?: SnapLocation;
  wrapWidth?: number;
  lineSpacing?: number;
}

interface TextLine {
  text: string;
  offset: number;
}

export interface LabelTextCorners {
  topLeft: Vec2;
  topRight: Vec2;
  bottomRight: Vec2;
  bottomLeft: Vec2;
}

export class Label extends View {

  public readonly classList: string[];

  protected _elRef: Ref<SVGTextElement> = createRef();
  protected _angle: number;
  protected _textAnchor: LabelTextAnchor;
  protected _justify: SnapLocation;
  protected _lineSpacing: number;
  protected _lineHeight!: number;
  protected _text: string;
  protected _textCornerOffsets!: LabelTextCorners;
  protected _textLines: TextLine[] = [];
  protected _styleInfo: StyleInfo = {};

  constructor(paraview: ParaView, private options: LabelOptions) {
    super(paraview);
    this.classList = options.classList ?? [];
    if (!this.classList.includes('label')) {
      this.classList.push('label');
    }
    this._angle = this.options.angle ?? 0;
    this._textAnchor = this.options.textAnchor ?? (options.wrapWidth ? 'start' : 'middle');
    this._justify = this.options.justify ?? 'start';
    this._lineSpacing = this.options.lineSpacing ?? 0;
    this._text = this.options.text;
    // It should be okay to go ahead and compute our size here, rather than
    // waiting to be parented
    this.updateSize();

    if (this.options.loc) {
      this._loc = this.options.loc;
    }
    if (this.options.x) {
      this._x = this.options.x;
    }
    if (this.options.y) {
      this._y = this.options.y;
    }
    if (this.options.left) {
      this.left = this.options.left;
    }
    if (this.options.right) {
      this.right = this.options.right;
    }
    if (this.options.top) {
      this.top = this.options.top;
    }
    if (this.options.bottom) {
      this.bottom = this.options.bottom;
    }
    if (this.options.centerX) {
      this.centerX = this.options.centerX;
    }
    if (this.options.centerY) {
      this.centerY = this.options.centerY;
    }
    if (this.options.topLeft) {
      this.topLeft = this.options.topLeft;
    }
    if (this.options.topRight) {
      this.topRight = this.options.topRight;
    }
    if (this.options.bottomRight) {
      this.bottomRight = this.options.bottomRight;
    }
    if (this.options.bottomLeft) {
      this.bottomLeft = this.options.bottomLeft;
    }
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

  get topLeft() {
    return this._loc.add(this._textCornerOffsets.topLeft);
  }

  set topLeft(topLeft: Vec2) {
    this._loc = topLeft.subtract(this._textCornerOffsets.topLeft);
  }

  get topRight() {
    return this._loc.add(this._textCornerOffsets.topRight);
  }

  set topRight(topRight: Vec2) {
    this._loc = topRight.subtract(this._textCornerOffsets.topRight);
  }

  get bottomRight() {
    return this._loc.add(this._textCornerOffsets.bottomRight);
  }

  set bottomRight(bottomRight: Vec2) {
    this._loc = bottomRight.subtract(this._textCornerOffsets.bottomRight);
  }

  get bottomLeft() {
    return this._loc.add(this._textCornerOffsets.bottomLeft);
  }

  set bottomLeft(bottomLeft: Vec2) {
    this._loc = bottomLeft.subtract(this._textCornerOffsets.bottomLeft);
  }

  get textCorners(): LabelTextCorners {
    return {
      topLeft: this.topLeft,
      topRight: this.topRight,
      bottomRight: this.bottomRight,
      bottomLeft: this.bottomLeft
    };
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
    this._locOffset.x = -(clientRect.x - canvasRect.x);
    this._locOffset.y = -(clientRect.y - canvasRect.y);

    let top = 0, bottom = 0, left = 0, right = 0;

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
          tspans.at(-1)!.setAttribute('dy', `${rect.height + this._lineSpacing}px`);
        }
      }

      const clientRect = text.getBoundingClientRect();
      width = clientRect.width;
      height = clientRect.height;

      this._locOffset.x = -(clientRect.x - canvasRect.x);
      this._locOffset.y = -(clientRect.y - canvasRect.y);

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
      // XXX needs testing
      tspans.forEach(t => {
        const numChars = t.getNumberOfChars();
        for (let i = 0; i < numChars; i++) {
          const extent = t.getExtentOfChar(i);
          top = Math.min(top, extent.y);
          bottom = Math.max(bottom, extent.y + extent.height);
          left = Math.min(left, extent.x);
          right = Math.max(right, extent.x + extent.width);
        }
      });
      this._lineHeight = tspans[0].getExtentOfChar(0).height;
      tspans.forEach(t => t.remove());
    } else {
      this._textLines = [];
      const numChars = text.getNumberOfChars();
      top = text.getExtentOfChar(0).y;
      bottom = text.getExtentOfChar(0).y + text.getExtentOfChar(0).height;
      left = text.getExtentOfChar(0).x;
      right = text.getExtentOfChar(numChars - 1).x + text.getExtentOfChar(numChars - 1).width;
      this._lineHeight = text.getExtentOfChar(0).height;
    }

    // Coord system is vertically mirrored, so flip the sign of the angle
    const topLeft = new Vec2(left, top).rotate(-this._angle*Math.PI/180);
    const topRight = new Vec2(right, top).rotate(-this._angle*Math.PI/180);
    const bottomRight = new Vec2(right, bottom).rotate(-this._angle*Math.PI/180);
    const bottomLeft = new Vec2(left, bottom).rotate(-this._angle*Math.PI/180);
    this._textCornerOffsets = {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft
    };

    text.remove();
    return [width, height] as [number, number];
  }

  protected _makeTransform() {
    let t: string | undefined;
    if (this._angle) {
      t = fixed`
        translate(${this._x},${this._y})
        rotate(${this._angle})
        translate(${-this._x},${-this._y})`;
    }
    return t;
  }

  render() {
    // TODO: figure out why `this._y` is larger here than for single line titles
    // HACK: divide `this._y` by 2 for `y` attribute value
    return svg`
      <text
        ${ref(this._elRef)}
        class=${this.options.classList?.join(' ') ?? nothing}
        role=${this.options.role ?? nothing}
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        text-anchor=${this._textAnchor}
        transform=${this._makeTransform() ?? nothing}
        id=${this.id}
        style=${styleMap(this._styleInfo)}
      >
        ${this._textLines.length
          ? this._textLines.map((line, i) =>
            svg`
              <tspan
                x=${fixed`${this._x + line.offset}`}
                dy=${i === 0 ? '0' : this._lineHeight + this._lineSpacing}
              >
                ${line.text}
              </tspan>
            `)
          : this._text ? this._text : unsafeHTML('&nbsp;')}
      </text>
    `;
  }

}
