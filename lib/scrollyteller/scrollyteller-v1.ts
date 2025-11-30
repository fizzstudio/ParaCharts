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
 *
 * https://github.com/russellsamora/scrollama
 */

/**
 * ---------------------------------------------------------------------------
 *  Scrollyteller (ParaCharts)
 * ---------------------------------------------------------------------------
 *
 *  HOW STEPS WORK
 *  --------------
 *  A scrollytelling `step` is any DOM element that contains at least one of:
 *
 *    - data-para-enter="action(params)"
 *    - data-para-exit="action(params)"
 *    - data-para-progress="action(params)"
 *
 *  Steps are automatically discovered and sorted in DOM order.
 *
 *
 *  SCOPING STEPS TO A CHART
 *  -------------------------
 *  If a step has:
 *
 *      data-para-chartid="myChart"
 *
 *  it will only apply to that chart instance. Steps without this attribute
 *  apply to every chart on the page.
 *
 *
 *  OFFSETS
 *  -------
 *  Step `enter` triggers when the step element crosses the offset line.
 *
 *  Global offset (defined in ParaChart.settings.scrollytelling.offset):
 *      0.5     → middle of the viewport
 *      0.25    → upper quarter
 *      "200px" → fixed pixel value from top
 *
 *  Per-step override (in the DOM):
 *      <section data-para-offset="0.3"> ... </section>
 *
 *  If a step has a per-step offset, it overrides the global offset.
 *
 *
 *  ACTION TYPES
 *  ------------
 *  ENTER actions run when a step first crosses the offset threshold.
 *  EXIT actions run when the step leaves the threshold (above or below).
 *
 *  PROGRESS actions are different:
 *      - They fire continuously while a step is active and intersects the viewport.
 *      - They receive a progress ratio between 0 and 1.
 *      - Only steps that define data-para-progress get progress events.
 *
 *
 *  SETTINGS (from ParaChart.settings.scrollytelling)
 *  -------------------------------------------------
 *
 *  {
 *    isScrollytellingEnabled: boolean;  // master switch
 *    offset?: number | string;  // global offset (0-1 or "200px")
 *    threshold?: number;  // pixel granularity for progress thresholds
 *    isProgress?: boolean;  // enable or disable progress observers globally
 *    isTriggerOnce?: boolean;  // if true, each stepEnter only fires once
 *    container?: HTMLElement;  // optional scroll container
 *    root?: Element | Document | null;  // IntersectionObserver root
 *    isScrollyAnnouncementsEnabled?: boolean;  // future: narration
 *    isScrollySoniEnabled?: boolean;           // future: sonification
 *  }
 *
 *  You normally set these on the ParaChart instance before rendering:
 *
 *      chart.settings.scrollytelling = {
 *        isScrollytellingEnabled: true,
 *        isProgress: true,
 *        offset: 0.4,
 *        threshold: 6,
 *      };
 *
 *  If settings change at runtime:
 *
 *      chart.scrollyteller.reloadFromSettings();
 *
 *
 *  PROGRESS PERFORMANCE OPTIMIZATION
 *  ---------------------------------
 *  Only steps that have progress actions AND only when this.settings.progress
 *  is true will get progress observers.
 *
 *  All other steps get only enter/exit observers.
 *
 * ---------------------------------------------------------------------------
 */


import { ParaChart } from '../parachart/parachart';

export interface ParsedOffset {
  format: 'pixels' | 'percent';
  value: number;
}

export interface Action {
  action: string;
  params: string[];
}

export interface StepActions {
  enter: Action[];
  exit: Action[];
  progress: Action[];
}

export interface CallbackResponse {
  element: Element;
  index: number;
  direction?: 'up' | 'down';
  progress?: number;
  // For the relevant event (enter/exit/progress) only:
  actions: Action[];
}

export interface ScrollyStep {
  id: string;
  eventType: 'enter' | 'exit' | 'progress';
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
  actions: StepActions;
  top: number;
  progress: number;
  state?: 'enter' | 'exit';
  isExcluded?: boolean; // for "isTriggerOnce" behavior
}

export type ScrollyEvent = 'stepEnter' | 'stepExit' | 'stepProgress';
export type Callback = (response: CallbackResponse) => void;

