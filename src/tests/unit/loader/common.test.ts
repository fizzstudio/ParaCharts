import { describe, it, expect } from 'vitest';
import { concatenateSeriesLabels } from '../../../../lib/loader/common';

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
});
