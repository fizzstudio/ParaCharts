
import { ChartLayer } from '..';
import { FocusRing } from './focus_ring';

import { svg } from 'lit';

export class FocusLayer extends ChartLayer {

  protected _createId() {
    return super._createId('focus');
  }

  content() {
    const leaf = this._parent.dataLayer.focusLeaf;
    const ring = this._parent.dataLayer.shouldDrawFocusRing
      && (this.paraview.store.settings.ui.isLowVisionModeEnabled
        || this.paraview.store.settings.ui.isFocusRingEnabled)
      ? new FocusRing(this.paraview, leaf)
      : null;
    return svg`
      ${ring?.render()}
    `;
  }
}