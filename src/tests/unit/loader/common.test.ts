import { describe, it, expect } from 'vitest';
import { concatenateSeriesLabels, isEnveloped, getDatasets, firstDataset } from '../../../../lib/loader/common';

describe('loader/common', () => {
  describe('concatenateSeriesLabels', () => {
    it('should return empty string for empty array', () => {
      expect(concatenateSeriesLabels([])).toBe('');
    });

    it('should return single label as-is', () => {
      expect(concatenateSeriesLabels(['Sales'])).toBe('Sales');
    });

    it('should concatenate two labels with comma-space', () => {
      expect(concatenateSeriesLabels(['Sales', 'Profit'])).toBe('Sales, Profit');
    });

    it('should concatenate multiple labels with comma-space', () => {
      expect(concatenateSeriesLabels(['Sales', 'Profit', 'Tax'])).toBe('Sales, Profit, Tax');
    });

    it('should truncate at 50 characters with ellipsis', () => {
      const labels = ['Very Long Series Name One', 'Very Long Series Name Two', 'More'];
      const result = concatenateSeriesLabels(labels);
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not have trailing comma-space in result', () => {
      const labels = ['A', 'B', 'C'];
      const result = concatenateSeriesLabels(labels);
      expect(result).toBe('A, B, C');
      expect(result.endsWith(', ')).toBe(false);
    });

    it('should handle exactly at 50 character boundary', () => {
      // Create labels that total exactly 50 chars with separators
      const labels = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDD'];
      const result = concatenateSeriesLabels(labels);
      // Should fit all without truncation if <= 50
      if (result.length <= 50) {
        expect(result).not.toContain('...');
      } else {
        expect(result).toContain('...');
      }
    });

    it('should handle single character labels', () => {
      expect(concatenateSeriesLabels(['A', 'B', 'C', 'D'])).toBe('A, B, C, D');
    });

    it('should handle labels with special characters', () => {
      expect(concatenateSeriesLabels(['Sales ($)', 'Profit %', 'Tax/Fee']))
        .toBe('Sales ($), Profit %, Tax/Fee');
    });

    it('should handle empty string labels', () => {
      expect(concatenateSeriesLabels(['', 'Sales', ''])).toBe(', Sales, ');
    });
  });

  describe('isEnveloped', () => {
    it('should return true for enveloped manifests (with "jim" key)', () => {
      const enveloped = { jim: { datasets: [] } };
      expect(isEnveloped(enveloped as any)).toBe(true);
    });

    it('should return false for raw JIM manifests (without "jim" key)', () => {
      const raw = { datasets: [] };
      expect(isEnveloped(raw as any)).toBe(false);
    });
  });

  describe('getDatasets', () => {
    it('should extract datasets from an enveloped manifest', () => {
      const datasets = [{ series: [] }];
      const enveloped = { jim: { datasets } };
      expect(getDatasets(enveloped as any)).toBe(datasets);
    });

    it('should extract datasets from a raw JIM manifest', () => {
      const datasets = [{ series: [] }];
      const raw = { datasets };
      expect(getDatasets(raw as any)).toBe(datasets);
    });

    it('should return empty array when datasets is empty', () => {
      expect(getDatasets({ datasets: [] } as any)).toEqual([]);
      expect(getDatasets({ jim: { datasets: [] } } as any)).toEqual([]);
    });
  });

  describe('firstDataset', () => {
    it('should return the first dataset from an enveloped manifest', () => {
      const ds = { series: [{ name: 'A' }] };
      const enveloped = { jim: { datasets: [ds, { series: [] }] } };
      expect(firstDataset(enveloped as any)).toBe(ds);
    });

    it('should return the first dataset from a raw JIM manifest', () => {
      const ds = { series: [{ name: 'B' }] };
      const raw = { datasets: [ds] };
      expect(firstDataset(raw as any)).toBe(ds);
    });
  });
});