export class Scrollyteller {
  private parachart: ParaChart;
  private chartId: string;
  private stepElements!: NodeListOf<Element>;
  private settings!: any;

  // Simple list of steps for bulk operations (observers, etc.)
  private steps: ScrollyStep[];
  // Primary mapping from DOM element -> ScrollyStep
  private stepMap: WeakMap<Element, ScrollyStep>;

  private _events: Map<ScrollyEvent, Array<Callback>>;
  private globalOffset: ParsedOffset;
  private containerElement?: HTMLElement;
  private rootElement: Element | Document | null;
  private progressThreshold: number;
  private isScrollytellingEnabled: boolean;
  private isProgress: boolean;
  private isTriggerOnce: boolean;

  private currentScrollY: number;
  private comparisonScrollY: number;
  private direction?: 'up' | 'down';

  constructor(parachart: ParaChart) {
    this.parachart = parachart;
    this.chartId = this.parachart.id;

    this._events = new Map();
    this.steps = [];
    this.stepMap = new WeakMap();
    this.globalOffset = { format: 'percent', value: 0.5 };
    this.containerElement = undefined;
    this.rootElement = null;

    this.progressThreshold = 0;
    this.isScrollytellingEnabled = false;
    this.isProgress = false;
    this.isTriggerOnce = false;

    this.currentScrollY = 0;
    this.comparisonScrollY = 0;
    this.direction = undefined;

    this._handleScroll = this._handleScroll.bind(this);
    this._resizeStep = this._resizeStep.bind(this);
    this._intersectStep = this._intersectStep.bind(this);
    this._intersectProgress = this._intersectProgress.bind(this);

    // Pull settings from ParaCharts
    this.settings = this.parachart.paraView.store.settings.scrollytelling;

    if (this.settings.isScrollytellingEnabled) {
      this.init();
    }
  }

  // --- Init & top-level behavior -------------------------------------------

  private init(): void {
    this.setupFromSettings();

    this.on('stepEnter', (response: CallbackResponse) => {
      const element = response.element;
      this.highlightPageContent(element);

      for (const { action, params } of response.actions) {
        console.warn('scrolly:', action, params);

        if (action === 'directLabels') {
          this.parachart.api.setSetting('chart.hasDirectLabels', false);
          this.parachart.api.setSetting('color.isDarkModeEnabled', true);
          this.parachart.api.setSetting('chart.isDrawSymbols', false);
          this.parachart.api.setSetting('type.line.isDrawSymbols', false);
        }

        if (action === 'highlightSeries') {
          if (params.length > 0) {
            this.parachart.store.lowlightOtherSeries(...params);
          }
        }

        if (action === 'highlightDatapoint') {
          if (params.length >= 2) {
            this.parachart.api
              .getSeries(params[0])
              .getPoint(+params[1])
              .select();
          }
        }
      }

      if (this.settings.isScrollyAnnouncementsEnabled) {
        console.log('TODO: Add scrollytelling aria-live descriptions of highlights');
      }

      if (this.settings.isScrollySoniEnabled) {
        console.log('TODO: Add scrollytelling sonifications');
      }

    });

    this.on('stepExit', (response: CallbackResponse) => {
      if (response.direction === 'up') {
        for (const { action, params } of response.actions) {
          if (action === 'highlightDatapoint') {
            if (params.length >= 2) {
              this.parachart.api
                .getSeries(params[0])
                .getPoint(+params[1])
                .select();
            }
          }
        }
      }
    });

    this.on('stepProgress', (response: CallbackResponse) => {
      const { progress, index } = response;
      console.warn('stepProgress:', index, progress);
    });

    this.on('stepProgress', ({ progress, index, element }) => {
      console.warn('progress:', progress, 'step:', index);
    });

    this.enableDebugThreshold();
  }

  /**
   * Re-reads settings from ParaCharts and rebuilds all observers/steps.
   * Call this if ParaCharts updates scrollytelling settings at runtime.
   */
  public reloadFromSettings(): void {
    this.settings = this.parachart.paraView.store.settings.scrollytelling ?? {};

    if (!this.settings.isScrollytellingEnabled) {
      this.destroy();
      return;
    }
    this.setupFromSettings();
  }

  private highlightPageContent(nextStep: Element): void {
    if (!this.stepElements) return;
    this.stepElements.forEach(step => step.classList.remove('para-active'));
    nextStep.classList.add('para-active');
  }

