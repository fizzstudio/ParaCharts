
import { PlotLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { RectShape } from '../../shape/rect';
import { PathShape } from '../../shape/path';
import { Vec2 } from '../../../common/vector';
import { PointAnnotation, Setting, type ParaState } from '../../../state';
import { Popup } from '../../popup';
import { datapointIdToCursor } from '../../../state';
import { PlaneChartInfo } from '../../../chart_types';

export type AnnotationType = 'foreground' | 'background';

export class AnnotationLayer extends PlotLayer {
  protected _groups = new Map<string, DecorationGroup>();

  constructor(paraState: ParaState, paraview: ParaView, width: number, height: number, public readonly type: AnnotationType) {
    super(paraState, paraview, width, height);
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
    this._groups.set(name, new DecorationGroup(this._paraState, this.paraview, name));
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

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['ui.isLowVisionModeEnabled'].includes(path)) {
      if (!oldValue) {
        for (let annot of this._paraState.annotations) {
          annot.isSelected = false;
        }
      }
    }
  }

  renderChildren() {
    if (this.type === 'foreground') {
      if (this._paraState.modelTrendLines && this.parent.parent.chartInfo instanceof PlaneChartInfo) {
        this.addGroup('trend-lines', true);
        this.group('trend-lines')!.clearChildren();
        for (const tl of this._paraState.modelTrendLines) {
          const series = this._paraState.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0];
          const range = this.parent.parent.chartInfo.yInterval!;
          const minValue = range.start ?? Number(this._paraState.settings.axis.y.minValue)
          const maxValue = range.end ?? Number(this._paraState.settings.axis.y.maxValue)
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this._paraState.colors.colorValue('visit');
          const trendLine = new PathShape(this._paraState, this.paraview, {
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

      if (this._paraState.userTrendLines && this.parent.parent.chartInfo instanceof PlaneChartInfo) {
        this.addGroup('user-trend-lines', true);
        this.group('user-trend-lines')!.clearChildren();
        let tls = structuredClone(this._paraState.userTrendLines);
        if (this._paraState.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this._paraState.visitedDatapoints.values().toArray()[0]);
          tls = tls.filter(a => a.seriesKey == cursor.seriesKey)
        }
        for (const tl of tls) {
          const series = this._paraState.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const range = this.parent.parent.chartInfo.yInterval!;
          const minValue = range.start ?? Number(this._paraState.settings.axis.y.minValue)
          const maxValue = range.end ?? Number(this._paraState.settings.axis.y.maxValue)
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this._paraState.colors.colorValue('highlight');
          const trendLine = new PathShape(this._paraState, this.paraview, {
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

      if (this._paraState.annotations) {
        this.addGroup('annotation-popups', true);
        this.group('annotation-popups')!.clearChildren();
        let annots = structuredClone(this._paraState.annotations.filter(a => a.type == 'datapoint' && a.isSelected == true) as unknown as PointAnnotation[]);
        /*
        for (let dp of this._paraState.visitedDatapoints){
          let cursor = datapointIdToCursor(dp)
          let dpView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)
          for (let annot of this._paraState.annotations){
            if (dpView!.seriesKey === annot.seriesKey && dpView!.index === annot.index && !annot.isSelected){
              annots.push(annot as PointAnnotation)
            }
          }
        }
          */
        for (const annot of annots) {
          const seriesKey = this._paraState.model!.series.filter(s => s[0].seriesKey == annot.seriesKey)[0].key
          const dpView = this.paraview.documentView?.chartLayers.dataLayer.datapointViews.filter(d => d.seriesKey == seriesKey && d.index == annot.index)[0]
          if (!dpView) {
            break
          }
          let popup = new Popup(this._paraState, this.paraview,
            {
              text: annot.text,
              x: dpView.x,
              y: dpView.y,
              id: this.id,
              color: dpView.color,
              points: [dpView]
            },
            {
              fill: this._paraState.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this._paraState.settings.popup.backgroundColor === "light" ?
                  this._paraState.colors.lighten(this._paraState.colors.colorValueAt(dpView.color), 6)
                  : this._paraState.colors.colorValueAt(dpView.color),
              stroke: this._paraState.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this._paraState.settings.popup.backgroundColor === "light" ?
                  this._paraState.colors.colorValueAt(dpView.color)
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
      if (this._paraState.rangeHighlights) {
        this.addGroup('range-highlights', true);
        this.group('range-highlights')!.clearChildren();
        for (const rhl of this._paraState.rangeHighlights) {
          const startPx = this.width * rhl.startPortion;
          const endPx = this.width * rhl.endPortion;
          const rect = new RectShape(this._paraState, this.paraview, {
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

      if (this._paraState.modelLineBreaks) {
        this.addGroup('linebreaker-markers', true);
        this.group('linebreaker-markers')!.clearChildren();
        for (const lb of this._paraState.modelLineBreaks) {
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this._paraState, this.paraview, {
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
      if (this._paraState.userLineBreaks) {
        this.addGroup('user-linebreaker-markers', true);
        this.group('user-linebreaker-markers')!.clearChildren();
        let lbs = structuredClone(this._paraState.userLineBreaks);
        if (this._paraState.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this._paraState.visitedDatapoints.values().toArray()[0]);
          lbs = lbs.filter(a => a.seriesKey == cursor.seriesKey);
        }
        for (const lb of lbs) {
          const index = this._paraState.model!.series.findIndex(a => a.key == lb.seriesKey);
          const color = this._paraState.colors.colorValueAt(index)
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this._paraState, this.paraview, {
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

  constructor(paraState: ParaState, paraview: ParaView, protected _name: string) {
    super(paraState, paraview);
  }

  get name() {
    return this._name;
  }

}