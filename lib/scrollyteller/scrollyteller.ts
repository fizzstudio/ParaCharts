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

export interface ScrollyOptions {
  step: string | Element | NodeList | Element[];
  parent?: string;
  offset?: string | number;
  threshold?: number;
  progress?: boolean;
  once?: boolean;
  container?: HTMLElement;
  root?: Element | Document | null;
};

export class Scrollyteller {
  private parachart: ParaChart;
  private steps!: NodeListOf<Element>;
  private settings!: any;


  constructor(
    parachart?: ParaChart,
    chartID?: string,
  ) {
    // HACK: needed to assign something to this.parachart
    this.parachart = parachart as ParaChart;
    this.settings = this.parachart.paraView.store.settings.scrollytelling;
    if (this.settings.isScrollytellingEnabled) {

      if (!this.parachart) {
        this.parachart = chartID ?
          document.getElementById(chartID) as ParaChart
          : document.querySelector('para-chart, para-chart-ai') as ParaChart;

        if (!this.parachart) {
          throw new Error(
            `Scrollyteller requires a ParaChart element. ${chartID
              ? `No element found with ID "${chartID}"`
              : 'No "para-chart" element found on page'
            }`
          );
        }
      }

      this.init();
    }

  }

  private init(): void {
    this.steps = document.querySelectorAll('[data-para-step]');
    const scroller = new ScrollytellerEngine();

    scroller.setup({
      step: '[data-para-step]',
      offset: 0.5,
      progress: true,
      once: false,
    });

    scroller.on('stepEnter', (response: CallbackResponse) => {
      const element = response.element;
      this.activateNextStep(element);

      // TODO: remove previous series highlights
      // this.parachart.store.soloSeries = '';
      if (response.action?.highlightSeries) {
        // TODO: remove inserted tab when `soloSeries` takes comma/space delimiter
        const seriesList = response.action.highlightSeries.replace(/[\s,]/g, '\t');
        //this.parachart.store.soloSeries = seriesList;
        this.parachart.store.lowlightOtherSeries(...seriesList.split('\t'));
      }

      // TODO: remove previous datapoint highlights
      // this.parachart.command('click', []);
      if (response.action?.highlightDatapoint) {
        const highlights = response.action.highlightDatapoint.replace(/[\[\]']+/g, '').split(',');
        this.parachart.command('click', [`${highlights[0]}`, +highlights[1]]);
      }

      // TODO: add appropriate aria-live descriptions of highlighted series, groups, and datapoints
      if (this.settings.isScrollyAnnouncementsEnabled) {
        console.log('Add scrollytelling aria-live descriptions of highlights')
      }

      // TODO: add sonifications
      if (this.settings.isScrollySoniEnabled) {
        console.log('Add scrollytelling sonifications')
      }
    });

    this.steps[0].classList.add('para-active');
  }

  private activateNextStep(nextStep: Element): void {
    this.steps.forEach(step => step.classList.remove('para-active'));
    nextStep.classList.add('para-active');
  }
}

export class ScrollytellerEngine {

  private steps: ScrollyStep[];
  private _events: Map<ScrollyEvent, Array<(response: CallbackResponse) => void>>;
  private globalOffset: ParsedOffset;
  private containerElement?: HTMLElement;
  private rootElement: Element | Document | null;
  private progressThreshold: number;
  private isEnabled: boolean;
  private isProgress: boolean;
  private isTriggerOnce: boolean;
  private exclude: boolean[];
  private currentScrollY: number;
  private comparisonScrollY: number;
  private direction?: 'up' | 'down';

  constructor() {
    this._events = new Map();
    this.steps = [];
    this.globalOffset = { format: 'percent', value: 0.5 };
    this.containerElement = undefined;
    this.rootElement = null;

    this.progressThreshold = 0;

    this.isEnabled = false;
    this.isProgress = false;
    this.isTriggerOnce = false;

    this.exclude = [];

    this.currentScrollY = 0;
    this.comparisonScrollY = 0;
    this.direction = undefined;

    this._handleScroll = this._handleScroll.bind(this);
    this._resizeStep = this._resizeStep.bind(this);
    this._intersectStep = this._intersectStep.bind(this);
    this._intersectProgress = this._intersectProgress.bind(this);
  }

  // internal helpers

  private selectAll(
    selector: string | Element | NodeList | Element[],
    parent: Document | Element = document
  ): Element[] {
    if (typeof selector === 'string') {
      return Array.from(parent.querySelectorAll(selector));
    }
    if (selector instanceof Element) return [selector];
    if (selector instanceof NodeList) return Array.from(selector) as Element[];
    if (Array.isArray(selector)) return selector;
    return [];
  }

  private getIndex(node: Element): number {
    const attr = node.getAttribute('data-scrollytelling-index');
    return attr ? +attr : 0;
  }

  private indexSteps(steps: ScrollyStep[]): void {
    steps.forEach((step) =>
      step.node.setAttribute('data-scrollytelling-index', step.index.toString())
    );
  }

  private getOffsetTop(node: Element): number {
    const { top } = node.getBoundingClientRect();
    const scrollTop = window.pageYOffset;
    const clientTop = document.body.clientTop || 0;
    return top + scrollTop - clientTop;
  }

  private parseOffset(x?: string | number): ParsedOffset {
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
    return { format: 'percent', value: 0.5 };
  }

  private parseAction(action: string | undefined): Record<string, string> {
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
    return actions;
  }

  private err(msg: string): void {
    console.error(`scrollytelling: ${msg}`);
  }

  private createProgressThreshold(height: number, threshold: number): number[] {
    const count = Math.ceil(height / threshold);
    const t = [];
    const ratio = 1 / count;
    for (let i = 0; i < count + 1; i += 1) t.push(i * ratio);
    return t;
  }

  private _resetExclusions(): void {
    this.exclude = [];
  }

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
      listeners.forEach(callback => callback(response));
    }
  }

