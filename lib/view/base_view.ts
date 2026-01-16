/* ParaCharts: Base Views
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

import { type TemplateResult, svg, nothing } from 'lit';
import { svg as staticSvg, StaticValue } from 'lit/static-html.js';
import { ref } from 'lit/directives/ref.js';
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type Setting } from '../state';
import { type Shape } from './shape/shape';
import { Logger, getLogger } from '@fizz/logger';

/*import {
  HotkeyActionManager, EventActionManager, type KeyRegistrations, KeymapManager,
  type KeyDetails
} from '../input';
import { TodoEvent, type Actions } from '../input/actions';
import { type HotkeyInfo } from '../input/defaultactions';*/
import { fixed } from '../common/utils';
import { ParaView } from '../paraview';
import { Vec2 } from '../common/vector';
import { Popup } from './popup';

export type SnapLocation = 'start' | 'end' | 'center';

export type BboxAnchorSide = 'top' | 'bottom' | 'left' | 'right';
export type BboxAnchorCorner =
  | 'topLeft'
  | 'topRight'
  | 'bottomRight'
  | 'bottomLeft';
export type BboxAnchor = BboxAnchorSide | BboxAnchorCorner;

export interface PaddingInput {
  all?: number;
  horiz?: number;
  vert?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CollisionEscape {
  dists: number[];
  shortest: number;
}

export class Collision {

  constructor(
    protected _centerDiffX: number,
    protected _centerDiffY: number,
    protected _rSumX: number,
    protected _rSumY: number
  ) { }

  // {+x, -x, +y, -y}, shortest
  escape(): CollisionEscape {
    const padding = 0.001;
    const ed = [0, 0, 0, 0];
    if (this._centerDiffX > 0) {
      ed[0] = (this._rSumX - this._centerDiffX) + padding;
      ed[1] = -(this._rSumX + this._centerDiffX + padding);
    } else {
      ed[0] = (this._rSumX - this._centerDiffX) + padding;
      ed[1] = -(this._rSumX + this._centerDiffX + padding);
    }
    if (this._centerDiffY > 0) {
      ed[2] = (this._rSumY - this._centerDiffY) + padding;
      ed[3] = -(this._rSumY + this._centerDiffY + padding);
    } else {
      ed[2] = (this._rSumY - this._centerDiffY) + padding;
      ed[3] = -(this._rSumY + this._centerDiffY + padding);
    }
    let shortestEscape = 0;
    for (let i = 1; i < 4; i++) {
      if (Math.abs(ed[i]) < Math.abs(ed[shortestEscape])) {
        shortestEscape = i;
      }
    }
    return {
      dists: ed,
      shortest: shortestEscape,
    };
  }

  escapeVector(): { x: number, y: number } {
    const padding = 0.001;
    // these are both positive
    const hEscape = this._rSumX - Math.abs(this._centerDiffX);
    const vEscape = this._rSumY - Math.abs(this._centerDiffY);
    const ev = { x: 0, y: 0 };
    if (hEscape < vEscape) {
      ev.x = this._centerDiffX > 0
        ? hEscape + padding
        : -hEscape - padding;
    } else {
      ev.y = this._centerDiffY > 0
        ? vEscape + padding
        : -vEscape - padding;
    }
    return ev;
  }
}


export class BaseView {
  public log: Logger = getLogger("BaseView");

  readonly isContainer: boolean = false;

  get id() {
    return '';
  }

  get x() {
    return 0;
  }

  get y() {
    return 0;
  }

  get width() {
    return 0;
  }

  get height() {
    return 0;
  }

  set width(_newWidth: number) { }

  set height(_newHeight: number) { }

  get children(): readonly View[] {
    return [];
  }

