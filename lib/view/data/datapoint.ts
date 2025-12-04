
import { DataView, type SeriesView } from './';
import { DataSymbol } from '../symbol';
import { datapointIdToCursor } from '../../store';
import { Shape } from '../shape/shape';
import { RectShape } from '../shape/rect';

import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { svg, nothing, TemplateResult } from 'lit';
import { formatBox } from '@fizz/parasummary';
import { Datapoint } from '@fizz/paramodel';
import { Label } from '../label';

/**
 * Mapping of datapoint properties to values.
 */
export type AnimState = Record<string, any>;

/**
 * Abstract base class for views representing datapoint values
 * (e.g., bar chart bars, pie slices, etc.).
 * @public
 */
export class DatapointView extends DataView {

  declare protected _parent: SeriesView;

  protected _shapes: Shape[] = [];
  protected _symbol: DataSymbol | null = null;
  protected _labels: Label[] = [];
  protected _baseSymbolScale: number = 1;
  protected _animStartState: AnimState = {};
  protected _animEndState: AnimState = {};

  constructor(seriesView: SeriesView) {
    super(seriesView.chart, seriesView.series.key);
  }

  protected _addedToParent() {
    super._addedToParent();
  }

  protected _removedFromParent() {
    super._removedFromParent();
    this._parent.chart.unregisterDatapoint(this);
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: SeriesView) {
    super.parent = parent;
  }

  get cousins() {
    return super.cousins as this[];
  }

  get withCousins() {
    return super.withCousins as this[];
  }

  get nextSeriesLanding() {
    return this._parent.next;
  }

  get prevSeriesLanding() {
    return this._parent.prev;
  }

  get datapoint(): Datapoint {
    return this.series.datapoints[this.index];
  }

  /**
   * Identifier of the form: `${seriesKey}-${index}`
   * NB: *NOT* the same as the `id` property (the DOM ID)
   */
  get datapointId(): string {
    return `${this.seriesKey}-${this.index}`;
  }

  get selectedMarker(): Shape {
    return new RectShape(this.paraview, {
      width: this._width/2,
      height: this._width/2,
      x: this._x - this._width/4,
      y: this._y - this._width/4,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2,
      isClip: this.shouldClip
    });
  }

  get shapes() {
    return [...this._shapes];
  }

  get symbol() {
    return this._symbol;
  }

  get labels() {
    return [...this._labels];
  }

  set baseSymbolScale(scale: number) {
    this._baseSymbolScale = scale;
  }

  get classInfo(): ClassInfo {
    return {
      datapoint: true,
      visited: this.paraview.store.isVisited(this.seriesKey, this.index),
      selected: this.paraview.store.isSelected(this.seriesKey, this.index),
      highlighted: this.chart.chartInfo.isHighlighted(this.seriesKey, this.index)
    };
  }

  get color(): number {
    return this._isStyleEnabled ? this.index : this._parent.color;
  }

  /**
   * May be overridden to apply shape-specific style info
   * (e.g., if only a particular shape should be highlighted on visitation)
   * @param shapeIndex - Index of the shape in `_shapes`.
   * @returns Style info
   */
  protected _shapeStyleInfo(_shapeIndex: number): StyleInfo {
    return this.styleInfo;
  }

  get ref() {
    return this.chart.paraview.ref<SVGElement>(this._id);
  }

  get el() {
    return this.ref.value!;
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    this._shapes.forEach(shape => {
      shape.x += x - this._x;
    });
    if (this._symbol) {
      this._symbol.x += x - this._x;
    }
    this._labels.forEach(label => {
      label.x += x - this._x;
    });
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    this._shapes.forEach(shape => {
      shape.y += y - this._y;
    });
    if (this._symbol) {
      this._symbol.y += y - this._y;
    }
    this._labels.forEach(label => {
      label.y += y - this._y;
    });
    super.y = y;
  }

  get shouldClip() {
    const obb = this.outerBbox;
    if (this.paraview.store.settings.animation.isAnimationEnabled
      && this.paraview.store.settings.animation.lineSnake
    ) {
      return true;
    }
    return (obb.right < this.chart.x || obb.bottom < this.chart.y
      || obb.left > this.chart.right || obb.top > this.chart.bottom);
  }

  protected _createId(..._args: any[]): string {
    const jimIndex = this._parent.modelIndex*this._series.length + this.index + 1;
    const id = this.paraview.store.jimerator!.jim.selectors[`datapoint${jimIndex}`].dom as string;
    // don't include the '#' from JIM
    return id.slice(1);
  }

