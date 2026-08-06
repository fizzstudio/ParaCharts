import { ClassInfo } from 'lit/directives/class-map.js';
import { TemplateResult, svg } from 'lit';
import { View, Container } from './base_view';
import { SimpleGridLayout, type Layout } from './layout';
import { type DataSymbolType, DataSymbol, DataSymbolOptions } from './symbol';
import { Label } from './label';
import { SettingsManager } from '../state';
import { RectShape } from './shape/rect';
import { type ViewContext } from './view_context';
import { HIGHLIGHT_PADDING } from '../common';
import { type CardinalDirection, type LegendConfig } from '../config/config_types';
import { type ScatterChartInfo } from '../chart_types/scatter_chart';
import { BubblePlotView } from './layers/data/chart_type/bubble_plot_view';

export type SeriesAttrs = {
  color: string;
  symbol: DataSymbolType;
};

export interface LegendItem {
  label: string;
  seriesKey: string;
  symbol?: DataSymbolType;
  symbolOptions?: Partial<DataSymbolOptions>;
  colorIndex: number;
  datapointIndex?: number;
  bubbleSize?: "small" | "medium" | "large"
}

export type LegendOrientation = 'horiz' | 'vert';

export interface LegendOptions {
  orientation: LegendOrientation;
  wrapWidth: number;
  rowGap: number;
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

  protected _grid!: SimpleGridLayout;
  //protected _markers: RectShape[] = [];

  constructor(paraview: ViewContext,
    protected _items: LegendItem[],
    protected _options: Partial<LegendOptions> = { orientation: 'vert' }
  ) {
    super(paraview);
  }

  get config() {
    return SettingsManager.getGroupLink<LegendConfig>('legend', this.paraview.paraState.config);
  }

  get classInfo() {
    return { legend: true };
  }

  protected _addedToParent() {
    const views: View[] = [];

    const hasLegendBox = this.config.boxStyle.outline !== 'none' || this.config.boxStyle.fill !== 'none';

    this._items.forEach(item => {
      //this._markers.push(new RectShape(this.paraview, { width: 12, height: 6 }));
      //views.push(this._markers.at(-1)!);
      views.push(DataSymbol.fromType(
        this.paraview,
        this.paraview.paraState.config.chart.isDrawSymbols
          ? (item.symbol ?? 'square.solid')
          : 'square.solid',
        {
          colorIndex: item.colorIndex,
          lighten: item.symbolOptions?.lighten ?? false,
          baseSize: item.symbolOptions?.baseSize ?? 1,
          dashed: item.symbolOptions?.dashed ?? false,
          pointerEnter: (e) => {
            this.pointerEnterActions(item);
          },
          pointerLeave: (e) => {
            this.pointerLeaveAction(item);
          },
          click: (e) => {
            this.clickAction(item);
          }
        }
      ));
      if (item.bubbleSize) {
        views.at(-1)!.styleInfo = { fill: "hsl(0, 0%, 90%)", ...views.at(-1)!.styleInfo };
      }
      views.push(new Label(this.paraview, {
        text: item.label,
        x: 0,
        y: 0,
        //textAnchor: 'start',
        classList: ['legend-label'],
        pointerEnter: (e) => {
          this.pointerEnterActions(item);
        },
        pointerLeave: (e) => {
          this.pointerLeaveAction(item);
        },
        click: (e) => {
          this.clickAction(item);
        }
      }));
    });
    const symLabelGap = this.paraview.paraState.config.legend.symbolLabelGap;
    const pairGap = this.paraview.paraState.config.legend.pairGap;
    let labelsPerRow = views.length / 2;
    if (this._options.orientation === 'vert') {
      this._grid = new SimpleGridLayout(this.paraview, {
        numCols: 2,
        colGaps: symLabelGap,
        colAligns: ['center', 'start'],
        rowGaps: this._options.rowGap ? new Array(labelsPerRow + 1).fill(this._options.rowGap) : undefined
      }, 'legend-grid');
      this._grid.padding = hasLegendBox ? this.paraview.paraState.config.legend.padding : 0;
      views.forEach(v => this._grid.append(v));
    } else {
      while (true) {
        const colGaps = intersperse(
          //new Array(labelsPerRow).fill(0),
          new Array(labelsPerRow).fill(symLabelGap),
          new Array(labelsPerRow - 1).fill(pairGap));
        this._grid = new SimpleGridLayout(this.paraview, {
          numCols: labelsPerRow * 2,
          colGaps: colGaps,
          rowGaps: new Array(labelsPerRow + 1).fill(this._options.rowGap)
        }, 'legend-grid');
        this._grid.padding = hasLegendBox ? this.paraview.paraState.config.legend.padding : 0;
        views.forEach(v => this._grid.append(v));
        this._grid.updateSize();
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
        //new Array(labelsPerRow).fill('center'),
        new Array(labelsPerRow).fill('center'),
        new Array(labelsPerRow).fill('start'));
    }
    this._grid.layoutViews();
    this.append(this._grid);
    // this.prepend(new Rect(this._width, this._height, 'white'));

    if (hasLegendBox) {
      this.prepend(new RectShape(this.paraview, {
        width: this._grid.width,
        height: this._grid.height,
        fill: this.config.boxStyle.fill,
        stroke: this.config.boxStyle.outline,
        strokeWidth: this.config.boxStyle.outlineWidth
      }));
    }
    this.updateSize();
  }

