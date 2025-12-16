// * Generate Chart Stories *

// Imports

import printf from 'printf';
import fs from 'node:fs';

import { type CatalogListing } from '@fizz/chart-data';

import { template } from './storyTemplate.ts';
import { template as testTemplate } from './testStoriesTemplate.ts';
import { familyCatalogMap, familyCatalogMapMulti } from './chartSelectorHelper.ts';
import { allTemplate } from './allStoriesTemplate.ts';
import { CHART_FAMILY_MEMBERS, type ChartTypeFamily, type ChartType } from '@fizz/paramanifest';
//import { capitalize } from '../../lib/common/utils.ts';

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const AUTOGEN_PATH = './src/stories/autogen/';
const AUTOGEN_TEST_PATH = './src/stories/autogen-test/';

const CHART_TYPE_FOLDERS_SINGLE: Record<ChartType, string> = {
  'line': 'Line Charts/Single Line Charts',
  'stepline': 'Line Charts/Single Stepline Charts',
  'bar': 'Bar Charts/Single Bar Charts',
  'column': 'Bar Charts/Single Column Charts',
  'lollipop': 'Bar Charts/Single Lollipop Charts',
  'pie': 'Pastry Charts/Pie Charts',
  'donut': 'Pastry Charts/Donut Charts',
  'scatter': 'Scatter Charts',
  'histogram': 'Histograms',
  'waterfall': 'Waterfall Charts',
  'heatmap': 'Heat Maps',
  'graph': 'Graph'
}

const CHART_TYPE_FOLDERS_MULTI: Record<ChartType, string> = {
  'line': 'Line Charts/Multi Line Charts',
  'stepline': 'Line Charts/Multi Stepline Charts',
  'bar': 'Bar Charts/Multi Bar Charts',
  'column': 'Bar Charts/Multi Column Charts',
  'lollipop': 'Bar Charts/Multi Lollipop Charts',
  'pie': 'Pastry Charts/Pie Charts',
  'donut': 'Pastry Charts/Donut Charts',
  'scatter': 'Scatter Charts',
  'histogram': 'Histograms',
  'waterfall': 'Waterfall Charts',
  'heatmap': 'Heat Maps',
  'graph': 'Graph'
}

// Generator Functions

function generateCode(
  ai: boolean,
  typeFolder: string,
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number,
  templateToUse: string
): string {
  const topFolder = ai ? 'AI-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Chart';
  return printf(templateToUse, 
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
  const typeFolder = CHART_TYPE_FOLDERS_SINGLE[chartType];
  
  const demoCode = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index, template
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}${chartType}${index}.stories.ts`, demoCode, 'utf8');
  
  const testCode = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index, testTemplate
  );
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}${ai ? 'AI' : ''}${chartType}${index}.stories.ts`, testCode, 'utf8');
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
  const typeFolder = multi ? CHART_TYPE_FOLDERS_MULTI[chartType] : CHART_TYPE_FOLDERS_SINGLE[chartType];
  
  const demoCode = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index, template
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${ai ? 'AI' : ''}${chartType}${multiText}${index}.stories.ts`, demoCode, 'utf8');
  
  const testCode = generateCode(
    ai, typeFolder, manifestTitle, chartType, manifestPath, index, testTemplate
  );
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}${ai ? 'AI' : ''}${chartType}${multiText}${index}.stories.ts`, testCode, 'utf8');
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

function generateFamilyStories(family: ChartTypeFamily, ai: boolean, multi?: boolean): void {
  const familyManifests = multi === undefined
    ? familyCatalogMap(family)
    : familyCatalogMapMulti(family, multi);
  const familyMembers = CHART_FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (chartType === 'heatmap') {
      continue;
    }
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
  family: ChartTypeFamily
): void {
  const topFolder = ai ? 'AI-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Chart';
  const typeFolder = `${capitalize(chartType)} Charts`
  const typePath = CHART_TYPE_FOLDERS_SINGLE[chartType];
  const storyName = `All${ai ? 'AI' : ''}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { topFolder, typeFolder, typePath, storyName, family, multi: 'false', chartType, chartElement }
  );
  
  fs.writeFileSync(`${AUTOGEN_PATH}z${ai ? 'AI' : ''}all${chartType}.stories.ts`, code, 'utf8');
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}z${ai ? 'AI' : ''}all${chartType}.stories.ts`, code, 'utf8');
}

function generateAllStoryMulti(
  ai: boolean,
  chartType: ChartType,
  family: ChartTypeFamily,
  multi: boolean
): void {
  const topFolder = ai ? 'AI-enhanced Charts' : 'Basic Charts';
  const chartElement = ai ? 'AiChart' : 'Chart';
  const multiText = multi ? 'multi' : 'single';
  const typeFolder = `${capitalize(multiText)} ${capitalize(chartType)} Charts`
  const typePath = multi ? CHART_TYPE_FOLDERS_MULTI[chartType] : CHART_TYPE_FOLDERS_SINGLE[chartType];
  const storyName = `All${capitalize(multiText)}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { topFolder, typeFolder, typePath, storyName, family, multi: 'true', chartType, chartElement }
  );
  
  fs.writeFileSync(`${AUTOGEN_PATH}z${ai ? 'AI' : ''}all${multiText}${chartType}.stories.ts`, code, 'utf8');
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}z${ai ? 'AI' : ''}all${multiText}${chartType}.stories.ts`, code, 'utf8');
}

function generateFamilyAllStory(family: ChartTypeFamily, ai: boolean, multi?: boolean): void {
  const familyMembers = CHART_FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (chartType === 'heatmap') {
      continue;
    }
    if (multi === undefined) {
      generateAllStory(ai, chartType, family);
    } else {
      generateAllStoryMulti(ai, chartType, family, multi);
    }
  }
}

// Runtime

// Removes existing `autogen` and `autogen-test` folders. 'force: true' means that this is ignored if they don't
//   exist because the stories have never been built before
fs.rmSync(AUTOGEN_PATH, { force: true, recursive: true })
fs.rmSync(AUTOGEN_TEST_PATH, { force: true, recursive: true })

fs.mkdirSync(AUTOGEN_PATH);
fs.mkdirSync(AUTOGEN_TEST_PATH);

const MULTIABLE_FAMILIES: ChartTypeFamily[] = ['line', 'bar'];
const NON_MULTIABLE_FAMILIES: ChartTypeFamily[] = ['scatter', 'pastry', 'histogram', 'waterfall'];

for (const family of MULTIABLE_FAMILIES) {
  generateFamilyAllStory(family, false, false);
  generateFamilyAllStory(family, true, false);
  generateFamilyAllStory(family, false, true);
  generateFamilyAllStory(family, true, true);
  generateFamilyStories(family, false, false);
  generateFamilyStories(family, true, false);
  generateFamilyStories(family, false, true);
  generateFamilyStories(family, true, true);

}

for (const family of NON_MULTIABLE_FAMILIES) {
  generateFamilyAllStory(family, false);
  generateFamilyAllStory(family, true);
  generateFamilyStories(family, false);
  generateFamilyStories(family, true);
}

console.log('Finished generating stories');
