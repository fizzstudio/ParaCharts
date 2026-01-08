
import { PlotLayer} from '.';
import { type ParaView } from '../../paraview';
import { svg } from 'lit';
import { datapointIdToCursor } from '../../store';
import { DataSymbol } from '../symbol';
import { type DatapointView } from '../data';
import { PathShape, RectShape, Shape } from '../shape';
import { type View } from '../base_view';
import { PlaneChartInfo } from '../../chart_types';

export type HighlightsType = 'foreground' | 'background';


export class HighlightsLayer extends PlotLayer {

  constructor(paraview: ParaView, width: number, height: number, public readonly type: HighlightsType) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId(`${this.type}-highlights`);
  }

  protected _processDatapoint(
    datapointId: string,
    overlays: (DataSymbol | Shape)[],
  ) {
    const datapoint = this.paraview.store.getDatapoint(datapointId);
    let datapointView = this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!;
    overlays.push((datapointView.symbol ?? datapointView.shapes[0]).clone());
    if (this.type === 'foreground') {
      datapointView.addDatapointPopup();
    }
    overlays.forEach(sym => {
      sym.scale = 3;
      sym.opacity = 0.5;
      sym.fill = 'empty';
    });
    this.paraview.documentView?.chartLayers.popupLayer.addPopups();
  }

  protected _processSequence(
    sequenceId: string,
    overlays: (DataSymbol | Shape)[],
    overlayLines: PathShape[],
    underlayRects: RectShape[]
  ) {
    // XXX Ultimately, we need to support pastry and other non-plane chart types here
    const chartInfo = this.paraview.documentView!.chartInfo as PlaneChartInfo;
    const fields = sequenceId.split(/-/);
    const datapoints = [
      this.paraview.store.getDatapoint(`${fields[0]}-${fields[1]}`),
      this.paraview.store.getDatapoint(`${fields[0]}-${parseInt(fields[2]) - 1}`),
    ];
    let datapointViews: DatapointView[] = datapoints.map(datapoint =>
      this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!);
    overlays.push((datapointViews[0].symbol ?? datapointViews[0].shapes[0]).clone());
    overlays.push((datapointViews.at(-1)!.symbol ?? datapointViews.at(-1)!.shapes[0]).clone());

    const lineStroke = overlays[0] instanceof DataSymbol
      ? this.paraview.store.colors.colorValueAt(overlays[0].color!)
      : overlays[0].stroke;
    overlayLines.push(new PathShape(this.paraview, {
      x: overlays[0].width/2,
      y: 0,
      points: [overlays[0].loc, overlays[1].loc],
      stroke: lineStroke,
      opacity: 0.5,
      strokeWidth: 20
    }));
    if (this.type === 'background') {
      const rectFill = overlays[0] instanceof DataSymbol
        ? this.paraview.store.colors.colorValueAt(overlays[0].color!)
        : overlays[0].fill;
      const rect = new RectShape(this.paraview, {
        x: overlays[0].x,
        y: 0,
        width: overlays[1].x - overlays[0].x + (chartInfo.isIntertick ? overlays[0].width : 0),
        height: this._height,
        fill: rectFill,
        opacity: 0.25
      })
      underlayRects.push(rect);
      rect.classInfo = { 'underlay-rect': true };
    }
    if (this.type == "foreground") {
      this.paraview.store.popups.push(...this.parent.popupLayer.addSequencePopups(datapointViews))
    }

    overlays.forEach(sym => {
      sym.scale = 3;
      sym.opacity = 0.5;
      sym.fill = 'empty';
    });
    this.paraview.documentView?.chartLayers.popupLayer.addPopups();
  }

  content() {
    let underlayRects: RectShape[] = [];
    let overlays: (DataSymbol | Shape)[] = [];
    let overlayLines: PathShape[] = [];
    this.paraview.store.highlightedDatapoints.forEach(datapointId => {
      this._processDatapoint(datapointId, overlays);
    });
    this.paraview.store.highlightedSequences.forEach(sequenceId => {
      this._processSequence(sequenceId, overlays, overlayLines, underlayRects);
    });
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
      })}
      ${
        this.type === 'background' && underlayRects.length
          ? underlayRects.map(rect => rect.render())
          : ''
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
        this.type === 'foreground' && overlayLines.length
          ? overlayLines.map(line => line.render())
          : ''
      }
      ${
        this.type === 'foreground' && overlays.length
          ? overlays.map(sym => sym.render())
          : ''
      }
    `;
  }
}