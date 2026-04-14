import { describe, it, expect } from 'vitest';
import { formatRangeConstraint } from '../../../docs/scripts/rangeFormatter.js';

describe('formatRangeConstraint', () => {
  it('should return null when there are no bounds', () => {
    expect(formatRangeConstraint({ type: 'float' })).toBeNull();
    expect(formatRangeConstraint({ type: 'int' })).toBeNull();
  });

  describe('single lower bound', () => {
    it('should format inclusive min', () => {
      expect(formatRangeConstraint({ min: 0, type: 'float' })).toBe('>= 0');
      expect(formatRangeConstraint({ min: 5, type: 'int' })).toBe('>= 5');
    });

    it('should format exclusive min (open)', () => {
      expect(formatRangeConstraint({ minOpen: 0, type: 'float' })).toBe('> 0');
      expect(formatRangeConstraint({ minOpen: -1, type: 'float' })).toBe('> -1');
    });
  });

  describe('single upper bound', () => {
    it('should format inclusive max', () => {
      expect(formatRangeConstraint({ max: 100, type: 'int' })).toBe('<= 100');
      expect(formatRangeConstraint({ max: 1, type: 'float' })).toBe('<= 1');
    });

    it('should format exclusive max (open)', () => {
      expect(formatRangeConstraint({ maxOpen: 100, type: 'float' })).toBe('< 100');
    });
  });

  describe('both bounds (interval notation)', () => {
    it('should format closed interval [min, max]', () => {
      expect(formatRangeConstraint({ min: 0, max: 1, type: 'float' })).toBe('in [0, 1]');
      expect(formatRangeConstraint({ min: -10, max: 10, type: 'int' })).toBe('in [-10, 10]');
    });

    it('should format open interval (minOpen, maxOpen)', () => {
      expect(formatRangeConstraint({ minOpen: 0, maxOpen: 1, type: 'float' })).toBe('in (0, 1)');
    });

    it('should format half-open intervals', () => {
      expect(formatRangeConstraint({ min: 0, maxOpen: 100, type: 'float' })).toBe('in [0, 100)');
      expect(formatRangeConstraint({ minOpen: 0, max: 100, type: 'float' })).toBe('in (0, 100]');
    });
  });
});
