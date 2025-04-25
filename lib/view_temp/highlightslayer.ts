
import { ChartLayer } from './chartlayer';
import { svg } from 'lit';
import { ref } from 'lit/directives/ref.js';

export class HighlightsLayer extends ChartLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  protected _visitedMarkRef(datapointId: string) {
    return this._parent.docView.paraview.ref<SVGUseElement>(`visited-mark.${datapointId}`);
  }

  content() {
    return svg`
      ${
        this.paraview.store.visitedDatapoints.map(id => svg`
          <use
            ${ref(this._visitedMarkRef(id))} 
            id="visited-mark-${id}"
            class="visited-mark"
            href="#${id}" 
          />
        `)
      }
    `;
  }
}