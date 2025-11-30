// src/Scrollyteller.ts
// Scrollytelling engine using IntersectionObserver, designed to be hosted by
// something like ParaCharts that implements ScrollyHost.

export type ScrollDirection = 'up' | 'down';
export type ScrollyEvent = 'stepEnter' | 'stepExit' | 'stepProgress';

export interface ScrollytellingSettings {
  offset?: number | string; // 0-1 or 'NNNpx' or >1 px
  isDebug?: boolean;
}

// Host interface: ParaCharts will implement this shape.
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

export type ActionHandler = (ctx: ActionContext) => void;

export interface ActionMap {
  [actionName: string]: ActionHandler;
}

export interface ScrollytellerOptions {
  offset?: number | string;
  isDebug?: boolean;
  rootMarginExtra?: number; // px
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

  enterActions: string[];
  exitActions: string[];
  progressActions: string[];

  chartId: string | null;
  datasetId: string | null;

  offsetRaw: string | null; // data-para-offset per-step override
  debugLineEl?: HTMLDivElement | null;
}

type StepCallback = (info: ActionContext) => void;

export class Scrollyteller {
  private parachart: ScrollyHost;
  private options: ScrollytellerOptions;
  private actions: ActionMap;

  private steps: StepEntry[] = [];
  private stepMap: WeakMap<Element, StepEntry> = new WeakMap();

  private observer: IntersectionObserver | null = null;

  private offsetPx = 0; // global offset in px
  private lastScrollY = 0;
  private direction: ScrollDirection = 'down';

  private debugEnabled = false;
  private debugLineEl: HTMLDivElement | null = null; // global debug line

  private events: Map<ScrollyEvent, StepCallback[]> = new Map();

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

    console.warn('Scrolly: constructor')
    this.init();
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────────

  public init(): void {
    console.warn('Scrolly: init')

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.resolveSettings();
    this.collectSteps();
    if (this.steps.length === 0) return;

    this.createDebugLine();
    this.setupObserver();
    this.updateDebugLinePosition();

    this.lastScrollY = window.pageYOffset || 0;
  }

  public destroy(): void {
    if (this.observer) {
      this.steps.forEach(step => this.observer?.unobserve(step.element));
      this.observer.disconnect();
      this.observer = null;
    }

    // Clean per-step debug lines
    this.steps.forEach(step => {
      if (step.debugLineEl && step.debugLineEl.parentNode) {
        step.debugLineEl.parentNode.removeChild(step.debugLineEl);
      }
      step.debugLineEl = null;
    });

    this.steps = [];
    this.stepMap = new WeakMap();
    this.events.clear();

    // Clean global debug line
    if (this.debugLineEl && this.debugLineEl.parentNode) {
      this.debugLineEl.parentNode.removeChild(this.debugLineEl);
      this.debugLineEl = null;
    }
  }

