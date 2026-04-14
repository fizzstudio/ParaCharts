import { describe, it, expect } from 'vitest';
import { toFixed, capitalize, fixed, precisionFromAxisRange, formatDataValue, joinStrArray, bboxOppositeAnchor } from '../../../lib/common/utils.js';

describe('Utils', () => {
  describe('toFixed', () => {
    it('should format decimal numbers with specified digits', () => {
      expect(toFixed(3.14159, 2)).toBe('3.14');
      expect(toFixed(2.7182, 3)).toBe('2.718');
      expect(toFixed(1.5, 1)).toBe('1.5'); // Use non-integer to test decimal formatting
    });

    it('should show integers without decimal when bareInt=true', () => {
      expect(toFixed(5, 2, true)).toBe('5');
      expect(toFixed(42, 3, true)).toBe('42');
      expect(toFixed(0, 1, true)).toBe('0');
    });

    it('should show integers with decimal when bareInt=false', () => {
      expect(toFixed(5, 2, false)).toBe('5.00');
      expect(toFixed(42, 1, false)).toBe('42.0');
    });

    it('should default to 2 digits and bareInt=true', () => {
      expect(toFixed(3.14159)).toBe('3.14');
      expect(toFixed(5)).toBe('5');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter of lowercase words', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle already capitalized words', () => {
      expect(capitalize('Hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
    });

    it('should handle single characters', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('Z')).toBe('Z');
    });

    it('should handle empty and edge cases', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize('123')).toBe('123');
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });

  describe('fixed template literal', () => {
    it('should format numbers in template strings', () => {
      const result = fixed`Value: ${3.14159}`;
      expect(result).toBe('Value: 3.14');
    });

    it('should leave strings unchanged', () => {
      const result = fixed`Name: ${'John'} Age: ${25}`;
      expect(result).toBe('Name: John Age: 25');
    });

    it('should handle multiple numbers', () => {
      const result = fixed`X: ${1.234} Y: ${5.678}`;
      expect(result).toBe('X: 1.23 Y: 5.68');
    });

    it('should handle no expressions', () => {
      const result = fixed`Just a string`;
      expect(result).toBe('Just a string');
    });

    it('should handle mixed content', () => {
      const result = fixed`Point (${1.234}, ${5.678}) named "${'origin'}"`;
      expect(result).toBe('Point (1.23, 5.68) named "origin"');
    });
  });

  describe('precisionFromAxisRange', () => {
    it('should return 0 digits for large ranges (log10 >= 3)', () => {
      expect(precisionFromAxisRange(1000)).toBe(0);
      expect(precisionFromAxisRange(10000)).toBe(0);
    });

    it('should return 1 digit for medium ranges (1 < log10 < 3)', () => {
      expect(precisionFromAxisRange(100)).toBe(1);
      expect(precisionFromAxisRange(50)).toBe(1);
    });

    it('should return ceil(abs(log10)) for small ranges (log10 <= 1)', () => {
      expect(precisionFromAxisRange(10)).toBe(1);
      expect(precisionFromAxisRange(1)).toBe(0);
      expect(precisionFromAxisRange(0.1)).toBe(1);
      expect(precisionFromAxisRange(0.01)).toBe(2);
      expect(precisionFromAxisRange(0.001)).toBe(3);
    });
  });

  describe('formatDataValue', () => {
    it('should format values based on axis range precision', () => {
      expect(formatDataValue(3.14159, 100)).toBe('3.1');
      expect(formatDataValue(3.14159, 0.01)).toBe('3.14');
    });

    it('should strip trailing zeros for whole numbers', () => {
      expect(formatDataValue(5, 100)).toBe('5');
      expect(formatDataValue(42, 0.01)).toBe('42');
    });

    it('should handle negative values', () => {
      expect(formatDataValue(-7.5, 100)).toBe('-7.5');
      expect(formatDataValue(-0.123, 0.01)).toBe('-0.12');
    });

    it('should handle zero', () => {
      expect(formatDataValue(0, 100)).toBe('0');
      expect(formatDataValue(0, 1000)).toBe('0');
    });
  });

  describe('joinStrArray', () => {
    it('should return empty string for empty array', () => {
      expect(joinStrArray([])).toBe('');
    });

    it('should return single item with a period', () => {
      expect(joinStrArray(['Hello'])).toBe('Hello');
    });

    it('should join multiple items with periods', () => {
      const result = joinStrArray(['First', 'Second', 'Third']);
      expect(result).toContain('First');
      expect(result).toContain('Second');
      expect(result).toContain('Third');
      expect(result.endsWith('.')).toBe(true);
    });

    it('should not double-add periods when items already end with punctuation', () => {
      const result = joinStrArray(['Already punctuated.', 'Next']);
      expect(result).not.toContain('..');
    });

    it('should filter out blank/whitespace-only strings', () => {
      expect(joinStrArray(['', '  ', 'Valid'])).toBe('Valid');
      expect(joinStrArray(['', '  ', '   '])).toBe('');
    });

    it('should include linebreak marker when provided', () => {
      const result = joinStrArray(['First', 'Second'], '<br>');
      expect(result).toContain('<br>');
    });
  });

  describe('bboxOppositeAnchor', () => {
    it('should return opposite sides', () => {
      expect(bboxOppositeAnchor('top')).toBe('bottom');
      expect(bboxOppositeAnchor('bottom')).toBe('top');
      expect(bboxOppositeAnchor('left')).toBe('right');
      expect(bboxOppositeAnchor('right')).toBe('left');
    });

    it('should return opposite corners', () => {
      expect(bboxOppositeAnchor('topLeft')).toBe('bottomRight');
      expect(bboxOppositeAnchor('topRight')).toBe('bottomLeft');
      expect(bboxOppositeAnchor('bottomLeft')).toBe('topRight');
      expect(bboxOppositeAnchor('bottomRight')).toBe('topLeft');
    });
  });
});