  // --- DOM & action parsing -------------------------------------------------

  private filterChartActions(): Element[] {
    const steps = Array.from(this.stepElements).filter((element) => {
      const chartId = (element as HTMLElement).dataset.paraChartid;
      return !chartId || chartId === this.chartId;
    });
    return steps;
  }

  private getActions(element: HTMLElement): StepActions {
    const actions: StepActions = {
      enter: [],
      exit: [],
      progress: [],
    };

    // Event-specific attributes on the step element itself
    actions.enter.push(...this.parseActions(element.dataset.paraEnter));
    actions.exit.push(...this.parseActions(element.dataset.paraExit));
    actions.progress.push(...this.parseActions(element.dataset.paraProgress));

    return actions;
  }

  private parseActions(actionString: string | undefined): Action[] {
    if (!actionString) return [];

    const actions: Action[] = [];
    const actionArray = actionString.split(')');

    actionArray.forEach(actionItem => {
      const trimmed = actionItem.trim();
      if (!trimmed) return;

      const keyValueArray = trimmed.split('(');
      const actionName = keyValueArray[0].trim();
      const paramString = keyValueArray[1] ? keyValueArray[1].trim() : '';
      const params = paramString
        ? paramString.split(',').map(p => p.trim())
        : [];
      actions.push({ action: actionName, params });
    });

    return actions;
  }


  /**
   * Returns true if this step has one or more progress actions.
   */
  private hasProgress(step: ScrollyStep): boolean {
    return step.actions.progress.length > 0;
    // return true;
  }

