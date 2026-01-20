
import { PlotLayer } from '..';
import { FocusRing } from './focus_ring';

import { svg } from 'lit';

export class FocusLayer extends PlotLayer {

  protected _createId() {
    return super._createId('focus');
  }

  content() {
    const leaf = this._parent.dataLayer.focusLeaf;
    const ring = this._parent.parent.chartInfo.shouldDrawFocusRing
      && (this._paraState.settings.ui.isLowVisionModeEnabled
        || this._paraState.settings.ui.isFocusRingEnabled)
      ? new FocusRing(this._paraState, this.paraview, leaf)
      : null;
    return svg`
      ${ring?.render()}
    `;
  }
}