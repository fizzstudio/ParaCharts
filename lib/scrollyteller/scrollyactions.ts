import { 
  type ActionMap,
  type ActionContext  
} from './scrollyteller';

export const scrollyActions: ActionMap = {
  highlightSeries: ({ chartId, datasetId, progress }: ActionContext) => {
    if (!chartId || !datasetId) return;
    // this.highlightDataset(chartId, datasetId, progress);
    console.warn('[ParaCharts] highlightSeries', { chartId, datasetId, progress });
  },

  highlightDatapoint: ({ chartId, datasetId, progress }: ActionContext) => {
    if (!chartId || !datasetId) return;
    // this.highlightDataset(chartId, datasetId, progress);
    console.warn('[ParaCharts] highlightDatapoint', { chartId, datasetId, progress });
  },

  resetHighlight: ({ chartId, datasetId }: ActionContext) => {
    if (!chartId || !datasetId) return;
    // this.resetHighlight(chartId, datasetId);
    console.warn('[ParaCharts] resetHighlight', { chartId, datasetId });

  },

  logStep: ({ index, direction }: ActionContext) => {
    // eslint-disable-next-line no-console
    console.log('[ParaCharts] logStep', { index, direction });
  },
};