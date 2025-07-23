
import { ChartLayer } from '.';

import { svg } from 'lit';

export class HighlightsLayer extends ChartLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  content() {
    return svg`
      ${
        this.paraview.store.visitedDatapoints.map(cursor => {
          const dpView = this._parent.dataLayer.datapointView(cursor.seriesKey, cursor.index);
          return svg`
            <use
              id="visited-mark-${cursor.seriesKey}-${cursor.index}"
              class="visited-mark"
              href="#${dpView!.id}"
            />
          `;
        })
      }
    `;
  }
}