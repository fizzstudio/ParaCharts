import { ParaStore } from '../store';

export interface Summarizer {
  getChartSummary(): string;
  getSeriesSummary(seriesKey: string): string;
  getDatapointSummary(seriesKey: string, datapointIndex: number): string;
  // ...
}

export abstract class BaseSummarizer implements Summarizer {

  constructor(protected _store: ParaStore) {}
  
  getChartSummary() {
    return '';
  }
  
  getSeriesSummary(seriesKey: string) {
    return '';
  }

  getDatapointSummary(seriesKey: string, datapointIndex: number) {
    return '';
  }
}