
import { ChartLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { Rect } from '../../shape/rect';
import { Path } from '../../shape/path';
import { Vec2 } from '../../../common/vector';

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
      if (this.paraview.store.trendLines) {
        this.addGroup('trend-lines', true);
        this.group('trend-lines')!.clearChildren();
        for (const tl of this.paraview.store.trendLines) {
          const series = this.paraview.store.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const minValue = Number(this.paraview.store.settings.axis.y.minValue)
          const maxValue = Number(this.paraview.store.settings.axis.y.maxValue)
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetAsNumber("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetAsNumber("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const linebreak = new Path(this.paraview, {
            x: this._x,
            y: this._y,
            points: [new Vec2(startPx, startHeight), new Vec2(endPx, endHeight),],
          });
          const colorValue = this.paraview.store.colors.colorValue('highlight');
    linebreak.styleInfo.fill = colorValue;
    linebreak.styleInfo.stroke = colorValue;
          //linebreak.styleInfo.fill = "blue"
          //linebreak.styleInfo.stroke = "blue"
          linebreak.classInfo = { 'trend-line': true }
          this.group('trend-lines')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('trend-lines')) {
          this.removeGroup('trend-lines', true);
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
          const rect = new Rect(this.paraview, {
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
      if (this.paraview.store.lineBreaks) {
        this.addGroup('line-breaks', true);
        this.group('line-breaks')!.clearChildren();
        for (const lb of this.paraview.store.lineBreaks) {
          const startPx = this.width * lb.startPortion;
          const linebreak = new Rect(this.paraview, {
            x: startPx - 1.5,
            y: 0,
            width: 3,
            height: this.height
          })
          linebreak.classInfo = { 'linebreaker-marker': true }
          this.group('line-breaks')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('range-highlights')) {
          this.removeGroup('linebreaks', true);
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