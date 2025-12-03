// IntersectionObserver-based scrollytelling engine that uses the paraActions DSL
// for data-para-enter / data-para-exit / data-para-progress attributes.

import {
  parseActionList,
  executeParaActionList,
  type ParaAction,
  type ActionHandler as ParaActionHandler,
  type ActionRegistry as ParaActionHandlerMap,
} from '../paraactions/paraactions';

export type ScrollDirection = 'up' | 'down';
export type ScrollyEvent = 'stepEnter' | 'stepExit' | 'stepProgress';

export interface ScrollytellingSettings {
  offset?: number | string; // 0-1 or 'NNNpx' or >1 px
  isDebug?: boolean;
}

// Host interface: ParaChart (or similar) will match this shape structurally.
export interface ScrollyHost {
  paraView?: {
    store?: {
      settings?: {
        scrollytelling?: ScrollytellingSettings;
      };
    };
  };

  // Default scrollytelling actions defined by the host
  scrollyActions?: ActionMap;
}

export interface ActionContext {
  element: HTMLElement;
  index: number;
  direction: ScrollDirection;
  progress?: number;

  chartId?: string | null;
  datasetId?: string | null;

  parachart: ScrollyHost;
}

// Specialisations of the generic paraActions types for scrollytelling.
export type ActionHandler = ParaActionHandler<ActionContext>;
export type ActionMap = ParaActionHandlerMap<ActionContext>;

export interface ScrollytellerOptions {
  offset?: number | string;
  isDebug?: boolean;
  rootMarginExtra?: number;      // extra px to expand rootMargin for stepObserver
  progressThresholdPx?: number;  // px granularity for progress IO (default ~4px)
}

interface StepEntry {
  element: HTMLElement;
  index: number;
  isActive: boolean;
  progress: number; // 0-1
  direction: ScrollDirection | null;

  hasEnter: boolean;
  hasExit: boolean;
  hasProgress: boolean;

  enterActions: ParaAction[];
  exitActions: ParaAction[];
  progressActions: ParaAction[];

  chartId: string | null;
  datasetId: string | null;

  offsetRaw: string | null; // data-para-offset per-step override

  // Geometry for progress observer
  height: number;

  // Per-step observers
  stepObserver?: IntersectionObserver | null;
  progressObserver?: IntersectionObserver | null;

  debugLineElement?: HTMLDivElement | null;
}

type StepCallback = (info: ActionContext) => void;

export class Scrollyteller {
  private parachart: ScrollyHost;
  private options: ScrollytellerOptions;
  private actions: ActionMap;

  private steps: StepEntry[] = [];
  private stepMap: WeakMap<Element, StepEntry> = new WeakMap();

  private offsetPx = 0; // global offset in px
  private lastScrollY = 0;
  private direction: ScrollDirection = 'down';

  private isDebugEnabled = false;
  private debugLineElement: HTMLDivElement | null = null; // global debug line

  private events: Map<ScrollyEvent, StepCallback[]> = new Map();

  private progressThresholdPx = 4; // default px granularity

  public onStepEnter?: StepCallback;
  public onStepExit?: StepCallback;
  public onStepProgress?: StepCallback;

