import { DataPoint } from '@fizz/paramodel';
import { ParaStore } from '../store';

export interface Summarizer {
  getChartSummary(): string;
  getSeriesSummary(seriesKey: string): string;
  getDatapointSummary(datapoint: DataPoint): string;
  // ...
}

export abstract class BaseSummarizer implements Summarizer {

  constructor(protected _store: ParaStore) {}

  abstract getChartSummary(): string;
  
  abstract getSeriesSummary(seriesKey: string): string;

  abstract getDatapointSummary(datapoint: DataPoint): string;
}