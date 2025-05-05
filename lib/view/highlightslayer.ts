
import { ChartLayer } from './chartlayer';
import { svg } from 'lit';
import { ref } from 'lit/directives/ref.js';

export class HighlightsLayer extends ChartLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  protected _visitedMarkRef(seriesKey: string, index: number) {
    return this._parent.docView.paraview.ref<SVGUseElement>(`visited-mark.${seriesKey}-${index}`);
  }

  content() {
    return svg`
      ${
        this.paraview.store.visitedDatapoints.map(cursor => svg`
          <use
            ${ref(this._visitedMarkRef(cursor.seriesKey, cursor.index))} 
            id="visited-mark-${cursor.seriesKey}-${cursor.index}"
            class="visited-mark"
            href="#${this._parent.dataLayer.datapointView(cursor.seriesKey, cursor.index)!.id}" 
          />
        `)
      }
    `;
  }
}