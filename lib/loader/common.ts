/**
 * Concatenate multiple series labels into a single string for axis titles.
 * Labels are joined with ", " separator and truncated at 50 characters if needed.
 * 
 * @param labels - Array of series label strings to concatenate
 * @returns Concatenated string with ", " separator, truncated to 50 chars with "..." if needed
 * 
 * @example
 * concatenateSeriesLabels(['Sales', 'Profit']) // => 'Sales, Profit'
 * concatenateSeriesLabels(['A', 'B', 'C', ...]) // => 'A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, ...' (if > 50 chars)
 */
export function concatenateSeriesLabels(labels: string[]): string {
  if (labels.length === 0) {
    return '';
  }
  
  if (labels.length === 1) {
    return labels[0];
  }
  
  let result = '';
  for (let i = 0; i < labels.length; i++) {
    const candidate = result.concat(labels[i], ', ');
    if (candidate.length > 50) {
      result = result.concat('...');
      break;
    }
    result = candidate;
  }
  
  // Remove trailing comma and space
  return result.replace(/, $/, '');
}