  get id(): string {
    return super.id;
  }

  set id(id: string) {
    super.id = id;
    this._parent.chart.registerDatapoint(this);
  }

  /** Compute and set `x` and `y` */
  computeLocation() {}

  /** Do any other layout (which may depend on the location being set) */
  completeLayout() {
    this._createShapes();
    this._createSymbol();
    this._createLabels();
    if (this._children.length === 1) {
      // We won't be using a group
      const kid = this._children[0] as (Shape | DataSymbol);
      //this._shape!.ref = this.ref;
      kid.id = this._id;
      kid.role = 'datapoint';
    } else {
      this._children.forEach((kid, i) => {
        const sfx = kid instanceof Shape
          ? `${i}`
          : 'sym';
        kid.id = `${this._id}-${sfx}`;
      });
    }
    this.layoutSymbol();
  }

  /**
   *
   * @param t - Value between 0 and 1
   */
  beginAnimStep(bezT: number, linearT: number) {
  }

  /**
   *
   * @param t - Value between 0 and 1
   */
  endAnimStep(bezT: number, linearT: number) {
    this.completeLayout();
  }

  /**
   * Subclasses should override this;
   * If there will be shapes, add them to `this._shapes` first,
   * THEN call `super._createShapes()`.
   * Otherwise, override with an empty method.
   */
  protected _createShapes() {
    this._shapes.forEach(shape => {
      this.append(shape);
    })
  }

  protected _createSymbol() {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    // If datapoints are laid out again after the initial layout,
    // we need to replace the original shape and symbol
    this._symbol?.remove();
    this._symbol = DataSymbol.fromType(this.paraview, symbolType);
    this.append(this._symbol);
  }

  protected _createLabels() {
    this.labels.forEach(label => {
      this.append(label);
    })
  }

  layoutSymbol() {
    if (this._symbol) {
      this._symbol.x = this._x;
      this._symbol.y = this._y;
    }
  }

  protected get symbolScale() {
    if (this.paraview.store.isVisited(this.seriesKey, this.index)) {
      return this.paraview.store.settings.chart.symbolHighlightScale * this._baseSymbolScale;
    } else if (this.chart.chartInfo.isHighlighted(this.seriesKey, this.index)) {
      return 1; //this.paraview.store.settings.chart.symbolHighlightScale;
    } else {
      return this._baseSymbolScale;
    }
  }

  protected get _symbolColor() {
    //return this.chart.chartInfo.isHighlighted(this.seriesKey, this.index) ? -2 as number :
    return this.paraview.store.isVisited(this.seriesKey, this.index) ? -1 as number :
           this.color; //undefined; // set the color so the highlights layer can clone it
  }

  protected _contentUpdateShapes() {
    this._shapes.forEach((shape, i) => {
      shape.styleInfo = this._shapeStyleInfo(i);
      //shape.classInfo = this.classInfo;
    });
  }

  protected _contentUpdateSymbol() {
    if (this._symbol) {
      this._symbol.scale = this.symbolScale;
      this._symbol.color = this._symbolColor;
      this._symbol.hidden = !this.paraview.store.settings.chart.isDrawSymbols;
    }
  }

  protected _contentUpdateLabels() {
  }

  content(): TemplateResult {
    // on g: aria-labelledby="${this.params.labelId}"
    // originally came from: xAxis.tickLabelIds[j]
    this._contentUpdateShapes();
    this._contentUpdateSymbol();
    this._contentUpdateLabels();
    if (this._children.length === 1) {
      // classInfo may change, so needs to get reassigned here
      const kid = this._children[0] as (Shape | DataSymbol);
      kid.classInfo = this.classInfo;
      return super.content();
    } else {
      return svg`
        <g
          id=${this._id}
          class=${classMap(this.classInfo)}
          role="datapoint"
        >
          ${super.content()}
        </g>`;
    }
  }

  public equals(other: DatapointView): boolean {
    return this.datapoint.seriesKey === other.datapoint.seriesKey && this.datapoint.datapointIndex === other.datapoint.datapointIndex;
  }

  addPopup(text?: string){}

  removePopup(id: string) {
    this.paraview.store.popups.splice(this.paraview.store.popups.findIndex(p => p.id === id), 1)
    this.paraview.requestUpdate()
  }

}
