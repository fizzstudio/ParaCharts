import { ApiModel, ApiInterface, ApiPropertyItem, ApiItemKind } from '@microsoft/api-extractor-model';
import { defaults } from '../../lib/state/settings_defaults.js';
import { settingRanges } from '../../lib/state/settings_ranges.js';
import { formatRangeConstraint } from './rangeFormatter.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SettingInfo {
  path: string;
  description: string;
  defaultValue: any;
  type: string;
}

/**
 * Recursively extract all settings paths from the defaults object
 */
function extractSettingsPathsFromDefaults(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...extractSettingsPathsFromDefaults(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  
  return paths;
}

/**
 * Get a value from an object by dot-notation path
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Find an interface in the API model by name
 */
function findInterface(apiModel: ApiModel, name: string): ApiInterface | undefined {
  for (const apiPackage of apiModel.packages) {
    for (const entryPoint of apiPackage.entryPoints) {
      for (const member of entryPoint.members) {
        if (member.kind === ApiItemKind.Interface && member.displayName === name) {
          return member as ApiInterface;
        }
      }
    }
  }
  return undefined;
}

/**
 * Find a type alias in the API model and extract its union values
 * Returns the expanded type string if found, undefined otherwise
 */
function findTypeAlias(apiModel: ApiModel, name: string): string | undefined {
  for (const apiPackage of apiModel.packages) {
    for (const entryPoint of apiPackage.entryPoints) {
      for (const member of entryPoint.members) {
        if (member.kind === ApiItemKind.TypeAlias && member.displayName === name) {
          const excerpt = (member as any).typeExcerpt;
          if (excerpt && excerpt.spannedTokens) {
            return excerpt.spannedTokens.map((t: any) => t.text).join('').trim();
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Extract the type string from a property
 */
function extractTypeString(property: ApiPropertyItem): string {
  return property.propertyTypeExcerpt.spannedTokens.map(t => t.text).join('').trim();
}

/**
 * Extract description from a property's TSDoc comment
 */
function extractDescription(property: ApiPropertyItem): string {
  const summary = property.tsdocComment?.summarySection;
  if (!summary) return '';
  
  let description = '';
  for (const node of summary.nodes) {
    if (node.kind === 'Paragraph') {
      for (const child of (node as any).nodes) {
        if (child.kind === 'PlainText') {
          description += (child as any).text;
        }
      }
    }
  }
  return description.trim();
}

/**
 * Find a property in the API model by its dot-notation path
 */
function findPropertyByPath(apiModel: ApiModel, settingPath: string): { typeStr: string; description: string } | null {
  const pathParts = settingPath.split('.');
  
  const settingsInterface = findInterface(apiModel, 'Settings');
  if (!settingsInterface) return null;
  
  let currentInterface: ApiInterface | undefined = settingsInterface;
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    // Find the property in the current interface
    let foundProperty: ApiPropertyItem | null = null;
    for (const member of currentInterface.members) {
      if (member.kind === ApiItemKind.PropertySignature && (member as ApiPropertyItem).name === part) {
        foundProperty = member as ApiPropertyItem;
        break;
      }
    }
    
    if (!foundProperty) return null;
    
    // If this is the last part, return the type and description
    if (i === pathParts.length - 1) {
      return {
        typeStr: extractTypeString(foundProperty),
        description: extractDescription(foundProperty)
      };
    }
    
    // Navigate to the next interface
    const propertyType = extractTypeString(foundProperty).replace(/\s/g, '');
    currentInterface = findInterface(apiModel, propertyType);
    if (!currentInterface) return null;
  }
  
  return null;
}

/**
 * Infer type from default value
 */
function inferTypeFromValue(value: any): string {
  if (value === null || value === undefined) return 'any';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Extract all settings from defaults and API model
 */
function extractAllSettings(): { settings: SettingInfo[]; apiModel: ApiModel } {
  const apiModel = new ApiModel();
  const apiJsonPath = path.resolve(__dirname, '../../temp/paracharts.api.json');
  
  try {
    apiModel.loadPackage(apiJsonPath);
  } catch (error) {
    console.error('Error loading API model:', error);
    return { settings: [], apiModel };
  }
  
  const allSettingsPaths = extractSettingsPathsFromDefaults(defaults);
  
  const settings = allSettingsPaths.map(settingPath => {
    const defaultValue = getValueByPath(defaults, settingPath);
    const apiInfo = findPropertyByPath(apiModel, settingPath);
    
    return {
      path: settingPath,
      description: apiInfo?.description || '',
      defaultValue,
      type: apiInfo?.typeStr || inferTypeFromValue(defaultValue)
    };
  });
  
  return { settings, apiModel };
}

/**
 * Format default values for display
 */
function formatDefaultValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'string') return value === '' ? '' : `"${value}"`;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.length === 0 ? '[]' : '[...]';
  if (typeof value === 'object') return '{...}';
  return JSON.stringify(value);
}

/**
 * Simplify complex TypeScript types for documentation
 * Note: Leaves union types as-is for later processing by expandOrReferenceType
 */
function simplifyType(typeStr: string): string {
  if (!typeStr || typeStr === 'unknown' || typeStr === 'undefined') return 'any';
  
  // Handle complex generic types
  if (typeStr.includes('T extends')) return 'string';
  
  // Leave union types as-is for processing by expandOrReferenceType
  if (typeStr.includes(' | ')) {
    return typeStr.replace(/\s+/g, ' ').trim();
  }
  
  // Simplify axis types
  if (typeStr.includes('RadialAxisType') || typeStr.includes('OrientedAxisType')) {
    return 'string';
  }
  
  return typeStr.replace(/\s+/g, ' ').trim();
}

/**
 * Generate fallback description based on property name patterns
 */
function generateDescription(path: string, type: string, existingDescription?: string): string {
  if (existingDescription?.trim()) return existingDescription;
  
  const lastPart = path.split('.').pop() || '';
  const isBoolean = type === 'boolean';
  const isNumber = type === 'number';
  
  // Boolean patterns
  if (isBoolean) {
    if (lastPart.startsWith('is')) {
      const feature = lastPart.slice(2).replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `Enable/disable ${feature}`;
    }
    if (lastPart.includes('Enabled')) {
      const feature = lastPart.replace(/Enabled$/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `Enable ${feature}`;
    }
  }
  
  // Size and dimensions
  if (lastPart.includes('Width') || lastPart.includes('Height') || lastPart.includes('strokeWidth')) {
    return 'Width or height in pixels';
  }
  if (lastPart.includes('Gap') || lastPart.includes('Margin') || lastPart.includes('Padding')) {
    return 'Spacing in pixels';
  }
  if (lastPart.includes('Size') && isNumber) return 'Size in pixels';
  if (lastPart.includes('Size')) return 'Size settings';
  
  // Font
  if (lastPart.includes('fontSize')) return 'Font size (e.g., "12pt")';
  if (lastPart.includes('fontWeight')) return 'Font weight (e.g., "normal", "bold")';
  if (lastPart.includes('fontFamily')) return 'Font family name';
  
  // Formatting
  if (lastPart.includes('Format')) return 'Display format (e.g., "raw", "percentage")';
  if (lastPart.includes('Color') || lastPart.includes('color')) return 'Color value';
  
  // Numeric values
  if (isNumber) {
    if (lastPart.includes('Scale') || lastPart.includes('Factor')) return 'Scaling factor';
    if (lastPart.includes('Angle')) return 'Angle in degrees';
    if (lastPart.includes('Max')) return 'Maximum value';
    if (lastPart.includes('Min')) return 'Minimum value';
  }
  
  // Generic fallback using property name
  const readable = lastPart.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return `Set ${readable}`;
}

/**
 * Category descriptions for documentation
 */
const categoryDescriptions: Record<string, string> = {
  chart: 'Overall chart appearance and behavior settings.',
  axis: 'Axis display, labels, ticks, and positioning.',
  legend: 'Legend visibility, positioning, and styling.',
  ui: 'User interface and accessibility features.',
  color: 'Color schemes, palettes, and vision accessibility.',
  animation: 'Chart animation timing and effects.',
  sonification: 'Audio feedback and sonification settings.',
  controlPanel: 'Control panel visibility and layout.',
  type: 'Chart type-specific settings (bar, line, pie, etc.)',
  grid: 'Grid lines and background elements.',
  popup: 'Tooltip and popup styling.',
  plotArea: 'Main chart plotting area dimensions.',
  scrollytelling: 'Narrative scrolling features.',
  statusBar: 'Status bar display options.',
  dataTable: 'Data table formatting.',
  jim: 'Navigation assistance features.',
  dev: 'Development and debugging options.'
};

/**
 * Manual mappings for custom types that should be expanded inline (≤3 values)
 * or added to glossary (>3 values)
 */
const TYPE_EXPANSIONS: Record<string, string> = {
  'ChartType': "'bar' | 'lollipop' | 'line' | 'stepline' | 'scatter' | 'pie' | 'donut' | 'gauge' | 'histogram' | 'heatmap' | 'waterfall' | 'venn'",
  'CardinalDirection': "'north' | 'south' | 'east' | 'west'",
  'SnapLocation': "'start' | 'end' | 'center'",
  'LegendItemOrder': "'alphabetical' | 'series'",
  'BarClusterMode': "'facet'",
  'BarDataLabelPosition': "'center' | 'end' | 'base' | 'outside'",
};

/**
 * Count union members in a type string
 * Returns the count, or null if not a simple union type
 */
function countUnionMembers(typeStr: string): number | null {
  // Multiple values separated by |
  if (!typeStr.includes(' | ')) {
    // Single string literal like 'value'
    const trimmed = typeStr.trim();
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      return 1;
    }
    return null;
  }
  
  const parts = typeStr.split(' | ').map(p => p.trim());
  const isSimpleUnion = parts.every(p => 
    (p.startsWith("'") && p.endsWith("'")) || 
    (p.startsWith('"') && p.endsWith('"'))
  );
  
  return isSimpleUnion ? parts.length : null;
}

/**
 * Expand a type alias if it's simple enough (≤3 union members), otherwise return the type name
 * Collects complex types in the typeGlossary map
 */
function expandOrReferenceType(typeStr: string, apiModel: ApiModel, typeGlossary: Map<string, string>): string {
  // Already an expanded union or primitive type
  if (typeStr.includes(' | ')) {
    const unionCount = countUnionMembers(typeStr);
    if (unionCount !== null && unionCount <= 3) {
      return typeStr; // Expand inline
    } else if (unionCount !== null && unionCount > 3) {
      // Try to find the type name in our manual mappings by comparing expansions
      for (const [typeName, expansion] of Object.entries(TYPE_EXPANSIONS)) {
        // Normalize both for comparison (remove all whitespace)
        const normalizedExpansion = expansion.replace(/\s+/g, '');
        const normalizedTypeStr = typeStr.replace(/\s+/g, '');
        if (normalizedExpansion === normalizedTypeStr) {
          typeGlossary.set(typeName, expansion);
          // Return as a link to the glossary
          return `[${typeName}](#${typeName.toLowerCase()})`;
        }
      }
      // No type name found - this shouldn't happen, but keep expanded as fallback
      console.warn(`No type name found for union with ${unionCount} members: ${typeStr.substring(0, 50)}...`);
      return typeStr;
    }
    // Not a simple union, return as-is
    return typeStr;
  }
  
  // Primitive types
  if (typeStr === 'boolean' || typeStr === 'number' || typeStr === 'string') {
    return typeStr;
  }
  
  // Single identifier - check manual expansions first
  const typeName = typeStr.trim();
  if (TYPE_EXPANSIONS[typeName]) {
    const expandedType = TYPE_EXPANSIONS[typeName];
    const unionCount = countUnionMembers(expandedType);
    if (unionCount !== null && unionCount <= 3) {
      return expandedType; // Expand inline
    } else if (unionCount !== null) {
      // Complex type - add to glossary and return as link
      typeGlossary.set(typeName, expandedType);
      return `[${typeName}](#${typeName.toLowerCase()})`;
    }
  }
  
  // Try API model as fallback
  if (/^[A-Z][a-zA-Z0-9]*$/.test(typeName)) {
    const expandedType = findTypeAlias(apiModel, typeName);
    if (expandedType) {
      const unionCount = countUnionMembers(expandedType);
      if (unionCount !== null && unionCount <= 3) {
        return expandedType; // Expand inline
      } else if (unionCount !== null) {
        // Complex type - add to glossary and return as link
        typeGlossary.set(typeName, expandedType);
        return `[${typeName}](#${typeName.toLowerCase()})`;
      }
    }
  }
  
  return typeStr;
}

// Build the export data
const { settings: allSettings, apiModel } = extractAllSettings();

// Group by top-level category
const settingsByCategory: Record<string, SettingInfo[]> = {};
for (const setting of allSettings) {
  const category = setting.path.split('.')[0];
  (settingsByCategory[category] ??= []).push(setting);
}

/**
 * Combine type and range constraint into a single "Type" string.
 * Escapes pipe characters for markdown table compatibility.
 */
function formatValidValues(simpleType: string, settingPath: string, apiModel: ApiModel, typeGlossary: Map<string, string>): string {
  const range = settingRanges[settingPath];
  
  if (range) {
    const typeName = range.type === 'int' ? 'integer' : 'number';
    const constraint = formatRangeConstraint(range);
    if (constraint) {
      // Use parens for ≥/≤/>/< notation, no parens for "in [...]" notation
      if (constraint.startsWith('in ')) {
        return `${typeName} ${constraint}`;
      } else {
        return `${typeName} (${constraint})`;
      }
    }
    return typeName;
  }
  
  // No range defined - expand or reference the type
  const expanded = expandOrReferenceType(simpleType, apiModel, typeGlossary);
  return expanded.replace(/\|/g, '\\|');
}

export default {
  categories: Object.entries(settingsByCategory).map(([name, settings]) => {
    const typeGlossary = new Map<string, string>();
    
    const processedSettings = settings.map(s => {
      const simpleType = simplifyType(s.type);
      return {
        path: s.path,
        description: generateDescription(s.path, simpleType, s.description),
        defaultValue: formatDefaultValue(s.defaultValue),
        isBoolean: simpleType === 'boolean',
        simpleName: s.path.split('.').pop()?.replace(/([A-Z])/g, ' $1').toLowerCase(),
        validValues: formatValidValues(simpleType, s.path, apiModel, typeGlossary)
      };
    });
    
    // Convert glossary to array for template
    const typeDefinitions = Array.from(typeGlossary.entries()).map(([name, definition]) => ({
      name,
      id: name.toLowerCase(),
      definition: definition.replace(/\|/g, '\\|')
    }));
    
    return {
      name,
      description: categoryDescriptions[name] || '',
      settings: processedSettings,
      typeDefinitions
    };
  })
};
