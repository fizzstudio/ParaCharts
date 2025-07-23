import { type ParaView } from '../../../paraview';
import { View, Container } from '../../base_view';
import { RectShape } from '../../shape/rect';
import { type Shape } from '../../shape/shape';

import { type TemplateResult, svg } from 'lit';

const strokeWidthOuter = 4;
const strokeWidthInner = 2;

export class FocusRing extends Container(View) {

  constructor(paraview: ParaView, focusView: View) {
    super(paraview);
    const gap = paraview.store.settings.ui.focusRingGap;

    let shape = focusView.focusRingShape();
    if (shape) {
      shape.stroke = 'white';
      shape.strokeWidth = strokeWidthOuter;
      shape.fill = 'none';
      this.append(shape);
      const inner = shape.clone();
      inner.stroke = 'black';
      inner.strokeWidth = strokeWidthInner;
      inner.fill = 'none';
      this.append(inner);
    } else {
      const bbox = focusView.focusRingBbox() ?? focusView.outerBbox;
      const x = bbox.left - strokeWidthOuter/2 - gap;
      const y = bbox.top - strokeWidthOuter/2 - gap;
      const width = bbox.width + strokeWidthOuter + gap*2;
      const height = bbox.height + strokeWidthOuter + gap*2;
      this.append(new RectShape(paraview, {
        x,
        y,
        width,
        height,
        stroke: 'white',
        strokeWidth: strokeWidthOuter,
        fill: 'none'
      }));
      this.append(new RectShape(paraview, {
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

}