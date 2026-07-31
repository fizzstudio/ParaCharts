import { categories, displayName, typeGroups } from './config.js';

const categoryPages = categories
  .filter(category => category.name !== 'type')
  .map(category => ({
    outputPath: `config/${category.name}.md`,
    context: {
      ...category,
      title: displayName(category.name),
      backLabel: 'Back to configuration',
      backLink: '../config.md'
    }
  }));

const typePages = typeGroups.map(group => ({
  outputPath: `config/type/${group.name}.md`,
  context: {
    ...group,
    title: `${group.displayName} Type`,
    backLabel: 'Back to chart-type configuration',
    backLink: '../type.md'
  }
}));

export const cleanOutputDirectories = ['config'];
export const pages = [...categoryPages, ...typePages];
