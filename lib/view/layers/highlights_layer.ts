
import { PlotLayer } from '.';

import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';

export class HighlightsLayer extends PlotLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  content() {
    const selector = this.paraview.store.highlightedSelector;
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
        selector
          ? this.paraview.documentView!.chartInfo.datapointsForSelector(selector).map(datapoint => {
              return svg`
                <use
                  id="highlighted-mark-${datapoint.seriesKey}-${datapoint.datapointIndex}"
                  class="highlighted-mark"
                  href="#${this._parent.dataLayer.datapointDomIds.get(`${datapoint.seriesKey}-${datapoint.datapointIndex}`)}"
                />
              `;
            })
          : ''
      }
    `;
  }
}