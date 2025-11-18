
import { PlotLayer} from '.';
import { type ParaView } from '../../paraview';
import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';
import { DataSymbol } from '../symbol';
import { type DatapointView } from '../data';
import { PathShape, RectShape } from '../shape';

export type HighlightsType = 'foreground' | 'background';


export class HighlightsLayer extends PlotLayer {

  constructor(paraview: ParaView, width: number, height: number, public readonly type: HighlightsType) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId(`${this.type}-highlights`);
  }

  content() {
    const selector = this.paraview.store.highlightedSelector;
    let underlayRect: RectShape | null = null;
    let overlaySyms: DataSymbol[] = [];
    let overlayLine: PathShape | null = null;
    let datapointViews: DatapointView[] = [];
    if (selector) {
      const datapoints = this.paraview.documentView!.chartInfo.datapointsForSelector(selector);
      datapointViews = datapoints.map(datapoint =>
        this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!);
      if (selector.startsWith('datapoint')) {
        overlaySyms.push(datapointViews[0].symbol!.clone());
        if (this.paraview.store.settings.chart.isShowPopups && this.type == "foreground") {
          datapointViews[0].addPopup()
        }
      } else if (selector.startsWith('sequence')) {
        overlaySyms.push(datapointViews[0].symbol!.clone());
        overlaySyms.push(datapointViews.at(-1)!.symbol!.clone());
        overlayLine = new PathShape(this.paraview, {
          x: 0,
          y: 0,
          points: [overlaySyms[0].loc, overlaySyms[1].loc],
          stroke: this.paraview.store.colors.colorValueAt(overlaySyms[0].color!),
          opacity: 0.5,
          strokeWidth: 20
        });
        if (this.type === 'background') {
          underlayRect = new RectShape(this.paraview, {
            x: overlaySyms[0].x,
            y: 0,
            width: overlaySyms[1].x - overlaySyms[0].x,
            height: this._height,
            fill: this.paraview.store.colors.colorValueAt(overlaySyms[0].color!),
            opacity: 0.25
          });
        }
        if (this.paraview.store.settings.chart.isShowPopups && this.type == "foreground") {
          this.paraview.store.popups.push(...this.parent.popupLayer.addSequencePopups(datapointViews))
        }
      }
      overlaySyms.forEach(sym => {
        sym.scale *= 3;
        sym.opacity = 0.5;
        sym.fill = 'empty';
      });
      this.paraview.documentView?.chartLayers.popupLayer.addPopups();
    }
    return svg`
      ${this.paraview.store.visitedDatapoints.values().map(datapointId => {
      const { seriesKey, index } = datapointIdToCursor(datapointId);
      return svg`
            <use
              id="visited-mark-${seriesKey}-${index}"
              class="visited-mark"
              href="#${this._parent.dataLayer.datapointDomIds.get(datapointId)}"
            />
          `;
    })
      }
      ${this.type === 'background' && underlayRect ? underlayRect.render() : ''
      }
      ${
      /*overlaySym
        ?
            svg`
              <use
                id="highlighted-mark-${datapointViews[0].seriesKey}-${datapointViews[0].index}"
                class="highlighted-mark"
                href="#${datapointViews[0].id}-sym"
              />
            `

        : ''*/
      this.type === 'foreground' && overlayLine ? overlayLine.render() : ''
      }
      ${this.type === 'foreground' && overlaySyms.length ? overlaySyms.map(sym => sym.render()) : ''
      }
    `;
  }
}