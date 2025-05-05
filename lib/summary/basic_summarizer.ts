
import { BaseSummarizer } from './summarizer';
import { formatBox } from '../view/formatter';
import { Memoize } from 'typescript-memoize';

export class BasicSummarizer extends BaseSummarizer {

  @Memoize()
  getChartSummary() {
    return 'At top level.'
  }

  @Memoize()
  getSeriesSummary(seriesKey: string) {
    return seriesKey;
  }

  getDatapointSummary(seriesKey: string, datapointIndex: number) {
    const visitedLength = this._store.visitedDatapoints.length;
    // We don't assume the datapoint we're summarizing is actually currently
    // visited; it might not be, in headless mode  
    const isSeriesChange = this._store.isVisitedSeries(seriesKey) && !this._store.wasVisitedSeries(seriesKey);
    if (visitedLength > 1) {
      // return `${this.datapoint.formatX('statusBar')}, all points`;
      return `${seriesKey}, ${datapointIndex}, all points`;
    } else {
      // Don't include the series name unless the previously-visited point
      // was in a different series
      const dp = this._store.model!.atKeyAndIndex(seriesKey, datapointIndex);
      const formatted = Object.entries(dp!).map(([key, box]) =>
        formatBox(box, 'statusBar', this._store)).join(', ');
      if (!isSeriesChange) {
        return formatted;
      } else {
        return `${seriesKey}: ${formatted}`;
      }
    }
  }
}