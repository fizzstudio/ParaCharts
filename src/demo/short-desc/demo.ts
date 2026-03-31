import { Manifest } from '@fizz/paramanifest';
import { modelFromInlineManifest  } from '@fizz/paramodel';
import { initParaSummary, summarizerFromModel } from '@fizz/parasummary';

import '../../../lib-ai/index-ai';

import SINGLE_LINE_MANIFEST from '../../demo-data/line-single-manifest-7.json';
import MULTI_LINE_MANIFEST from '../../demo-data/line-multi-manifest-57.json';
import PIE_MANIFEST from '../../demo-data/pie-manifest-dark-matter.json';
import SINGLE_BAR_MANIFEST from '../../demo-data/bar-single-manifest-1018.json';
import MULTI_BAR_MANIFEST from '../../demo-data/bar-multi-manifest-48.json';
import SCATTER_MANIFEST from '../../demo-data/scatter-manifest-geyser.json';
import WATERFALL_MANIFEST from '../../demo-data/waterfall-manifest-001.json';
import { ParaChartAi } from '../../../lib-ai/index-ai';

/*await initParaSummary();

async function displayShortDesc(elementId: string, manifest: unknown): Promise<void> {
  const paraElement = document.getElementById(elementId) as HTMLParagraphElement;
  const model = modelFromInlineManifest(manifest as Manifest);
  const summarizer = summarizerFromModel(model);
  const shortDesc = await summarizer.getRequestedSummaries(['$.datasets[0]._short']);
  paraElement.innerText = shortDesc.text;
}*/

async function displayShortDesc(pElementId: string, chartElementId: string): Promise<void> {
  const pElement = document.getElementById(pElementId) as HTMLParagraphElement;
  const chartElement = document.getElementById(chartElementId) as ParaChartAi;
  const shortDesc = await chartElement.shortDescription();
  pElement.innerText = shortDesc;
}

/*displayShortDesc('single_line_p', SINGLE_LINE_MANIFEST);
displayShortDesc('multi_line_p', MULTI_LINE_MANIFEST);
displayShortDesc('pie_p', PIE_MANIFEST);
displayShortDesc('single_bar_p', SINGLE_BAR_MANIFEST);
displayShortDesc('multi_bar_p', MULTI_BAR_MANIFEST);
displayShortDesc('scatter_p', SCATTER_MANIFEST);
displayShortDesc('waterfall_p', WATERFALL_MANIFEST);*/

displayShortDesc('single_line_p', 'single_line_c');
displayShortDesc('multi_line_p', 'multi_line_c');
displayShortDesc('pie_p', 'pie_c');
displayShortDesc('single_bar_p', 'single_bar_c');
displayShortDesc('multi_bar_p', 'multi_bar_c');
displayShortDesc('scatter_p', 'scatter_c');
displayShortDesc('waterfall_p', 'waterfall_c');
