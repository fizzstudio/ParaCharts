
import { PlotLayer } from '.';

import { svg } from 'lit';

export class SelectionLayer extends PlotLayer {

  protected _createId() {
    return super._createId('selection');
  }

  get class() {
    return 'selected-datapoint-marker';
  }

  content() {
    const dataLayer = this._parent.dataLayer;
    return svg`
      ${
        this.paraview.store.selectedDatapoints.values().map(datapointId => {
          // NB: Line datapoint height = 0
          return dataLayer.datapointViewForId(dataLayer.datapointDomIds.get(datapointId)!)!.selectedMarker.render();
          //return cursor.datapointView.selectedMarker.render();
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