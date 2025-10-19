
import { PlotLayer} from '.';
import { type ParaView } from '../../paraview';
import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';
import { DataSymbol } from '../symbol';
import { type DatapointView } from '../data';
import { PathShape, RectShape } from '../shape';
import { formatBox } from '@fizz/parasummary';
import { Popup } from '../popup';
import { trendTranslation } from './popup_layer';

export type HighlightsType = 'foreground' | 'background';


export class HighlightsLayer extends PlotLayer {

  constructor(paraview: ParaView, width: number, height: number, public readonly type: HighlightsType) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId(`${this.type}-highlights`);
  }

  sequencePopup(datapointViews: DatapointView[]) {
    const firstDPView = datapointViews[0]
    const lastDPView = datapointViews[datapointViews.length - 1]
    let x = (lastDPView.x + firstDPView.x) / 2;
    let y = 0;
    if (datapointViews.length % 2 == 0) {
      const leftDPView = datapointViews[(datapointViews.length / 2) - 1]
      const rightDPView = datapointViews[(datapointViews.length / 2)]
      y = (leftDPView.y + rightDPView.y) / 2;
    }
    else {
      const leftDPView = datapointViews[(datapointViews.length - 1) / 2]
      y = leftDPView.y;
    }
    const seriesAnalysis = this.paraview.store.seriesAnalyses[firstDPView.seriesKey]!
    const index = seriesAnalysis.sequences.findIndex(s => s.start === datapointViews[0].index && s.end - 1 === datapointViews[datapointViews.length - 1].index)
    const labels = this.paraview.store.model!.series[0].datapoints.map(
      (p) => formatBox(p.facetBox('x')!, this.paraview.store.getFormatType('horizTick'))
    );
    const points = this.paraview.store.model!.series.find(s => s.key === datapointViews[0].seriesKey)!.datapoints
    let text = ''
    if (seriesAnalysis.sequences[index].message == null) {
      let sequence = seriesAnalysis.sequences[index]
      if (datapointViews[datapointViews.length - 1].y - datapointViews[0].y > 0 && Math.abs(sequence.slopeInfo.slope) > .2) {
        text = text.concat(`Falling trend`)
      }
      else if (datapointViews[datapointViews.length - 1].y - datapointViews[0].y <= 0 && Math.abs(sequence.slopeInfo.slope) > .2) {
        text = text.concat(`Rising trend`)
      }
      else {
        text = text.concat(`Stable trend`)
      }
    }
    else {
      text = text.concat(`${trendTranslation[seriesAnalysis.sequences[index].message!]} trend`)
    }
    const changeVal = parseFloat((points[seriesAnalysis.sequences[index].end - 1].facetValueAsNumber("y")!
      - points[seriesAnalysis.sequences[index].start].facetValueAsNumber("y")!).toFixed(4))
    text = text.concat(`\n${changeVal > 0 ? '+' : ''}${changeVal}`)
    text = text.concat(`\n${labels[seriesAnalysis.sequences[index].start]}-${labels[seriesAnalysis.sequences[index].end - 1]}`)
    text = text.concat(`\n${seriesAnalysis.sequences[index].end - seriesAnalysis.sequences[index].start} records`)

    const popup = new Popup(this.paraview,
      {
        text: text,
        x: x,
        y: y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: `sequence-highlight-popup-${index}`,
        color: firstDPView.color,
        margin: 60
      },
      {
      })
    popup.classInfo = { 'popup': true }
    this.paraview.store.popups.push(popup)
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
        if (this.paraview.store.settings.chart.showPopups && this.type == "foreground") {
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
        if (this.paraview.store.settings.chart.showPopups && this.type == "foreground") {
          this.sequencePopup(datapointViews)
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