  public resize(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    this.computeOffsetPx();
    this.updateObserverRootMargin();
    this.updateDebugLinePosition();
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

  // ───────────────────────────────────────────────────────────────────────────────
  // Settings & step collection
  // ───────────────────────────────────────────────────────────────────────────────

  private resolveSettings(): void {
    const storeSettings =
      this.parachart?.paraView?.store?.settings?.scrollytelling ?? {};
    const combined: ScrollytellingSettings = {
      ...storeSettings,
      ...this.options,
    };

    this.debugEnabled = !!combined.isDebug;
    this.offsetPx = this.computeOffsetFromSetting(combined.offset);
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
      return isNaN(value) ? viewH * 0.5 : value;
    }

    // If string but not 'px', treat as fraction or fallback to 0.5vh
    const num = Number(offset);
    if (!isNaN(num) && num >= 0 && num <= 1) {
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

      const enterActions = this.parseActionList(enterAttr);
      const exitActions = this.parseActionList(exitAttr);
      const progressActions = this.parseActionList(progressAttr);

      const hasEnter = enterActions.length > 0;
      const hasExit = exitActions.length > 0;
      const hasProgress = progressActions.length > 0;

      const chartId = el.dataset.paraChartid ?? null;
      const datasetId = el.dataset.paraDatasetid ?? null;
      const offsetRaw = el.dataset.paraOffset ?? null;

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
        debugLineEl: null,
      };

      this.steps.push(step);
      this.stepMap.set(el, step);
    });
  }

  private parseActionList(attr: string | null): string[] {
    if (!attr) return [];
    return attr
      .split(/[, ]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // IntersectionObserver setup
  // ───────────────────────────────────────────────────────────────────────────────

  private setupObserver(): void {
    const rootMargin = this.computeRootMargin();
    const thresholds = this.computeThresholds();

    if (this.observer) {
      this.steps.forEach(step => this.observer?.unobserve(step.element));
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      entries => this.handleIntersections(entries),
      {
        root: null,
        rootMargin,
        threshold: thresholds,
      }
    );

    this.steps.forEach(step => this.observer!.observe(step.element));
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
    const steps = 10;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      out.push(i / steps);
    }
    return out;
  }

  private updateObserverRootMargin(): void {
    if (!this.observer) return;
    this.setupObserver();
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Per-step offset helper
  // ───────────────────────────────────────────────────────────────────────────────

  private computeStepOffsetPx(offsetRaw: string | null): number {
    if (typeof window === 'undefined') return this.offsetPx;
    if (!offsetRaw) return this.offsetPx;

    const viewH = window.innerHeight || 0;
    const trimmed = offsetRaw.trim();
    if (!trimmed) return this.offsetPx;

    if (trimmed.endsWith('px')) {
      const value = Number(trimmed.replace('px', ''));
      return isNaN(value) ? this.offsetPx : value;
    }

    const num = Number(trimmed);
    if (isNaN(num)) return this.offsetPx;

    if (num >= 0 && num <= 1) {
      return viewH * num;
    }
    if (num > 1) {
      return num;
    }

    return this.offsetPx;
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Per-step debug line helpers
  // ───────────────────────────────────────────────────────────────────────────────

  private ensureStepDebugLine(step: StepEntry): void {
    if (!this.debugEnabled) return;
    if (step.debugLineEl) return;

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
    label.textContent = `step ${step.index}${
      step.offsetRaw ? ` @ ${step.offsetRaw}` : ''
    }`;
    line.appendChild(label);

    const style = window.getComputedStyle(step.element);
    if (style.position === 'static') {
      step.element.style.position = 'relative';
    }

    step.element.appendChild(line);
    step.debugLineEl = line;
  }

  private updateStepDebugLine(
    step: StepEntry,
    rect: DOMRectReadOnly,
    offsetPx: number
  ): void {
    if (!this.debugEnabled) return;
    this.ensureStepDebugLine(step);
    if (!step.debugLineEl) return;

    const localY = offsetPx - rect.top;
    const clamped = Math.min(Math.max(localY, 0), rect.height);

    step.debugLineEl.style.top = `${clamped}px`;
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Intersection handling
  // ───────────────────────────────────────────────────────────────────────────────

  private handleIntersections(entries: IntersectionObserverEntry[]): void {
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
    const prevProgress = step.progress;

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

    if (
      isActive &&
      step.hasProgress &&
      Math.abs(progress - prevProgress) > 0.001
    ) {
      this.handleProgress(step);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Event + actions dispatch
  // ───────────────────────────────────────────────────────────────────────────────

  private handleEnter(step: StepEntry): void {
    const ctx: ActionContext = {
      element: step.element,
      index: step.index,
      direction: this.direction,
      chartId: step.chartId,
      datasetId: step.datasetId,
      parachart: this.parachart,
    };

    this.emit('stepEnter', ctx);

    if (this.onStepEnter) {
      this.onStepEnter(ctx);
    }

    if (step.hasEnter) {
      this.runActions(step.enterActions, ctx);
    }

    if (this.debugEnabled) {
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

    this.emit('stepExit', ctx);

    if (this.onStepExit) {
      this.onStepExit(ctx);
    }

    if (step.hasExit) {
      this.runActions(step.exitActions, ctx);
    }

    if (this.debugEnabled) {
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

    if (step.hasProgress) {
      this.runActions(step.progressActions, ctx);
    }
  }

  private runActions(actionNames: string[], ctx: ActionContext): void {
    for (const name of actionNames) {
      const handler = this.actions[name];
      if (typeof handler === 'function') {
        handler(ctx);
      } else if (this.debugEnabled) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Scrollyteller] No handler registered for action '${name}'.`
        );
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Global debug trigger line
  // ───────────────────────────────────────────────────────────────────────────────

  private createDebugLine(): void {
    if (!this.debugEnabled) return;
    if (this.debugLineEl) return;

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
    label.textContent = `Scrolly offset (global): ${this.offsetPx}px`;
    el.appendChild(label);

    document.body.appendChild(el);
    this.debugLineEl = el;
  }

  private updateDebugLinePosition(): void {
    if (!this.debugEnabled || !this.debugLineEl) return;
    this.debugLineEl.style.top = `${this.offsetPx}px`;
  }
}
