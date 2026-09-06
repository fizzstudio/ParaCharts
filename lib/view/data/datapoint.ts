import { svg, TemplateResult } from 'lit';
import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type StyleInfo } from 'lit/directives/style-map.js';
import { Datapoint } from '@fizz/paramodel';
import { DataSymbol } from '../symbol';
import { makeDatapointId } from '../../state';
import { Shape } from '../shape/shape';
import { RectShape } from '../shape/rect';
import { Label } from '../label';
import { Popup, ShapeTypes } from '../popup';
import { type PastryPlotView, type RadialDatapointParams } from '../layers';
import { SeriesView } from './series';
import { DataView } from './data';
import { ref } from 'lit/directives/ref.js';

export const SELECTION_MARKER_SIZE = 40;

/**
 * Mapping of datapoint properties to values.
 */
export type AnimState = Record<string, any>;

export interface DatapointPopupOptions {
  text?: string;
  xInput?: number;
  yInput?: number;
  focus?: boolean;
  select?: boolean;
}

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
  alwaysClip: boolean = false;

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
   * Identifier of the form: `${seriesKey}@${index}`
   * NB: *NOT* the same as the `id` property (the DOM ID)
   */
  get datapointId(): string {
    return makeDatapointId(this.seriesKey, this.index);
  }

  get selectedMarker(): Shape {
    const w = SELECTION_MARKER_SIZE;
    return new RectShape(this.paraview, {
      width: w / 2,
      height: w / 2,
      x: this._x - w / 4,
      y: this._y - w / 4,
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

  get baseSymbolScale() {
    return this._baseSymbolScale;
  }

  get classInfo(): ClassInfo {
    const index = this.index;
    const numColors = this.paraview.paraState.colors.numSeriesColors;
    return {
      datapoint: true,
      [`series-${this.colorIndex % numColors}`]: true,
      visited: this.paraview.paraState.isVisited(this.seriesKey, index),
      selected: this.paraview.paraState.isSelected(this.seriesKey, index),
      highlighted: this.paraview.paraState.isDatapointHighlighted(this.seriesKey, index),
      lowlighted: this.paraview.paraState.isDatapointLowlighted(this.seriesKey, index),
      hidden: this.paraview.paraState.isDatapointHidden(this.seriesKey, index)
    };
  }

  get colorIndex(): number {
    return this._isStyleEnabled ? this.index : this._parent.colorIndex;
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
    return ref(this.chart.paraview.ref<SVGElement>(this._id));
  }

  get el() {
    return this.chart.paraview.ref<SVGElement>(this._id).value!;
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
    if (this.paraview.paraState.thresholds.length > 0) {
      return true;
    }
    if (this.alwaysClip) {
      return true;
    }
    const obb = this.outerBbox;
    if (this.paraview.paraState.config.animation.isAnimationEnabled
      && this.paraview.paraState.config.animation.animationType === 'xAxis'
    ) {
      return true;
    }
    return (obb.right < this.chart.x || obb.bottom < this.chart.y
      || obb.left > this.chart.right || obb.top > this.chart.bottom);
  }

  protected _createId(..._args: any[]): string {
    let jimIndex = 1;
    for (let i = this._parent.modelIndex - 1; i >= 0; i--) {
      jimIndex += this.chart.model.series[i].datapoints.length;
    }
    jimIndex += this.index;
    const datasetIndex = this.datasetIndex;
    let sel = `datapoint${jimIndex}`;
    if (this.paraview.paraState.comboModel) {
      sel = `dataset${datasetIndex}_` + sel;
    }
    const id = (this.paraview.paraState.jimerator!.manifest.jim as any).selectors[sel].dom as string;
    // don't include the '#' from JIM
    return id.slice(1);
  }

  get datasetIndex(): number {
    return 0;
  }

  get id(): string {
    return super.id;
  }

  set id(id: string) {
    super.id = id;
    this._parent.chart.registerDatapoint(this);
  }

  /** Compute and set `x` and `y` */
  computeLocation() { }

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

  popInAnimation() { }

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
    this._symbol = DataSymbol.fromType(this.paraview, symbolType,
      { blackBorder: this.paraview.paraState.config.ui.isLowVisionModeEnabled, borderStrokeWidth: 3, datapoint: this.datapoint });
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
    if (this.paraview.paraState.isVisited(this.seriesKey, this.index)) {
      return this.paraview.paraState.config.chart.symbolHighlightScale * this._baseSymbolScale;
    } else if (this.paraview.paraState.isDatapointHighlighted(this.seriesKey, this.index)) {
      return 1; //this.paraview.paraState.settings.chart.symbolHighlightScale;
    } else {
      return this._baseSymbolScale;
    }
  }

  protected get _symbolColorIndex() {
    //return this.chart.chartInfo.isHighlighted(this.seriesKey, this.index) ? -2 as number :
    return this.paraview.paraState.isVisited(this.seriesKey, this.index) ? -1 as number :
      this.colorIndex; //undefined; // set the color so the highlights layer can clone it
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
      this._symbol.colorIndex = this._symbolColorIndex;
      this._symbol.hidden = !this.paraview.paraState.config.chart.isDrawSymbols;
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
      if (kid instanceof DataSymbol) {
        // Merge: preserve symbol-managed classes (symbol, fill-type, lighten) while
        // adding datapoint state classes (series-N, visited, selected, etc.)
        kid.classInfo = { ...kid.classInfo, ...this.classInfo };
      } else {
        kid.classInfo = this.classInfo;
      }
    }
    return svg`
        <g
          ${this.ref}
          id=${this._id}
          class=${classMap(this.classInfo)}
          role="datapoint"
        >
          ${super.content()}
        </g>`;

  }

  public equals(other: DatapointView): boolean {
    return this.datapoint.seriesKey === other.datapoint.seriesKey && this.datapoint.datapointIndex === other.datapoint.datapointIndex;
  }


  addDatapointPopup(options: DatapointPopupOptions = {}) {
    const { text, xInput, yInput, focus, select } = options;
    let datapointText = `${this.index + 1}/${this.series.datapoints.length}: ${this.chart.chartInfo.summarizer.getDatapointSummary(this.datapoint, 'statusBar')}`;
    if (this.paraview.paraState.model!.multi) {
      datapointText = `${this.series.getLabel()} ${datapointText}`
    }
    if (this.paraview.paraState.thresholds.length > 0) {
      const horizTs = this.paraview.paraState.thresholds.filter(t => t.orientation == 'horiz');
      const vertTs = this.paraview.paraState.thresholds.filter(t => t.orientation == 'vert');
      if (horizTs.length > 0) {
        const yVal = this.datapoint.facetValueAsNumber('y')!;
        const aboveT = horizTs.filter(t => t.align > yVal);
        const belowT = horizTs.filter(t => t.align < yVal);
        const onT = horizTs.filter(t => t.align == yVal);
        if (onT.length > 0) {
          datapointText = datapointText.concat(` On threshold ${onT[0].text ?? onT[0].align}.`)
        }
        else if (aboveT.length > 0 && belowT.length > 0) {
          const highestBelowT = belowT.sort((a, b) => b.align - a.align)[0]!;
          const lowestAboveT = aboveT.sort((a, b) => a.align - b.align)[0]!;
          datapointText = datapointText.concat(` Above threshold ${highestBelowT.text ?? highestBelowT.align} but below threshold ${lowestAboveT.text ?? lowestAboveT.align}.`)
        }
        else if (aboveT.length > 0) {
          const lowestAboveT = aboveT.sort((a, b) => a.align - b.align)[0]!;
          datapointText = datapointText.concat(` Below threshold ${lowestAboveT.text ?? lowestAboveT.align}.`)
        }
        else if (belowT.length > 0) {
          const highestBelowT = belowT.sort((a, b) => b.align - a.align)[0]!;
          datapointText = datapointText.concat(` Above threshold ${highestBelowT.text ?? highestBelowT.align}.`)
        }
      }
      if (vertTs.length > 0) {
        const xVal = this.x;
        const aboveT = vertTs.filter(t => t.clipWidth > xVal);
        const belowT = vertTs.filter(t => t.clipWidth < xVal);
        const onT = vertTs.filter(t => t.clipWidth == xVal);
        if (onT.length > 0) {
          datapointText = datapointText.concat(` On threshold ${onT[0].text ?? onT[0].align}.`)
        }
        else if (aboveT.length > 0 && belowT.length > 0) {
          const highestBelowT = belowT.sort((a, b) => b.align - a.align)[0]!;
          const lowestAboveT = aboveT.sort((a, b) => a.align - b.align)[0]!;
          datapointText = datapointText.concat(` Right of threshold ${highestBelowT.text ?? highestBelowT.align} but left of threshold ${lowestAboveT.text ?? lowestAboveT.align}.`)
        }
        else if (aboveT.length > 0) {
          const lowestAboveT = aboveT.sort((a, b) => a.align - b.align)[0]!;
          datapointText = datapointText.concat(` Left of threshold ${lowestAboveT.text ?? lowestAboveT.align}.`)
        }
        else if (belowT.length > 0) {
          const highestBelowT = belowT.sort((a, b) => b.align - a.align)[0]!;
          datapointText = datapointText.concat(` Right of threshold ${highestBelowT.text ?? highestBelowT.align}.`)
        }
      }
    }

    let x = this.x;
    let y = this.y;
    let color = this.colorIndex;
    let fill = undefined;
    let shape = "boxWithArrow";
    let pointerControlled = false;
    if (['bar', 'column', 'waterfall', 'histogram', 'heatmap'].includes(this.paraview.paraState.type)) {
      x = this.x + this.width / 2
      if (this.paraview.paraState.config.popup.activation == "onHover") {
        pointerControlled = true;
      }
    }
    if (['waterfall'].includes(this.paraview.paraState.type)) {
      const palIdx = this.paraview.paraState.colors.indexOfPalette('semantic');
      const pal = this.paraview.paraState.colors.palettes[palIdx];
      if (this.index && !this.isLast) {
        fill = this.datapoint.facetValueAsNumber('y')! >= 0
          ? pal.colors[0].value
          : pal.colors[1].value;
        y = this.datapoint.facetValueAsNumber('y')! >= 0
          ? y
          : y + this.height;
      } else {
        fill = pal.colors[2].value;
      }
      color = 0;
    }
    if (['pie', 'donut'].includes(this.paraview.paraState.type)) {
      const chart = this.chart as PastryPlotView;
      //@ts-ignore
      const params = this._params as RadialDatapointParams;
      const angle = 2 * Math.PI - ((params.accum * 2 * Math.PI) + (params.percentage * Math.PI) - (chart.config.orientationAngleOffset * 2 * Math.PI / 360))
      x = this.x + chart.radius * (1 - chart.config.annularThickness / 2) * Math.cos(angle)
      y = this.y - chart.radius * (1 - chart.config.annularThickness / 2) * Math.sin(angle)
      if (this.paraview.paraState.config.popup.activation == "onHover") {
        pointerControlled = true;
      }
    }
    const popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: xInput ?? x,
        y: yInput ?? y,
        id: this.id,
        colorIndex: color,
        points: [this],
        rotationExempt: this.paraview.paraState.type == 'bar' ? false : true,
        angle: this.paraview.paraState.type == 'bar' ? -90 : 0,
        pointerControlled
      },
      {
        shape: shape as ShapeTypes,
        fill: fill
      });
    focus ? this.paraview.paraState.focusPopups.push(popup) :
      select ? this.paraview.paraState.selectPopups.push(popup) :
        this.paraview.paraState.popups.push(popup);
    this._popup = popup;
  }

  shouldAddHoverPopup(): boolean {
    if (['bar', 'column', 'scatter', 'waterfall', 'histogram', 'heatmap'].includes(this.paraview.paraState.type)) {
      return (this.paraview.paraState.config.chart.isShowPopups
        && this.paraview.paraState.config.popup.activation == 'onHover'
        && (!this.paraview.paraState.config.popup.isShowCrosshair
          || this.paraview.paraState.config.popup.isCrosshairFollowPointer));
    }
    else if (['pie', 'donut'].includes(this.paraview.paraState.type)) {
      return (this.paraview.paraState.config.chart.isShowPopups
        && this.paraview.paraState.config.popup.activation == 'onHover');
    }
    else {
      return false;
    }
  }

  movePopupAction() {
    if (this._popup) {
      this._popup.remove()
      this.chart.removeDatapointPopup(this)
      if (['column', 'waterfall', 'pie', 'donut', 'histogram', 'heatmap'].includes(this.paraview.paraState.type)) {
        this.addDatapointPopup({ xInput: this.paraview.paraState.pointerCoords.x, yInput: this.paraview.paraState.pointerCoords.y })
        this._popup.horizShift = this.paraview.paraState.pointerCoords.x - (this._popup.grid.x + this._popup.grid.width / 2)
      }
      else if (this.paraview.paraState.type == 'bar') {
        this.addDatapointPopup({ xInput: this.paraview.paraState.pointerCoords.y, yInput: this.chart.height - this.paraview.paraState.pointerCoords.x })
      }
    }
  }

  stopAnimation() { }

}
