
import { View, Container } from './base_view';
import { GridLayout, type Layout } from './layout';
import { type DataSymbolType, DataSymbol } from './symbol';
import { Label } from './label';
import { type LegendSettings, type DeepReadonly, SettingsManager } from '../store';
import { RectShape } from './shape/rect';
import { type ParaView } from '../paraview';
import { TemplateResult } from 'lit';
import { ClassInfo } from 'lit/directives/class-map.js';

export type SeriesAttrs = {
  color: string;
  symbol: DataSymbolType;
};

export interface LegendItem {
  label: string;
  symbol?: DataSymbolType;
  color: number;
  datapointIndex?: number;
}

export type LegendOrientation = 'horiz' | 'vert';

export interface LegendOptions {
  orientation: LegendOrientation;
  wrapWidth: number;
}

const intersperse = (...arrays: any[][]) => {
  const out: any[] = [];
  for (let i = 0; i < Math.max(...arrays.map(a => a.length)); i++) {
    arrays.forEach(array => {
      if (array[i] !== undefined) {
        out.push(array[i]);
      }
    });
  }
  return out;
};

export class Legend extends Container(View) {

  declare protected _parent: Layout;

  protected _grid!: GridLayout;
  protected _markers: RectShape[] = [];

  constructor(paraview: ParaView,
    protected _items: LegendItem[],
    protected _options: Partial<LegendOptions> = {orientation: 'vert'}
  ) {
    super(paraview);
  }

  get settings() {
    return SettingsManager.getGroupLink<LegendSettings>('legend', this.paraview.store.settings);
  }

  get classInfo() {
    return { legend: true };
  }

  protected _addedToParent() {
    const views: View[] = [];

    const hasLegendBox = this.settings.boxStyle.outline !== 'none' || this.settings.boxStyle.fill !== 'none';

    this._items.forEach(item => {
      this._markers.push(new RectShape(this.paraview, {width: 12, height: 6}));
      views.push(this._markers.at(-1)!);
      views.push(DataSymbol.fromType(
        this.paraview,
        this.paraview.store.settings.chart.isDrawSymbols
          ? (item.symbol ?? 'square.solid')
          : 'square.solid',
        {
          color: item.color,
          pointerEnter: (e) => {
            this.paraview.store.soloSeries = item.label;
          },
          pointerLeave: (e) => {
            this.paraview.store.soloSeries = '';
          }
        }
      ));
      views.push(new Label(this.paraview, {
        text: item.label,
        x: 0,
        y: 0,
        textAnchor: 'start',
        classList: ['legend-label'],
        pointerEnter: (e) => {
          this.paraview.store.soloSeries = item.label;
        },
        pointerLeave: (e) => {
          this.paraview.store.soloSeries = '';
        }
      }));
    });
    const symLabelGap = this.paraview.store.settings.legend.symbolLabelGap;
    const pairGap = this.paraview.store.settings.legend.pairGap;
    if (this._options.orientation === 'vert') {
      this._grid = new GridLayout(this.paraview, {
        numCols: 3,
        colGaps: symLabelGap,
        colAligns: ['center', 'center', 'start'],
        isAutoWidth: true,
        isAutoHeight: true
      }, 'legend-grid');
      this._grid.padding = hasLegendBox ? this.paraview.store.settings.legend.padding : 0;
      views.forEach(v => this._grid.append(v));
    } else {
      let labelsPerRow = views.length/3;
      while (true) {
        const colGaps = intersperse(
          new Array(labelsPerRow).fill(0),
          new Array(labelsPerRow).fill(symLabelGap),
          new Array(labelsPerRow - 1).fill(pairGap));
        this._grid = new GridLayout(this.paraview, {
          numCols: labelsPerRow*3,
          colGaps: colGaps,
        }, 'legend-grid');
        this._grid.padding = hasLegendBox ? this.paraview.store.settings.legend.padding : 0;
        views.forEach(v => this._grid.append(v));
        if (this._options.wrapWidth === undefined ||
            this._grid.paddedWidth <= this._options.wrapWidth ||
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
      this.prepend(new RectShape(this.paraview, {
        width: this._grid.width,
        height: this._grid.height,
        fill: this.settings.boxStyle.fill,
        stroke: this.settings.boxStyle.outline,
        strokeWidth: this.settings.boxStyle.outlineWidth
      }));
    }
    this.updateSize();
  }

  computeSize(): [number, number] {
    return [this._grid?.paddedWidth ?? 0, this._grid?.paddedHeight ?? 0];
  }

  content() {
    this._items.forEach((item, i) => {
      const style = this._markers[i].styleInfo;
      const visited = item.datapointIndex !== undefined
        ? this.paraview.store.isVisited(
          this.paraview.store.model!.seriesKeys[0], item.datapointIndex)
        : this.paraview.store.isVisitedSeries(item.label);
      if (visited) {
        style.fill = this.paraview.store.colors.colorValueAt(-1);
      } else {
        style.fill = 'none';
      }
      this._markers[i].styleInfo = style;
    });
    return super.content();
  }

}