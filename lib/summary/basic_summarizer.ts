
import { BaseSummarizer } from './summarizer';
import { formatDatapoint } from '../view/formatter';
import { Memoize } from 'typescript-memoize';
import { DataPoint } from '@fizz/paramodel';

export class BasicSummarizer extends BaseSummarizer {

  @Memoize()
  getChartSummary() {
    return 'At top level.'
  }

  @Memoize()
  getSeriesSummary(seriesKey: string) {
    return seriesKey;
  }

  @Memoize()
  getDatapointSummary(datapoint: DataPoint) {
    const visitedLength = this._store.visitedDatapoints.length;
    // We don't assume the datapoint we're summarizing is actually currently
    // visited; it might not be, in headless mode  
    const isSeriesChange = 
      this._store.isVisitedSeries(datapoint.seriesKey) && !this._store.wasVisitedSeries(datapoint.seriesKey);
    if (visitedLength > 1) {
      // return `${this.datapoint.formatX('statusBar')}, all points`;
      return `${datapoint.seriesKey}, ${datapoint.datapointIndex}, all points`;
    } else {
      // Don't include the series name unless the previously-visited point
      // was in a different series
      const formatted = formatDatapoint(datapoint, 'statusBar', this._store);
      if (!isSeriesChange) {
        return formatted;
      } else {
        return `${datapoint.seriesKey}: ${formatted}`;
      }
    }
  }
}