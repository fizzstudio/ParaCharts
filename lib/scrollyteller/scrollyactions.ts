// lib/scrollyteller/scrollyactions.ts
// Starter ActionMap for Scrollyteller → ParaCharts integration.

import type { ActionMap, ActionContext } from './scrollyteller';
import type {
  ParaActionArg,
  ParaNamedArg,
} from '../paraactions/paraactions';

// Rough structural type for your ParaCharts API.
// Adjust/extend as your real API evolves.
export interface ParaChartsSeriesApi {
  setOpacity(value: number): void;
}

export interface ParaChartsChartApi {
  getSeries(id: string): ParaChartsSeriesApi;
  highlightSeries(seriesIds: string[], options?: { emphasis?: number; dimOthers?: boolean }): void;
  resetHighlight?(seriesIds?: string[]): void;
  resetAllHighlights?(): void;
}

export interface ParaChartsApi {
  getChart(id: string): ParaChartsChartApi;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for dealing with ParaActionArg[]
// ─────────────────────────────────────────────────────────────────────────────

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

// Optional helper to fetch your real chart API. Adjust to your actual structure.
function getApiFromContext(ctx: ActionContext): ParaChartsApi | null {
  const parachartAny = ctx.parachart as any;
  const api = parachartAny?.api;

  if (!api || typeof api.getChart !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('[scrollyActions] ctx.parachart.api missing or invalid');
    return null;
  }

  return api as ParaChartsApi;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default scrollyActions
// ─────────────────────────────────────────────────────────────────────────────

export const scrollyActions: ActionMap = {
  /**
   * Highlight one or more series on the chart.
   *
   * Examples:
   *   data-para-enter="highlightSeries(series='revenue')"
   *   data-para-enter="highlightSeries(revenue, expenses)"
   */
  highlightSeries: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    // console.warn('[scrollyActions.highlightSeries]', ctx, args);

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

    if (!ctx.chartId || seriesIds.length === 0) return;

    const emphasis = asNumber(named.emphasis, 1);
    const dimOthers = asBoolean(named.dimOthers, true);

    const api = getApiFromContext(ctx);
    if (!api) {
      // eslint-disable-next-line no-console
      console.warn('[scrollyActions.highlightSeries] no api on parachart');
      return;
    }

    const chart = api.getChart(ctx.chartId);
    chart.highlightSeries(seriesIds, { emphasis, dimOthers });

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

    const api = getApiFromContext(ctx);
    if (!api || !ctx.chartId) {
      // eslint-disable-next-line no-console
      console.warn('[scrollyActions.resetHighlight] no api or chartId');
      return;
    }

    const chart = api.getChart(ctx.chartId);

    if (seriesIds.length > 0 && chart.resetHighlight) {
      chart.resetHighlight(seriesIds);
    } else if (chart.resetAllHighlights) {
      chart.resetAllHighlights();
    }

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
   */
  progressFade: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const series = asString(named.series);
    const p = ctx.progress ?? 0;

    // explicit log of raw progress
    // eslint-disable-next-line no-console
    console.log('[progressFade] raw progress =', p);

    const fadeIn = asNumber(named.in, 0);
    const fadeOut = asNumber(named.out, 1);

    if (!series || !ctx.chartId) return;

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

    const api = getApiFromContext(ctx);
    if (!api) return;

    const chart = api.getChart(ctx.chartId);
    const seriesApi = chart.getSeries(series);
    seriesApi.setOpacity(t);
  },

  /**
   * Show a textual callout or annotation at a step.
   */
  showCallout: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const id = asString(named.id);
    const text = asString(named.text, '');

    if (!ctx.chartId || !id) return;

    const api = getApiFromContext(ctx);
    if (!api) return;

    // Real chart API:
    // api.getChart(ctx.chartId).showCallout({ id, text, stepIndex: ctx.index });

    // eslint-disable-next-line no-console
    console.log('[showCallout]', {
      chartId: ctx.chartId,
      id,
      text,
    });
  },

  hideCallout: (ctx: ActionContext, ...args: ParaActionArg[]) => {
    const named = getNamedArgs(args);
    const id = asString(named.id);

    if (!ctx.chartId || !id) return;

    const api = getApiFromContext(ctx);
    if (!api) return;

    // Real chart API:
    // api.getChart(ctx.chartId).hideCallout(id);

    // eslint-disable-next-line no-console
    console.log('[hideCallout]', {
      chartId: ctx.chartId,
      id,
    });
  },

  /**
   * Simple debugging helper: log the scrollytelling context and any arguments.
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
   */
  debugContext: (ctx: ActionContext) => {
    // eslint-disable-next-line no-console
    console.log('[debugContext]', ctx);
  },
};
