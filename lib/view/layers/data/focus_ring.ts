import { type ParaView } from '../../../paraview';
import { View, Container } from '../../base_view';
import { Rect } from '../../shape/rect';

import { type TemplateResult, svg } from 'lit';

const strokeWidthOuter = 4;
const strokeWidthInner = 2;

export class FocusRing extends Container(View) {

  constructor(paraview: ParaView, focusView: View) {
    super(paraview);
    const gap = paraview.store.settings.ui.focusRingGap;
    const x = focusView.outerBbox.left - strokeWidthOuter/2 - gap;
    const y = focusView.outerBbox.top - strokeWidthOuter/2 - gap;
    const width = focusView.outerBbox.width + strokeWidthOuter + gap*2;
    const height = focusView.outerBbox.height + strokeWidthOuter + gap*2;
    this.append(new Rect(paraview, {
      x,
      y,
      width,
      height,
      stroke: 'white',
      strokeWidth: strokeWidthOuter,
      fill: 'none'
    }));
    this.append(new Rect(paraview, {
      x,
      y,
      width,
      height,
      stroke: 'black',
      strokeWidth: strokeWidthInner,
      fill: 'none'
    }));
  }

}