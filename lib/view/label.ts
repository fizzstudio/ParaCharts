/* ParaCharts: Labels
Copyright (C) 2025 Fizz Studio

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
import { type Ref, ref, createRef } from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

import { View, type SnapLocation, type BboxAnchorCorner } from '../view/base_view';
import { generateUniqueId, fixed } from '../common/utils';
import { type ViewContext } from './view_context';
import { SVGNS } from '../common/constants';
import { Vec2 } from '../common/vector';
import { ConfigSetting } from '../config/config_types';

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
  hasBackground?: boolean;
  pointerEnter?: (e: PointerEvent) => void;
  pointerLeave?: (e: PointerEvent) => void;
  pointerMove?: (e: PointerEvent) => void;
  click?: (e: MouseEvent) => void;
}

interface TextLine {
  text: string;
  offset: number;
}

export type LabelTextCorners = Record<BboxAnchorCorner, Vec2>;

export class Label extends View {

  protected _elRef: Ref<SVGTextElement> = createRef();
  protected _angle: number;
  protected _textAnchor: LabelTextAnchor;
  protected _justify: SnapLocation;
  protected _lineSpacing: number;
  protected _lineHeight!: number;
  protected _text: string;
  protected _textCornerOffsets!: LabelTextCorners;
  protected _textLines: TextLine[] = [];

  constructor(paraview: ViewContext, private options: LabelOptions) {
    super(paraview);
    this._canWidthFlex = true;
    this._canHeightFlex = true;
    if (options.classList) {
      if (!options.classList.includes('label')) {
        options.classList.push('label');
      }
      if (paraview.paraState.config.chart.isTactileEnabled && !options.classList.includes('tactile')) {
        options.classList.push('tactile');
      }
      this._classInfo = Object.fromEntries(options.classList.map(cls => [cls, true]));
    } else {
      this._classInfo = {
        label: true,
        tactile: paraview.paraState.config.chart.isTactileEnabled
      };
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
    return this.options.id || generateUniqueId(this._text, this.paraview.paraState);
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
    // Disallow angled (but not vertical) text in tactile mode
    return (this.paraview.paraState.config.chart.isTactileEnabled && this._angle % 90)
      ? 0
      : this._angle;
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

  // get bbox() {
  //   return this._elRef.value!.getBBox();
  // }

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

  get topNormal(): Vec2 {
    return new Vec2(0, 1).rotate(this.angle*Math.PI/180);
  }

  get bottomNormal(): Vec2 {
    return new Vec2(0, -1).rotate(this.angle*Math.PI/180);
  }

  get leftNormal(): Vec2 {
    return new Vec2(-1, 0).rotate(this.angle*Math.PI/180);
  }

  get rightNormal(): Vec2 {
    return new Vec2(1, 0).rotate(this.angle*Math.PI/180);
  }

  get topLeftNormal(): Vec2 {
    return this.topNormal.add(this.leftNormal).normalize();
  }

  get topRightNormal(): Vec2 {
    return this.topNormal.add(this.rightNormal).normalize();
  }

  get bottomRightNormal(): Vec2 {
    return this.bottomNormal.add(this.rightNormal).normalize();
  }

  get bottomLeftNormal(): Vec2 {
    return this.bottomNormal.add(this.leftNormal).normalize();
  }

  addClass(cls: string) {
    this._classInfo[cls] = true;
  }

  removeClass(cls: string) {
    delete this._classInfo[cls];
  }

  resize(width: number, height: number): void {
    // pretend to resize for grid layout
  }

  computeSize(): [number, number] {
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
    this.paraview.root!.append(text);

    let bbox = text.getBBox();
    let width = bbox.width;
    let height = bbox.height;
    const wrapMode = this.options.wrapWidth !== undefined && width > this.options.wrapWidth;
    if (wrapMode || this._text.includes('\n')) {
      text.textContent = '';
      const tspans: SVGTSpanElement[] = [document.createElementNS(SVGNS, 'tspan')];
      const tokens = this._text.split(wrapMode ? /(\s+)/ : /(\n+)/);
      // XXX Assumes first token is non-whitespace
      tspans.at(-1)!.textContent = tokens.shift()!;
      text.append(tspans.at(-1)!);
      while (tokens.length) {
        const tok = tokens.shift()!;
        if (tok.includes('\n')) {
          tspans.push(document.createElementNS(SVGNS, 'tspan'));
          const tspan = tspans.at(-1)!;
          text.append(tspan);
          tspan.textContent = tok;
          tspan.setAttribute('x', '0');
          const tspanBbox = this._getTextBBox(tspans.at(-2)!);
          tspan.setAttribute('dy', `${tspanBbox.height + this._lineSpacing}px`);
          continue;
        }
        if (!tok.match(/\w/)) {
          // only whitespace
          continue;
        }
        const tspan = tspans.at(-1)!;
        const oldContent = tspan.textContent;
        if (wrapMode) {
          tspan.textContent += ' ' + tok;
          const tspanBbox = this._getTextBBox(tspan);
          if (tspanBbox.width >= this.options.wrapWidth!) {
            tspan.textContent = oldContent;
            tspans.push(document.createElementNS(SVGNS, 'tspan'));
            text.append(tspans.at(-1)!);
            tspans.at(-1)!.textContent = tok;
            tspans.at(-1)!.setAttribute('x', '0');
            tspans.at(-1)!.setAttribute('dy', `${tspanBbox.height + this._lineSpacing}px`);
          }
        } else {
          tspan.textContent = tok;
          const tspanBbox = this._getTextBBox(tspan);
          if (tspans.length > 1) {
            tspans.at(-1)!.setAttribute('x', '0');
            tspans.at(-1)!.setAttribute('dy', `${tspanBbox.height + this._lineSpacing}px`);
          }
        }
      }

      bbox = text.getBBox();
      [width, height] = this._measureOuterBbox(bbox);
      this._textLines = tspans.map(t => ({ text: t.textContent!, offset: 0 }));

      if (this._justify !== 'start' && this.textAnchor === undefined) {
        tspans.forEach((tspan, i) => {
          const tspanBbox = this._getTextBBox(tspan);
          let x = width - tspanBbox.width;
          if (this._justify === 'center') {
            x = x / 2;
          }
          this._textLines[i].offset = x;
        });
      }

      this._lineHeight = tspans[0].getExtentOfChar(0).height;
      tspans.forEach(t => t.remove());
    } else {
      [width, height] = this._measureOuterBbox(bbox);
    }

    text.remove();
    return [width, height];
  }

  /**
   * Compute the bounding box of a text-containing element.
   * Works even for tspans when the chart is scaled (getBBox() has problems).
   */
  protected _getTextBBox(el: SVGTextContentElement): DOMRect {
    const n = el.getNumberOfChars();
    const minX = el.getExtentOfChar(0).x;
    const maxX = el.getExtentOfChar(n - 1).x + el.getExtentOfChar(n - 1).width;
    const minYs: number[] = [];
    for (let i = 0; i < n; i++) {
      minYs.push(el.getExtentOfChar(i).y);
    }
    const maxYs: number[] = [];
    for (let i = 0; i < n; i++) {
      maxYs.push(el.getExtentOfChar(i).y + el.getExtentOfChar(i).height);
    }
    const minY = Math.min(...minYs);
    const maxY = Math.max(...maxYs);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  /**
   * Given the axis-aligned bbox of a text element positioned at the origin,
   * rotates the provided bbox, then computes an outer,
   * axis-aligned bbox of the rotated bbox, and returns the size
   * of the outer bbox. Also computes and sets `_locOffset` and
   * `_textCornerOffsets`.
   */
  protected _measureOuterBbox(bbox: SVGRect): [number, number] {
    const toRads = Math.PI/180;
    // Coord system is vertically mirrored, so flip the sign of the angle
    const theta = -this.angle*toRads;
    const left = bbox.x;
    const right = left + bbox.width;
    const top = bbox.y;
    const bottom = top + bbox.height;
    if (theta) {
      const topLeft = new Vec2(left, top).rotate(theta);
      const topRight = new Vec2(right, top).rotate(theta);
      const bottomRight = new Vec2(right, bottom).rotate(theta);
      const bottomLeft = new Vec2(left, bottom).rotate(theta);
      const minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
      const maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
      const minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
      const maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
      this._locOffset.x = -minX;
      this._locOffset.y = -minY;
      this._textCornerOffsets = {
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
      };
      return [maxX - minX, maxY - minY];
    } else {
      const topLeft = new Vec2(left, top);
      const topRight = new Vec2(right, top);
      const bottomRight = new Vec2(right, bottom);
      const bottomLeft = new Vec2(left, bottom);
      this._locOffset.x = -left;
      this._locOffset.y = -top;
      this._textCornerOffsets = {
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
      };
      return [bbox.width, bbox.height];
    }
  }

  protected _makeTransform() {
    let t: string | undefined;
    if (this.angle) {
      t = fixed`
        translate(${this._x},${this._y})
        rotate(${this.angle})
        translate(${-this._x},${-this._y})`;
    }
    return t;
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting) {
    this.updateSize();
    super.settingDidChange(path, oldValue, newValue);
  }

  protected _renderRect(flag: boolean, cls: string) {
    const tln = this.topLeftNormal.multiplyScalar(4);
    const trn = this.topRightNormal.multiplyScalar(4);
    const brn = this.bottomRightNormal.multiplyScalar(4);
    const bln = this.bottomLeftNormal.multiplyScalar(4);
    return svg`
      ${flag
        ? svg`
          <path
            class=${cls}
            d="
              M${this.topLeft.x + tln.x},${this.topLeft.y - tln.y}
              L${this.topRight.x + trn.x},${this.topRight.y - trn.y}
              L${this.bottomRight.x + brn.x},${this.bottomRight.y - brn.y}
              L${this.bottomLeft.x + bln.x},${this.bottomLeft.y - bln.y}
              Z"
            width=${this._width}
            height=${this._height}
          ></path>
        `
        : ''
      }
    `;
  }

  renderHighlight(type: 'fg' | 'bg') {
    return this._renderRect(true, `view-highlight-${type}`);
  }

  render() {
    // TODO: figure out why `this._y` is larger here than for single line titles
    // HACK: divide `this._y` by 2 for `y` attribute value
    return svg`
      ${this._renderRect(!!this.options.hasBackground, 'label-bg')}
      <text
        ${ref(this._elRef)}
        class=${Object.keys(this._classInfo).length ? classMap(this._classInfo) : nothing}
        role=${this.options.role ?? nothing}
        x=${fixed`${this._x}`}
        y=${fixed`${this._y}`}
        text-anchor=${this._textAnchor !== 'start' ? this._textAnchor : nothing}
        transform=${this._makeTransform() ?? nothing}
        id=${this.id}
        style=${Object.keys(this._styleInfo).length ? styleMap(this._styleInfo) : nothing}
        @pointerenter=${this.options.pointerEnter ?? nothing}
        @pointerleave=${this.options.pointerLeave ?? nothing}
        @pointermove=${this.options.pointerMove ?? nothing}
        @click=${this.options.click ?? nothing}
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
