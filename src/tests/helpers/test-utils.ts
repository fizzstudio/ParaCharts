import { vi, expect } from 'vitest';

// Manifest factory functions
export const createTestManifest = (overrides: any = {}) => ({
  datasets: [{
    type: 'bar',
    description: 'Test Chart',
    series: [
      { key: 'sales', records: [] },
      { key: 'profit', records: [] }
    ],
    data: { source: 'inline' },
    ...overrides
  }]
});

export const createComplexManifest = (overrides: any = {}) => ({
  datasets: [{
    type: 'bar',
    description: 'Test Bar Chart',
    series: [
      { key: 'sales', records: [] },
      { key: 'profit', records: [] }
    ],
    data: { source: 'inline' },
    ...overrides
  }]
});

// CSV data factory
export const createCSVData = () => ({
  text: 'date,sales,profit\n2023-01,100,20\n2023-02,150,30',
  rows: [
    { date: '2023-01', sales: '100', profit: '20' },
    { date: '2023-02', sales: '150', profit: '30' }
  ],
  fields: ['date', 'sales', 'profit'],
  seriesKeys: ['sales', 'profit'],
  independentKey: 'date'
});

// Mock fetch utilities
export const createMockResponse = (data: any, options: { shouldFailJson?: boolean } = {}) => ({
  json: vi.fn().mockImplementation(() => 
    options.shouldFailJson 
      ? Promise.reject(new Error('Invalid JSON')) 
      : Promise.resolve(data)
  ),
  text: vi.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data))
});

export const mockFetch = (data: any, options: { shouldFail?: boolean, shouldFailJson?: boolean } = {}) => {
  if (options.shouldFail) {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'));
    globalThis.fetch = mockFn;
    return mockFn;
  }
  
  const mockResponse = createMockResponse(data, options);
  const mockFn = vi.fn().mockResolvedValue(mockResponse);
  globalThis.fetch = mockFn;
  return mockFn;
};

// Mock store factory
export const createMockStore = (overrides: any = {}) => ({
  settings: {
    color: {
      colorMap: null,
      colorPalette: 'diva',
      colorVisionMode: 'normal'
    },
    ...overrides.settings
  },
  updateSettings: vi.fn(),
  ...overrides
});

// Common test data
export const TEST_DATA = {
  // Sample field arrays
  MIXED_FIELDS: ['date', 'sales', 'profit', 'region'],
  NUMERIC_FIELDS: ['sales', 'profit'],
  SERIES_KEYS: ['sales', 'profit'],
  
  // Sample row data
  SAMPLE_ROWS: [
    { date: '2023-01', sales: '100', profit: '20' },
    { date: '2023-02', sales: '150', profit: '30' }
  ],
  
  // Path constants
  CHART_DATA_PREFIX: './node_modules/@fizz/chart-data/data/',
  
  // Sample values for type detection
  NUMERIC_VALUE: '123.45',
  STRING_VALUE: 'Category A',
  
  // HSL color samples
  HSL_COLORS: {
    BASIC: 'hsl(180, 50%, 25%)',
    NEGATIVE_HUE: 'hsl(-45, 100%, 50%)',
    DECIMAL: 'hsl(270.5, 33.3%, 66.7%)'
  },
  
  // Test number pairs for comparison
  COMPARISON_PAIRS: {
    EQUAL: [5, 5],
    GREATER: [10, 5],
    LESSER: [3, 8],
    PERCENTAGE_TEST: [100, 150],
    NEGATIVE: [-5, -10],
    DECIMAL: [1.5, 2.7],
    ZERO_BASE: [0, 5],
    ZERO_TARGET: [10, 0],
    SMALL_DIFF: [1.0001, 1.0002]
  }
};

// Helper functions for common operations
export const parseManifestJson = (manifest: any) => JSON.stringify(manifest);

export const expectSuccessResult = (result: any, expectations: any = {}) => {
  expect(result.result).toBe('success');
  if (result.result === 'success' && expectations) {
    Object.entries(expectations).forEach(([key, value]) => {
      expect(result.manifest.datasets[0][key]).toBe(value);
    });
  }
  return result;
};

// Mock cleanup utility
export const restoreAllMocks = () => {
  vi.restoreAllMocks();
};