  protected pointerEnterActions(item: LegendItem) {
    if (item.bubbleSize) {
      if (this.paraview.paraState.pinnedBubbleSize !== null) return;
      (this.paraview.documentView?.chartLayers.dataLayer as BubblePlotView).dimOtherSizes(item.bubbleSize);
      return;
    }
    if (this.paraview.paraState.isSeriesHidden(item.seriesKey)) return;
    if (this.paraview.paraState.pinnedSeriesKey !== null) return;

    if ((this.paraview.paraState.chartInfo as ScatterChartInfo).clustering
      && !this.paraview.paraState.model?.multi) {
      this.paraview.paraState.dimOtherCluster(item.seriesKey, item.colorIndex)
      return;
    }
    this.paraview.paraState.dimOtherSeries(item.seriesKey);
  }

  protected pointerLeaveAction(item: LegendItem) {
    if (item.bubbleSize) {
      if (this.paraview.paraState.pinnedBubbleSize !== null) return;
      this.paraview.paraState.clearAllPointsDimming();
    }

    if (this.paraview.paraState.pinnedSeriesKey !== null) return;
    this.paraview.paraState.clearAllSeriesDimming();

  }

  protected clickAction(item: LegendItem) {
    if (item.bubbleSize) {
      if (this.paraview.paraState.pinnedBubbleSize === item.bubbleSize
        || this.paraview.paraState.isSizeHidden(item.bubbleSize)
      ) {
        if (this.paraview.paraState.isSizeHidden(item.bubbleSize)) {
          (this.paraview.documentView?.chartLayers.dataLayer as BubblePlotView).unhideSize(item.bubbleSize)
        }
        else {
          (this.paraview.documentView?.chartLayers.dataLayer as BubblePlotView).unpinBubbleSize();
          (this.paraview.documentView?.chartLayers.dataLayer as BubblePlotView).hideSize(item.bubbleSize);
        }
      }
      else {
        (this.paraview.documentView?.chartLayers.dataLayer as BubblePlotView).pinBubbleSize(item.bubbleSize);
      }
      return;
    }
    if (this.paraview.paraState.pinnedSeriesKey === item.seriesKey
      || this.paraview.paraState.isSeriesHidden(item.seriesKey)
    ) {
      if (this.paraview.paraState.isSeriesHidden(item.seriesKey)) {
        this.paraview.paraState.unhideSeries(item.seriesKey)
      }
      else {
        this.paraview.paraState.unpinSeries();
        this.paraview.paraState.hideSeries(item.seriesKey)
      }
    } else {
      this.paraview.paraState.pinSeries(item.seriesKey);
    }
  }

  computeSize(): [number, number] {
    return [this._grid?.paddedWidth ?? 0, this._grid?.paddedHeight ?? 0];
  }

