// Scrollyteller.ts
// Minimal scrollytelling engine integrated with ParaCharts settings.
//
// Assumptions / conventions:
// - Steps are any elements that have at least one of:
//   data-para-enter, data-para-exit, data-para-progress
// - Offset comes from this.parachart.paraView.store.settings.scrollytelling.offset
//   and can be a number (0-1 = percent of viewport height) or a string like '200px'.
// - Only elements with data-para-progress fire progress callbacks.
// - You will plug in actual handlers to run for enter/exit/progress actions.

type ScrollDirection = 'up' | 'down';

interface ScrollytellingSettings {
  offset?: number | string;   // 0-1 or 'px' string
  debug?: boolean;
}

interface ParaViewStore {
  settings?: {
    scrollytelling?: ScrollytellingSettings;
  };
}

interface ParaView {
  store?: ParaViewStore;
}

interface ParaChartLike {
  paraView?: ParaView;
  // Add anything else you need from your ParaCharts root object
}

interface StepState {
  element: HTMLElement;
  index: number;
  isActive: boolean;
  progress: number;      // 0-1
  direction: ScrollDirection | null;
  hasEnter: boolean;
  hasExit: boolean;
  hasProgress: boolean;
}

interface ScrollytellerOptions {
  // Optional manual override if you don't want to pull directly from ParaCharts
  offset?: number | string;
  debug?: boolean;
  rootMarginExtra?: number; // Extra padding around viewport for IO, in px
}

type StepCallback = (info: {
  element: HTMLElement;
  index: number;
  direction: ScrollDirection;
  progress?: number;
}) => void;

export class Scrollyteller {
  private parachart: ParaChartLike;
  private options: ScrollytellerOptions;

  private steps: StepState[] = [];
  private observer: IntersectionObserver | null = null;

  private offsetPx: number = 0;
  private lastScrollY: number = 0;
  private direction: ScrollDirection = 'down';

  private debugEnabled: boolean = false;
  private debugLineEl: HTMLDivElement | null = null;

  // External hooks you can wire into ParaCharts
  public onStepEnter?: StepCallback;
  public onStepExit?: StepCallback;
  public onStepProgress?: StepCallback;

  constructor(parachart: ParaChartLike, options: ScrollytellerOptions = {}) {
    this.parachart = parachart;
    this.options = options;
  }

