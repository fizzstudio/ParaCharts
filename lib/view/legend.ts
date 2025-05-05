
import { View, Container } from './base_view';
import { GridLayout, type Layout } from './layout';
import { type DataSymbolType, DataSymbol } from './symbol';
import { Label } from './label';
import { type LegendSettings, type DeepReadonly, SettingsManager } from '../store';
import { Rect } from './shape/rect';
import { type ParaView } from '../paraview';

export type SeriesAttrs = {
  color: string;
  symbol: DataSymbolType;
};

export interface LegendItem {
  label: string;
  symbol?: DataSymbolType;
  color: number;
}

export type LegendOrientation = 'horiz' | 'vert';

export interface LegendOptions {
  orientation: LegendOrientation;
  wrapWidth: number;
}

const intersperse = (a: any[], b: any[]) => {
  const out: any[] = [];
  a.forEach((x, i) => {
    out.push(x);
    if (b[i] !== undefined) {
      out.push(b[i]);
    }
  });
  return out;
};

export class Legend extends Container(View) {

  declare protected _parent: Layout;
  declare protected _settings: DeepReadonly<LegendSettings>;

  protected _grid!: GridLayout;

  constructor(paraview: ParaView,
    protected _items: LegendItem[],
    protected _options: Partial<LegendOptions> = {orientation: 'vert'}
  ) {
    super(paraview);
  }

  get settings() {
    return this._settings;
  }

  protected _addedToParent() {
    this._settings = SettingsManager.getGroupLink('legend', this.paraview.store.settings);

    const views: View[] = [];

    const hasLegendBox = this._settings.boxStyle.outline !== 'none' || this._settings.boxStyle.fill !== 'none';

    //this.paraview.store.model!.keys.forEach(seriesKey => {
    //  const series = this.paraview.store.seriesProperties!.properties(seriesKey);
    this._items.forEach(item => {
      views.push(DataSymbol.fromType(
        this.paraview,
        this.paraview.store.settings.chart.isDrawSymbols
          ? (item.symbol ?? 'square.solid')
          : 'square.solid',
        {
          color: item.color
        }
      ));
      views.push(new Label(this.paraview, {text: item.label, x: 0, y: 0, textAnchor: 'start'}));
    });
    const symLabelGap = this.paraview.store.settings.legend.symbolLabelGap;
    const pairGap = this.paraview.store.settings.legend.pairGap;   
    if (this._options.orientation === 'vert') {
      this._grid = new GridLayout(this.paraview, {
        numCols: 2,
        colGaps: symLabelGap,
        colAligns: ['center', 'start']
      }, 'legend-grid');
      this._grid.padding = hasLegendBox ? this.paraview.store.settings.legend.padding : 0;
      views.forEach(v => this._grid.append(v));
    } else {
      let labelsPerRow = views.length/2;
      while (true) {
        const colGaps = intersperse(
          new Array(labelsPerRow).fill(symLabelGap),
          new Array(labelsPerRow - 1).fill(pairGap));
        this._grid = new GridLayout(this.paraview, {
          numCols: labelsPerRow*2,
          colGaps: colGaps,
        }, 'legend-grid');  
        this._grid.padding = hasLegendBox ? this.paraview.store.settings.legend.padding : 0;
        views.forEach(v => this._grid.append(v));
        if (this._options.wrapWidth === undefined || 
            this._grid.boundingWidth <= this._options.wrapWidth || 
            labelsPerRow === 1) {
          break;
        }
        labelsPerRow--;
        // This is necessary to unset v.parent; it does have the side-effect
        // of resizing the grid, which isn't really necessary
        views.forEach(v => v.remove());
      }
      this._grid.colAligns = intersperse(
        new Array(labelsPerRow).fill('center'),
        new Array(labelsPerRow).fill('start'));
    }
    this.append(this._grid);
    // this.prepend(new Rect(this._width, this._height, 'white'));

    if (hasLegendBox) {
      this.prepend(new Rect(this.paraview, this._width, this._height, 
        this._settings.boxStyle.fill, this._settings.boxStyle.outline, this._settings.boxStyle.outlineWidth));
    }
  }

  computeSize(): [number, number] {
    return [this._grid?.boundingWidth ?? 0, this._grid?.boundingHeight ?? 0];
  }

}