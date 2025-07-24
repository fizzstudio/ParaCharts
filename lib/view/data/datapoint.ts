
import { DataView, type SeriesView } from './';
import { DataSymbol } from '../symbol';
import { type DataCursor } from '../../store';
import { Shape } from '../shape/shape';
import { RectShape } from '../shape/rect';

import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { svg, nothing, TemplateResult } from 'lit';
import { formatBox } from '@fizz/parasummary';
import { Datapoint } from '@fizz/paramodel';

/**
 * Abstract base class for views representing datapoint values
 * (e.g., bar chart bars, pie slices, etc.).
 * @public
 */
export class DatapointView extends DataView {

  declare protected _parent: SeriesView;

  protected _shapes: Shape[] = [];
  protected _symbol: DataSymbol | null = null;

  constructor(seriesView: SeriesView) {
    super(seriesView.chart, seriesView.series.key);
  }

  protected _addedToParent() {
    super._addedToParent();
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

  get selectedMarker(): Shape {
    return new RectShape(this.paraview, {
      width: this._width/2,
      height: this._width/2,
      x: this._x - this._width/4,
      y: this._y - this._width/4,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }

  get shapes() {
    return [...this._shapes];
  }

  get classInfo(): ClassInfo {
    return {
      datapoint: true,
      visited: this.paraview.store.isVisited(this.seriesKey, this.index),
      selected: this.paraview.store.isSelected(this.seriesKey, this.index)
    };
  }

  get color(): number {
    return this._isStyleEnabled ? this.index : this._parent.color;
  }

  get styleInfo(): StyleInfo {
    const style = super.styleInfo;
    if (this.paraview.store.isVisited(this.seriesKey, this.index)) {
      this._addVisitedStyleInfo(style);
    }
    return style;
  }

  /**
   * Mutate `styleInfo` with visited styling.
   * @param styleInfo
   */
  protected _addVisitedStyleInfo(styleInfo: StyleInfo) {
    const colorValue = this.paraview.store.colors.colorValue('highlight');
    styleInfo.fill = colorValue;
    styleInfo.stroke = colorValue;
    const visitedScale = this.paraview.store.settings.chart.strokeHighlightScale;
    styleInfo.strokeWidth = this.paraview.store.settings.chart.strokeWidth*visitedScale;
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
    super.y = y;
  }

  protected _createId(..._args: any[]): string {
    const jimIndex = this._parent.modelIndex*this._series.length + this.index + 1;
    const id = this.paraview.store.jimerator!.jim.selectors[`datapoint${jimIndex}`].dom as string;
    // don't include the '#' from JIM
    return id.slice(1);
  }

  /** Compute and set `x` and `y` */
  computeLocation() {}

  /** Do any other layout (which may depend on the location being set) */
  completeLayout() {
    this._createShapes();
    this._createSymbol();
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

  layoutSymbol() {
    if (this._symbol) {
      this._symbol.x = this._x;
      this._symbol.y = this._y;
    }
  }

  protected get _symbolScale() {
    return this.paraview.store.isVisited(this.seriesKey, this.index)
      ? this.paraview.store.settings.chart.symbolHighlightScale
      : 1;
  }

  protected get _symbolColor() {
    return this.paraview.store.isVisited(this.seriesKey, this.index)
      ? -1 as number
      : undefined;
  }

  protected _composeSelectionAnnouncement(isExtend: boolean) {
    // This method assumes only a single point was visited when the select
    // command was issued (i.e., we know nothing about chord mode here)
    const seriesAndVal = (cursor: DataCursor) => {
      const dp = this.paraview.store.model!.atKeyAndIndex(cursor.seriesKey, cursor.index)!;
      return `${cursor.seriesKey} (${formatBox(dp.facetBox('x')!, this.paraview.store.getFormatType('statusBar'))}, ${formatBox(dp.facetBox('y')!, this.paraview.store.getFormatType('statusBar'))})`;
    };

    const newTotalSelected = this.paraview.store.selectedDatapoints.length;
    const oldTotalSelected = this.paraview.store.prevSelectedDatapoints.length;
    const justSelected = this.paraview.store.selectedDatapoints.filter(dc =>
      !this.paraview.store.wasSelected(dc.seriesKey, dc.index));
    const justDeselected = this.paraview.store.prevSelectedDatapoints.filter(dc =>
      !this.paraview.store.isSelected(dc.seriesKey, dc.index));

    const s = newTotalSelected === 1 ? '' : 's';
    const newTotSel = `${newTotalSelected} point${s} selected.`;

    if (oldTotalSelected === 0) {
      // None were selected; selected 1
      return `Selected ${seriesAndVal(justSelected[0])}`;
    } else if (oldTotalSelected === 1 && !newTotalSelected) {
      // 1 was selected; it has been deselected
      return `Deselected ${seriesAndVal(justDeselected[0])}. No points selected.`;
    } else if (!isExtend && justSelected.length && oldTotalSelected) {
      // Selected 1 new, deselected others
      return `Selected ${seriesAndVal(justSelected[0])}. 1 point selected.`;
    } else if (!isExtend && newTotalSelected && oldTotalSelected) {
      // Kept 1 selected, deselected others
      return `Deselected ${seriesAndVal(justDeselected[0])}. 1 point selected.`;
    } else if (isExtend && justDeselected.length) {
      // Deselected 1
      return `Deselected ${seriesAndVal(justDeselected[0])}. ${newTotSel}`;
    } else if (isExtend && justSelected.length) {
      // Selected 1
      return `Selected ${seriesAndVal(justSelected[0])}. ${newTotSel}`;
    } else {
      return 'ERROR';
    }
  }

  select(isExtend: boolean) {
    if (isExtend) {
      this.paraview.store.extendSelection(this.paraview.store.visitedDatapoints);
    } else {
      this.paraview.store.select(this.paraview.store.visitedDatapoints);
    }
    this.paraview.store.announce(this._composeSelectionAnnouncement(isExtend));
  }

  content(): TemplateResult {
    // on g: aria-labelledby="${this.params.labelId}"
    // originally came from: xAxis.tickLabelIds[j]
    this._shapes.forEach((shape, i) => {
      shape.styleInfo = this._shapeStyleInfo(i);
      //shape.classInfo = this.classInfo;
    });
    if (this._symbol) {
      this._symbol.scale = this._symbolScale;
      this._symbol.color = this._symbolColor;
      this._symbol.hidden = !this.paraview.store.settings.chart.isDrawSymbols;
    }
    return this._children.length > 1
      ? svg`
        <g
          id=${this._id}
          class=${classMap(this.classInfo)}
          role="datapoint"
        >
          ${super.content()}
        </g>`
      : super.content();
  }

}