  get padding(): Padding {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  set padding(_padding: PaddingInput | number) {
  }

  get hidden() {
    return false;
  }

  set hidden(_hidden: boolean) { }

  get el(): SVGElement | null {
    return null;
  }

  get styleInfo(): StyleInfo {
    return {};
  }

  get classInfo(): ClassInfo {
    return {};
  }

  renderChildren(): TemplateResult {
    return svg`${this.children.map(kid => kid.render())}`;
  }

  content(..._options: any[]): TemplateResult {
    return this.renderChildren();
  }

  render(...options: any[]): TemplateResult {
    return this.hidden ? svg`` : this.content(...options);
  }

}

/**
 * Something that is drawn within a rectangular bounding box
 * in the SVG element.
 * @public
 */
export class View extends BaseView {

  protected _id!: string;
  protected _parent: View | null = null;
  protected _prev: View | null = null;
  protected _next: View | null = null;
  protected _children: View[] = [];
  protected _loc = new Vec2();
  /** Offset of loc from top left corner of bbox */
  protected _locOffset = new Vec2();
  protected _width = -1;
  protected _height = -1;
  protected _canWidthFlex = false;
  protected _canHeightFlex = false;
  protected _isBubbleSizeChange = false;
  protected _currFocus: View | null = null;
  //protected _eventActionManager: EventActionManager<this> | null = null;
  //protected _hotkeyActionManager!: HotkeyActionManager<this>;
  //protected _keymapManager: KeymapManager | null = null;
  protected _padding: Padding = { top: 0, bottom: 0, left: 0, right: 0 };
  protected _hidden = false;
  protected _styleInfo: StyleInfo = {};
  protected _classInfo: ClassInfo = {};
  protected _isObserveStore = false;
  protected _isObserveNotices = false;
  protected _popup?: Popup;

  constructor(public readonly paraview: ParaView) {
    super();
    //this._setActions();
    //this.updateKeymap();
  }

  get id() {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    this.paraview.requestUpdate();
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: View | null) {
    if (parent && this._parent) {
      throw new Error('parent already set');
    }
    if (!parent) {
      if (this._parent) {
        this._parent._children.splice(this.index, 1);
        const parent = this._parent;
        this._parent = null;
        if (this._prev) {
          this._prev._next = this._next;
        }
        if (this._next) {
          this._next._prev = this._prev;
        }
        this._prev = null;
        this._next = null;
        this._removedFromParent();
        parent._didRemoveChild(this);
      }
      return;
    }
    // A view may have set its size before being parented, e.g.,
    // in the constructor
    if (this._width === -1 && this._height === -1) {
      this.updateSize();
    }
    this._parent = parent;
    // NB: we assume we've already been added to parent.children
    if (this.index) {
      this._prev = parent.children[this.index - 1];
      this._prev._next = this;
    }
    this._next = parent._children[this.index + 1] ?? null;
    if (this._next) {
      this._next._prev = this;
    }
    this._addedToParent();
    this._parent._didAddChild(this);
    if (!this._id) {
      // ID may have been set already, e.g., by a subclass constructor
      // NB: Use the setter here to allow datapoint views to hook into this
      // and register their ID
      this.id = this._createId();
    }
  }

  protected _createId(..._args: any[]) {
    return '';
  }

  protected _addedToParent() {
  }

  protected _removedFromParent() {
  }

  protected _didAddChild(_kid: View) {
    //this.updateSize();
  }

  protected _didRemoveChild(_kid: View) {
    //this.updateSize();
  }

  get children(): readonly View[] {
    return this._children;
  }

  get index() {
    return this._parent?._children.indexOf(this) ?? -1;
  }

  get isLast() {
    if (!this._parent) throw new Error('view has no parent');
    return this.index === this._parent._children.length - 1;
  }

  get isFocused() {
    return this._parent!.currFocus === this;
  }

  get loc() {
    return this._loc.clone();
  }

  set loc(loc: Vec2) {
    this._loc = loc;
  }

  get locOffset() {
    return this._locOffset.clone();
  }

  set locOffset(locOffset: Vec2) {
    this._locOffset = locOffset;
  }