  /**
   * Convert the global offset to pixels, matching Scrollama's offsetMargin.
   */
  private get offsetMarginPx(): number {
    if (this.globalOffset.format === 'pixels') {
      return this.globalOffset.value;
    }
    return this.globalOffset.value * window.innerHeight;
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

  // private createProgressThreshold(height: number, threshold: number): number[] {
  //   const count = Math.ceil(height / threshold);
  //   const t = [];
  //   const ratio = 1 / count;
  //   for (let i = 0; i < count + 1; i += 1) t.push(i * ratio);
  //   return t;
  // }

  private createProgressThreshold(height: number, threshold: number): number[] {
    // Guard against zero / invalid heights so we don't create NaN thresholds.
    if (!height || height <= 0 || !Number.isFinite(height)) {
      // simplest: just get a start and end callback
      return [0, 1];
    }

    const count = Math.max(1, Math.ceil(height / threshold));
    const t: number[] = [];
    const ratio = 1 / count;

    for (let i = 0; i <= count; i += 1) {
      t.push(i * ratio);
    }

    return t;
  }


  // --- Event subscription ---------------------------------------------------

  on(event: ScrollyEvent, callback: Callback): this {
    this._events.set(event, this._events.get(event) || []);
    this._events.get(event)!.push(callback);
    return this;
  }

  once(event: ScrollyEvent, callback: Callback): this {
    const wrapper: Callback = (response: CallbackResponse) => {
      callback(response);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event?: ScrollyEvent, callback?: Callback): this {
    if (!event) {
      this._events.clear();
    } else if (!callback) {
      this._events.delete(event);
    } else {
      const callbacks = this._events.get(event) || [];
      const callbackIndex = callbacks.indexOf(callback);
      if (callbackIndex >= 0) {
        callbacks.splice(callbackIndex, 1);
      }
      this._events.set(event, callbacks);
    }
    return this;
  }

  private emit(event: ScrollyEvent, response: CallbackResponse): void {
    if (this._events.has(event)) {
      this._events.get(event)!.forEach(callback => callback(response));
    }
  }

  // --- Notifications from observers ----------------------------------------

  // private _notifyProgress(element: Element, progress?: number): void {
  //   const step = this.stepMap.get(element);
  //   if (!step) return;

  //   // no progress actions = no progress events
  //   if (!this.hasProgress(step)) return;

  //   if (progress !== undefined) step.progress = progress;
  //   const { index } = step;

  //   const response: CallbackResponse = {
  //     element,
  //     index,
  //     progress,
  //     direction: this.direction,
  //     actions: step.actions.progress,
  //   };

  //   if (step.state === 'enter') this.emit('stepProgress', response);
  // }

  private _notifyProgress(element: Element, progress?: number): void {
    const step = this.stepMap.get(element);
    if (!step) return;

    // no progress actions = no progress events
    if (!this.hasProgress(step)) return;

    if (progress !== undefined) step.progress = progress;
    const { index } = step;

    const response: CallbackResponse = {
      element,
      index,
      progress,
      direction: this.direction,
      actions: step.actions.progress,
    };

    // ← previously: if (step.state === 'enter') this.emit(...)
    this.emit('stepProgress', response);
  }


  private _notifyStepEnter(element: Element): void {
    const step = this.stepMap.get(element);
    if (!step) return;

    const { index } = step;
    const response: CallbackResponse = {
      element,
      index,
      direction: this.direction,
      actions: step.actions.enter,
    };

    step.direction = this.direction;
    step.state = 'enter';

    if (!step.isExcluded) {
      this.emit('stepEnter', response);
    }
    if (this.isTriggerOnce) {
      step.isExcluded = true;
    }
  }

  private _notifyStepExit(element: Element): boolean {
    const step = this.stepMap.get(element);
    if (!step || !step.state) return false;

    const { index } = step;
    const response: CallbackResponse = {
      element,
      index,
      direction: this.direction,
      actions: step.actions.exit,
    };

    if (this.isProgress) {
      if (this.direction === 'down' && step.progress < 1) {
        this._notifyProgress(element, 1);
      } else if (this.direction === 'up' && step.progress > 0) {
        this._notifyProgress(element, 0);
      }
    }

    step.direction = this.direction;
    step.state = 'exit';
    this.emit('stepExit', response);
    return true;
  }

  // --- Scroll tracking ------------------------------------------------------

  private _handleScroll(): void {
    const scrollTop = this.containerElement
      ? this.containerElement.scrollTop
      : window.pageYOffset;

    if (this.currentScrollY !== scrollTop) {
      this.currentScrollY = scrollTop;
      if (this.currentScrollY > this.comparisonScrollY) {
        this.direction = 'down';
      } else if (this.currentScrollY < this.comparisonScrollY) {
        this.direction = 'up';
      }
      this.comparisonScrollY = this.currentScrollY;
    }
  }

  private _setupScrollListener(): void {
    document.removeEventListener('scroll', this._handleScroll);
    document.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  // --- Observers ------------------------------------------------------------

  private _resizeStep(entries: ResizeObserverEntry[]): void {
    if (entries.length === 0) return;
    const entry = entries[0];

    const step = this.stepMap.get(entry.target as Element);
    if (!step) return;

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

    this._handleScroll();
    const { isIntersecting, target } = entry;
    if (isIntersecting) this._notifyStepEnter(target);
    else this._notifyStepExit(target);
  }

  // private _intersectProgress(entries: IntersectionObserverEntry[]): void {
  //   if (entries.length === 0) return;
  //   const entry = entries[0];

  //   const step = this.stepMap.get(entry.target as Element);
  //   if (!step) return;

  //   const { isIntersecting, intersectionRatio, target } = entry;
  //   if (isIntersecting && step.state === 'enter') {
  //     this._notifyProgress(target, intersectionRatio);
  //   }
  // }

  // private _intersectProgress(entries: IntersectionObserverEntry[]): void {
  //   if (entries.length === 0) return;
  //   const entry = entries[0];

  //   const step = this.stepMap.get(entry.target as Element);
  //   if (!step) return;

  //   const { isIntersecting, intersectionRatio, target } = entry;

  //   console.log(
  //     'scrolly: _intersectProgress for step',
  //     step.index,
  //     'isIntersecting =',
  //     isIntersecting,
  //     'intersectionRatio =',
  //     intersectionRatio,
  //     'state =',
  //     step.state
  //   );

  //   if (isIntersecting && step.state === 'enter') {
  //     console.warn('isIntersecting', step.state)

  //     this._notifyProgress(target, intersectionRatio);
  //   }

  //   if (isIntersecting /* && step.state === 'enter' */) {
  //     console.error('isIntersecting', step.state)
  //     this._notifyProgress(target, intersectionRatio);
  //   }
  // }

  // private _intersectProgress(entries: IntersectionObserverEntry[]): void {
  //   if (entries.length === 0) return;
  //   const entry = entries[0];

  //   const step = this.stepMap.get(entry.target as Element);
  //   if (!step) return;

  //   const { isIntersecting, intersectionRatio, target } = entry;

  //   if (!isIntersecting) return;

  //   this._notifyProgress(target, intersectionRatio);
  // }

  // private _intersectProgress(entries: IntersectionObserverEntry[]): void {
  //   if (entries.length === 0) return;
  //   const entry = entries[0];
  
  //   const step = this.stepMap.get(entry.target as Element);
  //   if (!step) return;
  
  //   const { isIntersecting, intersectionRatio, target } = entry;
  
  //   // Only steps with progress actions should ever generate progress events
  //   if (!this.hasProgress(step)) return;
  
  //   // Mirror Scrollama: progress is only meaningful while the step is "active"
  //   if (!isIntersecting) return;
  //   if (step.state !== 'enter') return;
  
  //   this._notifyProgress(target, intersectionRatio);
  // }

  private _intersectProgress(entries: IntersectionObserverEntry[]): void {
    if (!entries.length) return;
  
    for (const entry of entries) {
      const step = this.stepMap.get(entry.target as Element);
      if (!step) continue;
  
      const { isIntersecting, intersectionRatio, target } = entry;
  
      console.log(
        'scrolly: _intersectProgress',
        'step', step.index,
        'isIntersecting =', isIntersecting,
        'intersectionRatio =', intersectionRatio,
        'state =', step.state
      );
  
      // Only while the element is actually intersecting
      if (!isIntersecting) continue;
  
      // Only steps that we consider "progress steps"
      if (!this.hasProgress(step)) continue;
  
      // Only while the step is "active" (between enter and exit)
      if (step.state !== 'enter') continue;
  
      this._notifyProgress(target, intersectionRatio);
    }
  }
  
  

  private _updateResizeObserver(step: ScrollyStep): void {
    const observer = new ResizeObserver(this._resizeStep);
    observer.observe(step.node);
    step.observers.resize = observer;
  }

  private _updateStepObserver(step: ScrollyStep): void {
    // Use per-step offset if present, otherwise global
    const offset = step.offset ?? this.globalOffset;

    const h = Math.floor(window.innerHeight * offset.value);
    const marginTop =
      offset.format === 'pixels' ? offset.value : h;
    const rootMarginTop = marginTop * -1;

    const rootMargin = `${rootMarginTop}px 0px ${rootMarginTop}px 0px`;
    const threshold = 0.5;

    const observer = new IntersectionObserver(this._intersectStep, {
      root: this.rootElement === document ? null : (this.rootElement as Element),
      rootMargin,
      threshold,
    });
    observer.observe(step.node);
    step.observers.step = observer;
  }

  // private _updateProgressObserver(step: ScrollyStep): void {
  //   // gate by global flag AND per-step actions
  //   if (!this.isProgress || !this.hasProgress(step)) return;

  //   const threshold = this.createProgressThreshold(step.height, this.progressThreshold);
  //   const rootMarginTop = -step.top;
  //   const rootMarginBottom = -(step.height - step.top);
  //   const rootMargin = `${rootMarginTop}px 0px ${rootMarginBottom}px 0px`;

  //   const observer = new IntersectionObserver(this._intersectProgress, {
  //     root: this.rootElement === document ? null : (this.rootElement as Element),
  //     rootMargin,
  //     threshold,
  //   });
  //   observer.observe(step.node);
  //   step.observers.progress = observer;
  // }

  // private _updateProgressObserver(step: ScrollyStep): void {
  //   // gate by global flag AND per-step actions
  //   if (!this.isProgress || !this.hasProgress(step)) return;

  //   const threshold = this.createProgressThreshold(step.height, this.progressThreshold);

  //   const observer = new IntersectionObserver(this._intersectProgress, {
  //     root: this.rootElement === document ? null : (this.rootElement as Element),
  //     threshold,
  //     // NOTE: no rootMargin here; we let intersectionRatio be based on the viewport.
  //   });

  //   observer.observe(step.node);
  //   step.observers.progress = observer;
  // }  

  // private _updateProgressObserver(step: ScrollyStep): void {
  //   // gate by global flag AND per-step actions
  //   if (!this.isProgress || !this.hasProgress(step)) {
  //     console.log(
  //       'scrolly: skipping progress observer for step',
  //       step.index,
  //       'isProgress =',
  //       this.isProgress,
  //       'hasProgress =',
  //       this.hasProgress(step)
  //     );
  //     return;
  //   }

  //   console.log(
  //     'scrolly: creating progress observer for step',
  //     step.index,
  //     'height =',
  //     step.height,
  //     'progressThreshold =',
  //     this.progressThreshold
  //   );

  //   const threshold = this.createProgressThreshold(
  //     step.height,
  //     this.progressThreshold
  //   );

  //   console.log('scrolly: thresholds for step', step.index, threshold);

  //   const observer = new IntersectionObserver(this._intersectProgress, {
  //     root: this.rootElement === document ? null : (this.rootElement as Element),
  //     threshold,
  //   });

  //   observer.observe(step.node);
  //   step.observers.progress = observer;
  // }

  // private _updateProgressObserver(step: ScrollyStep): void {
  //   // gate by global flag AND per-step actions
  //   if (!this.isProgress || !this.hasProgress(step)) {
  //     // Optional debug:
  //     // console.log(
  //     //   'scrolly: skipping progress observer for step',
  //     //   step.index,
  //     //   'isProgress =', this.isProgress,
  //     //   'hasProgress =', this.hasProgress(step)
  //     // );
  //     return;
  //   }
  
  //   // Scrollama-style threshold array, based on step height
  //   const threshold = this.createProgressThreshold(
  //     step.height,
  //     this.progressThreshold
  //   );
  
  //   // Scrollama-style rootMargin:
  //   // - marginTop moves the top of the IO box down so we only care
  //   //   about the region from the offset line down to the bottom
  //   // - marginBottom cuts off below the viewport bottom minus offset
  //   const offsetMargin = this.offsetMarginPx;
  //   const viewH = window.innerHeight;
  
  //   const marginTop = step.height - offsetMargin;
  //   const marginBottom = -viewH + offsetMargin;
  //   const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
  
  //   const observer = new IntersectionObserver(this._intersectProgress, {
  //     root: this.rootElement === document ? null : (this.rootElement as Element),
  //     rootMargin,
  //     threshold,
  //   });
  
  //   observer.observe(step.node);
  //   step.observers.progress = observer;
  // }
  
  private _updateProgressObserver(step: ScrollyStep): void {
    // gate by global flag AND per-step actions/attribute
    if (!this.isProgress || !this.hasProgress(step)) {
      console.log(
        'scrolly: skipping progress observer for step',
        step.index,
        'isProgress =',
        this.isProgress,
        'hasProgress =',
        this.hasProgress(step)
      );
      return;
    }
  
    const threshold = this.createProgressThreshold(
      step.height,
      this.progressThreshold
    );
  
    console.log(
      'scrolly: creating progress observer for step',
      step.index,
      'height =',
      step.height,
      'progressThreshold =',
      this.progressThreshold,
      'thresholds =',
      threshold
    );
  
    const observer = new IntersectionObserver((entries) => {
      this._intersectProgress(entries);
    }, {
      root: this.rootElement === document ? null : (this.rootElement as Element),
      threshold,
    });
  
    observer.observe(step.node);
    step.observers.progress = observer;
  }
  

  private _updateResizeObservers(): void {
    this.steps.forEach((step) => this._updateResizeObserver(step));
  }

  private _updateStepObservers(): void {
    this.steps.forEach((step) => this._updateStepObserver(step));
  }

  private _updateProgressObservers(): void {
    this.steps.forEach((step) => this._updateProgressObserver(step));
  }

  private _disconnectObserver(observers: {
    resize?: ResizeObserver;
    step?: IntersectionObserver;
    progress?: IntersectionObserver;
  }): void {
    if (observers.resize) observers.resize.disconnect();
    if (observers.step) observers.step.disconnect();
    if (observers.progress) observers.progress.disconnect();
  }

  private _disconnectObservers(): void {
    this.steps.forEach(({ observers }) => this._disconnectObserver(observers));
  }

  private _updateObservers(): void {
    this._disconnectObservers();
    this._updateResizeObservers();
    this._updateStepObservers();
    if (this.isProgress) this._updateProgressObservers();
  }

  // --- Settings-driven setup ------------------------------------------------

  /**
   * Reads scrollytelling config from this.settings and (re)builds steps + observers.
   * This replaces the old public setup(options) method.
   */
  private setupFromSettings(): void {
    this._setupScrollListener();

    // A "step" is any element with at least one of the action attributes.
    this.stepElements = document.querySelectorAll(
      '[data-para-enter], [data-para-exit], [data-para-progress]'
    );

    this.stepMap = new WeakMap();

    // Build steps list once from the DOM; WeakMap is the primary lookup.
    this.steps = this.filterChartActions().map((element, index) => {
      const el = element as HTMLElement;

      const stepOffset = this.parseOffset(
        (el.dataset.paraOffset as string | undefined) ?? ''
      );

      const stepObj: ScrollyStep = {
        id: element.id,
        eventType: 'enter',
        index,
        direction: undefined,
        height: el.offsetHeight,
        node: element,
        observers: {},
        offset: stepOffset,
        actions: this.getActions(el),
        top: this.getOffsetTop(element),
        progress: 0,
        state: undefined,
        isExcluded: false,
      };

      this.stepMap.set(element, stepObj);
      return stepObj;
    });

    console.warn('stepmap:', this.stepMap)

    if (!this.steps.length) {
      console.log('scrollytelling: no step elements found');
      return;
    }

    // Read config from this.settings with sensible defaults.
    // Adjust property names to match your ParaChart settings model.
    const offsetSetting: string | number = this.settings.offset ?? 0.5;
    const thresholdSetting: number = this.settings.threshold ?? 4;
    const progressSetting: boolean = this.settings.isProgress ?? true;
    const onceSetting: boolean = this.settings.isTriggerOnce ?? false;
    const containerSetting: HTMLElement | undefined = this.settings.container;
    const rootSetting: Element | Document | null =
      this.settings.root ?? null;

    this.isProgress = progressSetting;
    this.isTriggerOnce = onceSetting;
    this.progressThreshold = Math.max(1, +thresholdSetting);
    this.globalOffset = this.parseOffset(offsetSetting);
    this.containerElement = containerSetting;
    this.rootElement = rootSetting;

    this.off();
    this._handleEnable(true);
  }

  // --- Public lifecycle -----------------------------------------------------

  private _handleEnable(shouldEnable: boolean): void {
    if (shouldEnable && !this.isScrollytellingEnabled) this._updateObservers();
    if (!shouldEnable && this.isScrollytellingEnabled) this._disconnectObservers();
    this.isScrollytellingEnabled = shouldEnable;
  }

  enable(): Scrollyteller {
    this._handleEnable(true);
    return this;
  }

  disable(): Scrollyteller {
    this._handleEnable(false);
    return this;
  }

  destroy(): Scrollyteller {
    this._handleEnable(false);
    this.off();
    document.removeEventListener('scroll', this._handleScroll);
    return this;
  }

  resize(): Scrollyteller {
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

  private err(msg: string): void {
    console.error(`scrollytelling error: ${msg}`);
  }

  // DEBUG

  /**
   * Adds a visual debug overlay showing the global threshold line.
   * Useful for verifying where stepEnter/stepExit will fire.
   */
  public enableDebugThreshold(): void {
    // Avoid adding it twice
    if (document.getElementById('scrolly-threshold-debug')) return;

    // Insert CSS if not already inserted
    const style = document.createElement('style');
    style.textContent = `
    #scrolly-threshold-debug {
      position: fixed;
      left: 0;
      right: 0;
      height: 0;
      border-top: 2px dashed rgba(255, 0, 0, 0.6);
      z-index: 999999;
      pointer-events: none;
    }
  `;
    document.head.appendChild(style);

    // Create line element
    const line = document.createElement('div');
    line.id = 'scrolly-threshold-debug';
    document.body.appendChild(line);

    // Position based on global offset
    this.updateDebugThresholdPosition();
  }

  /**
   * Updates the threshold line position (based on global offset).
   * Call this after resize or if settings.offset changes.
   */
  public updateDebugThresholdPosition(): void {
    const line = document.getElementById('scrolly-threshold-debug') as HTMLElement;
    if (!line) return;

    const offset = this.globalOffset;

    if (offset.format === 'percent') {
      // Percentage of viewport height
      const y = offset.value * window.innerHeight;
      line.style.top = `${y}px`;
    } else {
      // Pixel offset
      line.style.top = `${offset.value}px`;
    }
  }

}
