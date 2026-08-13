import { chartTypeAliases, typeGroups } from './config.js';

export const pages = [{
  outputPath: 'config/type.md',
  context: {
    typeGroups: typeGroups.map(group => ({
      ...group,
      link: `type/${group.name}.md`,
      settingCount: group.settings.length
    })),
    chartTypeAliases: chartTypeAliases.map(alias => ({
      ...alias,
      hasSettingsGroup: Boolean(alias.settingsGroup),
      settingsLink: alias.settingsGroup ? `type/${alias.settingsGroup}.md` : ''
    }))
  }
}];
