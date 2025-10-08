
import { PlotLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { RectShape } from '../../shape/rect';
import { PathShape } from '../../shape/path';
import { Vec2 } from '../../../common/vector';
import { Label } from '../../label';
import { PointAnnotation } from '../../../store';
import { Popup } from '../../popup';
import { datapointIdToCursor } from '../../../store';
import { formatBox } from '@fizz/parasummary';
import { SequenceNavNodeOptions, SeriesNavNodeOptions } from '../data';

export type AnnotationType = 'foreground' | 'background';

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
    throw new Error(`group '${name}' does not exist`);
  }

  renderChildren() {
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

      if (this.paraview.store.popups) {
        this.addGroup('datapoint-popups', true);
        this.group('datapoint-popups')!.clearChildren();
        if (this.paraview.store.settings.chart.showPopups && this.paraview.store.settings.popup.activation === "onFocus") {
          this.paraview.store.popups.splice(0, this.paraview.store.popups.length)
          const cursor = this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.navMap!.cursor
          if (cursor.type === 'chord') {
            let text = ''
            for (let dp of cursor.datapoints) {
              text = text.concat(`${dp.seriesKey}: ${this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.summarizer.getDatapointSummary(dp, 'statusBar')}\n`)
            }
            const dp = cursor.datapoints[0]
            const dpView = this.paraview.documentView!.chartLayers!.dataLayer.datapointView(dp.seriesKey, dp.datapointIndex)!
            //dpView?.addPopup(text)
            const items = this.paraview.documentView?.chartLayers.dataLayer.chartInfo.popuplegend()!;
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
            this.group('datapoint-popups')!.append(popup);
          }
          else if (cursor.type === 'sequence') {
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
            const points = this.paraview.store.model!.series[this.paraview.store.model!.seriesKeys.indexOf(firstDP.seriesKey)].datapoints
            let text = ''

            text = text.concat(`Trend: ${seriesAnalysis?.sequences[index].message}`)
            text = text.concat(`\nChange: ${parseFloat((points[seriesAnalysis.sequences[index].end - 1].facetValueAsNumber("y")!
              - points[seriesAnalysis.sequences[index].start].facetValueAsNumber("y")!).toFixed(4))}`)
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
                fill: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                  : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(firstDPView.color), 6)
                    : this.paraview.store.colors.colorValueAt(firstDPView.color),
                stroke: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                  : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.colorValueAt(firstDPView.color)
                    : "black",
              })
            popup.classInfo = { 'popup': true }
            this.group('datapoint-popups')!.append(popup);
          }
          else if (cursor.type === 'series') {
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
            const points = this.paraview.store.model!.series[cursor.index].datapoints
            let text = ''

            text = text.concat(`${(cursor.options as SeriesNavNodeOptions).seriesKey}`)
            if (seriesAnalysis?.message) {
              text = text.concat(`\nTrend: ${seriesAnalysis?.message}`)
            }
            text = text.concat(`\nChange: ${parseFloat((points[points.length - 1].facetValueAsNumber("y")!
              - points[0].facetValueAsNumber("y")!).toFixed(4))}`)
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
              {
                fill: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                  : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(firstDPView.color), 6)
                    : this.paraview.store.colors.colorValueAt(firstDPView.color),
                stroke: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                  : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.colorValueAt(firstDPView.color)
                    : "black",
              })
            popup.classInfo = { 'popup': true }
            this.group('datapoint-popups')!.append(popup);
          }
          else {
            for (let dp of this.paraview.store.visitedDatapoints) {
              const { seriesKey, index } = datapointIdToCursor(dp);
              const datapointView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
              datapointView.addPopup()
            }
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
          this.group('datapoint-popups')!.append(popup);
        }

      }
      else {
        if (this._groups.has('datapoint-popups')) {
          this.removeGroup('datapoint-popups', true);
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
        if (this._groups.has('linebreaks')) {
          this.removeGroup('linebreaks', true);
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