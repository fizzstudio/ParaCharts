// * Generate Chart Stories *

// Imports

import printf from 'printf';
import fs from 'node:fs';

import { type CatalogListing } from '@fizz/chart-data';

import { template } from './storyTemplate.ts';
import { type ChartFamily, FAMILY_MEMBERS, familyCatalogMap, familyCatalogMapMulti} 
  from './chartSelectorHelper.ts';
import { allTemplate } from './allStoriesTemplate.ts';
import { type ChartType } from '@fizz/paramanifest';
import { capitalize } from '../../lib/common/utils.ts';

/*function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}*/

const AUTOGEN_PATH = './src/stories/autogen/'

// Generator Functions

function generateCode(
  ai: boolean,
  typeFolder: string,
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number
): string {
  const topFolder = ai ? 'Ai-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Charts';
  return printf(template, 
    { manifestTitle, typeFolder, topFolder, manifestPath, index, chartType, chartElement }
  );
}

function generateStory(
  ai: boolean,
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number
): void {
  const typeFolder = capitalize(chartType) + ' Charts';
  const code = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}${chartType}${index}.stories.ts`, code, 'utf8');
}

function generateStoryMulti(
  ai: boolean,
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number,
  multi: boolean
): void {
  const multiText = multi ? 'Multi' : 'Single';
  const typeFolder = `${capitalize(chartType)} ${multiText} Charts`;
  const code = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}${chartType}${multiText}${index}.stories.ts`, code, 'utf8');
}

function generateTypeStories(
  ai: boolean,
  chartType: ChartType, 
  familyManifests: Record<string, CatalogListing>,
): void {
  for (const manifestTitle in familyManifests) {
    const manifestPath = familyManifests[manifestTitle].path;
    const index = familyManifests[manifestTitle].index;
    generateStory(ai, manifestTitle, chartType, manifestPath, index);
  }
}

function generateTypeStoriesMulti(
  ai: boolean,
  chartType: ChartType, 
  familyManifests: Record<string, CatalogListing>,
  multi: boolean
): void {
  for (const manifestTitle in familyManifests) {
    const manifestPath = familyManifests[manifestTitle].path;
    const index = familyManifests[manifestTitle].index;
    generateStoryMulti(ai, manifestTitle, chartType, manifestPath, index, multi);
  }
}

function generateFamilyStories(family: ChartFamily, ai: boolean, multi?: boolean): void {
  const familyManifests = multi === undefined
    ? familyCatalogMap(family)
    : familyCatalogMapMulti(family, multi);
  const familyMembers = FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (multi === undefined) {
      generateTypeStories(ai, chartType, familyManifests);
    } else {
      generateTypeStoriesMulti(ai, chartType, familyManifests, multi);
    }
  }
}

// Generate All-Stories

function generateAllStory(
  ai: boolean,
  chartType: ChartType, 
  family: ChartFamily
): void {
  const topFolder = ai ? 'Ai-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Charts';
  const typeFolder = capitalize(chartType) + ' Charts';
  const storyName = `All${ai ? 'AI' : ''}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { topFolder, typeFolder, storyName, family, multi: 'false', chartType, chartElement }
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}all${chartType}.stories.ts`, code, 'utf8');
}

function generateAllStoryMulti(
  ai: boolean,
  chartType: ChartType,
  family: ChartFamily,
  multi: boolean
): void {
  const topFolder = ai ? 'Ai-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Charts';
  const multiText = multi ? 'multi' : 'single';
  const typeFolder = `${capitalize(chartType)} ${capitalize(multiText)} Charts`;
  const storyName = `All${capitalize(multiText)}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { topFolder, typeFolder, storyName, family, multi: 'true', chartType, chartElement }
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}all${multiText}${chartType}.stories.ts`, code, 'utf8');
}

function generateFamilyAllStory(family: ChartFamily, ai: boolean, multi?: boolean): void {
  const familyMembers = FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (multi === undefined) {
      generateAllStory(ai, chartType, family);
    } else {
      generateAllStoryMulti(ai, chartType, family, multi);
    }
  }
}

// Runtime

// Removes existing `autogen` folder. 'force: true' means that this is ignored if `autogen` doesn't
//   exist because the stories have never been built before
fs.rmSync(AUTOGEN_PATH, { force: true, recursive: true })

fs.mkdirSync(AUTOGEN_PATH);

const MULTIABLE_FAMILIES: ChartFamily[] = ['line', 'bar'];
const NON_MULTIABLE_FAMILIES: ChartFamily[] = ['scatter', 'pastry'];

for (const family of MULTIABLE_FAMILIES) {
  generateFamilyStories(family, false, false);
  generateFamilyStories(family, true, false);
  generateFamilyStories(family, false, true);
  generateFamilyStories(family, true, true);
  generateFamilyAllStory(family, false, false);
  generateFamilyAllStory(family, true, false);
  generateFamilyAllStory(family, false, true);
  generateFamilyAllStory(family, true, true);
}

for (const family of NON_MULTIABLE_FAMILIES) {
  generateFamilyStories(family, false);
  generateFamilyStories(family, true);
  generateFamilyAllStory(family, false);
  generateFamilyAllStory(family, true);
}

console.log('Finished generating stories');
