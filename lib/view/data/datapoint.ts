
import { DataView, type SeriesView } from './';
import { DataSymbol, DataSymbols } from '../symbol';
import { type DataPoint } from '@fizz/paramodel';
import { strToId } from '../../common/utils';
import { formatBox } from '../formatter';

import { type clusterObject } from '@fizz/clustering';

import { type StaticValue } from 'lit/static-html.js';
import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { svg, nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';

/**
 * Abstract base class for views representing datapoint values
 * (e.g., bar chart bars, pie slices, etc.).
 * @public
 */
export class DatapointView extends DataView {

  declare protected _parent: SeriesView;

  //protected _isVisited = false; 
  private _isSelected = false;
  protected _extraAttrs: {attr: StaticValue, value: any}[] = [];
  protected _symbol: DataSymbol | null = null;
  // private _selectedMarker: SelectedDatapointMarker | null = null;

  constructor(seriesView: SeriesView) {
    super(seriesView.chart, seriesView.series.key);
  }

  protected _addedToParent() {
    super._addedToParent();
    this._createSymbol();
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
    return this.series[this.index];
  }

  get isSelected() {
    return this._isSelected;
  }

  set isSelected(selected: boolean) {
    this._isSelected = selected;
    // if (!selected && this._selectedMarker) {
    //   this._selectedMarker.remove();
    //   this._selectedMarker = null;
    // } else if (selected && !this._selectedMarker) {
    //   this._selectedMarker = new SelectedDatapointMarker(this, this._selectedMarkerX, this._selectedMarkerY);
    //   this.chart.parent.selectionLayer.append(this._selectedMarker);
    // } else {
    //   return;
    // }
    this.paraview.requestUpdate();
  }

  // get selectedMarker() {
  //   return this._selectedMarker;
  // }

  protected get _selectedMarkerX() {
    return 0;
  }

  protected get _selectedMarkerY() {
    return 0;
  }

  get classes(): ClassInfo {
    return {
      visited: this.paraview.store.isVisited(this.seriesKey, this.index),
      selected: this._isSelected
    };
  }

  get color(): number {
    // Only used if per-datapoint styling is enabled (`_isStyleEnabled`)
    return this.index;
  }

  get style(): StyleInfo {
    const style = super.style;
    if (this.paraview.store.isVisited(this.seriesKey, this.index)) {
      let colorValue = this.chart.paraview.store.colors.colorValue('highlight');
      style.fill = colorValue;
      style.stroke = colorValue;
      const visitedScale = this.paraview.store.settings.chart.strokeHighlightScale;
      style.strokeWidth = this.paraview.store.settings.chart.strokeWidth*visitedScale;
      return style;
    }
    return style;
  }


  get ref() {
    return this.chart.paraview.ref<SVGGElement>(this.id);
  }

  get el() {
    return this.ref.value!;
  }

  protected _createId(..._args: any[]): string {
    const facets = Object.entries(this.datapoint).map(([key, box]) => 
      `${key}_${formatBox(box, 'domId', this.paraview.store)}`).join('-');
    return [
      'datapoint',
      strToId(this.series.key),
      facets,
      `${this.index}`
    ].join('-'); 
  }
  
  protected _visit() {
    this.paraview.store.visit([{seriesKey: this.seriesKey, index: this.index}]);
  }

  onFocus() {
    super.onFocus();
    this._visit();
    this.paraview.store.announce(
      this.paraview.summarizer.getDatapointSummary(this.datapoint));
  }

  computeLayout() {}

  //// Symbols

  protected _createSymbol() {
    const series = this.seriesProps;
    let symbolType = series.symbol;
    const index = this.parent.children.indexOf(this);
    let color: number = series.color;
    const types = new DataSymbols().types;
    if (this.chart.isClustering){ 
      let clustering = this.chart.clustering as clusterObject[]
      for (let clusterId in clustering){
        if (clustering[clusterId].dataPointIDs.indexOf(index) > -1){
          color = Number(clusterId)
          symbolType = types[color % types.length]
        }
      }
    }
    this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      color
    });
    this.append(this._symbol);
  }

  layoutSymbol() {
    if (this._symbol) {
      this._symbol.x = this._x - this._symbol.width/2;
      this._symbol.y = this._y - this._symbol.height/2;
    }
  }

  protected _renderSymbol() {
    let opts = undefined;
    if (this.paraview.store.isVisited(this.seriesKey, this.index)) {
      opts = {
        scale: this.paraview.store.settings.chart.symbolHighlightScale,
        color: -1
      };
    }
    return this._symbol?.render(opts) ?? svg``;
  }

  // end symbols

  render() {
    // on g: aria-labelledby="${this.params.labelId}"
    // originally came from: xAxis.tickLabelIds[j]
    return svg`
      <g
        ${ref(this.ref)}
        id=${this.id}
        style=${Object.keys(this.style).length ? styleMap(this.style) : nothing}
        class="datapoint ${classMap(this.classes)}"
        role="datapoint"
        ${this._extraAttrs.map(attrInfo => svg`
          ${attrInfo.attr}=${attrInfo.value}
        `)}
      >
        ${this.content()}
        ${this.paraview.store.settings.chart.isDrawSymbols 
          ? this._renderSymbol() 
          : ''}
      </g>
    `;
  }

}
