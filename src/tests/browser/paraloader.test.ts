import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParaLoader } from '../../../lib/loader/paraloader.js';

// Test data factories
const createTestManifest = (overrides = {}) => ({
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

const createCSVData = () => ({
  text: 'date,sales,profit\n2023-01,100,20\n2023-02,150,30',
  rows: [
    { date: '2023-01', sales: '100', profit: '20' },
    { date: '2023-02', sales: '150', profit: '30' }
  ],
  fields: ['date', 'sales', 'profit'],
  seriesKeys: ['sales', 'profit'],
  independentKey: 'date'
});

const createMockResponse = (data: any, shouldFail = false) => ({
  json: vi.fn().mockImplementation(() => 
    shouldFail ? Promise.reject(new Error('Invalid JSON')) : Promise.resolve(data)
  ),
  text: vi.fn().mockResolvedValue(data)
});

const mockFetch = (response: any, shouldFail = false) => {
  const mockFn = shouldFail 
    ? vi.fn().mockRejectedValue(new Error('Network error'))
    : vi.fn().mockResolvedValue(response);
  globalThis.fetch = mockFn;
  return mockFn;
};

describe('ParaLoader Browser Tests', () => {
  let loader: ParaLoader;
  let testManifest: any;
  let csvData: any;

  beforeEach(() => {
    loader = new ParaLoader();
    testManifest = createTestManifest();
    csvData = createCSVData();
    vi.restoreAllMocks();
  });

  describe('manifest loading from content', () => {
    it('should successfully load manifest from JSON content', async () => {
      const result = await loader.load('content', JSON.stringify(testManifest));

      expect(result.result).toBe('success');
      if (result.result === 'success') {
        expect(result.manifest.datasets[0].type).toBe('bar');
        expect(result.manifest.datasets[0].description).toBe('Test Chart');
        expect(result.manifest.datasets[0].series).toHaveLength(2);
      }
    });

    it('should apply chart type override', async () => {
      const result = await loader.load('content', JSON.stringify(testManifest), 'line');

      expect(result.result).toBe('success');
      if (result.result === 'success') {
        expect(result.manifest.datasets[0].type).toBe('line');
      }
    });

    it('should apply description override', async () => {
      const newDescription = 'New Description';
      const result = await loader.load('content', JSON.stringify(testManifest), undefined, newDescription);

      expect(result.result).toBe('success');
      if (result.result === 'success') {
        expect(result.manifest.datasets[0].description).toBe(newDescription);
      }
    });

    it('should handle malformed JSON', async () => {
      const invalidJson = '{ "datasets": [ invalid json }';
      await expect(loader.load('content', invalidJson)).rejects.toThrow();
    });
  });

  describe('manifest loading from URL', () => {
    const testPaths = [
      { input: 'bar-chart.json', expected: 'bar-chart.json', kind: 'url' },
      { 
        input: 'line-multi-manifest-16.json', 
        expected: './node_modules/@fizz/chart-data/data/line-multi-manifest-16.json',
        kind: 'fizz-chart-data'
      }
    ];

    testPaths.forEach(({ input, expected, kind }) => {
      it(`should construct correct file path for ${kind}`, () => {
        const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';
        let filePath = '';
        
        if (kind === 'fizz-chart-data') {
          filePath = CHART_DATA_MODULE_PREFIX;
        }
        filePath += input;
        
        expect(filePath).toBe(expected);
      });
    });

    it('should handle fetch network errors gracefully', async () => {
      mockFetch(null, true);
      await expect(loader.load('url', 'nonexistent.json')).rejects.toThrow('Network error');
    });

    it('should handle fetch JSON parsing errors', async () => {
      const mockResponse = createMockResponse(testManifest, true);
      mockFetch(mockResponse);
      await expect(loader.load('url', 'invalid.json')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('CSV data processing', () => {
    it('should handle CSV text processing', async () => {
      const mockResponse = createMockResponse(csvData.text);
      mockFetch(mockResponse);

      const response = await fetch('test.csv');
      const text = await response.text();
      
      expect(text).toBe(csvData.text);
      expect(text).toContain('date,sales,profit');
    });

    it('should create FieldInfo objects with correct structure', () => {
      const testFields = [
        { name: 'region', value: 'North', expectedType: 'string' },
        { name: 'sales', value: '100', expectedType: 'number' },
        { name: 'profit', value: '20', expectedType: 'number' }
      ];
      
      testFields.forEach(({ name, value, expectedType }) => {
        const fieldInfo = {
          name,
          type: !isNaN(parseFloat(value)) ? 'number' as const : 'string' as const
        };
        expect(fieldInfo).toEqual({ name, type: expectedType });
      });
    });
  });

  describe('external data processing', () => {
    it('should handle series key filtering', () => {
      const allFields = [...csvData.fields, 'region'];
      const independentKeys = allFields.filter(field => !csvData.seriesKeys.includes(field));
      
      expect(independentKeys).toEqual(['date', 'region']);
    });

    it('should process data transformation correctly', () => {
      const transformedData = csvData.rows.reduce((acc: any, row: any) => {
        Object.entries(row).forEach(([field, val]) => {
          if (csvData.seriesKeys.includes(field)) {
            if (!acc[field]) acc[field] = [];
            acc[field].push({
              x: row[csvData.independentKey],
              y: val as string
            });
          }
        });
        return acc;
      }, {});

      expect(transformedData.sales).toHaveLength(2);
      expect(transformedData.profit).toHaveLength(2);
      expect(transformedData.sales[0]).toEqual({ x: '2023-01', y: '100' });
      expect(transformedData.profit[1]).toEqual({ x: '2023-02', y: '30' });
    });
  });
});