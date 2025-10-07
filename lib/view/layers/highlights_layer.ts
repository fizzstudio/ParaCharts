
import { PlotLayer } from '.';

import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';
import { DataSymbol } from '../symbol';

export class HighlightsLayer extends PlotLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  content() {
    const selector = this.paraview.store.highlightedSelector;
    let overlaySym: DataSymbol | null = null;
    if (selector) {
      const datapoints = this.paraview.documentView!.chartInfo.datapointsForSelector(selector);
      const datapointViews = datapoints.map(datapoint =>
        this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!);
      if (selector.startsWith('datapoint')) {
        overlaySym = datapointViews[0].symbol!.clone();
        overlaySym.scale *= 2;
        overlaySym.opacity = 0.5;
      }
    }
    return svg`
      ${
        this.paraview.store.visitedDatapoints.values().map(datapointId => {
          const {seriesKey, index} = datapointIdToCursor(datapointId);
          return svg`
            <use
              id="visited-mark-${seriesKey}-${index}"
              class="visited-mark"
              href="#${this._parent.dataLayer.datapointDomIds.get(datapointId)}"
            />
          `;
        })
      }
      ${
        /*selector
          ? this.paraview.documentView!.chartInfo.datapointsForSelector(selector).map(datapoint => {
              return svg`
                <use
                  id="highlighted-mark-${datapoint.seriesKey}-${datapoint.datapointIndex}"
                  class="highlighted-mark"
                  href="#${this._parent.dataLayer.datapointDomIds.get(`${datapoint.seriesKey}-${datapoint.datapointIndex}`)}"
                />
              `;
            })
          : ''*/
          overlaySym ? overlaySym.render() : ''
      }
    `;
  }
}