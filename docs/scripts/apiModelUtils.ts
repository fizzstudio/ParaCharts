import { ApiModel } from '@microsoft/api-extractor-model';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and return the staged API Extractor model.
 */
export function loadApiModel(): ApiModel {
  const apiModel = new ApiModel();
  const apiJsonPath = path.resolve(__dirname, '../.api-model/paracharts.api.json');
  apiModel.loadPackage(apiJsonPath);
  return apiModel;
}

/**
 * Extract TSDoc summary text from any API item that has a tsdocComment.
 */
export function extractSummaryText(item: { tsdocComment?: any }): string {
  const summary = item.tsdocComment?.summarySection;
  if (!summary) return '';
  let text = '';
  for (const node of summary.nodes) {
    if (node.kind === 'Paragraph') {
      for (const child of (node as any).nodes) {
        if (child.kind === 'PlainText') {
          text += (child as any).text;
        }
      }
    }
  }
  return text.trim();
}
