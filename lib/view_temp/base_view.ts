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

/*import { 
  HotkeyActionManager, EventActionManager, type KeyRegistrations, KeymapManager,
  type KeyDetails 
} from '../input';
import { TodoEvent, type Actions } from '../input/actions';
import { type HotkeyInfo } from '../input/defaultactions';*/
import { fixed } from '../common/utils';
import { ParaView } from './paraview';
//import { todo } from '../components/todochart';

export type SnapLocation = 'start' | 'end' | 'center';

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

export class BaseView {
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

  set width(_newWidth: number) {}

  set height(_newHeight: number) {}

  get children(): readonly View[] {
    return [];
  }

  get padding(): Padding {
    return {top: 0, bottom: 0, left: 0, right: 0};
  }

  set padding(_padding: PaddingInput | number) {
  }

  get hidden() {
    return false;
  }

  set hidden(_hidden: boolean) {}

  get el(): SVGElement | null {
    return null;
  }

  render(content?: TemplateResult): TemplateResult {
    return (this.hidden || !content) ? svg`` : content;
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
  protected _x = 0;
  protected _y = 0;
  protected _width = 0;
  protected _height = 0;
  protected _currFocus: View | null = null;
  //protected _eventActionManager: EventActionManager<this> | null = null;
  //protected _hotkeyActionManager!: HotkeyActionManager<this>;
  //protected _keymapManager: KeymapManager | null = null;
  protected _padding: Padding = {top: 0, bottom: 0, left: 0, right: 0};
  protected _hidden = false;

  constructor(public paraview: ParaView) {
    super();
    //this._setActions();
    //this.updateKeymap();
  }

  get id() {
    return this._id;
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
        this._prev =  null;
        this._next = null;
        parent._didRemoveChild(this);
      }
      return;
    }
    // Update the size without updating the parent
    this.updateSize();
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
      this._id = this._createId();
    }
  }

  protected _createId(..._args: any[]) {
    return '';
  }

  protected _addedToParent() {
  }

  protected _didAddChild(_kid: View) {
    this.updateSize();
  }

  protected _didRemoveChild(_kid: View) {
    this.updateSize();
  }

  get children(): readonly View[] {
    return this._children;
  }

  get index() {
    return this._parent?._children.indexOf(this) ?? -1;
  }

  get isFocused() {
    return this._parent!.currFocus === this;
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
    return this._hidden ? 0 : this._width;
  }

  get height() {
    return this._hidden ? 0 : this._height;
  }

  set width(newWidth: number) {
    const oldWidth = this._width;
    this._width = newWidth;
    if (this._parent && oldWidth !== newWidth) {
      this._boundingSizeDidChange();
    }
  }

  set height(newHeight: number) {
    const oldHeight = this._height;
    this._height = newHeight;
    if (this._parent && oldHeight !== newHeight) {
      this._boundingSizeDidChange();
    }
  }

  get boundingWidth() {
    return this._hidden ? 0 : this.width + this._padding.left + this._padding.right;
  }

  get boundingHeight() {
    return this._hidden ? 0 : this.height + this._padding.top + this._padding.bottom;
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
      this._boundingSizeDidChange();
    }
  }

  protected _expandPadding(padding: PaddingInput | number, defaults?: Padding): Padding {
    if (typeof padding === 'number') {
      return {top: padding, bottom: padding, left: padding, right: padding};
    } else {
      let out: Partial<Padding> = {};
      if (padding.all !== undefined) {
        out = {top: padding.all, bottom: padding.all, left: padding.all, right: padding.all};
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

  get hidden() {
    return this._hidden;
  }

  set hidden(hidden: boolean) {
    const oldBoundWidth = this.boundingWidth;
    const oldBoundHeight = this.boundingHeight;
    this._hidden = hidden;
    if (oldBoundWidth || oldBoundHeight) {
      this._boundingSizeDidChange();
    }
  }

  get left() {
    return this._x;
  }

  get right() {
    return this._x + this.boundingWidth;
  }

  get top() {
    return this._y;
  }

  get bottom() {
    return this._y + this.boundingHeight;
  }

  computeSize(): [number, number] {
    return [this.width, this.height];
  }

  setSize(width: number, height: number) {
    const oldWidth = this._width;
    const oldHeight = this._height;
    this._width = width;
    this._height = height;
    const sizeChanged = oldWidth !== this._width || oldHeight !== this._height;
    if (sizeChanged) {
      this._boundingSizeDidChange();
    }
  }

  protected _boundingSizeDidChange() {
    if (this._parent) {
      this._parent._childDidResize(this);
    }
    this.paraview.requestUpdate();
  }

  updateSize() {
    this.setSize(...this.computeSize());
  }

  protected _childDidResize(_kid: View) {
    this.updateSize();
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

  get sameIndexers(): readonly View[] {
    return this._parent!.siblings.map(sib => sib.children[this.index]);
  }

  get withSameIndexers(): readonly View[] {
    return this._parent!.withSiblings.map(view => view.children[this.index]);
  }

  get nextSameIndexer(): View | null {
    if (!this._parent!.next) {
      return null;
    }
    return this.sameIndexers[this._parent!.index];
  }

  get prevSameIndexer(): View | null {
    if (!this._parent!.prev) {
      return null;
    } 
    return this.sameIndexers[this._parent!.index - 1];
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

  focus(level = 0) {
    if (!this._parent) {
      return;
    }
    //this.siblings.forEach(sib => sib.isFocused = false);
    if (this._parent!.currFocus && this._parent!.currFocus !== this && !level) {
      // Only auto-blur at the bottom level to avoid setting the prev leaf twice
      this._parent!.currFocus.blur(false);
    }
    this._parent!.currFocus = this;
    this._parent!.focus(level + 1);
    if (!this._currFocus) {
      this.onFocus();
    }
  }

  onFocus() {
  }

  blur(parentOnFocus = true) {
    /*if (todo().canvas.documentView?.focusLeaf === this) {
      todo().canvas.prevFocusLeaf = this;
    }*/
    this._parent!.currFocus = null;
    this.onBlur();
    if (parentOnFocus) {
      this._parent!.onFocus();
    }
  }

  onBlur() {

  }

  get focusLeaf(): View {
    return this._currFocus ? this._currFocus.focusLeaf : this;
  }

  append(child: View) {
    this._children.push(child);
    child.parent = this;
  }

  prepend(child: View) {
    this._children.unshift(child);
    child.parent = this;
  }

  insert(child: View, i: number) {
    this._children.splice(i, 0, child);
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
    this._children.splice(0);
    this.updateSize();
  }

  replaceChild(oldChild: View, newChild: View) {
    const i = oldChild.index;
    oldChild.remove();
    this.insert(newChild, i);
  }

}

type Constructor<T extends BaseView> = new (...args: any[]) => T;

/**
 * @public
 */
export function Container<TBase extends Constructor<BaseView>>(Base: TBase) {
  return class _Container extends Base {

    get class() {
      return '';
    }

    get role() {
      return '';
    }

    get roleDescription() {
      return '';
    }

    get extraAttrs(): {attr: StaticValue, value: any}[] {
      return [];
    }

    get ref(): ReturnType<typeof ref> | null {
      return null;
    }

    renderChildren(): TemplateResult {
      return svg`${this.children.map(kid => kid.render())}`;
    }

    render(content?: TemplateResult) {
      const tx = this.x + this.padding.left;
      const ty = this.y + this.padding.top;
      return super.render(staticSvg`
        <g
          ${this.ref}
          id=${this.id || nothing}
          class=${this.class || nothing}
          role=${this.role || nothing}
          aria-roledescription=${this.roleDescription || nothing}
          transform=${tx || ty ? fixed`translate(${tx},${ty})` : nothing}
          ${this.extraAttrs.map(attrInfo => svg`
            ${attrInfo.attr}=${attrInfo.value}
          `)}
        >
          ${content ?? this.renderChildren()}
        </g>
      `);
    }
  }
}
