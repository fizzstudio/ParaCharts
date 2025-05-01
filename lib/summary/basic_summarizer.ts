
import { BaseSummarizer } from './summarizer';
import { formatBox, formatXYDatapointX } from '../view/formatter';

export class BasicSummarizer extends BaseSummarizer {

  getChartSummary() {
    return 'At top level.'
  }

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
      // const datapoint = this.datapoint.format('statusBar');
      const datapoint = `${datapointIndex}`;
      if (!isSeriesChange) {
        return datapoint;
      } else {
        return `${seriesKey}: ${datapoint}`;
      }
    }
  }
}