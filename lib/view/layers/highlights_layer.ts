
import { PlotLayer } from '.';

import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';

export class HighlightsLayer extends PlotLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  content() {
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
    `;
  }
}