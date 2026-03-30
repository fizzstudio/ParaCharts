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

await initParaSummary();

async function displayShortDesc(elementId: string, manifest: unknown): Promise<void> {
  const paraElement = document.getElementById(elementId) as HTMLParagraphElement;
  const model = modelFromInlineManifest(manifest as Manifest);
  const summarizer = summarizerFromModel(model);
  const shortDesc = await summarizer.getRequestedSummaries(['$.datasets[0]._short']);
  paraElement.innerText = shortDesc.text;
}

displayShortDesc('single_line', SINGLE_LINE_MANIFEST);
displayShortDesc('multi_line', MULTI_LINE_MANIFEST);
displayShortDesc('pie', PIE_MANIFEST);
displayShortDesc('single_bar', SINGLE_BAR_MANIFEST);
displayShortDesc('multi_bar', MULTI_BAR_MANIFEST);
displayShortDesc('scatter', SCATTER_MANIFEST);
displayShortDesc('waterfall', WATERFALL_MANIFEST);
