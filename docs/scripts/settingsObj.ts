import { ApiModel, ApiInterface, ApiPropertyItem, ApiItemKind } from '@microsoft/api-extractor-model';
import { defaults } from '../../lib/state/settings_defaults.js';
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
      // If it's a nested object, recurse
      paths.push(...extractSettingsPathsFromDefaults(value, currentPath));
    } else {
      // This is a leaf setting
      paths.push(currentPath);
    }
  }
  
  return paths;
}

/**
 * Find a property in the API model by its path
 */
function findPropertyByPath(apiModel: ApiModel, settingPath: string): {property: ApiPropertyItem, typeStr: string, description: string} | null {
  const pathParts = settingPath.split('.');
  
  // Start from the Settings interface
  const settingsInterface = findInterface(apiModel, 'Settings');
  if (!settingsInterface) return null;
  
  let currentInterface = settingsInterface;
  let currentProperty: ApiPropertyItem | null = null;
  
  // Navigate through the path parts
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    // Find the property in the current interface
    currentProperty = null;
    for (const member of currentInterface.members) {
      if (member.kind === ApiItemKind.PropertySignature) {
        const prop = member as ApiPropertyItem;
        if (prop.name === part) {
          currentProperty = prop;
          break;
        }
      }
    }
    
    if (!currentProperty) {
      // Try to infer types for common patterns
      if (part === 'width' || part === 'height' || part.includes('Size') || part.includes('Length') || part.includes('Gap') || part.includes('Margin') || part.includes('Padding')) {
        return { property: null as any, typeStr: 'number', description: '' };
      }
      if (part.startsWith('is') || part.includes('Enabled') || part.includes('Visible') || part.includes('Show') || part.includes('Draw')) {
        return { property: null as any, typeStr: 'boolean', description: '' };
      }
      if (part.includes('Color') || part.includes('color')) {
        return { property: null as any, typeStr: 'string', description: '' };
      }
      if (part.includes('Format') || part.includes('Text') || part.includes('Label') || part.includes('Name')) {
        return { property: null as any, typeStr: 'string', description: '' };
      }
      // Default fallback based on value type inference from defaults
      const defaultValue = getValueByPath(defaults, settingPath);
      if (defaultValue !== undefined) {
        const inferredType = typeof defaultValue;
        return { property: null as any, typeStr: inferredType, description: '' };
      }
      return { property: null as any, typeStr: 'any', description: '' };
    }
    
    // If this is the last part, we found our setting
    if (i === pathParts.length - 1) {
      const typeStr = extractTypeString(currentProperty);
      const description = extractDescription(currentProperty);
      return { property: currentProperty, typeStr, description };
    }
    
    // Otherwise, find the interface for this property's type and continue
    const propertyTypeStr = extractTypeString(currentProperty).replace(/\s/g, '');
    let nextInterface = findInterface(apiModel, propertyTypeStr);
    
    // Try some common interface name patterns if direct lookup fails
    if (!nextInterface) {
      const patterns = [
        propertyTypeStr + 'Settings',
        propertyTypeStr.replace('Settings', ''),
        'RadialSettings', // for pie/donut/gauge
        'PlaneChartSettings', // for bar/line/etc
        'OrientedAxisSettings'
      ];
      
      for (const pattern of patterns) {
        nextInterface = findInterface(apiModel, pattern);
        if (nextInterface) break;
      }
    }
    
    if (!nextInterface) return null;
    currentInterface = nextInterface;
  }
  
  return null;
}

