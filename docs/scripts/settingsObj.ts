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

// Map interface names to their key in the Settings object
const interfaceToKey: Record<string, string> = {
  'UISettings': 'ui',
  'ChartSettings': 'chart',
  'AxisSettings': 'axis',
  'AxesSettings': 'axis',
  'ColorSettings': 'color',
  'AnimationSettings': 'animation',
  'ControlPanelSettings': 'controlPanel',
  'LegendSettings': 'legend',
  'SonificationSettings': 'sonification',
  'ScrollytellingSettings': 'scrollytelling',
  'GridSettings': 'grid',
  'PlotAreaSettings': 'plotArea',
  'PopupSettings': 'popup',
  'StatusBarSettings': 'statusBar',
  'DataTableSettings': 'dataTable',
  'JimSettings': 'jim',
  'DevSettings': 'dev',
  'ChartTypeSettings': 'type',
  'TitleSettings': 'title',
  'CaptionBoxSettings': 'caption',
  'TickSettings': 'ticks',
  'TickLabelSettings': 'labels',
  'AxisLineSettings': 'line',
  'AxisTitleSettings': 'title',
  'XAxisSettings': 'x',
  'YAxisSettings': 'y',
};

function getDefaultValue(path: string): any {
  try {
    const parts = path.split('.');
    let value: any = defaults;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  } catch {
    return undefined;
  }
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

function traverseInterface(
  apiInterface: ApiInterface, 
  apiModel: ApiModel,
  pathPrefix: string = '',
  results: SettingInfo[] = []
): SettingInfo[] {
  
  for (const member of apiInterface.members) {
    if (member.kind === ApiItemKind.PropertySignature) {
      const property = member as ApiPropertyItem;
      const propertyName = property.name;
      const currentPath = pathPrefix ? `${pathPrefix}.${propertyName}` : propertyName;
      
      const typeStr = extractTypeString(property);
      const description = extractDescription(property);
      
      // Check if this property is itself an interface we should recurse into
      const isNestedSettings = typeStr.endsWith('Settings') || 
                               typeStr === 'TitleSettings' ||
                               typeStr === 'Size2d' ||
                               typeStr === 'BoxStyle';
      
      if (isNestedSettings && !typeStr.includes('|') && !typeStr.includes('[')) {
        // Try to find the referenced interface
        const refInterfaceName = typeStr.trim();
        const refInterface = findInterface(apiModel, refInterfaceName);
        if (refInterface) {
          traverseInterface(refInterface, apiModel, currentPath, results);
          continue;
        }
      }
      
      // Add this setting
      const defaultValue = getDefaultValue(currentPath);
      results.push({
        path: currentPath,
        description: description || '',
        defaultValue: defaultValue,
        type: typeStr
      });
    }
  }
  
  return results;
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

function extractAllSettings(): SettingInfo[] {
  const apiModel = new ApiModel();
  const apiJsonPath = path.resolve(__dirname, '../../temp/paracharts.api.json');
  
  try {
    const apiPackage = apiModel.loadPackage(apiJsonPath);
    const allSettings: SettingInfo[] = [];
    
    // Find the Settings interface
    const settingsInterface = findInterface(apiModel, 'Settings');
    if (!settingsInterface) {
      console.warn('Settings interface not found in API model');
      return [];
    }
    
    // Traverse each top-level settings group
    for (const member of settingsInterface.members) {
      if (member.kind === ApiItemKind.PropertySignature) {
        const property = member as ApiPropertyItem;
        const groupKey = property.name;
        const typeStr = extractTypeString(property);
        
        // Find the interface for this group
        const groupInterface = findInterface(apiModel, typeStr.trim());
        if (groupInterface) {
          traverseInterface(groupInterface, apiModel, groupKey, allSettings);
        }
      }
    }
    
    return allSettings;
  } catch (error) {
    console.error('Error loading API model:', error);
    return [];
  }
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

// Get commonly used settings
const commonSettings = allSettings.filter(s => {
  const commonPaths = [
    'chart.type', 'chart.size.width', 'chart.size.height', 'chart.title.text',
    'ui.isVoicingEnabled', 'ui.isLowVisionModeEnabled', 'ui.speechRate',
    'sonification.isSoniEnabled', 'color.colorPalette', 'color.isDarkModeEnabled',
    'legend.isDrawLegend', 'controlPanel.isControlPanelDefaultOpen'
  ];
  return commonPaths.includes(s.path);
});

export default {
  commonSettings: commonSettings.map(s => ({
    path: s.path,
    description: s.description,
    defaultValue: JSON.stringify(s.defaultValue),
    type: s.type
  })),
  categories: Object.entries(settingsByCategory).map(([name, settings]) => ({
    name,
    settings: settings.map(s => ({
      path: s.path,
      description: s.description,
      defaultValue: JSON.stringify(s.defaultValue),
      type: s.type
    }))
  })),
  allSettings: allSettings.map(s => ({
    path: s.path,
    description: s.description,
    defaultValue: JSON.stringify(s.defaultValue),
    type: s.type
  }))
};
