
import { PlotLayer} from '.';
import { type ParaView } from '../../paraview';
import { svg } from 'lit';
import { datapointIdToCursor } from '../../state';
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
    const datapoint = this.paraview.paraState.getDatapoint(datapointId);
    let datapointView = this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!;
    overlays.push((datapointView.symbol ?? datapointView.shapes[0]).clone());
    if (this.type === 'foreground' && !this.paraview.paraState.popups.some(p => p.id == datapointView.id)) {
      datapointView.addDatapointPopup();
    }
    //overlays.forEach(sym => {
    overlays.at(-1)!.scale = 3;
    overlays.at(-1)!.opacity = 0.5;
    overlays.at(-1)!.fill = 'empty';
    //});
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
      this.paraview.paraState.getDatapoint(`${fields[0]}-${fields[1]}`),
      this.paraview.paraState.getDatapoint(`${fields[0]}-${parseInt(fields[2]) - 1}`),
    ];
    let datapointViews: DatapointView[] = datapoints.map(datapoint =>
      this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!);
    overlays.push((datapointViews[0].symbol ?? datapointViews[0].shapes[0]).clone());
    overlays.push((datapointViews.at(-1)!.symbol ?? datapointViews.at(-1)!.shapes[0]).clone());

    const lineStroke = overlays.at(-2)! instanceof DataSymbol
      ? this.paraview.paraState.colors.colorValueAt((overlays.at(-2) as DataSymbol).color!)
      : (overlays.at(-2) as Shape).stroke;
    overlayLines.push(new PathShape(this.paraview, {
      x: 0,//overlays.at(-2)!.width/2,
      y: 0,
      points: [overlays.at(-2)!.loc, overlays.at(-1)!.loc],
      stroke: lineStroke,
      opacity: 0.5,
      strokeWidth: 20
    }));
    if (this.type === 'background') {
      const rectFill = overlays.at(-2)! instanceof DataSymbol
        ? this.paraview.paraState.colors.colorValueAt((overlays.at(-2) as DataSymbol).color!)
        : (overlays.at(-2) as Shape).fill;
      const rect = new RectShape(this.paraview, {
        x: overlays.at(-2)!.x,
        y: 0,
        width: overlays.at(-1)!.x - overlays.at(-2)!.x + (chartInfo.isIntertick ? overlays.at(-2)!.width : 0),
        height: this._height,
        fill: rectFill,
        opacity: 0.25
      })
      underlayRects.push(rect);
      rect.classInfo = { 'underlay-rect': true };
    }
    if (this.type === 'foreground' && !this.paraview.paraState.popups.some(p => p.id == sequenceId)) {
      this.paraview.paraState.popups.push(...this.parent.popupLayer.addSequencePopups(datapointViews))
    }

    overlays.slice(-2).forEach(sym => {
      sym.scale = 3;
      sym.opacity = 0.5;
      sym.fill = 'empty';
    });
  }

  content() {
    const underlayRects: RectShape[] = [];
    const overlays: (DataSymbol | Shape)[] = [];
    const overlayLines: PathShape[] = [];
    this.paraview.paraState.highlightedDatapoints.forEach(datapointId => {
      this._processDatapoint(datapointId, overlays);
    });
    this.paraview.paraState.highlightedSequences.forEach(sequenceId => {
      this._processSequence(sequenceId, overlays, overlayLines, underlayRects);
    });
    return svg`
      ${this.paraview.paraState.visitedDatapoints.values().map(datapointId => {
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