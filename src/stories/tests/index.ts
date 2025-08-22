import type { ChartType, ChartTypeFamily } from '@fizz/paramanifest';

import * as pieTestFunctions from './pieTests';

export const chartTypeTestMap: Record<ChartType, any> = {
    'line': [],
    'stepline': [],
    'bar': [],
    'column': [],
    'lollipop': [],
    'histogram': [],
    'scatter': [],
    'heatmap': [],
    'pie': pieTestFunctions,
    'donut': [],
    'graph': []
};

export const storyTestMap: Record<string, any> = {};
