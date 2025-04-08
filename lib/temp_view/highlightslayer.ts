
import { ChartLayer } from './chartlayer';
import { svg } from 'lit';
import { ref } from 'lit/directives/ref.js';

export class HighlightsLayer extends ChartLayer {

  protected _createId() {
    return super._createId('highlights');
  }

  activateMark(datapointId: string) {
    this._visitedMarkRef(datapointId).value!.setAttribute('href', `#${datapointId}`);
  }

  deactivateMark(datapointId: string) {
    this._visitedMarkRef(datapointId).value!.setAttribute('href', '');
  }

  protected _visitedMarkRef(datapointId: string) {
    return this._parent.docView.paraview.ref<SVGUseElement>(`visited-mark.${datapointId}`);
  }

  render() {
    return super.render(svg`
      ${
        this._parent.dataLayer.datapointViews.map(dpView => svg`
          <use
            ${ref(this._visitedMarkRef(dpView.id))} 
            id="visited-mark-${dpView.id}"
            class="visited-mark"
            href="" 
          />
        `)
      }
    `);
  }

}