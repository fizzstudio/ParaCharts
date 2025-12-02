
import { PlotLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { RectShape } from '../../shape/rect';
import { PathShape } from '../../shape/path';
import { Vec2 } from '../../../common/vector';
import { PointAnnotation } from '../../../store';
import { Popup } from '../../popup';
import { datapointIdToCursor } from '../../../store';

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
    else {
      throw new Error(`group '${name}' does not exist`);
    }
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
        for (let dp of this.paraview.store.visitedDatapoints){
          let cursor = datapointIdToCursor(dp)
          let dpView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)
          for (let annot of this.paraview.store.annotations){
            if (dpView!.seriesKey === annot.seriesKey && dpView!.index === annot.index && !annot.isSelected){
              annots.push(annot as PointAnnotation)
            }
          }
        }
        for (const annot of annots) {
          const seriesKey = this.paraview.store.model!.series.filter(s => s[0].seriesKey == annot.seriesKey)[0].key
          const dpView = this.paraview.documentView?.chartLayers.dataLayer.datapointViews.filter(d => d.seriesKey == seriesKey && d.index == annot.index)[0]
          if (!dpView) {
            break
          }
          let popup = new Popup(this.paraview,
            {
              text: annot.text,
              x: dpView.x,
              y: dpView.y,
              id: this.id,
              color: dpView.color,
              points: [dpView]
            },
            {
              fill: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                  this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(dpView.color), 6)
                  : this.paraview.store.colors.colorValueAt(dpView.color),
              stroke: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                  this.paraview.store.colors.colorValueAt(dpView.color)
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