import { NumericRange } from '../../lib/state/settings_ranges.js';

/**
 * Format a NumericRange as a concise constraint string.
 * Returns null if there are no bounds to display.
 */
export function formatRangeConstraint(range: NumericRange): string | null {
  const hasMin = 'min' in range && range.min !== undefined;
  const hasMax = 'max' in range && range.max !== undefined;
  const hasMinOpen = 'minOpen' in range && range.minOpen !== undefined;
  const hasMaxOpen = 'maxOpen' in range && range.maxOpen !== undefined;

  // No bounds at all
  if (!hasMin && !hasMax && !hasMinOpen && !hasMaxOpen) {
    return null;
  }

  // Only lower bound (unbounded above)
  if ((hasMin || hasMinOpen) && !hasMax && !hasMaxOpen) {
    if (hasMinOpen) {
      return `> ${(range as any).minOpen}`;
    } else {
      return `>= ${range.min}`;
    }
  }

  // Only upper bound (unbounded below)
  if (!hasMin && !hasMinOpen && (hasMax || hasMaxOpen)) {
    if (hasMaxOpen) {
      return `< ${(range as any).maxOpen}`;
    } else {
      return `<= ${range.max}`;
    }
  }

  // Both bounds - use interval notation
  let leftBracket: string;
  let leftValue: string;
  let rightValue: string;
  let rightBracket: string;

  // Left side
  if (hasMinOpen) {
    leftBracket = '(';
    leftValue = String((range as any).minOpen);
  } else if (hasMin) {
    leftBracket = '[';
    leftValue = String(range.min);
  } else {
    leftBracket = '(';
    leftValue = '-infinity';
  }

  // Right side
  if (hasMaxOpen) {
    rightBracket = ')';
    rightValue = String((range as any).maxOpen);
  } else if (hasMax) {
    rightBracket = ']';
    rightValue = String(range.max);
  } else {
    rightBracket = ')';
    rightValue = 'infinity';
  }

  return `in ${leftBracket}${leftValue}, ${rightValue}${rightBracket}`;
}