  makeDirect(dir: CardinalDirection) {
    const bundledItems = [];
    const alreadyMoved: number[] = [];
    const dataLayer = this.paraview.documentView?.chartLayers.dataLayer!;
    const clv = dataLayer.chartLandingView!;
    //NB Sam: I don't know where this comes from but it aligns the horizontal direct legends correctly by eye
    const WEIRD_MAGIC_NUMBER = 70;
    if (dir == "east" || dir == "west") {
      if (['bar'].includes(this.paraview.paraState.type)) {
        return;
      }
      for (let i = 0; i < this._items.length; i++) {
        let newY = 0;
        if (dir == "east") {
          const lastDatapointView = clv.getSeriesView(this._items[i].seriesKey)!.children.at(-1)!;
          newY = lastDatapointView.centerY;
        }
        else if (dir == "west") {
          const firstDatapointView = clv.getSeriesView(this._items[i].seriesKey)!.children.at(0)!;
          newY = firstDatapointView.centerY;
        }
        this._grid.children[3 * i].centerY = newY;
        this._grid.children[3 * i + 1].centerY = newY;
        this._grid.children[3 * i + 2].centerY = newY;
        bundledItems.push([this._grid.children[3 * i], this._grid.children[3 * i + 1], this._grid.children[3 * i + 2]])
      }
      const sortedItems = bundledItems.toSorted((a, b) => a[2].y - b[2].y);
      for (let i = 0; i < sortedItems.length; i++) {
        for (let j = i + 1; j < sortedItems.length; j++) {
          const child1 = sortedItems[i][2];
          const child2 = sortedItems[j][2];
          if (child1.intersects(child2)) {
            const midpoint = (child1.y + child2.y) / 2;
            if (!alreadyMoved.includes(i)) {
              sortedItems[i].forEach(c => c.y -= (child1.bottom - midpoint));
              sortedItems[j].forEach(c => c.y += (midpoint - child2.top));
            }
            else {
              sortedItems[j].forEach(c => c.y += (midpoint - child2.top) + (child1.bottom - midpoint));
            }
            alreadyMoved.push(i, j);
          }
        }
      }
    }
    else if (dir == "north" || dir == "south") {
      if (['column', 'line', 'scatter'].includes(this.paraview.paraState.type)) {
        return;
      }
      for (let i = 0; i < this._items.length; i++) {
        let newX = 0;
        if (dir == "south") {
          const lastDatapointView = clv.getSeriesView(this._items[i].seriesKey)!.children.at(-1)!;
          newX = dataLayer.height - lastDatapointView.centerY - this.x + WEIRD_MAGIC_NUMBER;
        }
        else if (dir == "north") {
          const firstDatapointView = clv.getSeriesView(this._items[i].seriesKey)!.children.at(0)!;
          newX = dataLayer.height - firstDatapointView.centerY - this.x + WEIRD_MAGIC_NUMBER;
        }
        const leftDiff = this._grid.children[3 * i + 2].centerX - this._grid.children[3 * i].centerX;
        const middleDiff = this._grid.children[3 * i + 2].centerX - this._grid.children[3 * i + 1].centerX;
        this._grid.children[3 * i].centerX = newX - leftDiff;
        this._grid.children[3 * i + 1].centerX = newX - middleDiff;
        this._grid.children[3 * i + 2].centerX = newX;
        bundledItems.push([this._grid.children[3 * i], this._grid.children[3 * i + 1], this._grid.children[3 * i + 2]])
      }
      const sortedItems = bundledItems.toSorted((a, b) => a[2].y - b[2].y);
      for (let i = 0; i < sortedItems.length; i++) {
        for (let j = i + 1; j < sortedItems.length; j++) {
          const child1 = sortedItems[i][2];
          const child2 = sortedItems[j][2];
          if (sortedItems[i][2].intersects(sortedItems[j][0])
            || sortedItems[i][2].intersects(sortedItems[j][1])
            || sortedItems[i][2].intersects(sortedItems[j][2])) {
            const midpoint = (child1.y + child2.y) / 2;
            if (!alreadyMoved.includes(i)) {
              sortedItems[j].forEach(c => c.y += child1.height);
            }
            else {
              sortedItems[j].forEach(c => c.y += (midpoint - child2.top) + (child1.bottom - midpoint));
            }
            alreadyMoved.push(i, j);
          }
        }
      }
    }
  }

  renderHighlight(type: 'fg' | 'bg') {
    return svg`
      <rect
        x=${this.x + this.padding.left - HIGHLIGHT_PADDING / 2}
        y=${this.y + this.padding.top - HIGHLIGHT_PADDING / 2}
        width=${this.width + HIGHLIGHT_PADDING}
        height=${this.height + HIGHLIGHT_PADDING}
        class="view-highlight-${type}"
      ></rect>
    `;
  }

  content() {
    this._items.forEach((item, i) => {
      //const style = this._markers[i].styleInfo;
      let visited = item.datapointIndex !== undefined
        ? this.paraview.paraState.isVisited(
          this.paraview.paraState.model!.seriesKeys[0], item.datapointIndex)
        : this.paraview.paraState.isVisitedSeries(item.label);
      let hidden = this.paraview.paraState.isSeriesHidden(item.seriesKey) ? true : false;
      if (this.paraview.paraState.pinnedSeriesKey == item.seriesKey) {
        visited = true;
      }
      if (item.bubbleSize) {
        visited = false;
        hidden = false;
        if (this.paraview.paraState.isSizeHidden(item.bubbleSize)) {
          hidden = true
        }

        if (this.paraview.paraState.pinnedBubbleSize == item.bubbleSize) {
          visited = true;
        }
      }
      this._grid.children[(i) * 2 + 1].isSelected = visited
      this._grid.children[(i) * 2 + 1].isHidden = hidden
      //this._markers[i].styleInfo = style;
    });
    return super.content();
  }

}