function extractDescription(property: ApiPropertyItem): string {
  const comment = property.tsdocComment;
  if (!comment) return '';
  
  const summary = comment.summarySection;
  if (!summary) return '';
  
  // Extract text from nodes
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

function extractTypeString(property: ApiPropertyItem): string {
  const excerpt = property.propertyTypeExcerpt;
  let typeStr = '';
  for (const token of excerpt.spannedTokens) {
    typeStr += token.text;
  }
  return typeStr.trim();
}

function extractAllSettings(): SettingInfo[] {
  const apiModel = new ApiModel();
  const apiJsonPath = path.resolve(__dirname, '../../temp/paracharts.api.json');
  
  try {
    const apiPackage = apiModel.loadPackage(apiJsonPath);
    
    // Extract all settings paths from the defaults object
    const allSettingsPaths = extractSettingsPathsFromDefaults(defaults);
    
    const allSettings: SettingInfo[] = [];
    
    for (const settingPath of allSettingsPaths) {
      // Get default value by navigating the defaults object
      const defaultValue = getValueByPath(defaults, settingPath);
      
      // Find the type and description from the API model
      const apiInfo = findPropertyByPath(apiModel, settingPath);
      
      if (apiInfo) {
        allSettings.push({
          path: settingPath,
          description: apiInfo.description || '',
          defaultValue,
          type: apiInfo.typeStr
        });
      } else {
        // Fallback: add the setting even if we can't find type info
        allSettings.push({
          path: settingPath,
          description: '',
          defaultValue,
          type: 'unknown'
        });
      }
    }
    
    return allSettings;
  } catch (error) {
    console.error('Error loading API model:', error);
    return [];
  }
}

function getValueByPath(obj: any, path: string): any {
  try {
    const parts = path.split('.');
    let value: any = obj;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  } catch {
    return undefined;
  }
}

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

// Generate data for mustache template
const allSettings = extractAllSettings();

// Group by top-level category
const settingsByCategory: Record<string, SettingInfo[]> = {};
for (const setting of allSettings) {
  const category = setting.path.split('.')[0];
  if (!settingsByCategory[category]) {
    settingsByCategory[category] = [];
  }
  settingsByCategory[category].push(setting);
}

// Helper function to format default values without HTML entities
function formatDefaultValue(value: any): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return '';  // Show empty for undefined - template will handle display
  }
  if (typeof value === 'string') {
    // Don't quote empty strings
    if (value === '') return '';
    return `"${value}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[...]'; // Don't show full array content in docs
  }
  if (typeof value === 'object') {
    return '{...}'; // Don't show full object content in docs
  }
  return JSON.stringify(value);
}

// Helper function to simplify complex TypeScript types for user docs
function simplifyType(typeStr: string): string {
  if (!typeStr) return 'any';
  
  // Remove all HTML entities first
  typeStr = typeStr
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  // Handle empty or meaningless types
  if (!typeStr || typeStr === 'unknown' || typeStr === 'undefined') {
    return 'any';
  }
  
  // Simplify complex generic types
  if (typeStr.includes('T extends')) {
    return 'string'; // Most generic axis types are essentially string enums
  }
  
  // Handle union types
  if (typeStr.includes(' | ')) {
    const parts = typeStr.split(' | ').map(p => p.trim()).filter(p => p);
    if (parts.length <= 3) {
      return parts.join(' | ');
    } else {
      // Too many options, check if they're all strings
      const isAllStrings = parts.every(p => p.startsWith("'") || p.startsWith('"'));
      return isAllStrings ? 'string' : 'any';
    }
  }
  
  // Clean up some common messy types
  if (typeStr.includes('RadialAxisType') || typeStr.includes('OrientedAxisType')) {
    return 'string';
  }
  
  // Remove extra whitespace
  return typeStr.replace(/\s+/g, ' ').trim();
}

// Helper function to generate fallback descriptions
function generateDescription(path: string, type: string, existingDescription?: string): string {
  if (existingDescription && existingDescription.trim()) {
    return existingDescription;
  }
  
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];
  const category = parts[0];
  
  // Generate contextual descriptions based on path and type
  if (lastPart.startsWith('is') && type === 'boolean') {
    const feature = lastPart.replace(/^is/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    return `Enable ${feature}`;
  }
  
  // Size and dimension related
  if (lastPart.includes('Width') || lastPart.includes('Height')) {
    return `Width or height in pixels`;
  }
  if (lastPart.includes('Size') && type === 'number') {
    return `Size in pixels`;
  }
  if (lastPart.includes('Size') && type !== 'number') {
    return `Size settings`;
  }
  
  // Color related
  if (lastPart.includes('Color') || lastPart.includes('color') || lastPart.includes('Palette')) {
    return `Color value or scheme`;
  }
  
  // Spacing and layout
  if (lastPart.includes('Gap') || lastPart.includes('Margin') || lastPart.includes('Padding')) {
    return `Spacing in pixels`;
  }
  
  // Font related
  if (lastPart.includes('Font') && lastPart.includes('Size')) {
    return `Font size (e.g., "12pt", "16px")`;
  }
  if (lastPart.includes('Font') && lastPart.includes('Weight')) {
    return `Font weight (e.g., "normal", "bold", "300")`;
  }
  if (lastPart.includes('Font') && lastPart.includes('Family')) {
    return `Font family name`;
  }
  if (lastPart.includes('Font')) {
    return `Font setting`;
  }
  
  // Formatting and display
  if (lastPart.includes('Format')) {
    return `Display format (e.g., "raw", "percentage")`;
  }
  if (lastPart.includes('Position')) {
    return `Position or placement`;
  }
  if (lastPart.includes('Align')) {
    return `Alignment setting`;
  }
  if (lastPart.includes('Angle')) {
    return `Angle in degrees`;
  }
  
  // Chart type specific
  if (category === 'type' && lastPart.includes('Draw')) {
    const feature = lastPart.replace(/^isDraw/, '').replace(/^draw/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    return `Draw ${feature} on chart`;
  }
  
  // Boolean patterns
  if (type === 'boolean') {
    if (lastPart.includes('Show') || lastPart.includes('Visible')) {
      const feature = lastPart.replace(/^isShow/, '').replace(/^show/, '').replace(/^isVisible/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `Show ${feature}`;
    }
    if (lastPart.includes('Draw')) {
      const feature = lastPart.replace(/^isDraw/, '').replace(/^draw/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `Draw ${feature}`;
    }
    if (lastPart.includes('Enabled')) {
      const feature = lastPart.replace(/Enabled$/, '').replace(/^is/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `Enable ${feature}`;
    }
  }
  
  // Text and labels
  if (lastPart.includes('Text') && type === 'string') {
    return `Text content`;
  }
  if (lastPart.includes('Label') && type === 'string') {
    return `Label text`;
  }
  if (lastPart.includes('Title') && type === 'string') {
    return `Title text`;
  }
  
  // Numeric values
  if (type === 'number') {
    if (lastPart.includes('Scale') || lastPart.includes('Factor')) {
      return `Scaling factor`;
    }
    if (lastPart.includes('Rate') || lastPart.includes('Speed')) {
      return `Rate or speed value`;
    }
    if (lastPart.includes('Max')) {
      return `Maximum value`;
    }
    if (lastPart.includes('Min')) {
      return `Minimum value`;
    }
  }
  
  return ''; // Let template handle empty descriptions
}

// Helper to add category descriptions
function getCategoryDescription(categoryName: string): string {
  const descriptions = {
    'chart': 'Overall chart appearance and behavior settings.',
    'axis': 'Axis display, labels, ticks, and positioning.',
    'legend': 'Legend visibility, positioning, and styling.',
    'ui': 'User interface and accessibility features.',
    'color': 'Color schemes, palettes, and vision accessibility.',
    'animation': 'Chart animation timing and effects.',
    'sonification': 'Audio feedback and sonification settings.',
    'controlPanel': 'Control panel visibility and layout.',
    'type': 'Chart type-specific settings (bar, line, pie, etc.)',
    'grid': 'Grid lines and background elements.',
    'popup': 'Tooltip and popup styling.',
    'plotArea': 'Main chart plotting area dimensions.',
    'scrollytelling': 'Narrative scrolling features.',
    'statusBar': 'Status bar display options.',
    'dataTable': 'Data table formatting.',
    'jim': 'Navigation assistance features.',
    'dev': 'Development and debugging options.'
  };
  return descriptions[categoryName] || '';
}

export default {
  categories: Object.entries(settingsByCategory).map(([name, settings]) => ({
    name,
    description: getCategoryDescription(name),
    settings: settings.map(s => ({
      path: s.path,
      description: generateDescription(s.path, s.type, s.description),
      defaultValue: formatDefaultValue(s.defaultValue),
      type: s.type,
      simpleType: simplifyType(s.type),
      isBoolean: s.type === 'boolean',
      simpleName: s.path.split('.').pop()?.replace(/([A-Z])/g, ' $1').toLowerCase()
    }))
  })),
  allSettings: allSettings.map(s => ({
    path: s.path,
    description: generateDescription(s.path, s.type, s.description),
    defaultValue: formatDefaultValue(s.defaultValue),
    type: s.type,
    simpleType: simplifyType(s.type)
  }))
};
