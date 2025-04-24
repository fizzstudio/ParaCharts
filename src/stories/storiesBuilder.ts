// * Generate Chart Stories *

// Imports

import printf from 'printf';
import fs from 'node:fs';

import { type CatalogListing } from '@fizz/chart-data';

import { template } from './storyTemplate.ts';
import { type ChartFamily, type ChartType, FAMILY_MEMBERS, familyCatalogMap, familyCatalogMapMulti, 
  familyManifestPathsMap } from './chartSelectorHelper.ts';
import { allTemplate } from './allStoriesTemplate.ts';
//import { capitalize } from '../../lib/common/utils.ts';

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generator Functions

function generateStory(
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number
): void {
  const chartFolder = capitalize(chartType) + ' Charts';
  const code = printf(template, { manifestTitle, chartFolder, manifestPath, index });
  fs.writeFileSync(`./src/stories/autogen/${chartType}${index}.stories.ts`, code, 'utf8');
}

function generateStoryMulti(
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number,
  multi: boolean
): void {
  const multiText = multi ? 'Multi' : 'Single';
  const chartFolder = `${capitalize(chartType)} ${multiText} Charts`;
  const code = printf(template, { manifestTitle, chartFolder, manifestPath, index });
  fs.writeFileSync(`./src/stories/autogen/${chartType}${multiText}${index}.stories.ts`, code, 'utf8');
}

function generateTypeStories(
  chartType: ChartType, 
  familyManifests: Record<string, CatalogListing>,
): void {
  for (const manifestTitle in familyManifests) {
    const manifestPath = familyManifests[manifestTitle].path;
    const index = familyManifests[manifestTitle].index;
    generateStory(manifestTitle, chartType, manifestPath, index);
  }
}

function generateTypeStoriesMulti(
  chartType: ChartType, 
  familyManifests: Record<string, CatalogListing>,
  multi: boolean
): void {
  for (const manifestTitle in familyManifests) {
    const manifestPath = familyManifests[manifestTitle].path;
    const index = familyManifests[manifestTitle].index;
    generateStoryMulti(manifestTitle, chartType, manifestPath, index, multi);
  }
}

function generateFamilyStories(family: ChartFamily, multi?: boolean): void {
  const familyManifests = multi === undefined
    ? familyCatalogMap(family)
    : familyCatalogMapMulti(family, multi);
  const familyMembers = FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (multi === undefined) {
      generateTypeStories(chartType, familyManifests);
    } else {
      generateTypeStoriesMulti(chartType, familyManifests, multi);
    }
  }
}

// Generate All-Stories

function generateAllStory(
  chartType: ChartType, 
  family: ChartFamily
): void {
  const chartFolder = capitalize(chartType) + ' Charts';
  const storyName = `All${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, { chartFolder, storyName, family, multi: 'false' });
  fs.writeFileSync(`./src/stories/autogen/all${chartType}.stories.ts`, code, 'utf8');
}

function generateAllStoryMulti(
  chartType: ChartType,
  family: ChartFamily,
  multi: boolean
): void {
  const multiText = multi ? 'multi' : 'single';
  const chartFolder = `${capitalize(chartType)} ${capitalize(multiText)} Charts`;
  const storyName = `All${capitalize(multiText)}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, { chartType, chartFolder, storyName, family, multi: 'true' });
  fs.writeFileSync(`./src/stories/autogen/all${multiText}${chartType}.stories.ts`, code, 'utf8');
}

function generateFamilyAllStory(family: ChartFamily, multi?: boolean): void {
  const familyMembers = FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (multi === undefined) {
      generateAllStory(chartType, family);
    } else {
      generateAllStoryMulti(chartType, family, multi);
    }
  }
}

// Runtime

generateFamilyStories('line', false);
generateFamilyStories('line', true);
generateFamilyStories('bar', false);
generateFamilyStories('bar', true);
generateFamilyStories('scatter');
generateFamilyStories('pastry');

generateFamilyAllStory('line', false);
generateFamilyAllStory('line', true);
generateFamilyAllStory('bar', false);
generateFamilyAllStory('bar', true);
generateFamilyAllStory('scatter');
generateFamilyAllStory('pastry');

console.log('Finished generating stories');