  private _disconnectObserver(
    observers: Record<string, { disconnect(): void }>
  ): void {
    Object.keys(observers).forEach((name) => observers[name].disconnect());
  }
  private _disconnectObservers(): void {
    this.steps.forEach((s) => this._disconnectObserver(s.observers));
  }

  private _handleEnable(shouldEnable: boolean): void {
    if (shouldEnable && !this.isEnabled) this._updateObservers();
    if (!shouldEnable && this.isEnabled) this._disconnectObservers();
    this.isEnabled = shouldEnable;
  }

  private _notifyProgress(element: Element, progress?: number): void {
    const index = this.getIndex(element);
    const step = this.steps[index];
    if (progress !== undefined) step.progress = progress;
    const response = { element, index, progress, direction: this.direction };
    if (step.state === 'enter') this.emit('stepProgress', response);
  }

  private _notifyStepEnter(element: Element): void {
    const index = this.getIndex(element);
    const step = this.steps[index];
    const response = { element, index, direction: this.direction, action: step.action };

    step.direction = this.direction;
    step.state = 'enter';

    if (!this.exclude[index]) this.emit('stepEnter', response);
    if (this.isTriggerOnce) this.exclude[index] = true;
  }

  private _notifyStepExit(element: Element): boolean {
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

  private _handleScroll(): void {
    const scrollTop = this.containerElement ? this.containerElement.scrollTop : window.pageYOffset;
    if (this.currentScrollY !== scrollTop) {
      this.currentScrollY = scrollTop;
      if (this.currentScrollY > this.comparisonScrollY) {
        this.direction = 'down';
      }
      else if (this.currentScrollY < this.comparisonScrollY) {
        this.direction = 'up';
      }
      this.comparisonScrollY = this.currentScrollY;
    }
  }

  private _setupScrollListener(): void {
    document.removeEventListener('scroll', this._handleScroll);
    document.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  private _resizeStep(entries: ResizeObserverEntry[]): void {
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

  private _intersectStep(entries: IntersectionObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];
    this._handleScroll(); // update direction
    const { isIntersecting, target } = entry;
    if (isIntersecting) this._notifyStepEnter(target);
    else this._notifyStepExit(target);
  }

  private _intersectProgress(entries: IntersectionObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];
    const index = this.getIndex(entry.target);
    const step = this.steps[index];
    const { isIntersecting, intersectionRatio, target } = entry;
    if (isIntersecting && step.state === 'enter') {
      this._notifyProgress(target, intersectionRatio);
    }
  }

  private _updateResizeObserver(step: ScrollyStep): void {
    const observer = new ResizeObserver(this._resizeStep);
    observer.observe(step.node);
    step.observers.resize = observer;
  }

  private _updateResizeObservers(): void {
    this.steps.forEach((s) => this._updateResizeObserver(s));
  }

  private _updateStepObserver(step: ScrollyStep): void {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off.format === 'pixels' ? 1 : h;
    const offset = off.value * factor;
    const marginTop = step.height / 2 - offset;
    const marginBottom = step.height / 2 - (h - offset);
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    const root = this.rootElement;

    const threshold = 0.5;
    const options = { rootMargin, threshold, root };
    const observer = new IntersectionObserver(this._intersectStep, options);

    observer.observe(step.node);
    step.observers.step = observer;
  }

  private _updateStepObservers(): void {
    this.steps.forEach((s) => this._updateStepObserver(s));
  }

  private _updateProgressObserver(step: ScrollyStep): void {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off.format === 'pixels' ? 1 : h;
    const offset = off.value * factor;
    const marginTop = -offset + step.height;
    const marginBottom = offset - h;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

    const threshold = this.createProgressThreshold(step.height, this.progressThreshold);
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(this._intersectProgress, options);

    observer.observe(step.node);
    step.observers.progress = observer;
  }

  private _updateProgressObservers(): void {
    this.steps.forEach((s) => this._updateProgressObserver(s));
  }

  private _updateObservers(): void {
    this._disconnectObservers();
    this._updateResizeObservers();
    this._updateStepObservers();
    if (this.isProgress) this._updateProgressObservers();
  }

  setup({
    step,
    parent,
    offset = 0.5,
    threshold = 4,
    progress = false,
    once = false,
    container = undefined,
    root = null,
  }: ScrollyOptions): ScrollytellerEngine {
    this._setupScrollListener();

    const parentElement = (typeof step === 'string' && parent)
      ? document.querySelector(parent) || document
      : document;

    this.steps = this.selectAll(step, parentElement).map((node, index) => ({
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

    if (!this.steps.length) {
      this.err('no step elements');
      return this;
    }

    this.isProgress = progress;
    this.isTriggerOnce = once;
    this.progressThreshold = Math.max(1, +threshold);
    this.globalOffset = this.parseOffset(offset);
    this.containerElement = container;
    this.rootElement = root;

    this.off(); // Clear all event listeners
    this._resetExclusions();
    this.indexSteps(this.steps);
    this._handleEnable(true);
    return this;
  }

  enable(): ScrollytellerEngine {
    this._handleEnable(true);
    return this;
  }

  disable(): ScrollytellerEngine {
    this._handleEnable(false);
    return this;
  }

  destroy(): ScrollytellerEngine {
    this._handleEnable(false);
    this.off();
    this._resetExclusions();
    document.removeEventListener('scroll', this._handleScroll);
    return this;
  }

  resize(): ScrollytellerEngine {
    this._updateObservers();
    return this;
  }

  get offset(): number {
    return this.globalOffset.value;
  }

  set offset(value: string | number) {
    this.globalOffset = this.parseOffset(value);
    this._updateObservers();
  }
}
