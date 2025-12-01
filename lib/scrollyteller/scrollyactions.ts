// src/scrollyactions.ts
// Starter ActionMap for Scrollyteller → ParaCharts integration.
//
// These actions are invoked from attributes like:
//
//   data-para-enter="highlightSeries(series='revenue')"
//   data-para-exit="resetHighlight(series='revenue')"
//   data-para-progress="progressFade(series='revenue', in=0.2, out=0.8)"
//
// All arguments are parsed by paraActions.ts as ParaActionArg, which can be
// positional or named, and have typed values (string/number/boolean/null/identifier).

import type { ActionMap, ActionContext } from './scrollyteller';
import type {
  ParaActionArg,
  ParaNamedArg,
} from '../paraactions/paraactions';

// ───────────────────────────────────────────────────────────────────────────────
// Helpers for dealing with ParaActionArg[]
// ───────────────────────────────────────────────────────────────────────────────

function getNamedArgs(args: ParaActionArg[]): Record<string, unknown> {
  const namedEntries = args
    .filter((a): a is ParaNamedArg => a.kind === 'named')
    .map(a => [a.name, a.value] as const);

  return Object.fromEntries(namedEntries);
}

function getPositionalArgs(args: ParaActionArg[]): unknown[] {
  return args
    .filter(a => a.kind === 'positional')
    .map(a => a.value);
}

