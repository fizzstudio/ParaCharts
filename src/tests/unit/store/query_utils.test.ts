import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

// Extract just the compare function for testing without DOM dependencies
function compare(value1: number, value2: number) {
  const result: any = { diff: 0 };
  if (value1 === value2) {
    result.relationship = 'equal';
  } else {
    result.relationship = value1 > value2 ? 'greater' : 'less';
    const min = new Decimal(Math.min(value1, value2));
    const max = new Decimal(Math.max(value1, value2));
    result.diff = max.sub(min).toNumber();
    const startVal = new Decimal(value1);
    const endVal = new Decimal(value2);
    if (startVal) {
      result.percentageNext = endVal.sub(startVal).dividedBy(startVal).times(100).toNumber();
    }
    if (endVal) {
      result.percentagePrev = startVal.sub(endVal).dividedBy(endVal).times(100).toNumber();
    }
  }
  return result;
}

describe('Data Comparison Functions', () => {
  describe('compare function', () => {
    it('should identify equal values', () => {
      const result = compare(5, 5);
      expect(result.relationship).toBe('equal');
      expect(result.diff).toBe(0);
    });

    it('should identify greater values', () => {
      const result = compare(10, 5);
      expect(result.relationship).toBe('greater');
      expect(result.diff).toBe(5);
    });

    it('should identify lesser values', () => {
      const result = compare(3, 8);
      expect(result.relationship).toBe('less');
      expect(result.diff).toBe(5);
    });

    it('should calculate percentage differences correctly', () => {
      const result = compare(100, 150);
      expect(result.relationship).toBe('less');
      expect(result.diff).toBe(50);
      expect(result.percentageNext).toBeCloseTo(50); // 150 is 50% more than 100
      expect(result.percentagePrev).toBeCloseTo(-33.33, 1); // 100 is ~33% less than 150
    });

    it('should handle negative numbers', () => {
      const result = compare(-5, -10);
      expect(result.relationship).toBe('greater');
      expect(result.diff).toBe(5);
    });

    it('should handle decimal numbers', () => {
      const result = compare(1.5, 2.7);
      expect(result.relationship).toBe('less');
      expect(result.diff).toBeCloseTo(1.2);
    });

    it('should handle zero values', () => {
      const result = compare(0, 5);
      expect(result.relationship).toBe('less');
      expect(result.diff).toBe(5);
    });

    it('should handle very small differences', () => {
      const result = compare(1.0001, 1.0002);
      expect(result.relationship).toBe('less');
      expect(result.diff).toBeCloseTo(0.0001, 4);
    });

    it('should calculate percentage from zero base', () => {
      const result = compare(0, 10);
      expect(result.percentagePrev).toBeCloseTo(-100); // 0 is 100% less than 10
    });

    it('should handle percentage to zero', () => {
      const result = compare(10, 0);
      expect(result.percentageNext).toBeCloseTo(-100); // 0 is 100% less than 10
    });
  });
});