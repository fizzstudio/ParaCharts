// * Generate Chart Stories *

// Imports

import printf from 'printf';
import fs from 'node:fs';

import { type CatalogListing } from '@fizz/chart-data';

import { template } from './storyTemplate.ts';
import { template as testTemplate } from './testStoriesTemplate.ts';
import { familyCatalogMap, familyCatalogMapMulti } from './chartSelectorHelper.ts';
import { allTemplate } from './allStoriesTemplate.ts';
import { CHART_FAMILY_MEMBERS, type ChartTypeFamily, type ChartType, capitalize, CHART_TYPE_FAMILIES } from '@fizz/chartsignal-internal';

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
  'graph': 'Graph',
  'bubble': 'Bubble Charts',
  'venn': 'Venn Diagrams',
  'candlestick': 'Candlestick Charts',
  'combo': 'Combo Charts'
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
  'graph': 'Graph',
  'bubble': 'Bubble Charts',
  'venn': 'Venn Diagrams',
  'candlestick': 'Candlestick Charts',
  'combo': 'Combo Charts'
}

// Generator Functions

function generateCode(
  typeFolder: string,
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number,
  templateToUse: string
): string {
  return printf(templateToUse, { manifestTitle, typeFolder, manifestPath, index, chartType });
}

function generateStory(
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number
): void {
  const typeFolder = CHART_TYPE_FOLDERS_SINGLE[chartType];
  
  const demoCode = generateCode(
    typeFolder, manifestTitle, chartType, manifestPath, index, template
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${chartType}${index}.stories.ts`, demoCode, 'utf8');
  
  const testCode = generateCode(
    typeFolder, manifestTitle, chartType, manifestPath, index, testTemplate
  );
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}${chartType}${index}.stories.ts`, testCode, 'utf8');
}

function generateStoryMulti(
  manifestTitle: string, 
  chartType: ChartType, 
  manifestPath: string, 
  index: number,
  multi: boolean
): void {
  const multiText = multi ? 'Multi' : 'Single';
  const typeFolder = multi ? CHART_TYPE_FOLDERS_MULTI[chartType] : CHART_TYPE_FOLDERS_SINGLE[chartType];
  
  const demoCode = generateCode(
    typeFolder, manifestTitle, chartType, manifestPath, index, template
  );
  fs.writeFileSync(`${AUTOGEN_PATH}${chartType}${multiText}${index}.stories.ts`, demoCode, 'utf8');
  
  const testCode = generateCode(
    typeFolder, manifestTitle, chartType, manifestPath, index, testTemplate
  );
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}${chartType}${multiText}${index}.stories.ts`, testCode, 'utf8');
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

function generateFamilyStories(family: ChartTypeFamily, multi?: boolean): void {
  const familyManifests = multi === undefined
    ? familyCatalogMap(family)
    : familyCatalogMapMulti(family, multi);
  const familyMembers = CHART_FAMILY_MEMBERS[family];
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
  family: ChartTypeFamily
): void {
  const typeFolder = `${capitalize(chartType)} Charts`
  const typePath = CHART_TYPE_FOLDERS_SINGLE[chartType];
  const storyName = `All${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { typeFolder, typePath, storyName, family, multi: 'false', chartType }
  );
  
  fs.writeFileSync(`${AUTOGEN_PATH}zall${chartType}.stories.ts`, code, 'utf8');
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}zall${chartType}.stories.ts`, code, 'utf8');
}

function generateAllStoryMulti(
  chartType: ChartType,
  family: ChartTypeFamily,
  multi: boolean
): void {
  const multiText = multi ? 'multi' : 'single';
  const typeFolder = `${capitalize(multiText)} ${capitalize(chartType)} Charts`
  const typePath = multi ? CHART_TYPE_FOLDERS_MULTI[chartType] : CHART_TYPE_FOLDERS_SINGLE[chartType];
  const storyName = `All${capitalize(multiText)}${capitalize(chartType)}Charts`;
  const code = printf(allTemplate, 
    { typeFolder, typePath, storyName, family, multi: 'true', chartType }
  );
  
  fs.writeFileSync(`${AUTOGEN_PATH}zall${multiText}${chartType}.stories.ts`, code, 'utf8');
  fs.writeFileSync(`${AUTOGEN_TEST_PATH}zall${multiText}${chartType}.stories.ts`, code, 'utf8');
}

function generateFamilyAllStory(family: ChartTypeFamily, multi?: boolean): void {
  const familyMembers = CHART_FAMILY_MEMBERS[family];
  for (const chartType of familyMembers) {
    if (chartType === 'heatmap') {
      //continue;
    }
    if (multi === undefined) {
      generateAllStory(chartType, family);
    } else {
      generateAllStoryMulti(chartType, family, multi);
    }
  }
}

// Runtime

// Removes existing `autogen` and `autogen-test` folders. 'force: true' means that this is ignored 
//   if they don't exist because the stories have never been built before
fs.rmSync(AUTOGEN_PATH, { force: true, recursive: true })
fs.rmSync(AUTOGEN_TEST_PATH, { force: true, recursive: true })

fs.mkdirSync(AUTOGEN_PATH);
fs.mkdirSync(AUTOGEN_TEST_PATH);

const MULTIABLE_FAMILIES: ChartTypeFamily[] = ['line', 'bar'];

for (const family of CHART_TYPE_FAMILIES) {
  if (MULTIABLE_FAMILIES.includes(family)) {
    generateFamilyAllStory(family, false);
    generateFamilyAllStory(family, true);
    generateFamilyStories(family, false);
    generateFamilyStories(family, true);
  } else {
    generateFamilyAllStory(family);
    generateFamilyStories(family);
  }
}

console.log('Finished generating stories');
