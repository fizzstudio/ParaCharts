import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiInterface, ApiItemKind, ApiPropertyItem } from '@microsoft/api-extractor-model';
import { CHART_FAMILY_MAP } from '@fizz/paramanifest';
import { configMetadata } from '../../lib/config/config_metadata.js';
import { defaultConfig } from '../../lib/config/config_defaults.js';
import { chartTypeDefaults } from '../../lib/state/settings_defaults.js';
import { extractSummaryText, loadApiModel } from './apiModelUtils.js';

export interface SettingInfo {
  path: string;
  description: string;
  defaultValue: string;
  validValues: string;
}

export interface TypeDefinition {
  name: string;
  id: string;
  definition: string;
}

interface Metadata {
  description?: string;
  type?: string;
  control?: string;
  controlOptions?: { inputType?: string; min?: number; max?: number };
  advanced?: boolean;
  hidden?: boolean;
}

const fallbackTypeAliases: Record<string, string> = {
  ChartType: Object.keys(CHART_FAMILY_MAP).map(value => `'${value}'`).join(' | '),
  Color: 'string',
  SnapLocation: "'start' | 'end' | 'center'"
};

function extractTypeAliases(): Map<string, string> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const typesPath = path.resolve(scriptDir, '../../lib/config/config_types.ts');
  const source = fs.readFileSync(typesPath, 'utf8').replace(/\/\/.*$/gm, '');
  const aliases = new Map(Object.entries(fallbackTypeAliases));
  const aliasPattern = /export type\s+(\w+)(?:<[^;]+>)?\s*=\s*([\s\S]*?);/g;

  for (const match of source.matchAll(aliasPattern)) {
    aliases.set(match[1], match[2].replace(/\s+/g, ' ').trim().replace(/^\|\s*/, ''));
  }
  return aliases;
}

const typeAliases = extractTypeAliases();

function resolveTypeAlias(name: string, resolving = new Set<string>()): string | undefined {
  const definition = typeAliases.get(name);
  if (!definition || resolving.has(name)) return definition;

  const nextResolving = new Set(resolving).add(name);
  return definition.replace(/\b[A-Z][A-Za-z0-9]*\b/g, candidate => {
    const resolved = resolveTypeAlias(candidate, nextResolving);
    return resolved ? `(${resolved})` : candidate;
  });
}