  constructor(
    parachart: ScrollyHost,
    options: ScrollytellerOptions = {},
    extraActions: ActionMap = {}
  ) {
    this.parachart = parachart;
    this.options = options;

    const defaultActions = parachart.scrollyActions ?? {};
    this.actions = {
      ...defaultActions,
      ...extraActions,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  public init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.resolveSettings();
    this.collectSteps();
    if (this.steps.length === 0) return;

    this.createDebugLine();
    this.setupObserversForAllSteps();
    this.updateDebugLinePosition();

    this.lastScrollY = window.pageYOffset || 0;
  }

  public destroy(): void {
    // Disconnect per-step observers
    this.steps.forEach(step => {
      if (step.stepObserver) {
        step.stepObserver.unobserve(step.element);
        step.stepObserver.disconnect();
        step.stepObserver = null;
      }
      if (step.progressObserver) {
        step.progressObserver.unobserve(step.element);
        step.progressObserver.disconnect();
        step.progressObserver = null;
      }

      if (step.debugLineElement && step.debugLineElement.parentNode) {
        step.debugLineElement.parentNode.removeChild(step.debugLineElement);
      }
      step.debugLineElement = null;
    });

    this.steps = [];
    this.stepMap = new WeakMap();
    this.events.clear();

    if (this.debugLineElement && this.debugLineElement.parentNode) {
      this.debugLineElement.parentNode.removeChild(this.debugLineElement);
      this.debugLineElement = null;
    }
  }

  public resize(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Recompute global offset
    this.computeOffsetPx();
    this.updateDebugLinePosition();

    // Recompute step heights and re-create observers
    this.steps.forEach(step => {
      const rect = step.element.getBoundingClientRect();
      step.height = rect.height || step.element.offsetHeight || 0;

      if (step.stepObserver) {
        step.stepObserver.unobserve(step.element);
        step.stepObserver.disconnect();
        step.stepObserver = null;
      }
      if (step.progressObserver) {
        step.progressObserver.unobserve(step.element);
        step.progressObserver.disconnect();
        step.progressObserver = null;
      }

      this.setupStepObserver(step);
      if (step.hasProgress) {
        this.setupProgressObserver(step);
      }
    });
  }

  public on(event: ScrollyEvent, callback: StepCallback): void {
    const arr = this.events.get(event) ?? [];
    arr.push(callback);
    this.events.set(event, arr);
  }

  public once(event: ScrollyEvent, callback: StepCallback): void {
    const wrapper: StepCallback = (ctx: ActionContext) => {
      this.off(event, wrapper);
      callback(ctx);
    };
    this.on(event, wrapper);
  }

  public off(event?: ScrollyEvent, callback?: StepCallback): void {
    if (!event) {
      this.events.clear();
      return;
    }

    if (!callback) {
      this.events.delete(event);
      return;
    }

    const arr = this.events.get(event);
    if (!arr) return;
    const next = arr.filter(cb => cb !== callback);
    if (next.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, next);
    }
  }