  /**
   * Initialize scrollytelling:
   * - resolve settings (offset, debug)
   * - find step elements
   * - compute offset in px
   * - create IO and observe steps
   */
  public init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // SSR / non-DOM guard
      return;
    }

    this.resolveSettings();
    this.collectSteps();
    if (this.steps.length === 0) return;

    this.showTriggerLine();
    this.setupObserver();
    this.updateDebugLinePosition();

    // Initial evaluation (in case initial scroll position is not top)
    this.lastScrollY = window.pageYOffset || 0;
  }

  public destroy(): void {
    if (this.observer) {
      this.steps.forEach(step => this.observer?.unobserve(step.element));
      this.observer.disconnect();
      this.observer = null;
    }
    this.steps = [];

    if (this.debugLineEl && this.debugLineEl.parentNode) {
      this.debugLineEl.parentNode.removeChild(this.debugLineEl);
      this.debugLineEl = null;
    }
  }

  /**
   * Call this on resize (or let your layout system trigger it)
   */
  public resize(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    this.computeOffsetPx();
    this.updateObserverRootMargin();
    this.updateDebugLinePosition();
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Configuration & setup
  // ────────────────────────────────────────────────────────────────────────────────

  private resolveSettings(): void {
    const storeSettings =
      this.parachart?.paraView?.store?.settings?.scrollytelling ?? {};
    const combined: ScrollytellingSettings = {
      ...storeSettings,
      ...this.options,
    };

    this.debugEnabled = !!combined.debug;

    // Resolve offset -> this.offsetPx
    this.offsetPx = this.computeOffsetFromSetting(combined.offset);
  }

  private computeOffsetFromSetting(offset: number | string | undefined): number {
    const viewH =
      typeof window !== 'undefined' ? window.innerHeight || 0 : 0;

    if (offset == null) {
      // default: middle of viewport
      return viewH * 0.5;
    }

    if (typeof offset === 'number') {
      // treat as percent if 0-1, or as px if >= 1
      if (offset >= 0 && offset <= 1) {
        return viewH * offset;
      }
      return offset; // already pixels
    }

    if (typeof offset === 'string' && offset.endsWith('px')) {
      const value = Number(offset.replace('px', ''));
      return isNaN(value) ? viewH * 0.5 : value;
    }

    // Fallback: middle of viewport
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
    const elements: HTMLElement[] = Array.from(new Set(nodeList)); // de-dup elements

    this.steps = elements.map((el, index) => {
      const hasEnter = el.hasAttribute('data-para-enter');
      const hasExit = el.hasAttribute('data-para-exit');
      const hasProgress = el.hasAttribute('data-para-progress');

      el.setAttribute('data-para-step-index', String(index));

      return {
        element: el,
        index,
        isActive: false,
        progress: 0,
        direction: null,
        hasEnter,
        hasExit,
        hasProgress,
      };
    });
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // IntersectionObserver setup
  // ────────────────────────────────────────────────────────────────────────────────

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

    // We want a vertical band around the trigger line.
    // We'll center the IO viewport so that the trigger line is at this.offsetPx.
    //
    // Top of IO viewport is shifted up by offsetPx.
    // Bottom is shifted down so that total height stays equal to real viewport.
    const topMargin = -this.offsetPx;
    const bottomMargin = this.offsetPx - viewH;

    const extra = this.options.rootMarginExtra ?? 0;
    const top = topMargin - extra;
    const bottom = bottomMargin - extra;

    return `${top}px 0px ${bottom}px 0px`;
  }

  private computeThresholds(): number[] {
    // A few thresholds give us smoother progress without going crazy.
    // We’ll still compute progress manually, but thresholds make sure IO fires often.
    const steps = 10;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      out.push(i / steps);
    }
    return out;
  }

  private updateObserverRootMargin(): void {
    if (!this.observer) return;
    this.setupObserver(); // simplest: recreate with new margins
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Intersection handling
  // ────────────────────────────────────────────────────────────────────────────────

  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    if (typeof window === 'undefined') return;

    const currentY = window.pageYOffset || 0;
    this.direction = currentY > this.lastScrollY ? 'down' : 'up';
    this.lastScrollY = currentY;

    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      const indexAttr = target.getAttribute('data-para-step-index');
      if (indexAttr == null) continue;

      const index = Number(indexAttr);
      const step = this.steps[index];
      if (!step) continue;

      const rect = entry.boundingClientRect;
      this.updateStepStateFromGeometry(step, rect);
    }
  }

  /**
   * Core geometry:
   * - offsetPx defines the trigger line (from top of viewport).
   * - topAdjusted   = top - offsetPx
   * - bottomAdjusted= bottom - offsetPx
   *
   * Cases:
   * - topAdj > 0 && bottomAdj > 0  → step is BEFORE trigger line (above viewport)
   * - topAdj <= 0 && bottomAdj >= 0 → trigger line INSIDE step → ACTIVE
   * - topAdj < 0 && bottomAdj < 0 → step is AFTER trigger line (scrolled past)
   */
  private updateStepStateFromGeometry(
    step: StepState,
    rect: DOMRectReadOnly
  ): void {
    const { top, bottom, height } = rect;
    const topAdjusted = top - this.offsetPx;
    const bottomAdjusted = bottom - this.offsetPx;

    const wasActive = step.isActive;
    const prevProgress = step.progress;

    // Determine new state and progress
    let isActive = false;
    let progress = step.progress;

    if (topAdjusted <= 0 && bottomAdjusted >= 0) {
      // Trigger line is inside the element
      isActive = true;

      // Progress: 0 when trigger hits top, 1 when trigger hits bottom.
      // At top: topAdj = 0, bottomAdj = height
      // At bottom: bottomAdj = 0
      if (height > 0) {
        const raw = 1 - bottomAdjusted / height;
        progress = Math.min(1, Math.max(0, raw));
      } else {
        progress = 0;
      }
    } else if (bottomAdjusted < 0) {
      // Trigger line is below the element → fully 'after'
      isActive = false;
      progress = 1;
    } else if (topAdjusted > 0) {
      // Trigger line is above the element → fully 'before'
      isActive = false;
      progress = 0;
    }

    step.isActive = isActive;
    step.progress = progress;
    step.direction = this.direction;

    // Fire callbacks based on transitions
    if (!wasActive && isActive) {
      this.handleEnter(step);
    } else if (wasActive && !isActive) {
      this.handleExit(step);
    }

    // Only send progress if:
    // - step is active
    // - it actually has progress hooks
    // - progress changed meaningfully
    if (
      isActive &&
      step.hasProgress &&
      this.onStepProgress &&
      Math.abs(progress - prevProgress) > 0.001
    ) {
      this.onStepProgress({
        element: step.element,
        index: step.index,
        direction: this.direction,
        progress,
      });
    }
  }

  private handleEnter(step: StepState): void {
    if (!step.hasEnter || !this.onStepEnter) return;

    this.onStepEnter({
      element: step.element,
      index: step.index,
      direction: this.direction,
    });

    if (this.debugEnabled) {
      step.element.setAttribute('data-para-debug-state', 'enter');
    }
  }

  private handleExit(step: StepState): void {
    if (!step.hasExit || !this.onStepExit) return;

    this.onStepExit({
      element: step.element,
      index: step.index,
      direction: this.direction,
    });

    if (this.debugEnabled) {
      step.element.setAttribute('data-para-debug-state', 'exit');
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Debug trigger line
  // ────────────────────────────────────────────────────────────────────────────────

  private showTriggerLine(): void {
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
    label.textContent = `Scrolly trigger: ${this.offsetPx}px`;
    el.appendChild(label);

    document.body.appendChild(el);
    this.debugLineEl = el;
  }

  private updateDebugLinePosition(): void {
    if (!this.debugEnabled || !this.debugLineEl) return;
    this.debugLineEl.style.top = `${this.offsetPx}px`;
  }
}
