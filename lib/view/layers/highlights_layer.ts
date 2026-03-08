
import { PlanePlotView, PlotLayer } from '.';
import { type ParaView } from '../../paraview';
import { svg } from 'lit';
import { datapointIdToCursor, HighlightAxisOptions } from '../../state';
import { DataSymbol } from '../symbol';
import { type DatapointView } from '../data';
import { PathShape, RectShape, Shape } from '../shape';
import { type View } from '../base_view';
import { PlaneChartInfo } from '../../chart_types';
import { PlaneModel } from '@fizz/paramodel';
import { Label } from '../label';

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
    const chartInfo = this.paraview.paraState.chartInfo as PlaneChartInfo;
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

  protected _processIntersection(index: number, overlays: (DataSymbol | Shape)[]) {
    const chartInfo = this.paraview.paraState.chartInfo as PlaneChartInfo;
    const yRange = chartInfo.yInterval!.end - chartInfo.yInterval!.start;
    const pxPerYUnit = this.parent.logicalHeight / yRange;

    const model = this.paraview.paraState.model as PlaneModel;
    const isect = model.intersections[index];

    const sym = DataSymbol.fromType(this.paraview, 'circle.empty', { color: -1 });
    const first = model.series[0].datapoints[0].facetValueAsNumber('x')!;
    const last = model.series[0].datapoints.at(-1)!.facetValueAsNumber('x')!;
    const xRange = last - first;
    const pxPerXUnit = this.parent.logicalWidth / xRange;
    const x = (isect.independentValue - first) * pxPerXUnit;
    const y = this.parent.logicalHeight - (isect.dependentValue - chartInfo.yInterval!.start) * pxPerYUnit;
    sym.x = x;
    sym.y = y
    overlays.push(sym);
    const planeChart = this.paraview.documentView?.chartLayers.dataLayer as PlanePlotView;
    planeChart.makeCrosshairsAtPixelsCoords(x, y, `intersection-${index}`);
    // if (this.type === 'foreground' && !this.paraview.paraState.popups.some(p => p.id == datapointView.id)) {
    //   datapointView.addDatapointPopup();
    // }
    overlays.at(-1)!.scale = 3;
    overlays.at(-1)!.opacity = 0.5;
    overlays.at(-1)!.fill = 'empty';
  }

  protected _processAxisLabel(options: HighlightAxisOptions, overlays: (DataSymbol | Shape)[]) {

    if (options.orientation == 'horiz') {
      let labelText = this.paraview.documentView?.xAxis?.tickLabelTierValues[options.tierIndex].labels[options.labelIndex]
      if (!labelText) {
        return;
      }
      const tier = this.paraview.documentView?.xAxis?.tickLabelTiers[options.tierIndex]!
      const xValues = this.paraview.paraState.model!.allFacetValues("x")!.map(box => box.raw);
      tier.addPopup(labelText[0] == "Q" ? xValues[options.labelIndex] : labelText, options.labelIndex)
      const labelsLength = tier.options.content.labels.length
      const regFactor = (labelsLength % tier.children.length == 0)
        ? tier.children.length / labelsLength
        : (tier.children.length) / (labelsLength + 1)
      let width = tier.children[options.labelIndex].width * 1.5
      let height = tier.children[options.labelIndex].height * 1.5
      let strokeWidth = 5
      const shape = new RectShape(this.paraview, {
        width: width,
        height: height,
        x: tier._tickLabelX(options.labelIndex ?? 0)! * regFactor - width / 2,
        y: this.paraview.documentView?.chartLayers.height! + tier.y,
        fill: 'blue',
        stroke: 'blue',
        strokeWidth: strokeWidth,
        opacity: .3
      })
      overlays.push(shape)

    }
    else if (options.orientation == 'vert') {
      const tier = this.paraview.documentView?.yAxis?.tickLabelTiers[options.tierIndex]!
      const yValues = tier.children.map((c) => (c as Label).text)
      tier.addPopup(yValues[options.labelIndex], options.labelIndex)
      let width = tier.children[options.labelIndex].width * 2
      let height = tier.children[options.labelIndex].height * 1.5
      const shape = new RectShape(this.paraview, {
        width: width,
        height: height,
        x: 0 - width,
        y: tier._tickLabelY(options.labelIndex ?? 0)! - 2 * height / 3/* + this.paraview.paraState.settings.popup.margin - tier.children[options.index ?? 0].height*/,
        fill: 'blue',
        stroke: 'blue',
        opacity: .3
      })
      overlays.push(shape)
    }
  }

  protected _processCrosshair(x: string, y: string) {
    const chartInfo = this.paraview.documentView?.chartLayers.dataLayer.chartInfo;
    if (chartInfo instanceof PlaneChartInfo) {
      let height;
      let width;
      if (chartInfo.yInterval) {
        let int = chartInfo.yInterval
        if (!isNaN(Number(y))) {
          height = (1 - ((Number(y) - int.start) / (int.end - int.start))) * this.paraview.documentView!.chartLayers.dataLayer.height
        }
      }
      else if (this.paraview.documentView?.yAxis?.tickLabelTierValues.map(t => t.labels).flat().includes(y)) {

      }
      const xValues = this.paraview.paraState.model!.allFacetValues("x")!.map(box => box.raw);
      if (chartInfo.xInterval) {
        const int = chartInfo.xInterval
        if (!isNaN(Number(x))) {
          width = ((Number(x) - int.start) / (int.end - int.start)) * this.paraview.documentView!.chartLayers.dataLayer.width
        }
      }
      else if (xValues.includes(x)) {
        const index = xValues.indexOf(x)
        const tier = this.paraview.documentView?.xAxis?.tickLabelTiers[0]!
        /*const regFactor = (tier._options.content.labels.length % tier.children.length == 0)
          ? tier.children.length / tier._options.content.labels.length
          : (tier.children.length) / (tier._options.content.labels.length + 1)*/
        width = tier._tickLabelX(index)
      }
      const planeChart = this.paraview.documentView?.chartLayers.dataLayer as PlanePlotView;
      if (width !== undefined && height !== undefined) {
        planeChart.makeCrosshairsAtPixelsCoords(width, height, `dataspace-${x}-${y}`);
      }
      else {
        this.log.error('Invalid coordinates given for crosshair');
      }
    }
  }

  content() {
    const underlayRects: RectShape[] = [];
    const overlays: (DataSymbol | Shape)[] = [];
    const overlayLines: PathShape[] = [];
    this.paraview.paraState.prevHighlightedElements.forEach(id => {
      this.paraview.paraState.removePopup(id);
      this.paraview.paraState.removeCrosshair(id);
    });
    this.paraview.paraState._prevHighlightedElements = new Set()
    this.paraview.paraState.highlightedDatapoints.forEach(datapointId => {
      this._processDatapoint(datapointId, overlays);
      this.paraview.paraState.prevHighlightedElements.add(datapointId);
    });
    this.paraview.paraState.highlightedSequences.forEach(sequenceId => {
      this._processSequence(sequenceId, overlays, overlayLines, underlayRects);
      this.paraview.paraState.prevHighlightedElements.add(sequenceId);
    });
    this.paraview.paraState.highlightedIntersections.forEach(index => {
      this._processIntersection(index, overlays);
      this.paraview.paraState.prevHighlightedElements.add(`intersection-${index}`);
    });
    this.paraview.paraState.highlightedAxisLabels.forEach(options => {
      this._processAxisLabel(options, overlays);
      this.paraview.paraState.prevHighlightedElements.add(`axis-label-${options.orientation}-${options.labelIndex}`);
    });
    this.paraview.paraState.dataSpaceCrosshairs.forEach(point => {
      this._processCrosshair(point.x, point.y)
      this.paraview.paraState.prevHighlightedElements.add(`dataspace-${point.x}-${point.y}`);
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
      ${this.type === 'background' && underlayRects.length
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
      ${this.type === 'foreground' && overlays.length
        ? overlays.map(sym => sym.render())
        : ''
      }
    `;
  }
}