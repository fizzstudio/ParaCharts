
import { ChartLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { RectShape } from '../../shape/rect';
import { PathShape } from '../../shape/path';
import { Vec2 } from '../../../common/vector';
import { Label } from '../../label';
import { PointAnnotation } from '../../../store';

export type AnnotationType = 'foreground' | 'background';

export class AnnotationLayer extends ChartLayer {
  protected _groups = new Map<string, DecorationGroup>();

  constructor(paraview: ParaView, public readonly type: AnnotationType) {
    super(paraview);
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
          const range = this.parent.getYAxisInterval();
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
            fill : colorValue,
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
        if (this.paraview.store.visitedDatapoints.length > 0) {
          tls = tls.filter(a => a.seriesKey == this.paraview.store.visitedDatapoints[0].seriesKey)
        }
        for (const tl of tls) {
          const series = this.paraview.store.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const range = this.parent.getYAxisInterval();
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
            fill : colorValue,
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
        this.addGroup('annotation-labels', true);
        this.group('annotation-labels')!.clearChildren();
        
        let annots = structuredClone(this.paraview.store.annotations.filter(a => a.type == 'datapoint' && a.isSelected == true) as unknown as PointAnnotation[]);
        console.log(annots)
        
        for (const annot of annots) {
          const seriesKey = this.paraview.store.model!.series.filter(s => s[0].seriesKey == annot.seriesKey)[0].key
          //const datapoint = series[annot.index!]
          const datapoint = this.paraview.documentView?.chartLayers.dataLayer.datapointViews.filter(d => d.seriesKey == seriesKey && d.index == annot.index )[0]
          if (!datapoint){
            break
          }
          console.log(datapoint)
          let label = new Label(this.paraview, {
            text: annot.text,
            x: datapoint.x,
            y: datapoint.y - 40,
            //wrapWidth: 10, Not working
            classList: ['annotationlabel']
          })
          console.log(label)
          console.log(label.el)
          console.log(label.width)
          //let bbox = label.el.getBoundingClientRect()
          //console.log(bbox)
          let rect = new RectShape(this.paraview, {
            width: label.width + 10,
            height: label.height + 10,
            x: label.x - label.width / 2 - 5,
            y: label.y - label.height / 2 - 10,
            fill: `hsla(0, 0%, 71%, 0.28)`,
            //fill: "red",
            stroke: "black",
          })
          let shape = new PathShape(this.paraview, {
            points: [new Vec2(label.x - label.width / 2 - 5, label.y - label.height / 2 - 10), 
                     new Vec2(label.x - label.width / 2 - 5, label.y + label.height / 2),

                     new Vec2(label.x - Math.min(label.width / 4, 15), label.y + label.height / 2),
                     new Vec2(label.x, label.y + label.height / 2 + 10),
                     new Vec2(label.x + Math.min(label.width / 4, 15), label.y + label.height / 2),

                     new Vec2(label.x + label.width / 2 + 5, label.y + label.height / 2),
                     new Vec2(label.x + label.width / 2 + 5, label.y - label.height / 2 - 10),
                     new Vec2(label.x - label.width / 2 - 5, label.y - label.height / 2 - 10)],
            fill: `hsla(0, 0%, 71%, 0.28)`,
            stroke: "black",
          })
          /*
          const range = this.parent.getYAxisInterval();
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
            fill : colorValue,
            stroke: colorValue
          });

          trendLine.classInfo = { 'user-trend-line': true }
          */
          shape.classInfo = {'label-box': true }
          shape.styleInfo['border-radius'] = '5em'; 
          this.group('annotation-labels')!.append(shape);
          this.group('annotation-labels')!.append(label);
          
        }
          
      }
      else {
        if (this._groups.has('annotation-labels')) {
          this.removeGroup('annotation-labels', true);
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
        if (this.paraview.store.visitedDatapoints.length > 0){
          lbs = lbs.filter(a => a.seriesKey == this.paraview.store.visitedDatapoints[0].seriesKey)
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