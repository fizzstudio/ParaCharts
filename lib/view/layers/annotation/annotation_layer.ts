
import { ChartLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ParaView } from '../../../paraview';
import { Rect } from '../../shape/rect';

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
      if (this.paraview.store.rangeHighlights) {
        console.log('RHL', this.paraview.store.rangeHighlights);
        this.addGroup('range-highlights', true);
        this.group('range-highlights')!.clearChildren();
        for (const rhl of this.paraview.store.rangeHighlights) {
          const startPx = this.width*rhl.startPortion;
          const endPx = this.width*rhl.endPortion;
          const rect = new Rect(this.paraview, {
            x: startPx,
            y: 0,
            width: endPx - startPx,
            height: this.height
          });
          rect.classInfo = {'range-highlight': true};
          this.group('range-highlights')!.append(rect);
        }
      } else {
        this.removeGroup('range-highlights', true);
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