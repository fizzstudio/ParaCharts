
import { ChartLayer } from './chartlayer';

export class SelectionLayer extends ChartLayer {

  protected _createId() {
    return super._createId('selection');
  }

  get class() {
    return 'selected-datapoint-marker';
  }

  render() {
    return super.render();
  }

}