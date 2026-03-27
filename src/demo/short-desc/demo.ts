import { Manifest } from '@fizz/paramanifest';
import { modelFromInlineManifest  } from '@fizz/paramodel';
import { initParaSummary, summarizerFromModel } from '@fizz/parasummary';

import '../../../lib-ai/index-ai';

import SINGLE_LINE_MANIFEST from '../../demo-data/line-single-manifest-7.json';

await initParaSummary();

const singleLinePara = document.getElementById('single_line') as HTMLParagraphElement;

const singleLineModel = modelFromInlineManifest(SINGLE_LINE_MANIFEST as Manifest);
const singleLineSummarizer = summarizerFromModel(singleLineModel);

const singleLineShort = await singleLineSummarizer.getRequestedSummaries(['$.datasets[0]._short']);

singleLinePara.innerText = singleLineShort.text;