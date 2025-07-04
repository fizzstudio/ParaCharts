
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
          return dpView!.children.map((kid, i) => svg`
            <use
              id="visited-mark-${cursor.seriesKey}-${cursor.index}-${i}"
              class="visited-mark"
              href="#${kid.id}" 
            />
          `);
        })
      }
    `;
  }
}