/*
 * MIT License
 *
 * Copyright (c) 2022 Russell Samora
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { ParaChart } from '../parachart/parachart';

export type DecimalType = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;

export interface ParsedOffset {
  format: 'pixels' | 'percent';
  value: number;
}

export interface CallbackResponse {
  element: Element;
  index: number;
  direction?: 'up' | 'down';
  progress?: number;
  action?: Record<string, string>;
}

export type ScrollyEvent = 'stepEnter' | 'stepExit' | 'stepProgress';

export interface ScrollyStep {
  index: number;
  direction?: 'up' | 'down';
  height: number;
  node: Element;
  observers: {
    resize?: ResizeObserver;
    step?: IntersectionObserver;
    progress?: IntersectionObserver;
  };
  offset: ParsedOffset | null;
  action: Record<string, string>;
  top: number;
  progress: number;
  state?: 'enter' | 'exit';
}

export type DebugInfo = {
  id: string;
  step: ScrollyStep;
  marginTop: number;
  marginBottom?: number;
};

export type ScrollyOptions = {
  step: NodeList | HTMLElement[] | string;
  parent?: Document | Element;
  progress?: boolean;
  offset?: DecimalType;
  threshold?: 1 | 2 | 3 | 4;
  once?: boolean;
  debug?: boolean;
  container?: HTMLElement;
  root?: Element | Document | null;
  initialIndex?: number;
};

export class Scrollyteller {
  parachart: ParaChart | null;
  steps!: NodeListOf<Element>;

  constructor(chartID?: string) {
    this.parachart = chartID ?
      document.getElementById(chartID) as ParaChart | null
      : document.querySelector('para-chart-ai') as ParaChart | null;
    if (this.parachart) {
      this.init();
    }
  }

  init(): void {
    this.steps = document.querySelectorAll('[data-para-step]');
    const scroller = new Scrollytelling();

    scroller.setup({
      step: '[data-para-step]',
      offset: 0.5,
      progress: true,
      once: false,
      debug: false,
    });

    scroller.on('stepEnter', (response: CallbackResponse) => {
      const element = response.element;
      const stepIndex = parseInt((element as HTMLElement).dataset.paraStep || '0');
      console.warn('SCROLLER:', response, stepIndex);
      this.activateNextStep(element);
      
      if (this.parachart && response.action?.activate) {
        this.parachart.store.soloSeries = response.action.activate;
      }

      if (this.parachart && response.action?.highlight) {
        const highlights = response.action.highlight.replace(/[\[\]']+/g, '').split(',');
        console.warn('response.action.highlight', response.action.highlight)
        console.warn('response.action.highlight highlights', highlights)
        this.parachart.command('click', [`${highlights[0]}`, +highlights[1]]);
      }
    });

    this.steps[0].classList.add('para-active');
    // this.parachart.store.soloSeries = seriesKeys[0];
  }

  activateNextStep(nextStep: Element): void {
    this.steps.forEach(step => step.classList.remove('para-active'));
    nextStep.classList.add('para-active');
  }
}

export class Scrollytelling {

  steps: ScrollyStep[];
  private _events: Map<ScrollyEvent, Array<(response: CallbackResponse) => void>>;
  globalOffset?: ParsedOffset | null;
  containerElement?: HTMLElement;
  rootElement: Element | Document | null;
  progressThreshold: number; 
  isEnabled: boolean;
  isProgress: boolean;
  isDebug: boolean;
  isTriggerOnce: boolean;
  exclude: boolean[];
  currentScrollY: number;
  comparisonScrollY: number;
  direction?: 'up' | 'down';

  constructor() {
    // events
    this._events = new Map();

    // state
    this.steps = [];
    this.globalOffset = undefined;
    this.containerElement = undefined;
    this.rootElement = null;

    this.progressThreshold = 0;

    this.isEnabled = false;
    this.isProgress = false;
    this.isDebug = false;
    this.isTriggerOnce = false;

    this.exclude = [];

    // scroll direction state
    this.currentScrollY = 0;
    this.comparisonScrollY = 0;
    this.direction = undefined;

    // bound handlers
    this._handleScroll = this._handleScroll.bind(this);
    this._resizeStep = this._resizeStep.bind(this);
    this._intersectStep = this._intersectStep.bind(this);
    this._intersectProgress = this._intersectProgress.bind(this);
  }


  // internal helpers

  selectAll(
    selector: string | Element | NodeList | Element[],
    parent: Document | Element = document
  ): Element[] {
    if (typeof selector === 'string') {
      const selectees = Array.from(parent.querySelectorAll(selector));
      // console.warn('selectees', selectees)
      return selectees;
      // return Array.from(parent.querySelectorAll(selector));

    }
    if (selector instanceof Element) return [selector];
    if (selector instanceof NodeList) return Array.from(selector) as Element[];
    if (Array.isArray(selector)) return selector;
    return [];
  }

  getIndex(node: Element): number {
    const attr = node.getAttribute('data-scrollytelling-index');
    return attr ? +attr : 0;
  }

  indexSteps(steps: ScrollyStep[]): void {
    steps.forEach((step) =>
      step.node.setAttribute('data-scrollytelling-index', step.index.toString())
    );
  }

  getOffsetTop(node: Element): number {
    const { top } = node.getBoundingClientRect();
    const scrollTop = window.pageYOffset;
    const clientTop = document.body.clientTop || 0;
    return top + scrollTop - clientTop;
  }

  parseOffset(x: string | number | null | undefined): ParsedOffset | null {
    if (typeof x === 'string' && x.indexOf('px') > 0) {
      const v = +x.replace('px', '');
      if (!isNaN(v)) return { format: 'pixels', value: v };
      this.err('offset value must be in "px" format. Fallback to 0.5.');
      return { format: 'percent', value: 0.5 };
    } else if (typeof x === 'number' || (x != null && !isNaN(+x))) {
      const numValue = typeof x === 'number' ? x : +x;
      if (numValue > 1) this.err('offset value is greater than 1. Fallback to 1.');
      if (numValue < 0) this.err('offset value is lower than 0. Fallback to 0.');
      return { format: 'percent', value: Math.min(Math.max(0, numValue), 1) };
    }
    return null;
  }

  parseAction(action: string | undefined): Record<string, string> {
    if (!action) return {};
    const actions: Record<string, string> = {};
    const actionArray = action.split(')');
    actionArray.forEach(actionItem => {
      actionItem = actionItem.trim();
      if (actionItem) {
        const keyValueArray = actionItem.split('(');
        const actionName = keyValueArray[0].trim();
        actions[actionName] = keyValueArray[1].trim();
      }
    }); 
    // console.warn('actions', actions)
    return actions;
  }

  err(msg: string): void {
    console.error(`scrollytelling: ${msg}`);
  }

  createProgressThreshold(height: number, threshold: number): number[] {
    const count = Math.ceil(height / threshold);
    const t = [];
    const ratio = 1 / count;
    for (let i = 0; i < count + 1; i += 1) t.push(i * ratio);
    return t;
  }


  // ————— helpers —————
  _resetCallbacksAndExclusions(): void {
    this._events.clear();
    this.exclude = [];
  }

  // ————— Event Emitter ————— 
  on(event: ScrollyEvent, callback: (response: CallbackResponse) => void): this {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event)!.push(callback);
    return this;
  }

  once(event: ScrollyEvent, callback: (response: CallbackResponse) => void): this {
    const wrapper = (response: CallbackResponse) => {
      callback(response);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event?: ScrollyEvent, callback?: (response: CallbackResponse) => void): this {
    if (!event) {
      this._events.clear();
    } else if (!callback) {
      this._events.delete(event);
    } else {
      const listeners = this._events.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    }
    return this;
  }

  private emit(event: ScrollyEvent, response: CallbackResponse): void {
    const listeners = this._events.get(event);
    if (listeners) {
      listeners.slice().forEach(callback => callback(response));
    }
  }

  _disconnectObserver(
    observers: Record<string, { disconnect(): void }>
  ): void {
    Object.keys(observers).forEach((name) => observers[name].disconnect());
  }
  _disconnectObservers(): void {
    this.steps.forEach((s) => this._disconnectObserver(s.observers));
  }

  _handleEnable(shouldEnable: boolean): void {
    if (shouldEnable && !this.isEnabled) this._updateObservers();
    if (!shouldEnable && this.isEnabled) this._disconnectObservers();
    this.isEnabled = shouldEnable;
  }

  _notifyProgress(element: Element, progress?: number): void {
    const index = this.getIndex(element);
    const step = this.steps[index];
    if (progress !== undefined) step.progress = progress;
    const response = { element, index, progress, direction: this.direction };
    if (step.state === 'enter') this.emit('stepProgress', response);
  }

  _notifyStepEnter(element: Element): void {
    const index = this.getIndex(element);
    const step = this.steps[index];
    const response = { element, index, direction: this.direction, action: step.action };

    step.direction = this.direction;
    step.state = 'enter';

    if (!this.exclude[index]) this.emit('stepEnter', response);
    if (this.isTriggerOnce) this.exclude[index] = true;
  }

  _notifyStepExit(element: Element): boolean {
    const index = this.getIndex(element);
    const step = this.steps[index];
    if (!step.state) return false;

    const response = { element, index, direction: this.direction };

    if (this.isProgress) {
      if (this.direction === 'down' && step.progress < 1) this._notifyProgress(element, 1);
      else if (this.direction === 'up' && step.progress > 0) this._notifyProgress(element, 0);
    }

    step.direction = this.direction;
    step.state = 'exit';
    this.emit('stepExit', response);
    return true;
  }

  // ———— scroll tracking ————
  _handleScroll(): void {
    // window.innerHeight: the height of the visible content
    // document.body.scrollHeight: the total height of the entire content, including both the visible and hidden content
    // window.scrollY: the current vertical scroll position

    const scrollTop = this.containerElement ? this.containerElement.scrollTop : window.pageYOffset;
    // const pageTop = document.body.scrollTop;
    // const pageBottom = document.body.scrollHeight;
    // const currentScroll = window.scrollY + window.innerHeight;
    // let bottomScrollBuffer = 50;


    // console.log('currentScrollY', this.currentScrollY,
    //   '\n scrollY', window.scrollY,
    //   '\n pageTop', pageTop,
    //   '\n pageBottom', pageBottom)

    if (this.currentScrollY !== scrollTop) {
      this.currentScrollY = scrollTop;
      if (this.currentScrollY > this.comparisonScrollY) {
        this.direction = 'down';
      }
      else if (this.currentScrollY < this.comparisonScrollY) {
        this.direction = 'up';
      }
      this.comparisonScrollY = this.currentScrollY;

      // if (this.currentScrollY <= (pageTop + 5)) {
      //   // console.warn('pageTop', 
      //   //   this.steps[0].node
      //   // )
      //   this._notifyStepEnter(this.steps.at(0).node);
      // }
      // else if (currentScroll + bottomScrollBuffer >= pageBottom) {
      //   // console.warn('You are at the bottom!',
      //   //   '\n pageBottom', pageBottom,
      //   //   '\n currentScroll', currentScroll, 
      //   //   this.steps.at(-1).node
      //   // )
      //   this._notifyStepEnter(this.steps.at(-1).node);
      // }
    }
  }

  _setupScrollListener(): void {
    // Use a single listener on document; adjust direction per event
    document.removeEventListener('scroll', this._handleScroll);
    document.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  // ———— Observer callbacks ————
  _resizeStep(entries: ResizeObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];
    const index = this.getIndex(entry.target);
    const step = this.steps[index];
    const h = (entry.target as HTMLElement).offsetHeight;
    if (h !== step.height) {
      step.height = h;
      this._disconnectObserver(step.observers);
      this._updateResizeObserver(step);
      this._updateStepObserver(step);
      if (this.isProgress) this._updateProgressObserver(step);
    }
  }

  _intersectStep(entries: IntersectionObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];
    this._handleScroll(); // update direction
    const { isIntersecting, target } = entry;
    if (isIntersecting) this._notifyStepEnter(target);
    else this._notifyStepExit(target);
  }

  _intersectProgress(entries: IntersectionObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];
    const index = this.getIndex(entry.target);
    const step = this.steps[index];
    const { isIntersecting, intersectionRatio, target } = entry;
    if (isIntersecting && step.state === 'enter') {
      this._notifyProgress(target, intersectionRatio);
    }
  }

  // ———— Observer setup ————
  _updateResizeObserver(step: ScrollyStep): void {
    const observer = new ResizeObserver(this._resizeStep);
    observer.observe(step.node);
    step.observers.resize = observer;
  }
  _updateResizeObservers(): void {
    this.steps.forEach((s) => this._updateResizeObserver(s));
  }

  _updateStepObserver(step: ScrollyStep): void {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off!.format === 'pixels' ? 1 : h;
    const offset = off!.value * factor;
    const marginTop = step.height / 2 - offset;
    const marginBottom = step.height / 2 - (h - offset);
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    const root = this.rootElement;

    const threshold = 0.5;
    const options = { rootMargin, threshold, root };
    const observer = new IntersectionObserver(this._intersectStep, options);

    observer.observe(step.node);
    step.observers.step = observer;

    if (this.isDebug) this.updateDebug({ id: 'id', step, marginTop, marginBottom });
  }

  _updateStepObservers(): void {
    this.steps.forEach((s) => this._updateStepObserver(s));
  }

  _updateProgressObserver(step: ScrollyStep): void {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off!.format === 'pixels' ? 1 : h;
    const offset = off!.value * factor;
    const marginTop = -offset + step.height;
    const marginBottom = offset - h;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

    const threshold = this.createProgressThreshold(step.height, this.progressThreshold);
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(this._intersectProgress, options);

    observer.observe(step.node);
    step.observers.progress = observer;
  }
  _updateProgressObservers(): void {
    this.steps.forEach((s) => this._updateProgressObserver(s));
  }

  _updateObservers(): void {
    this._disconnectObservers();
    this._updateResizeObservers();
    this._updateStepObservers();
    if (this.isProgress) this._updateProgressObservers();
  }

  // ———— Public API ————
  setup({
    step,
    parent,
    offset = 0.5,
    threshold = 4,
    progress = false,
    once = false,
    debug = false,
    container = undefined,
    root = null,
    initialIndex,
  }: ScrollyOptions): Scrollytelling {
    this._setupScrollListener();

    this.steps = this.selectAll(step, parent).map((node, index) => ({
      index,
      direction: undefined,
      height: (node as HTMLElement).offsetHeight,
      node,
      observers: {},
      offset: this.parseOffset((node as HTMLElement).dataset.offset),
      action: this.parseAction((node as HTMLElement).dataset.paraAction),
      top: this.getOffsetTop(node),
      progress: 0,
      state: undefined,
    }));

    console.warn('SCROLLY: this.steps', this.steps);

    if (!this.steps.length) {
      this.err('no step elements');
      return this;
    }

    this.isProgress = progress;
    this.isTriggerOnce = once;
    this.isDebug = debug;
    this.progressThreshold = Math.max(1, +threshold);
    this.globalOffset = this.parseOffset(offset);
    this.containerElement = container;
    this.rootElement = root;

    this._resetCallbacksAndExclusions();
    this.indexSteps(this.steps);
    this._handleEnable(true);
    return this;
  }

  enable(): Scrollytelling {
    this._handleEnable(true);
    return this;
  }
  disable(): Scrollytelling {
    this._handleEnable(false);
    return this;
  }
  destroy(): Scrollytelling {
    this._handleEnable(false);
    this._resetCallbacksAndExclusions();
    document.removeEventListener('scroll', this._handleScroll);
    return this;
  }
  resize(): Scrollytelling {
    this._updateObservers();
    return this;
  }
  offset(x?: string | number): number | this {
    if (x === null || x === undefined) return this.globalOffset?.value ?? 0;
    this.globalOffset = this.parseOffset(x);
    this._updateObservers();
    return this;
  }

  // --- Debug helpers (no-op unless `debug: true`) ---

  updateDebug({ id, step, marginTop, marginBottom }: DebugInfo): void {
    const { index, height } = step;
    const className = `scrollytelling__debug-step--${id}-${index}`;
    let el = document.querySelector(`.${className}`);
    if (!el) el = this.createDebugEl(className);

    (el as HTMLElement).style.top = `${marginTop * -1}px`;
    (el as HTMLElement).style.height = `${height}px`;
    (el.querySelector('p') as HTMLElement).style.top = `${height / 2}px`;
  }

  createDebugEl(className: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `scrollytelling__debug-step ${className}`;
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.zIndex = '9999';
    el.style.borderTop = '2px solid black';
    el.style.borderBottom = '2px solid black';

    const p = document.createElement('p');
    p.style.position = 'absolute';
    p.style.left = '0';
    p.style.height = '1px';
    p.style.width = '100%';
    p.style.borderTop = '1px dashed black';

    el.appendChild(p);
    document.body.appendChild(el);
    return el;
  }
}
