import { type Manifest, type JIMManifest, type Dataset } from '@fizz/paramanifest';

export type { Manifest, JIMManifest };

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

/**
 * Type guard to check if a manifest is an enveloped Manifest.
 * 
 * @internal
 * 
 * @param manifest - A Manifest or JIMManifest object
 * @returns true if the manifest is enveloped (Manifest type), false if it's root form (JIMManifest type)
 */
export function isEnveloped(manifest: Manifest | JIMManifest): manifest is Manifest {
  return 'jim' in manifest;
}

/**
 * Extract datasets array from either a Manifest or JIMManifest object.
 * 
 * @internal
 * 
 * @param manifest - A Manifest or JIMManifest object containing dataset information
 * @returns Array of Dataset objects extracted from the manifest
 */
export function getDatasets(manifest: Manifest | JIMManifest): Dataset[] {
  if (isEnveloped(manifest)) {
    return manifest.jim.datasets;
  }
  return manifest.datasets;
}

/**
 * Extract the first dataset from either a Manifest or JIMManifest object.
 * 
 * @internal
 * 
 * @param manifest - A Manifest or JIMManifest object containing dataset information
 * @returns The first Dataset object from the manifest
 */
export function firstDataset(manifest: Manifest | JIMManifest): Dataset {
  return getDatasets(manifest)[0];
}