  // XXX These next 4 accessors are for legacy compatibility
  protected get _x() {
    return this._loc.x;
  }

  protected set _x(x: number) {
    this._loc.x = x;
  }

  protected get _y() {
    return this._loc.y;
  }

  protected set _y(y: number) {
    this._loc.y = y;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  set x(newX: number) {
    this._x = newX;
  }

  set y(newY: number) {
    this._y = newY;
  }

  get width() {
    return /*this._hidden ? 0 :*/ this._width;
  }

  get height() {
    return /*this._hidden ? 0 :*/ this._height;
  }

  set width(newWidth: number) {
    const oldWidth = this._width;
    this._width = newWidth;
    if (oldWidth !== newWidth) {
      this._boundingSizeDidChange(oldWidth, this._height);
    }
  }

  set height(newHeight: number) {
    const oldHeight = this._height;
    this._height = newHeight;
    if (oldHeight !== newHeight) {
      this._boundingSizeDidChange(this._width, oldHeight);
    }
  }

  get paddedWidth() {
    return /*this._hidden ? 0 :*/ this.width + this._padding.left + this._padding.right;
  }

  get paddedHeight() {
    return /*this._hidden ? 0 :*/ this.height + this._padding.top + this._padding.bottom;
  }

  get padding(): Padding {
    return this._padding;
  }

  set padding(padding: PaddingInput | number) {
    const oldVertPad = this._padding.top + this._padding.bottom;
    const oldHorizPad = this._padding.left + this._padding.right;
    this._padding = this._expandPadding(padding);
    const sizeChanged = oldVertPad !== this._padding.top + this._padding.bottom
      || oldHorizPad !== this._padding.left + this._padding.right;
    if (sizeChanged) {
      this._boundingSizeDidChange(oldHorizPad + this._width, oldVertPad + this._height);
    }
  }

  get popup() {
    return this._popup
  }

  protected _expandPadding(padding: PaddingInput | number, defaults?: Padding): Padding {
    if (typeof padding === 'number') {
      return { top: padding, bottom: padding, left: padding, right: padding };
    } else {
      let out: Partial<Padding> = {};
      if (padding.all !== undefined) {
        out = { top: padding.all, bottom: padding.all, left: padding.all, right: padding.all };
      }
      if (padding.horiz !== undefined) {
        out.left = padding.horiz;
        out.right = padding.horiz;
      }
      if (padding.vert !== undefined) {
        out.top = padding.vert;
        out.bottom = padding.vert;
      }
      if (padding.top !== undefined) {
        out.top = padding.top;
      }
      if (padding.bottom !== undefined) {
        out.bottom = padding.bottom;
      }
      if (padding.left !== undefined) {
        out.left = padding.left;
      }
      if (padding.right !== undefined) {
        out.right = padding.right;
      }
      if (out.left === undefined) {
        out.left = defaults?.left ?? 0;
      }
      if (out.right === undefined) {
        out.right = defaults?.right ?? 0;
      }
      if (out.top === undefined) {
        out.top = defaults?.top ?? 0;
      }
      if (out.bottom === undefined) {
        out.bottom = defaults?.bottom ?? 0;
      }
      return out as Padding;
    }
  }

  get canWidthFlex() {
    return this._canWidthFlex;
  }

  set canWidthFlex(canWidthFlex: boolean) {
    this._canWidthFlex = canWidthFlex;
  }

  get canHeightFlex() {
    return this._canHeightFlex;
  }

  set canHeightFlex(canHeightFlex: boolean) {
    this._canHeightFlex = canHeightFlex;
  }

  get hidden() {
    return this._hidden;
  }

  set hidden(hidden: boolean) {
    // const oldBoundWidth = this.paddedWidth;
    // const oldBoundHeight = this.paddedHeight;
    this._hidden = hidden;
    // if (oldBoundWidth || oldBoundHeight) {
    //   this._boundingSizeDidChange(oldBoundWidth, oldBoundHeight);
    // }
  }

  get left() {
    return this.x - this._locOffset.x;
  }

  set left(left: number) {
    this.x = left + this._locOffset.x;
  }

  get paddedLeft() {
    return this.left - this._padding.left;
  }

  set paddedLeft(paddedLeft: number) {
    this.x = paddedLeft + this._padding.left + this._locOffset.x;
  }

  get right() {
    return this.left + this.width;
  }

  set right(right: number) {
    this.x = right - this.width + this._locOffset.x;
  }

  get paddedRight() {
    return this.right + this._padding.right;
  }

  set paddedRight(paddedRight: number) {
    this.x = paddedRight - this._padding.right - this.width + this._locOffset.x;
  }

  get centerX() {
    return this.left + this.width / 2;
  }

  set centerX(centerX: number) {
    this.x = centerX - this.width / 2 + this._locOffset.x;
  }

  get top() {
    return this.y - this._locOffset.y;
  }

  set top(top: number) {
    this.y = top + this._locOffset.y;
  }

  get paddedTop() {
    return this.top - this._padding.top;
  }

  set paddedTop(paddedTop: number) {
    this.y = paddedTop + this._padding.top + this._locOffset.y;
  }

  get bottom() {
    return this.top + this.height;
  }

  set bottom(bottom: number) {
    this.y = bottom - this.height + this._locOffset.y;
  }

  get paddedBottom() {
    return this.bottom + this._padding.bottom;
  }

  set paddedBottom(paddedBottom: number) {
    this.y = paddedBottom - this._padding.bottom - this.height + this._locOffset.y;
  }

  get centerY() {
    return this.top + this.height / 2;
  }

  set centerY(centerY: number) {
    this.y = centerY - this.height / 2 + this._locOffset.y;
  }

  get bbox(): DOMRect {
    return new DOMRect(this.left, this.top, this.width, this.height);
  }

  /**
   * Bounding box inclusive of stroke width
   */
  get outerBbox(): DOMRect {
    return this.bbox;
  }

  computeSize(): [number, number] {
    return [this.width, this.height];
  }

  setSize(width: number, height: number, isBubble = true) {
    const oldWidth = this._width;
    const oldHeight = this._height;
    this._width = width;
    this._height = height;
    const sizeChanged = oldWidth !== this._width || oldHeight !== this._height;
    if (sizeChanged) {
      this._boundingSizeDidChange(oldWidth, oldHeight, isBubble);
    }
  }

  resize(width: number, height: number) {
    this.setSize(width, height);
  }

  get isBubbleSizeChange() {
    return this._isBubbleSizeChange;
  }

  set isBubbleSizeChange(isBubbleSizeChange: boolean) {
    this._isBubbleSizeChange = isBubbleSizeChange;
  }

  protected _boundingSizeDidChange(_oldWidth: number, _oldHeight: number, isBubble = true) {
    // if (this._parent && (isBubble && this._isBubbleSizeChange)) {
    //   this._bubbleSizeChange();
    // }
    //this.paraview.requestUpdate();
  }

  protected _bubbleSizeChange() {
    this._parent!._childDidResize(this);
  }

  updateSize(isBubble = true) {
    this.setSize(...this.computeSize(), isBubble);
  }

  protected _childDidResize(_kid: View) {
    //this.updateSize();
  }

  snapXTo(other: View, where: SnapLocation) {
    if (where === 'start') {
      this.left = other.left;
    } else if (where === 'end') {
      this.right = other.right;
    } else {
      this.centerX = other.centerX;
    }
  }

  snapYTo(other: View, where: SnapLocation) {
    if (where === 'start') {
      this.top = other.top;
    } else if (where === 'end') {
      this.bottom = other.bottom;
    } else {
      this.centerY = other.centerY;
    }
  }

  get styleInfo() {
    return { ...this._styleInfo };
  }

  set styleInfo(styleInfo: StyleInfo) {
    this._styleInfo = { ...styleInfo };
  }

  get classInfo() {
    return { ...this._classInfo };
  }

  set classInfo(classInfo: ClassInfo) {
    this._classInfo = { ...classInfo };
  }

  get prev() {
    return this._prev;
  }

  get next() {
    return this._next;
  }

  get siblings(): readonly View[] {
    return this._parent!.children.filter(kid => kid !== this);
  }

  get withSiblings() {
    return this._parent!.children;
  }

  get cousins(): readonly View[] {
    return this._parent!.siblings.map(sib => sib.children[this.index]);
  }

  get withCousins(): readonly View[] {
    return this._parent!.withSiblings.map(view => view.children[this.index]);
  }

  get nextCousin(): View | null {
    if (!this._parent!.next) {
      return null;
    }
    return this.cousins[this._parent!.index];
  }

  get prevCousin(): View | null {
    if (!this._parent!.prev) {
      return null;
    }
    return this.cousins[this._parent!.index - 1];
  }

  get currFocus() {
    return this._currFocus;
  }

  set currFocus(view: View | null) {
    this._currFocus = view;
  }

  /*get eventActionManager() {
    return this._eventActionManager;
  }

  get hotkeyActionManager() {
    return this._hotkeyActionManager;
  }

  protected get _eventActions(): Actions<this> {
    return {};
  }

  protected get _hotkeyActions(): Actions<this> {
    return {};
  }

  get keymap(): KeyRegistrations {
    return {};
  }

  protected _setActions() {
    const eventActions = this._eventActions;
    if (Object.keys(eventActions).length) {
      this._eventActionManager = new EventActionManager(this, eventActions);
    }
    this._hotkeyActionManager = new HotkeyActionManager(this, this._hotkeyActions);
  }

  updateKeymap() {
    const keyMap = this.keymap;
    if (Object.keys(keyMap).length) {
      this._keymapManager = new KeymapManager(this);
    }
  }

  hotkeyInfo(key: string): HotkeyInfo | undefined {
    const action = this._keymapManager?.actionForKey(key);
    if (action) {
      return todo().canvas.hotkeyInfo(key, action, this);
    }
    if (this._parent) {
      return this._parent.hotkeyInfo(key);
    }
    return undefined;
  }*/

  intersects(other: View): Collision | null {
    const centerDiffX = this.centerX - other.centerX;
    const rSumX = other.paddedWidth / 2 + this.paddedWidth / 2;
    if (Math.abs(centerDiffX) >= rSumX) {
      return null;
    }
    const centerDiffY = this.centerY - other.centerY;
    const rSumY = other.paddedHeight / 2 + this.paddedHeight / 2;
    if (Math.abs(centerDiffY) >= rSumY) {
      return null;
    }
    return new Collision(centerDiffX, centerDiffY, rSumX, rSumY);
  }


  async focus(isNewComponentFocus = false, level = 0) {
    if (!this._parent) {
      return;
    }
    //this.siblings.forEach(sib => sib.isFocused = false);
    if (this._parent!.currFocus && this._parent!.currFocus !== this && !level) {
      // Only auto-blur at the bottom level to avoid setting the prev leaf twice
      await this._parent!.currFocus.blur(false);
    }
    this._parent!.currFocus = this;
    await this._parent!.focus(isNewComponentFocus, level + 1);
    if (this._currFocus) {
      if (!level) {
        await this.focusLeaf.onFocus(isNewComponentFocus);
      }
    } else {
      await this.onFocus(isNewComponentFocus);
    }
  }

  async onFocus(_isNewComponentFocus = false) {
  }

  async blur(parentOnFocus = true) {
    /*if (todo().canvas.documentView?.focusLeaf === this) {
      todo().canvas.prevFocusLeaf = this;
    }*/
    this._parent!.currFocus = null;
    await this.onBlur();
    if (parentOnFocus) {
      await this._parent!.onFocus();
    }
  }

  async onBlur() {
  }

  get focusLeaf(): View {
    return this._currFocus ? this._currFocus.focusLeaf : this;
  }

  protected _didAddChildToList(_child: View) { }

  append(child: View) {
    this._children.push(child);
    this._didAddChildToList(child);
    child.parent = this;
  }

  prepend(child: View) {
    this._children.unshift(child);
    this._didAddChildToList(child);
    child.parent = this;
  }

  insert(child: View, i: number) {
    this._children.splice(i, 0, child);
    this._didAddChildToList(child);
    child.parent = this;
  }

  remove() {
    this.parent = null;
  }

  reverseChildren() {
    this._children.reverse();
    this._children.forEach((kid, i) => {
      const tmp = kid._prev;
      kid._prev = kid._next;
      kid._next = tmp;
      // kid._index = i;
    });
  }

  sortChildren(cmpFunc: (a: typeof this.children[0], b: typeof this.children[0]) => number) {
    this._children.sort(cmpFunc);
    this._children.forEach((kid, i) => {
      if (i === 0) {
        kid._prev = null;
      } else {
        if (i === this._children.length - 1) {
          kid._next = null;
        }
        kid._prev = this._children[i - 1];
        kid._prev._next = kid;
      }
      // kid._index = i;
    });
  }

  clearChildren() {
    [...this._children].forEach(kid => {
      kid.remove();
    });
  }

  replaceChild(oldChild: View, newChild: View) {
    const i = oldChild.index;
    oldChild.remove();
    this.insert(newChild, i);
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this._children.forEach(kid => kid.settingDidChange(path, oldValue, newValue));
  }

  get isObserveStore() {
    return this._isObserveStore;
  }

  observeStore() {
    this._isObserveStore = true;
    if (this._parent) {
      this._parent.observeStore();
    }
  }

  async storeDidChange(key: string, value: any) {
    if (!this._isObserveStore) {
      return;
    }
    this._children.forEach(kid => {
      if (kid.isObserveStore) {
        kid.storeDidChange(key, value);
      }
    });
  }

  get isObserveNotices() {
    return this._isObserveNotices;
  }

  observeNotices() {
    this._isObserveNotices = true;
    if (this._parent) {
      this._parent.observeNotices();
    }
  }

  noticePosted(key: string, value: any) {
    if (!this._isObserveNotices) {
      return;
    }
    this._children.forEach(kid => {
      if (kid.isObserveNotices) {
        kid.noticePosted(key, value);
      }
    });
  }

  focusRingShape(): Shape | null {
    return null;
  }

  focusRingBbox(): DOMRect | null {
    return null;
  }

  pointerMove(){
    this.children.forEach(c => c.pointerMove())
  }

}

export interface ContainableI {
  // Having these defined here prevents TS errors
  get classInfo(): ClassInfo;
  get styleInfo(): StyleInfo;
  get role(): string;
  get roleDescription(): string;
  get ref(): ReturnType<typeof ref> | null;
}

type GConstructor<T = {}> = new (...args: any[]) => T;
type Containable = GConstructor<BaseView & Partial<ContainableI>>;

/**
 * @public
 */
export function Container<TBase extends Containable>(Base: TBase) {
  return class _Container extends Base {

    readonly isContainer = true;

    render() {
      if (this.hidden) {
        return svg``;
      }
      const tx = this.x + this.padding.left;
      const ty = this.y + this.padding.top;
      return staticSvg`
        <g
          ${this.ref}
          id=${this.id || nothing}
          class=${Object.keys(this.classInfo).length ? classMap(this.classInfo) : nothing}
          style=${Object.keys(this.styleInfo).length ? styleMap(this.styleInfo) : nothing}
          role=${this.role || nothing}
          aria-roledescription=${this.roleDescription || nothing}
          transform=${(tx || ty) ? fixed`translate(${tx},${ty})` : nothing}
        >
          ${this.content()}
        </g>
      `;
    }
  }
}
