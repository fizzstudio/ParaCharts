
import { ChartLayer } from './chartlayer';
import { Rect } from './shape/rect';

import { svg } from 'lit';

export class SelectionLayer extends ChartLayer {

  protected _createId() {
    return super._createId('selection');
  }

  get class() {
    return 'selected-datapoint-marker';
  }

  content() {
    return svg`
      ${
        this.paraview.store.selectedDatapoints.map(cursor => {
          const dpView = this._parent.dataLayer.datapointView(cursor.seriesKey, cursor.index)!;
          // NB: Line datapoint height = 0
          return dpView.selectedMarker.render();
        })
      }
    `;
  }
}

/**
 * Visual indication of selected state for datapoints.
 */
// export class SelectedDatapointMarker extends View {

//   constructor(private datapointView: DatapointView, x: number, y: number) {
//     super(datapointView.paraview);
//     this._x = x;
//     this._y = y;
//   }

//   protected _createId(..._args: any[]): string {
//     return `select-${this.datapointView.id}`;
//   }

//   get width() {
//     return this.datapointView.width;
//   }

//   get height() {
//     return Math.max(this.datapointView.height, 20);
//   }

//   render() {
//     return svg`
//       <rect
//         x=${this._x}
//         y=${this._y}
//         width=${this.width}
//         height=${this.height}
//       />
//     `;
//   }

// }