  private emit(event: ScrollyEvent, ctx: ActionContext): void {
    const arr = this.events.get(event);
    if (!arr || arr.length === 0) return;
    for (const cb of arr) {
      cb(ctx);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings & step collection
  // ─────────────────────────────────────────────────────────────────────────────

  private resolveSettings(): void {
    const storeSettings =
      this.parachart?.paraView?.store?.settings?.scrollytelling ?? {};

    const combined: ScrollytellingSettings = {
      ...storeSettings,
      ...this.options,
    };

    const isDebug = (combined as any).isDebug ?? this.options.isDebug;

    this.isDebugEnabled = !!isDebug;
    this.offsetPx = this.computeOffsetFromSetting(combined.offset);

    this.progressThresholdPx =
      this.options.progressThresholdPx && this.options.progressThresholdPx > 0
        ? this.options.progressThresholdPx
        : 4;
  }

  private computeOffsetFromSetting(offset: number | string | undefined): number {
    const viewH =
      typeof window !== 'undefined' ? window.innerHeight || 0 : 0;

    if (offset == null) {
      return viewH * 0.5;
    }

    if (typeof offset === 'number') {
      if (offset >= 0 && offset <= 1) {
        return viewH * offset;
      }
      return offset;
    }

    if (typeof offset === 'string' && offset.endsWith('px')) {
      const value = Number(offset.replace('px', ''));
      return Number.isNaN(value) ? viewH * 0.5 : value;
    }

    const num = Number(offset);
    if (!Number.isNaN(num) && num >= 0 && num <= 1) {
      return viewH * num;
    }

    return viewH * 0.5;
  }

  private computeOffsetPx(): void {
    const storeSettings =
      this.parachart?.paraView?.store?.settings?.scrollytelling ?? {};
    const combined: ScrollytellingSettings = {
      ...storeSettings,
      ...this.options,
    };
    this.offsetPx = this.computeOffsetFromSetting(combined.offset);
  }

  private collectSteps(): void {
    const selector =
      '[data-para-enter], [data-para-exit], [data-para-progress]';

    const nodeList = document.querySelectorAll<HTMLElement>(selector);
    const elements: HTMLElement[] = Array.from(new Set(nodeList));

    this.steps = [];
    this.stepMap = new WeakMap();

    elements.forEach((el, index) => {
      const enterAttr = el.dataset.paraEnter ?? null;
      const exitAttr = el.dataset.paraExit ?? null;
      const progressAttr = el.dataset.paraProgress ?? null;

      // === PARA: CHANGED — purpose: use parseActionList (actions, errors) instead of parseParaActionList ===
      const { actions: enterActions, errors: enterErrors } =
        parseActionList(enterAttr ?? '');
      const { actions: exitActions, errors: exitErrors } =
        parseActionList(exitAttr ?? '');
      const { actions: progressActions, errors: progressErrors } =
        parseActionList(progressAttr ?? '');
      // === PARA: END CHANGED ===

      const hasEnter = enterActions.length > 0;
      const hasExit = exitActions.length > 0;
      const hasProgress = progressActions.length > 0;

      const chartId = el.dataset.paraChartid ?? null;
      const datasetId = el.dataset.paraDatasetid ?? null;
      const offsetRaw = el.dataset.paraOffset ?? null;

      const rect = el.getBoundingClientRect();
      const height = rect.height || el.offsetHeight || 0;

      const step: StepEntry = {
        element: el,
        index,
        isActive: false,
        progress: 0,
        direction: null,
        hasEnter,
        hasExit,
        hasProgress,
        enterActions,
        exitActions,
        progressActions,
        chartId,
        datasetId,
        offsetRaw,
        height,
        stepObserver: null,
        progressObserver: null,
        debugLineElement: null,
      };

      this.steps.push(step);
      this.stepMap.set(el, step);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-step offset helper
  // ─────────────────────────────────────────────────────────────────────────────

  private computeStepOffsetPx(offsetRaw: string | null): number {
    if (typeof window === 'undefined') return this.offsetPx;
    if (!offsetRaw) return this.offsetPx;

    const viewH = window.innerHeight || 0;
    const trimmed = offsetRaw.trim();
    if (!trimmed) return this.offsetPx;

    if (trimmed.endsWith('px')) {
      const value = Number(trimmed.replace('px', ''));
      return Number.isNaN(value) ? this.offsetPx : value;
    }

    const num = Number(trimmed);
    if (Number.isNaN(num)) return this.offsetPx;

    if (num >= 0 && num <= 1) {
      return viewH * num;
    }
    if (num > 1) {
      return num;
    }

    return this.offsetPx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-step debug line helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private ensureStepDebugLine(step: StepEntry): void {
    if (!this.isDebugEnabled) return;
    if (step.debugLineElement) return;

    const line = document.createElement('div');
    line.className = 'paracharts-scrolly-step-debug-line';
    line.style.position = 'absolute';
    line.style.left = '0';
    line.style.right = '0';
    line.style.height = '0';
    line.style.borderTop = '1px dotted rgba(0, 0, 255, 0.6)';
    line.style.pointerEvents = 'none';
    line.style.zIndex = '1';

    const label = document.createElement('span');
    label.style.position = 'absolute';
    label.style.left = '0';
    label.style.top = '-0.75em';
    label.style.fontFamily = 'monospace';
    label.style.fontSize = '10px';
    label.style.background = 'rgba(0, 0, 255, 0.1)';
    label.style.padding = '0 2px';
    label.style.borderRadius = '2px';
    label.textContent = `step ${step.index}${step.offsetRaw ? ` @ ${step.offsetRaw}` : ''
      }`;
    line.appendChild(label);

    const style = window.getComputedStyle(step.element);
    if (style.position === 'static') {
      step.element.style.position = 'relative';
    }

    step.element.appendChild(line);
    step.debugLineElement = line;
  }

  private updateStepDebugLine(
    step: StepEntry,
    rect: DOMRectReadOnly,
    offsetPx: number
  ): void {
    if (!this.isDebugEnabled) return;
    this.ensureStepDebugLine(step);
    if (!step.debugLineElement) return;

    const localY = offsetPx - rect.top;
    const clamped = Math.min(Math.max(localY, 0), rect.height);

    step.debugLineElement.style.top = `${clamped}px`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Observer setup (step + progress)
  // ─────────────────────────────────────────────────────────────────────────────

  private setupObserversForAllSteps(): void {
    this.steps.forEach(step => {
      this.setupStepObserver(step);
      if (step.hasProgress) {
        this.setupProgressObserver(step);
      }
    });
  }

  private setupStepObserver(step: StepEntry): void {
    if (typeof window === 'undefined') return;

    const rootMargin = this.computeRootMargin();
    const thresholds = this.computeThresholds();

    const observer = new IntersectionObserver(
      entries => this.handleStepIntersections(entries),
      {
        root: null,
        rootMargin,
        threshold: thresholds,
      }
    );

    observer.observe(step.element);
    step.stepObserver = observer;
  }

  private setupProgressObserver(step: StepEntry): void {
    if (typeof window === 'undefined') return;

    const vh = window.innerHeight || 0;
    const offsetPx = this.computeStepOffsetPx(step.offsetRaw);

    // Progress rootMargin:
    //   marginTop = -offset + step.height
    //   marginBottom = offset - viewportHeight
    const marginTop = -offsetPx + step.height;
    const marginBottom = offsetPx - vh;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

    const thresholds = this.createProgressThresholds(step.height);

    const observer = new IntersectionObserver(
      entries => this.handleProgressIntersections(entries),
      {
        root: null,
        rootMargin,
        threshold: thresholds,
      }
    );

    observer.observe(step.element);
    step.progressObserver = observer;
  }

  private computeRootMargin(): string {
    const viewH =
      typeof window !== 'undefined' ? window.innerHeight || 0 : 0;

    const topMargin = -this.offsetPx;
    const bottomMargin = this.offsetPx - viewH;

    const extra = this.options.rootMarginExtra ?? 0;
    const top = topMargin - extra;
    const bottom = bottomMargin - extra;

    return `${top}px 0px ${bottom}px 0px`;
  }

  private computeThresholds(): number[] {
    const steps = 2; // coarse thresholds for enter/exit; geometry does the real work
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      out.push(i / steps);
    }
    return out;
  }

  private createProgressThresholds(height: number): number[] {
    // choose a count so that each threshold ≈ progressThresholdPx in scroll.
    const h = height > 0 ? height : 1;
    const px = this.progressThresholdPx > 0 ? this.progressThresholdPx : 50;

    const count = Math.max(1, Math.ceil(h / px));
    const ratio = 1 / count;
    const out: number[] = [];
    for (let i = 0; i <= count; i++) {
      out.push(i * ratio);
    }
    return out;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Intersection handling (step enter/exit) via step observers
  // ─────────────────────────────────────────────────────────────────────────────

  private handleStepIntersections(
    entries: IntersectionObserverEntry[]
  ): void {
    if (typeof window === 'undefined') return;

    const currentY = window.pageYOffset || 0;
    this.direction = currentY > this.lastScrollY ? 'down' : 'up';
    this.lastScrollY = currentY;

    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      const step = this.stepMap.get(target);
      if (!step) continue;

      const rect = entry.boundingClientRect;
      this.updateStepStateFromGeometry(step, rect);
    }

    // Enforce boundary behavior: top → first step, bottom → last step
    this.enforceBoundaryActivation(currentY);
  }

  private updateStepStateFromGeometry(
    step: StepEntry,
    rect: DOMRectReadOnly
  ): void {
    const { top, bottom, height } = rect;

    const offsetPx = this.computeStepOffsetPx(step.offsetRaw);

    const topAdjusted = top - offsetPx;
    const bottomAdjusted = bottom - offsetPx;

    const wasActive = step.isActive;

    let isActive = false;
    let progress = step.progress;

    if (topAdjusted <= 0 && bottomAdjusted >= 0) {
      isActive = true;

      if (height > 0) {
        const raw = 1 - bottomAdjusted / height;
        progress = Math.min(1, Math.max(0, raw));
      } else {
        progress = 0;
      }
    } else if (bottomAdjusted < 0) {
      isActive = false;
      progress = 1;
    } else if (topAdjusted > 0) {
      isActive = false;
      progress = 0;
    }

    step.isActive = isActive;
    step.progress = progress;
    step.direction = this.direction;

    this.updateStepDebugLine(step, rect, offsetPx);

    if (!wasActive && isActive) {
      this.handleEnter(step);
    } else if (wasActive && !isActive) {
      this.handleExit(step);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Boundary behavior: first step at top, last step at bottom
  // ─────────────────────────────────────────────────────────────────────────────

  private enforceBoundaryActivation(scrollY: number): void {
    if (this.steps.length === 0) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const viewportHeight = window.innerHeight || 0;
    const docEl = document.documentElement;
    const docHeight = docEl ? docEl.scrollHeight : viewportHeight;

    const epsilon = 2; // px tolerance

    // Top of page: force first step active
    if (scrollY <= epsilon) {
      const first = this.steps[0];
      if (!first) return;

      for (const step of this.steps) {
        if (step !== first && step.isActive) {
          step.isActive = false;
          this.handleExit(step);
        }
      }

      if (!first.isActive) {
        first.isActive = true;
        first.progress = 0;
        this.handleEnter(first);
      }

      return;
    }

    // Bottom of page: force last step active
    const bottomY = scrollY + viewportHeight;
    if (bottomY >= docHeight - epsilon) {
      const last = this.steps[this.steps.length - 1];
      if (!last) return;

      for (const step of this.steps) {
        if (step !== last && step.isActive) {
          step.isActive = false;
          this.handleExit(step);
        }
      }

      if (!last.isActive) {
        last.isActive = true;
        last.progress = 1;
        this.handleEnter(last);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Intersection handling (progress) via progress observers
  // ─────────────────────────────────────────────────────────────────────────────

  private handleProgressIntersections(
    entries: IntersectionObserverEntry[]
  ): void {
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      const step = this.stepMap.get(target);
      if (!step) continue;

      if (!entry.isIntersecting) continue;
      if (!step.hasProgress) continue;
      if (!step.isActive) continue;

      const rawRatio = entry.intersectionRatio;
      const prev = step.progress;
      let next = rawRatio;

      // Make progress monotonic per scroll direction:
      //  - scrolling down: progress should not decrease
      //  - scrolling up:   progress should not increase
      if (this.direction === 'down' && next < prev) {
        next = prev;
      } else if (this.direction === 'up' && next > prev) {
        next = prev;
      }

      // Clamp to [0, 1]
      next = Math.min(1, Math.max(0, next));

      if (Math.abs(next - prev) <= 0.001) continue;

      step.progress = next;
      this.handleProgress(step);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Event + actions dispatch
  // ─────────────────────────────────────────────────────────────────────────────

  private handleEnter(step: StepEntry): void {
    const ctx: ActionContext = {
      element: step.element,
      index: step.index,
      direction: this.direction,
      chartId: step.chartId,
      datasetId: step.datasetId,
      parachart: this.parachart,
    };

    // Mark this step as visually active in the DOM
    step.element.classList.add('para-active');

    this.emit('stepEnter', ctx);

    if (this.onStepEnter) {
      this.onStepEnter(ctx);
    }

    // route enter actions through error-handling wrapper
    if (step.hasEnter) {
      this.runActionsForStep(step, step.enterActions, ctx);
    }
    if (this.isDebugEnabled) {
      step.element.setAttribute('data-para-debug-state', 'enter');
    }
  }

  private handleExit(step: StepEntry): void {
    const ctx: ActionContext = {
      element: step.element,
      index: step.index,
      direction: this.direction,
      chartId: step.chartId,
      datasetId: step.datasetId,
      parachart: this.parachart,
    };

    // Remove the visual active marker from the DOM
    step.element.classList.remove('para-active');

    this.emit('stepExit', ctx);

    if (this.onStepExit) {
      this.onStepExit(ctx);
    }

    // route exit actions through error-handling wrapper ===

    if (step.hasExit) {
      this.runActionsForStep(step, step.exitActions, ctx);
    }

    if (this.isDebugEnabled) {
      step.element.setAttribute('data-para-debug-state', 'exit');
    }
  }
  private handleProgress(step: StepEntry): void {
    const ctx: ActionContext = {
      element: step.element,
      index: step.index,
      direction: this.direction,
      progress: step.progress,
      chartId: step.chartId,
      datasetId: step.datasetId,
      parachart: this.parachart,
    };

    this.emit('stepProgress', ctx);

    if (this.onStepProgress) {
      this.onStepProgress(ctx);
    }

    // route progress actions through error-handling wrapper

    if (step.hasProgress) {
      this.runActionsForStep(step, step.progressActions, ctx);
    }
  }
  // call new executeParaActionList(actions, ctx, registry) API
  private runActions(actions: ParaAction[], ctx: ActionContext): void {
    executeParaActionList(
      actions,             // parsed AST
      ctx,                 // host for method chaining
      this.actions,        // ActionMap overrides
    );
  }
  // wrap action execution with per-step error handling
  private runActionsForStep(
    step: StepEntry,
    actions: ParaAction[],
    ctx: ActionContext
  ): void {
    try {
      this.runActions(actions, ctx);
    } catch (error) {
      this.markStepAsError(step, error);
    }
  }

  private markStepAsError(step: StepEntry, error: unknown): void {
    const el = step.element;

    // 1. Mark the element so CSS/debug UI can react
    el.classList.add('para-error');
    el.setAttribute('data-para-error', 'true');

    // 2. Debug visibility
    if (this.isDebugEnabled) {
      el.setAttribute('data-para-error-message', String(error));
    }

    // 3. Print a clear, informative console error
    // eslint-disable-next-line no-console
    console.error(
      '%cParaActions Error%c in step %o\nError: %o',
      'background:#B00020;color:white;padding:2px 4px;border-radius:3px;',
      '',
      el,
      error
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Global debug trigger line
  // ─────────────────────────────────────────────────────────────────────────────

  private createDebugLine(): void {
    if (!this.isDebugEnabled) return;
    if (this.debugLineElement) return;

    const el = document.createElement('div');
    el.className = 'paracharts-scrolly-debug-line';
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '0';
    el.style.borderTop = '2px dashed rgba(255, 0, 0, 0.8)';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';

    const label = document.createElement('span');
    label.style.position = 'absolute';
    label.style.left = '4px';
    label.style.top = '4px';
    label.style.fontFamily = 'monospace';
    label.style.fontSize = '11px';
    label.style.background = 'rgba(255, 255, 255, 0.9)';
    label.style.padding = '2px 4px';
    label.style.borderRadius = '2px';
    label.textContent = 'Scrolly offset (global)';
    el.appendChild(label);

    document.body.appendChild(el);
    this.debugLineElement = el;
  }

  private updateDebugLinePosition(): void {
    if (!this.isDebugEnabled || !this.debugLineElement) return;
    this.debugLineElement.style.top = `${this.offsetPx}px`;
  }
}
