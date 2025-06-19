
import { DataView, type SeriesView } from './';
import { DataSymbol, DataSymbols } from '../symbol';
import { type DataCursor } from '../../store';
import { type Shape } from '../shape/shape';
import { Rect } from '../shape/rect';

import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { svg, nothing, TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { formatBox } from '@fizz/parasummary';
import { DataPoint, strToId } from '@fizz/paramodel';

/**
 * Abstract base class for views representing datapoint values
 * (e.g., bar chart bars, pie slices, etc.).
 * @public
 */
export class DatapointView extends DataView {

  declare protected _parent: SeriesView;

  protected _shape: Shape | null = null;
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

  get sameIndexers() {
    return super.sameIndexers as this[]; 
  }

  get withSameIndexers() {
    return super.withSameIndexers as this[];
  }

  get nextSeriesLanding() {
    return this._parent.next;
  }

  get prevSeriesLanding() {
    return this._parent.prev;
  }

  get datapoint(): DataPoint {
    return this.series.datapoints[this.index];
  }

  get selectedMarker(): Shape {
    return new Rect(this.paraview, {
      width: this._width/2,
      height: this._width/2,
      x: this._x - this._width/4,
      y: this._y - this._width/4,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }

  get shape() {
    return this._shape;
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
    if (this._shape) {
      this._shape.x += x - this._x;
    }
    if (this._symbol) {
      this._symbol.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._shape) {
      this._shape.y += y - this._y;
    }
    if (this._symbol) {
      this._symbol.y += y - this._y;
    }
    super.y = y;
  }

  protected _createId(..._args: any[]): string {
    const jimIndex = this._parent.modelIndex*this._series.length + this.index + 1; 
    console.log('ci', jimIndex, this.paraview.store.jimerator!.jim.selectors)
    const id = this.paraview.store.jimerator!.jim.selectors[`datapoint${jimIndex}`].dom as string;
    // don't include the '#' from JIM
    return id.slice(1);
  }
  
  protected _visit(_isNewComponentFocus = false) {
    this.paraview.store.visit([{seriesKey: this.seriesKey, index: this.index}]);
    const announcement = this.paraview.store.model!.multi
      ? this.paraview.summarizer.getDatapointSummaryWithSeries(this.datapoint, 'raw')
      : this.paraview.summarizer.getDatapointSummary(this.datapoint, 'raw');
    this.paraview.store.announce(announcement);
  }

  async onFocus(isNewComponentFocus = false) {
    await super.onFocus(isNewComponentFocus);
    this._visit(isNewComponentFocus);
  }

  /** Compute and set `x` and `y` */
  computeLocation() {}

  /** Do any other layout (which may depend on the location being set) */
  completeLayout() {
    this._createShape();
    this._createSymbol();
    this.layoutSymbol();
  }

  /**
   * Subclasses should override this;
   * If there will be a shape, first set `this._shape`,
   * THEN call `super._createShape()`.
   * Otherwise, override with an empty method. 
   */
  protected _createShape() {
    this._shape!.ref = this.ref;
    this._shape!.id = this._id;
    this._shape!.role = 'datapoint';
    this.append(this._shape!);
  }

  protected _createSymbol() {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    this._symbol = DataSymbol.fromType(this.paraview, symbolType);
    this._symbol.id = `${this._id}-sym`;
    this._symbol.role = 'datapoint';
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
    if (this._shape) {
      this._shape.styleInfo = this.styleInfo;
      this._shape.classInfo = this.classInfo;  
    }
    if (this._symbol) {
      this._symbol.scale = this._symbolScale;
      this._symbol.color = this._symbolColor;
      this._symbol.hidden = !this.paraview.store.settings.chart.isDrawSymbols;
    }
    return super.content();
  }

}
