
import { PlaneDirection } from '../config/config_types';

export interface NavSchema {
  start: NavStart;
  shouldWrapMove?: boolean;
  oneWayTopLink?: boolean;
  levels: NavLevel[];
  transitions: NavTransition[];
}

export interface NavStart {
  level: string;
  if?: NavStartIf;
  else?: string;
}

export type NavStartIf = 'sonificationIsEnabled';

export interface NavLevel {
  id: string;
  orientation?: NavOrientation;
  wrap?: boolean;
  invisible?: boolean;
}

export type NavOrientation = 'horiz' | 'vert' | 'both';

export interface NavTransition {
  from: string;
  to: string;
  dir?: PlaneDirection;
  iter?: NavIter;
  mode: NavMode;
  when?: NavWhen;
  reciprocal?: boolean;
}

export type NavIter = 'datapoints' | 'records' | 'clusters';
export type NavMode = 'oneToFirst' | 'eachToFirst' | 'trendPointToTrend' | 'eachToFirstOfEachSet' | 'eachOfSetToNextSet' | 'eachOfSetToSameSet';
export type NavWhen = 'first' | 'last';

import barSingleJson from './bar_single.json' with { type: 'json' };
import barMultiJson from './bar_multi.json' with { type: 'json' };
import lineSingleJson from './line_single.json' with { type: 'json' };
import lineMultiJson from './line_multi.json' with { type: 'json' };
import candlestickSingleJson from './candlestick_single.json' with { type: 'json' };
import candlestickMultiJson from './candlestick_multi.json' with { type: 'json' };
import donutSingleJson from './donut_single.json' with { type: 'json' };
import donutMultiJson from './donut_multi.json' with { type: 'json' };
import pieSingleJson from './pie_single.json' with { type: 'json' };
import pieMultiJson from './pie_multi.json' with { type: 'json' };
import waterfallSingleJson from './waterfall_single.json' with { type: 'json' };
import waterfallMultiJson from './waterfall_multi.json' with { type: 'json' };
import scatterSingleJson from './scatter_single.json' with { type: 'json' };
import scatterMultiJson from './scatter_multi.json' with { type: 'json' };
import histogramSingleJson from './histogram_single.json' with { type: 'json' };
import histogramMultiJson from './histogram_multi.json' with { type: 'json' };
import heatmapSingleJson from './heatmap_single.json' with { type: 'json' };
import heatmapMultiJson from './heatmap_multi.json' with { type: 'json' };
import bubbleSingleJson from './bubble_single.json' with { type: 'json' };
import bubbleMultiJson from './bubble_multi.json' with { type: 'json' };
import lollipopSingleJson from './lollipop_single.json' with { type: 'json' };
import lollipopMultiJson from './lollipop_multi.json' with { type: 'json' };
import steplineSingleJson from './stepline_single.json' with { type: 'json' };
import steplineMultiJson from './stepline_multi.json' with { type: 'json' };
import { ChartType } from '@fizz/chartsignal-internal';

export interface NavSchemaPair {
  single: NavSchema;
  multi: NavSchema;
}

export const navSchemas: Partial<Record<ChartType, NavSchemaPair>> = {
  bar: {
    single: barSingleJson as NavSchema,
    multi: barMultiJson as NavSchema
  },
  column: {
    single: barSingleJson as NavSchema,
    multi: barMultiJson as NavSchema
  },
  line: {
    single: lineSingleJson as NavSchema,
    multi: lineMultiJson as NavSchema
  },
  candlestick: {
    single: candlestickSingleJson as NavSchema,
    multi: candlestickMultiJson as NavSchema
  },
  donut: {
    single: donutSingleJson as NavSchema,
    multi: donutMultiJson as NavSchema
  },
  pie: {
    single: pieSingleJson as NavSchema,
    multi: pieMultiJson as NavSchema
  },
  waterfall: {
    single: waterfallSingleJson as NavSchema,
    multi: waterfallMultiJson as NavSchema
  },
  scatter: {
    single: scatterSingleJson as NavSchema,
    multi: scatterMultiJson as NavSchema
  },
  histogram: {
    single: histogramSingleJson as NavSchema,
    multi: histogramMultiJson as NavSchema
  },
  heatmap: {
    single: heatmapSingleJson as NavSchema,
    multi: heatmapMultiJson as NavSchema
  },
  bubble: {
    single: bubbleSingleJson as NavSchema,
    multi: bubbleMultiJson as NavSchema
  },
  lollipop: {
    single: lollipopSingleJson as NavSchema,
    multi: lollipopMultiJson as NavSchema
  },
  stepline: {
    single: steplineSingleJson as NavSchema,
    multi: steplineMultiJson as NavSchema
  }
}
