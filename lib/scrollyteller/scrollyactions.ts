// Starter ActionMap for Scrollyteller → ParaCharts integration.

import type { ActionMap, ActionContext } from './scrollyteller';
import type { ParaValue } from '../paraactions/paraactions';

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
highlightSeries: (ctx: ActionContext, args: ParaValue[]) => {
  // console.warn('[scrollyActions.highlightSeries]', ctx, args);

  const seriesIds: string[] = [];
  let emphasis = 1;
  let dimOthers = true;
  let hasEmphasis = false;
  let hasDimOthers = false;

  for (const arg of args) {
    if (!arg) continue;
    const { kind, value } = arg;

    if (kind === 'string' || kind === 'identifier') {
      const id = asString(value);
      if (id) seriesIds.push(id);
      continue;
    }

    if (kind === 'number' && !hasEmphasis) {
      emphasis = asNumber(value, 1);
      hasEmphasis = true;
      continue;
    }

    if (kind === 'boolean' && !hasDimOthers) {
      dimOthers = asBoolean(value, true);
      hasDimOthers = true;
      continue;
    }
  }

  if (!ctx.chartId || seriesIds.length === 0) return;

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
resetHighlight: (ctx: ActionContext, args: ParaValue[]) => {
  const seriesIds: string[] = [];

  for (const arg of args) {
    if (!arg) continue;
    const { kind, value } = arg;
    if (kind === 'string' || kind === 'identifier') {
      const id = asString(value);
      if (id) seriesIds.push(id);
    }
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
progressFade: (ctx: ActionContext, args: ParaValue[]) => {
  const p = ctx.progress ?? 0;

  const seriesArg = args[0];
  const fadeInArg = args[1];
  const fadeOutArg = args[2];

  const series =
    seriesArg && (seriesArg.kind === 'string' || seriesArg.kind === 'identifier')
      ? asString(seriesArg.value)
      : null;

  const fadeIn =
    fadeInArg && fadeInArg.kind === 'number'
      ? asNumber(fadeInArg.value, 0)
      : 0;

  const fadeOut =
    fadeOutArg && fadeOutArg.kind === 'number'
      ? asNumber(fadeOutArg.value, 1)
      : 1;

  if (!series || !ctx.chartId) return;

  const tRaw = (p - fadeIn) / (fadeOut - fadeIn || 1);
  const t = Math.min(1, Math.max(0, tRaw));

  // explicit log of raw progress
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
showCallout: (ctx: ActionContext, args: ParaValue[]) => {
  const idArg = args[0];
  const textArg = args[1];

  const id =
    idArg && (idArg.kind === 'string' || idArg.kind === 'identifier')
      ? asString(idArg.value)
      : null;

  const text =
    textArg && textArg.kind === 'string'
      ? asString(textArg.value, '')
      : '';

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


hideCallout: (ctx: ActionContext, args: ParaValue[]) => {
  const idArg = args[0];

  const id =
    idArg && (idArg.kind === 'string' || idArg.kind === 'identifier')
      ? asString(idArg.value)
      : null;

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
logStep: (ctx: ActionContext, args: ParaValue[]) => {
  const tagArg = args[0];
  const tag =
    tagArg && (tagArg.kind === 'string' || tagArg.kind === 'identifier')
      ? asString(tagArg.value)
      : null;

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
  debugContext: (ctx: ActionContext, _args: ParaValue[]) => {
    // eslint-disable-next-line no-console
    console.log('[debugContext]', ctx);
  },
  // === AI: END CHANGED ===
};

