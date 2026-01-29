import type { ChartType, Manifest } from '@fizz/paramanifest';

/**
 * Attributes from the <para-chart> element that can be used as manifest/data sources
 */
export type Attributes = {
  manifest?: string;
  data?: string;
  config?: any; // SettingsInput
  type?: ChartType;
  summary?: string;
  cwd?: string;
  manifestId?: string;
};

// ============================================================================
// MANIFEST SOURCE LOADERS
// ============================================================================

/**
 * A manifest source loader takes attributes and other context, and returns
 * a partial manifest from a specific source. Each loader handles one source type.
 * 
 * Loaders are run in priority order, with earlier loaders taking precedence
 * for any fields they define.
 * 
 * Returns an empty object {} if the source is not available.
 */
export type ManifestSourceLoader = (
  attributes: Attributes,
  manifestElement?: HTMLElement,
  slotElements?: HTMLElement[]
) => Promise<Partial<Manifest>>;

/**
 * Load manifest metadata from <para-chart> element attributes
 * Priority: HIGHEST
 */
export async function loadManifestFromAttributes(
  attributes: Attributes,
  manifestElement?: HTMLElement,
  slotElements?: HTMLElement[]
): Promise<Partial<Manifest>> {
  const partial: Partial<Manifest> = {};
  
  if (attributes.type || attributes.summary) {
    partial.datasets = [{}] as any;
    
    if (attributes.type) {
      partial.datasets[0].type = attributes.type;
    }
    
    if (attributes.summary) {
      partial.datasets[0].description = attributes.summary;
    }
  }
  
  return partial;
}

/**
 * Load manifest from the manifest attribute
 * Handles both JSON content and file paths internally
 * Priority: HIGH
 */
export async function loadManifestFromManifestAttribute(
  attributes: Attributes,
  manifestElement?: HTMLElement,
  slotElements?: HTMLElement[]
): Promise<Partial<Manifest>> {
  if (!attributes.manifest) {
    return {};
  }
  
  const manifest = attributes.manifest.trim();
  
  if (manifest.startsWith('{') || manifest.startsWith('[')) {
    return JSON.parse(manifest);
  }
  
  const path = attributes.cwd ? attributes.cwd + manifest : manifest;
  const response = await fetch(path);
  return await response.json();
}

/**
 * Load manifest from element by ID (specified via manifestId attribute)
 * Handles both file sources (src attribute) and inline content (innerHTML)
 * Priority: MEDIUM
 */
export async function loadManifestFromElementById(
  attributes: Attributes,
  manifestElement?: HTMLElement,
  slotElements?: HTMLElement[]
): Promise<Partial<Manifest>> {
  if (!attributes.manifestId) {
    return {};
  }
  
  const element = document.getElementById(attributes.manifestId);
  if (!element) {
    return {};
  }
  
  const src = element.getAttribute('src');
  if (src) {
    const response = await fetch(src);
    return await response.json();
  }
  
  return JSON.parse(element.innerHTML);
}

/**
 * Load manifest from element with class 'manifest' in slot
 * Priority: LOW
 */
export async function loadManifestFromSlotElement(
  attributes: Attributes,
  manifestElement?: HTMLElement,
  slotElements?: HTMLElement[]
): Promise<Partial<Manifest>> {
  if (!slotElements || slotElements.length === 0) {
    return {};
  }
  
  const element = slotElements.find(el => el.className === 'manifest');
  if (!element) {
    return {};
  }
  
  return JSON.parse(element.innerHTML);
}

/**
 * Ordered list of manifest source loaders by priority
 * Earlier loaders take precedence for fields they define
 */
export const MANIFEST_SOURCE_LOADERS: ManifestSourceLoader[] = [
  loadManifestFromAttributes,
  loadManifestFromManifestAttribute,
  loadManifestFromElementById,
  loadManifestFromSlotElement,
];
