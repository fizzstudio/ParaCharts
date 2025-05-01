
import { DataView, type SeriesView } from './';
import { DataSymbol, DataSymbols } from '../symbol';
import { type DataPointDF } from '../../store';

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
  protected extraAttrs: {attr: StaticValue, value: any}[] = [];
  protected symbol?: DataSymbol;
  protected _datapoint?: DataPointDF;
  // private _selectedMarker: SelectedDatapointMarker | null = null;

  constructor(seriesView: SeriesView) {
    super(seriesView.chart, seriesView.series.key);
  }

  protected _addedToParent() {
    super._addedToParent();
    this._createSymbol();
    this._createDatapoint();
  }
  
  protected _createDatapoint(): DataPointDF {
    return this._datapoint = this.paraview.store.model!.atKeyAndIndex(this.series.key, this.index)!;
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

  get datapoint(): DataPointDF {
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

  get style(): StyleInfo {
    if (this.paraview.store.isVisited(this.seriesKey, this.index)) {
      const style: StyleInfo = {};
      let colorValue = this.chart.paraview.store.colors.colorValue('highlight');
      style.fill = colorValue;
      style.stroke = colorValue;
      return style;
    }
    return {};
  }


  get ref() {
    return this.chart.paraview.ref<SVGGElement>(this.id);
  }

  get el() {
    return this.ref.value!;
  }

  protected _visit() {
    this.paraview.store.visit([{seriesKey: this.seriesKey, index: this.index}]);
  }

  onFocus() {
    super.onFocus();
    this._visit();
    this.paraview.store.announce(
      this.paraview.summarizer.getDatapointSummary(this.seriesKey, this.index));
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
    this.symbol = DataSymbol.fromType(this.paraview, symbolType, {
      strokeWidth: this.paraview.store.settings.chart.symbolStrokeWidth,
      color
    });
    this.append(this.symbol);
  }

  layoutSymbol() {
    if (this.symbol) {
      this.symbol.x = this._x - this.symbol.width/2;
      this.symbol.y = this._y - this.symbol.height/2;
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
    return this.symbol?.render(opts) ?? svg``;
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
        ${this.extraAttrs.map(attrInfo => svg`
          ${attrInfo.attr}=${attrInfo.value}
        `)}
      >
        ${this.content()}
        ${this.chart.settings.isDrawSymbols 
          ? this._renderSymbol() 
          : ''}
      </g>
    `;
  }

}
