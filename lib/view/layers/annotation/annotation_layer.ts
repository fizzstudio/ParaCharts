
import { PlotLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { RectShape } from '../../shape/rect';
import { PathShape } from '../../shape/path';
import { Vec2 } from '../../../common/vector';
import { PointAnnotation } from '../../../store';
import { Popup } from '../../popup';
import { datapointIdToCursor } from '../../../store';
import { formatBox } from '@fizz/parasummary';
import { NavNode, SequenceNavNodeOptions, SeriesNavNodeOptions } from '../data';

export type AnnotationType = 'foreground' | 'background';
export const trendTranslation = {
  /** A single rising sequence */
  "Rise": "Rising",
  /** A single falling sequence */
  "Fall": "Falling",
  /** A single stable sequence */
  "Stable": "Stable",
  /** A single sequence that shows a large, rapid increase in value */
  "BigJump": "Big Jump",
  /** A single sequence that shows a large, rapid decrease in value */
  "BigFall": "Big Fall",
  /** A falling sequence followed by a rising sequence */
  "ReversalToRise": "Reversal to Rising",
  /** A rising sequence followed by a falling sequence */
  "ReversalToFall": "Reversal to Falling",
  /** A stable sequence followed by a rising sequence */
  "EmergingRise": "Emerging Rising",
  /** A stable sequence followed by a falling sequence */
  "EmergingFall": "Emerging Falling",
  /** A rising sequence followed by a stable sequence */
  "RiseToStable": "Rising to Stable",
  /** A falling sequence followed by a stable sequence */
  "FallToStable": "Falling to Stable",
  /** A rising sequence followed by a falling sequence and another rising sequence */
  "Rebound": "Rebounding",
  /** A falling sequence followed by a rising sequence and another falling sequence */
  "TemporaryJump": "Temporary Jump",
  /** A falling sequence followed by a short rising sequence at the end of the chart */
  "PossibleReversalToRise": "Possible Reversal to Rising",
  /** A rising sequence followed by a short falling sequence at the end of the chart */
  "PossibleReversalToFall": "Possible Reversal to Falling",
  /** A stable sequence followed by a short rising sequence at the end of the chart */
  "PossibleEmergingRise": "Possible Emerging Rising",
  /** A stable sequence followed by a short falling sequence at the end of the chart */
  "PossibleEmergingFall": "Possible Emerging Falling",
  /** A rising sequence followed by a short stable sequence at the end of the chart */
  "PossibleRiseToStable": "Possible Rising to Stable",
  /** A falling sequence followed by a short stable sequence at the end of the chart */
  "PossibleFallToStable": "Possible Falling to Stable",
  /** A rising sequence followed by a falling sequence and another short rising sequence at the end of the chart */
  "PossibleRebound": "Possible Rebounding",
  /** A falling sequence followed by a rising sequence and another short falling sequence at the end of the chart */
  "PossibleTemporaryJump": "Possible Temporary Jump"
}


export class AnnotationLayer extends PlotLayer {
  protected _groups = new Map<string, DecorationGroup>();

  constructor(paraview: ParaView, width: number, height: number, public readonly type: AnnotationType) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId(`${this.type}-annotation`);
  }

  group(name: string) {
    return this._groups.get(name);
  }

  addGroup(name: string, okIfExist = false) {
    if (this._groups.has(name)) {
      if (okIfExist) {
        return;
      }
      throw new Error(`group '${name}' already exists`);
    }
    this._groups.set(name, new DecorationGroup(this.paraview, name));
    this.append(this._groups.get(name)!);
  }

  removeGroup(name: string, okIfNotExist = false) {
    if (this._groups.has(name)) {
      this._groups.delete(name);
    } else if (okIfNotExist) {
      return;
    }
    else {
      throw new Error(`group '${name}' does not exist`);
    }
  }

  addPopups() {
    this.addGroup('datapoint-popups', true);
    this.group('datapoint-popups')!.clearChildren();
    this.paraview.store.userLineBreaks.splice(0, this.paraview.store.userLineBreaks.length)
    if (this.paraview.store.settings.chart.showPopups && this.paraview.store.settings.popup.activation === "onFocus") {
      this.paraview.store.popups.splice(0, this.paraview.store.popups.length)
      const cursor = this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.navMap!.cursor
      let popups: Popup[] = []
      if (cursor.type === 'chord') {
        popups.push(...this.addChordPopups(cursor));
      }
      else if (cursor.type === 'sequence') {
        popups.push(...this.addSequencePopups(cursor));
      }
      else if (cursor.type === 'series') {
        popups.push(...this.addSeriesPopups(cursor));
      }
      else {
        for (let dp of this.paraview.store.visitedDatapoints) {
          const { seriesKey, index } = datapointIdToCursor(dp);
          const datapointView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
          datapointView.addPopup()
        }
      }

      for (let popup of popups) {
        this.paraview.store.popups.push(popup)
      }
    }
    else if (this.paraview.store.settings.chart.showPopups && this.paraview.store.settings.popup.activation === "onSelect") {
      this.paraview.store.popups.splice(0, this.paraview.store.popups.length)
      for (let dp of this.paraview.store.selectedDatapoints) {
        const { seriesKey, index } = datapointIdToCursor(dp);
        const datapointView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
        datapointView.addPopup()
      }
    }

    for (const popup of this.paraview.store.popups) {
      popup.classInfo = { 'popup': true }
      if (this.type === 'foreground') {
        this.group('datapoint-popups')!.append(popup);
      }
      else {
        if (this._groups.has('datapoint-popups')) {
          this.removeGroup('datapoint-popups', true);
        }
      }
    }
  }

  addChordPopups(cursor: NavNode): Popup[] {
    let text = ''
    for (let dp of cursor.datapoints) {
      text = text.concat(`${dp.seriesKey}: ${this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.summarizer.getDatapointSummary(dp, 'statusBar')}\n`)
    }
    const dp = cursor.datapoints[0]
    const dpView = this.paraview.documentView!.chartLayers!.dataLayer.datapointView(dp.seriesKey, dp.datapointIndex)!
    const items = this.paraview.documentView?.chartLayers.dataLayer.chartInfo.popuplegend()!;
    if (this.type === "background"){
      
      this.paraview.store.addLineBreak(this.paraview.documentView?.chartLayers.dataLayer.chartInfo.navMap!.cursor.index! / (this.paraview.store.model!.series[0].datapoints.length - 1),
      cursor.index!, cursor.datapoints[0].seriesKey, false)
    }
    
    const popup = new Popup(this.paraview,
      {
        text: text,
        x: dpView!.x,
        y: dpView!.y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: this.id,
        color: dpView!.color,
        //margin: 60,
        type: "chord",
        items: items
      },
      {
        fill: "hsl(0, 0%, 100%)"
        ,
        stroke: "hsl(0, 0%, 0%)"
      })
    popup.classInfo = { 'popup': true }
    return [popup]
  }

  addSequencePopups(cursor: NavNode): Popup[] {
    const firstDP = cursor.datapoints[0]
    const firstDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(firstDP.seriesKey, firstDP.datapointIndex)!
    const lastDP = cursor.datapoints[cursor.datapoints.length - 1]
    const lastDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(lastDP.seriesKey, lastDP.datapointIndex)!
    let x = (lastDPView.x + firstDPView.x) / 2;
    let y = 0;
    if (cursor.datapoints.length % 2 == 0) {
      const leftDP = cursor.datapoints[(cursor.datapoints.length / 2) - 1]
      const leftDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(leftDP.seriesKey, leftDP.datapointIndex)!
      const rightDP = cursor.datapoints[(cursor.datapoints.length / 2)]
      const rightDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(rightDP.seriesKey, rightDP.datapointIndex)!
      y = (leftDPView.y + rightDPView.y) / 2;
    }
    else {
      const leftDP = cursor.datapoints[(cursor.datapoints.length - 1) / 2]
      const leftDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(leftDP.seriesKey, leftDP.datapointIndex)!
      y = leftDPView.y;
    }
    const seriesAnalysis = this.paraview.store.seriesAnalyses[firstDPView.seriesKey]!
    const index = seriesAnalysis.sequences.findIndex(s => s.start === (cursor.options as SequenceNavNodeOptions).start && s.end === (cursor.options as SequenceNavNodeOptions).end)
    const labels = this.paraview.store.model!.series[0].datapoints.map(
      (p) => formatBox(p.facetBox('x')!, this.paraview.store.getFormatType('horizTick'))
    );
    const points = this.paraview.store.model!.series.find(s => s.key === (cursor.options as SequenceNavNodeOptions).seriesKey)!.datapoints
    let text = ''
    if (seriesAnalysis.sequences[index].message == null) {
      text = text.concat(`No trend detected`)
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
        id: this.id,
        color: firstDPView.color,
        margin: 60
      },
      {
      })
    popup.classInfo = { 'popup': true }
    return [popup]
  }

  addSeriesPopups(cursor: NavNode): Popup[] {
    const firstDP = cursor.datapoints[0]
    const firstDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(firstDP.seriesKey, firstDP.datapointIndex)!
    const lastDP = cursor.datapoints[cursor.datapoints.length - 1]
    const lastDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(lastDP.seriesKey, lastDP.datapointIndex)!
    let x = (lastDPView.x + firstDPView.x) / 2;
    let y = 0;
    if (cursor.datapoints.length % 2 == 0) {
      const leftDP = cursor.datapoints[(cursor.datapoints.length / 2) - 1]
      const leftDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(leftDP.seriesKey, leftDP.datapointIndex)!
      const rightDP = cursor.datapoints[(cursor.datapoints.length / 2)]
      const rightDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(rightDP.seriesKey, rightDP.datapointIndex)!
      y = (leftDPView.y + rightDPView.y) / 2;
    }
    else {
      const leftDP = cursor.datapoints[(cursor.datapoints.length - 1) / 2]
      const leftDPView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(leftDP.seriesKey, leftDP.datapointIndex)!
      y = leftDPView.y;
    }
    const seriesAnalysis = this.paraview.store.seriesAnalyses[firstDPView.seriesKey]!
    const labels = this.paraview.store.model!.series[0].datapoints.map(
      (p) => formatBox(p.facetBox('x')!, this.paraview.store.getFormatType('horizTick'))
    );
    const points = this.paraview.store.model!.series.find(s => s.key === (cursor.options as SeriesNavNodeOptions).seriesKey)!.datapoints
    let text = ''

    text = text.concat(`${(cursor.options as SeriesNavNodeOptions).seriesKey}`)
    if (seriesAnalysis?.message == null) {
      text = text.concat(`\nNo trend detected`)
    }
    else {
      text = text.concat(`\n${trendTranslation[seriesAnalysis?.message!]} trend`)
    }
    let changeVal = parseFloat((points[points.length - 1].facetValueAsNumber("y")!
      - points[0].facetValueAsNumber("y")!).toFixed(4))
    text = text.concat(`\n${changeVal > 0 ? '+' : ''}${changeVal}`)
    text = text.concat(`\n${labels[0]}-${labels[points.length - 1]}`)
    text = text.concat(`\n${points.length} records`)

    const popup = new Popup(this.paraview,
      {
        text: text,
        x: x,
        y: y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: this.id,
        color: firstDPView.color,
        margin: 60
      },
      {})
    popup.classInfo = { 'popup': true }
    return [popup]
  }

  renderChildren() {
    if (this.paraview.store.popups) {
      this.addPopups();
    }
    if (this.type === 'foreground') {
      if (this.paraview.store.modelTrendLines) {
        this.addGroup('trend-lines', true);
        this.group('trend-lines')!.clearChildren();
        for (const tl of this.paraview.store.modelTrendLines) {
          const series = this.paraview.store.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const range = this.parent.docView.chartInfo.getYAxisInterval();
          const minValue = range.start ?? Number(this.paraview.store.settings.axis.y.minValue)
          const maxValue = range.end ?? Number(this.paraview.store.settings.axis.y.maxValue)
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this.paraview.store.colors.colorValue('visit');
          const trendLine = new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [new Vec2(startPx, startHeight), new Vec2(endPx, endHeight),],
            fill: colorValue,
            stroke: colorValue
          });
          trendLine.classInfo = { 'trend-line': true }
          this.group('trend-lines')!.append(trendLine);
        }
      }
      else {
        if (this._groups.has('trend-lines')) {
          this.removeGroup('trend-lines', true);
        }
      }

      if (this.paraview.store.userTrendLines) {
        this.addGroup('user-trend-lines', true);
        this.group('user-trend-lines')!.clearChildren();
        let tls = structuredClone(this.paraview.store.userTrendLines);
        if (this.paraview.store.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this.paraview.store.visitedDatapoints.values().toArray()[0]);
          tls = tls.filter(a => a.seriesKey == cursor.seriesKey)
        }
        for (const tl of tls) {
          const series = this.paraview.store.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const range = this.parent.docView.chartInfo.getYAxisInterval();
          const minValue = range.start ?? Number(this.paraview.store.settings.axis.y.minValue)
          const maxValue = range.end ?? Number(this.paraview.store.settings.axis.y.maxValue)
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this.paraview.store.colors.colorValue('highlight');
          const trendLine = new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [new Vec2(startPx, startHeight), new Vec2(endPx, endHeight),],
            fill: colorValue,
            stroke: colorValue
          });
          trendLine.classInfo = { 'user-trend-line': true }
          this.group('user-trend-lines')!.append(trendLine);
        }
      }
      else {
        if (this._groups.has('user-trend-lines')) {
          this.removeGroup('user-trend-lines', true);
        }
      }

      if (this.paraview.store.annotations) {
        this.addGroup('annotation-popups', true);
        this.group('annotation-popups')!.clearChildren();
        let annots = structuredClone(this.paraview.store.annotations.filter(a => a.type == 'datapoint' && a.isSelected == true) as unknown as PointAnnotation[]);
        for (const annot of annots) {
          const seriesKey = this.paraview.store.model!.series.filter(s => s[0].seriesKey == annot.seriesKey)[0].key
          const datapoint = this.paraview.documentView?.chartLayers.dataLayer.datapointViews.filter(d => d.seriesKey == seriesKey && d.index == annot.index)[0]
          if (!datapoint) {
            break
          }
          let popup = new Popup(this.paraview,
            {
              text: annot.text,
              x: datapoint.x,
              y: datapoint.y,
              textAnchor: "middle",
              classList: ['annotationlabel'],
              id: this.id,
              color: datapoint.color
            },
            {
              fill: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                  this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(datapoint.color), 6)
                  : this.paraview.store.colors.colorValueAt(datapoint.color),
              stroke: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                  this.paraview.store.colors.colorValueAt(datapoint.color)
                  : "black",
            })
          popup.classInfo = { 'popup': true }
          this.group('annotation-popups')!.append(popup);
        }

      }
      else {
        if (this._groups.has('annotation-popups')) {
          this.removeGroup('annotation-popups', true);
        }
      }


    }
    if (this.type === 'background') {
      if (this.paraview.store.rangeHighlights) {
        this.addGroup('range-highlights', true);
        this.group('range-highlights')!.clearChildren();
        for (const rhl of this.paraview.store.rangeHighlights) {
          const startPx = this.width * rhl.startPortion;
          const endPx = this.width * rhl.endPortion;
          const rect = new RectShape(this.paraview, {
            x: startPx,
            y: 0,
            width: endPx - startPx,
            height: this.height
          });
          rect.classInfo = { 'range-highlight': true };
          this.group('range-highlights')!.append(rect);
        }
      }
      else {
        if (this._groups.has('range-highlights')) {
          this.removeGroup('range-highlights', true);
        }
      }

      if (this.paraview.store.modelLineBreaks) {
        this.addGroup('linebreaker-markers', true);
        this.group('linebreaker-markers')!.clearChildren();
        for (const lb of this.paraview.store.modelLineBreaks) {
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this.paraview, {
            x: startPx - 1.5,
            y: 0,
            width: 3,
            height: this.height
          })
          linebreak.classInfo = { 'linebreaker-marker': true }
          this.group('linebreaker-markers')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('linebreaker-markers')) {
          this.removeGroup('linebreaker-markers', true);
        }
      }
      if (this.paraview.store.userLineBreaks) {
        this.addGroup('user-linebreaker-markers', true);
        this.group('user-linebreaker-markers')!.clearChildren();
        let lbs = structuredClone(this.paraview.store.userLineBreaks);
        if (this.paraview.store.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this.paraview.store.visitedDatapoints.values().toArray()[0]);
          lbs = lbs.filter(a => a.seriesKey == cursor.seriesKey);
        }
        for (const lb of lbs) {
          const index = this.paraview.store.model!.series.findIndex(a => a.key == lb.seriesKey);
          const color = this.paraview.store.colors.colorValueAt(index)
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this.paraview, {
            x: startPx - 1.5,
            y: 0,
            width: 3,
            height: this.height,
            fill: color
          })
          linebreak.classInfo = { 'user-linebreaker-marker': true }
          this.group('user-linebreaker-markers')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('user-linebreaks')) {
          this.removeGroup('userlinebreaks', true);
        }
      }

    }
    return super.renderChildren();
  }

}

class DecorationGroup extends Container(View) {

  constructor(paraview: ParaView, protected _name: string) {
    super(paraview);
  }

  get name() {
    return this._name;
  }

}