// Convenience helpers for common patterns
function asString(value: unknown, fallback: string | null = null): string | null {
  if (value == null) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

// ───────────────────────────────────────────────────────────────────────────────
// Default scrollyActions
// ───────────────────────────────────────────────────────────────────────────────
//
// NOTE: This is a starter set. You can replace the console.log calls with your
// real ParaCharts APIs (e.g., ctx.parachart.api.getSeries(...).setOpacity(...)).

export const scrollyActions: ActionMap = {

  /**
   * Reset highlight for a series or entire chart.
   *
   * Examples:
   *   data-para-exit="resetHighlight(series='revenue')"
   *   data-para-exit="resetHighlight()"
   */
  reset: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const positional = getPositionalArgs(args);

    const primarySeries = asString(named.series);
    const seriesIds: string[] = [];

    if (primarySeries) {
      seriesIds.push(primarySeries);
    }
    for (const value of positional) {
      const id = asString(value);
      if (id) seriesIds.push(id);
    }

    // Replace with your real chart API:
    // if (ctx.chartId) {
    //   const chart = ctx.parachart.api.getChart(ctx.chartId);
    //   if (seriesIds.length > 0) {
    //     chart.resetHighlight(seriesIds);
    //   } else {
    //     chart.resetAllHighlights();
    //   }
    // }

    // eslint-disable-next-line no-console
    console.log('[reset]', {
      chartId: ctx.chartId,
      seriesIds,
    });
  },


  /**
   * Highlight one or more series on the chart.
   *
   * Examples:
   *   data-para-enter="highlightSeries(series='revenue')"
   *   data-para-enter="highlightSeries(revenue, expenses)"
   */
  highlightSeries: (ctx: ActionContext, ...args: ParaActionArg[]) => {

    console.warn('scrollyactions:', 'highlightSeries', ctx, args)

    const named = getNamedArgs(args);
    const positional = getPositionalArgs(args);

    // series can be provided either as named or positional
    const primarySeries = asString(named.series);
    const seriesIds: string[] = [];

    if (primarySeries) {
      seriesIds.push(primarySeries);
    }
    for (const value of positional) {
      const id = asString(value);
      if (id) seriesIds.push(id);
    }

    if (!ctx.chartId || seriesIds.length === 0) return;

    // Optional: knobs for how strong the highlight is, whether to dim others, etc.
    const emphasis = asNumber(named.emphasis, 1);
    const dimOthers = asBoolean(named.dimOthers, true);

    // Replace with your real chart API:
    // ctx.parachart.api
    //   .getChart(ctx.chartId)
    //   .highlightSeries(seriesIds, { emphasis, dimOthers });

    // eslint-disable-next-line no-console
    console.log('[highlightSeries]', {
      chartId: ctx.chartId,
      seriesIds,
      emphasis,
      dimOthers,
    });
  },

  /**
   * Reset highlight for a series or entire chart.
   *
   * Examples:
   *   data-para-exit="resetHighlight(series='revenue')"
   *   data-para-exit="resetHighlight()"
   */
  resetHighlight: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const positional = getPositionalArgs(args);

    const primarySeries = asString(named.series);
    const seriesIds: string[] = [];

    if (primarySeries) {
      seriesIds.push(primarySeries);
    }
    for (const value of positional) {
      const id = asString(value);
      if (id) seriesIds.push(id);
    }

    // Replace with your real chart API:
    // if (ctx.chartId) {
    //   const chart = ctx.parachart.api.getChart(ctx.chartId);
    //   if (seriesIds.length > 0) {
    //     chart.resetHighlight(seriesIds);
    //   } else {
    //     chart.resetAllHighlights();
    //   }
    // }

    // eslint-disable-next-line no-console
    console.log('[resetHighlight]', {
      chartId: ctx.chartId,
      seriesIds,
    });
  },

  /**
   * Progress-driven fade action.
   *
   * Example:
   *   data-para-progress="progressFade(series='revenue', in=0.2, out=0.8)"
   *
   * This will:
   *   - log the raw progress as provided by Scrollyteller
   *   - map progress from [in, out] range to [0, 1] as t
   *   - log the final t value (used as e.g. opacity)
   */
  progressFade: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const series = asString(named.series);
    const p = ctx.progress ?? 0;

    // ⬅️ explicit log of raw progress
    // eslint-disable-next-line no-console
    console.log('[progressFade] raw progress =', p);

    const fadeIn = asNumber(named.in, 0);
    const fadeOut = asNumber(named.out, 1);

    if (!series) return;

    // Normalize to [0, 1] within fadeIn → fadeOut window
    const tRaw = (p - fadeIn) / (fadeOut - fadeIn);
    const t = Math.min(1, Math.max(0, tRaw));

    // eslint-disable-next-line no-console
    console.log('[progressFade]', {
      chartId: ctx.chartId,
      series,
      fadeIn,
      fadeOut,
      t,
    });

    // Real chart API might look like:
    // ctx.parachart.api
    //   .getSeries(series)
    //   .setOpacity(t);
  },

  /**
   * Show a textual callout or annotation at a step.
   *
   * Example:
   *   data-para-enter="showCallout(id='q4-dip', text='Notice the Q4 drawdown')"
   *   data-para-exit="hideCallout(id='q4-dip')"
   */
  showCallout: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const id = asString(named.id);
    const text = asString(named.text, '');

    if (!ctx.chartId || !id) return;

    // eslint-disable-next-line no-console
    console.log('[showCallout]', {
      chartId: ctx.chartId,
      id,
      text,
    });

    // Real chart API:
    // ctx.parachart.api
    //   .getChart(ctx.chartId)
    //   .showCallout({ id, text, stepIndex: ctx.index });
  },

  hideCallout: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const id = asString(named.id);

    if (!ctx.chartId || !id) return;

    // eslint-disable-next-line no-console
    console.log('[hideCallout]', {
      chartId: ctx.chartId,
      id,
    });

    // Real chart API:
    // ctx.parachart.api
    //   .getChart(ctx.chartId)
    //   .hideCallout(id);
  },

  /**
   * Simple debugging helper: log the scrollytelling context and any arguments.
   *
   * Example:
   *   data-para-enter="logStep(tag='intro')"
   */
  logStep: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const tag = asString(named.tag);

    // eslint-disable-next-line no-console
    console.log('[logStep]', {
      index: ctx.index,
      direction: ctx.direction,
      progress: ctx.progress,
      chartId: ctx.chartId,
      datasetId: ctx.datasetId,
      tag,
      args,
    });
  },

  /**
   * Ultra-verbose debugging helper: dump the entire ActionContext.
   *
   * Example:
   *   data-para-enter="debugContext()"
   */
  debugContext: (ctx: ActionContext) => {
    // eslint-disable-next-line no-console
    console.log('[debugContext]', ctx);
  },
};