function unionMembers(type: string): string[] | undefined {
  const members = type.split('|').map(member => member.trim().replace(/^\(+|\)+$/g, '').trim());
  return members.length > 1 && members.every(member => /^(['"]).*\1$/.test(member))
    ? members
    : undefined;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeTableText(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatType(type: string, settingPath: string, glossary: Map<string, TypeDefinition>): string {
  const typeName = type.trim();
  const resolved = /^[A-Z][A-Za-z0-9]*$/.test(typeName) ? resolveTypeAlias(typeName) : undefined;
  const displayedType = resolved ?? typeName;
  const members = unionMembers(displayedType);

  if (members && members.length > 3) {
    const name = resolved ? typeName : `${settingPath} values`;
    const id = slug(name);
    glossary.set(name, {
      name,
      id,
      definition: escapeTableText(members.join(' | '))
    });
    return `[${name}](#${id})`;
  }

  return escapeTableText(members?.join(' | ') ?? displayedType);
}

function formatNumericRange(metadata: Metadata): string | undefined {
  const isNumericControl = metadata.control === 'slider'
    || (metadata.control === 'textfield' && metadata.controlOptions?.inputType === 'number');
  if (!isNumericControl) return undefined;

  const min = metadata.controlOptions?.min;
  const max = metadata.controlOptions?.max;
  if (min !== undefined && max !== undefined) return `number [${min}, ${max}]`;
  if (min !== undefined) return `number (>= ${min})`;
  if (max !== undefined) return `number (<= ${max})`;
  return undefined;
}

function formatValue(value: unknown): string {
  if (value === undefined) return '*none*';
  return escapeTableText(JSON.stringify(value));
}

function walkDefaults(value: unknown, prefix = ''): Array<{ path: string; value: unknown }> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      walkDefaults(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [{ path: prefix, value }];
}

function metadataForPath(settingPath: string): Metadata {
  const parts = settingPath.split('.');
  const settingName = parts.pop()!;
  const groupPath = parts.join('.');
  const group = configMetadata[groupPath];
  if (!group || !(settingName in group.settings)) {
    throw new Error(`No config metadata found for ${settingPath}`);
  }
  return group.settings[settingName] as Metadata;
}

function descriptorFields(interfaceName: string) {
  const apiModel = loadApiModel();
  for (const apiPackage of apiModel.packages) {
    for (const entryPoint of apiPackage.entryPoints) {
      const apiInterface = entryPoint.members.find(member =>
        member.kind === ApiItemKind.Interface && member.displayName === interfaceName
      ) as ApiInterface | undefined;
      if (!apiInterface) continue;

      return apiInterface.members
        .filter(member => member.kind === ApiItemKind.PropertySignature)
        .map(member => {
          const property = member as ApiPropertyItem;
          return {
            name: `${property.name}${property.isOptional ? '?' : ''}`,
            type: escapeTableText(property.propertyTypeExcerpt.text.trim())
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;'),
            description: escapeTableText(extractSummaryText(property))
          };
        });
    }
  }
  throw new Error(`Could not find ${interfaceName} in the API model.`);
}

const allSettings = walkDefaults(defaultConfig);
const visibleSettings = allSettings.filter(({ path }) => !metadataForPath(path).hidden);
const settingsByCategory = new Map<string, Array<{ path: string; value: unknown; metadata: Metadata }>>();

for (const setting of visibleSettings) {
  const category = setting.path.split('.')[0];
  const metadata = metadataForPath(setting.path);
  const categorySettings = settingsByCategory.get(category) ?? [];
  categorySettings.push({ ...setting, metadata });
  settingsByCategory.set(category, categorySettings);
}

const documentedPaths = Array.from(settingsByCategory.values()).flat().map(({ path }) => path);
if (documentedPaths.length !== visibleSettings.length || new Set(documentedPaths).size !== documentedPaths.length) {
  throw new Error(`Config docs coverage mismatch: documented ${documentedPaths.length} of ${visibleSettings.length} non-hidden settings.`);
}
console.log(`Config docs: documented ${documentedPaths.length} of ${visibleSettings.length} non-hidden settings (${allSettings.length} total defaults).`);

export function displayName(name: string): string {
  if (name === 'ui') return 'UI';
  if (name === 'type') return 'Chart Types';
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, first => first.toUpperCase());
}

export const categories = Array.from(settingsByCategory, ([name, settings]) => {
  const glossary = new Map<string, TypeDefinition>();
  const processedSettings: SettingInfo[] = settings.map(({ path: settingPath, value, metadata }) => {
    if (!metadata.description) console.warn(`Config setting ${settingPath} has no description.`);
    const description = escapeTableText(metadata.description || '*Description missing.*');
    return {
      path: settingPath,
      description: metadata.advanced ? `*${description}* †` : description,
      defaultValue: formatValue(value),
      validValues: formatNumericRange(metadata) ?? formatType(metadata.type ?? typeof value, settingPath, glossary)
    };
  });

  return {
    name,
    description: configMetadata[name]?.description ?? '',
    settings: processedSettings,
    typeDefinitions: Array.from(glossary.values()),
    hasTypeDefinitions: glossary.size > 0
  };
});

const typeCategory = categories.find(category => category.name === 'type');
const settingsByType = new Map<string, SettingInfo[]>();
for (const setting of typeCategory?.settings ?? []) {
  const typeName = setting.path.split('.')[1];
  const settings = settingsByType.get(typeName) ?? [];
  settings.push(setting);
  settingsByType.set(typeName, settings);
}

export const typeGroups = Array.from(settingsByType, ([name, settings]) => {
  const typeDefinitions = (typeCategory?.typeDefinitions ?? []).filter(definition =>
    settings.some(setting => setting.validValues.includes(`#${definition.id}`))
  );
  return {
    name,
    displayName: displayName(name),
    description: configMetadata[`type.${name}`]?.description ?? '',
    settings,
    typeDefinitions,
    hasTypeDefinitions: typeDefinitions.length > 0
  };
});

export const chartTypeAliases = [
  { name: 'Lollipop', chartType: 'lollipop', settingsGroup: 'bar' },
  { name: 'Step Line', chartType: 'stepline', settingsGroup: 'line' },
  { name: 'Graph', chartType: 'graph', settingsGroup: '' }
];

export const chartTypeDefaultRows = Object.entries(chartTypeDefaults).flatMap(([chartType, overrides]) =>
  Object.entries(overrides ?? {}).map(([settingPath, value]) => ({
    chartType,
    settingPath,
    value: formatValue(value)
  }))
);

export const groupDescriptorFields = descriptorFields('ConfigGroupMetadata');
export const settingDescriptorFields = descriptorFields('ConfigSettingMetadata');

export default {
  settingCount: documentedPaths.length,
  categoryLinks: categories.map(category => ({
    name: displayName(category.name),
    description: category.description,
    settingCount: category.settings.length,
    link: category.name === 'type' ? 'config/type.md' : `config/${category.name}.md`
  }))
};
