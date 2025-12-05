/* ParaCharts: The Document View
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { Logger, getLogger } from '@fizz/logger';
import { type BaseChartInfo, chartInfoClasses, PlaneChartInfo } from '../chart_types';
import { View, Container, Padding } from './base_view';
import { Label } from './label';
import { type CardinalDirection, ParaStore, Setting } from '../store';
import { Facet, type ChartType } from '@fizz/paramanifest';
import { PlotLayerManager } from './layers';
import { HorizAxis, VertAxis, type AxisCoord } from './axis';
import { Legend } from './legend';
import { DirectLabelStrip } from './direct_label_strip';
import { type LinePlotView } from './layers';
import { type ParaView } from '../paraview';
import { AxisInfo, AxisLabelInfo } from '../common';

export type Legends = Partial<{[dir in CardinalDirection]: Legend}>;

/**
 * Root of the view hierarchy.
 */
export class DocumentView extends Container(View) {

  readonly type: ChartType;
  protected _chartInfo!: BaseChartInfo;
  protected _chartLayers!: PlotLayerManager;
  protected _directLabelStrip: DirectLabelStrip | null = null;
  protected _titleLabel?: Label;
  protected _horizAxis?: HorizAxis;
  protected _vertAxis?: VertAxis;
  protected _titleText!: string;
  protected _legends: Legends = {};

  protected _store: ParaStore;

  constructor(paraview: ParaView) {
    super(paraview);
    this.log = getLogger('DocumentView');
    this._store = paraview.store;
    this.observeNotices();
    this.type = this._store.type;
  }

  init() {
    // @ts-ignore
	  this._chartInfo = new chartInfoClasses[this.type](this.type, this.paraview);
    this.setTitleText(this._store.title);

    const expandedPadding = this._parsePadding(this._store.settings.chart.padding);
    // XXX temp hack for cpanel icon
    const leftPad = Math.max(8 + 1.1*16, expandedPadding.left);
    this.padding = {
      left: leftPad,
      right: expandedPadding.right,
      top: expandedPadding.top,
      bottom: expandedPadding.bottom
    };

    this.updateSize();
    this._populate();
  }

  computeSize(): [number, number] {
    return [
      this._store.settings.chart.size.width - this._padding.left - this._padding.right,
      this._store.settings.chart.size.height - this._padding.top - this._padding.bottom
    ];
  }

  /**
   * Parse `padding` like CSS padding (1-4 numbers, same order as CSS)
   */
  protected _parsePadding(padding: string): Padding {
    const vals = padding.trim().split(' ');
    if (vals.length === 0) {
      throw new Error(`must supply between 1 and 4 values for chart padding`);
    }
    if (vals.length === 1) {
      return this._expandPadding(parseFloat(vals[0]));
    } else if (vals.length === 2) {
      return this._expandPadding({
        vert: parseFloat(vals[0]),
        horiz: parseFloat(vals[1])
      });
    } else if (vals.length === 3) {
      return this._expandPadding({
        top: parseFloat(vals[0]),
        horiz: parseFloat(vals[1]),
        bottom: parseFloat(vals[2])
      });
    } else {
      return this._expandPadding({
        top: parseFloat(vals[0]),
        right: parseFloat(vals[1]),
        bottom: parseFloat(vals[2]),
        left: parseFloat(vals[3])
      });
    }
  }

  protected _populate() {
    if (this._store.settings.chart.title.isDrawTitle && this._store.title) {
      this.createTitle();
    }

    // const horizAxisPos = this._store.settings.axis.horiz.position;

    const horizFacet = this.chartInfo.getFacetForOrientation('horiz');
    const vertFacet = this.chartInfo.getFacetForOrientation('vert');
    //const axisInfo = this._chartInfo.axisInfo;

    // Initially create axes to compute the size of each axis
    // along the shorter dimension
    if (this._store.settings.axis.horiz.isDrawAxis && horizFacet) {
      this._createHorizAxis(horizFacet!, this._chartInfo as PlaneChartInfo, this._width);
      // console.log('H-AXIS HEIGHT', this._horizAxis!.height);
    }
    if (this._store.settings.axis.vert.isDrawAxis && vertFacet) {
      this._createVertAxis(vertFacet!, this._chartInfo as PlaneChartInfo, this._height);
      // console.log('V-AXIS WIDTH', this._vertAxis!.width);
    }

    // Create any west legend bc it affects the position of the vert axis
    if (this._shouldAddLegend && this._store.settings.legend.position === 'west' && this._store.type !== 'venn') {
      this.createLegend('west');
    }

    if (this._shouldAddLegend && this._store.settings.legend.position === 'south' && this._store.type !== 'venn') {
      this.createLegend('south');
    }

    // Recreate the axes using the size info computed above
    if (this._store.settings.axis.vert.isDrawAxis && vertFacet) {
      this._createVertAxis(vertFacet!, this._chartInfo as PlaneChartInfo, this._height
        - (this._titleLabel?.paddedHeight || 0)
        - (this._horizAxis?.height || 0));
      this.append(this._vertAxis!);
      this._vertAxis!.left = this._legends.west?.paddedRight ?? this.left;
      if (this._store.settings.chart.title.position === 'top') {
        this._vertAxis!.top = this._titleLabel!.paddedBottom;
      } else {
        // this._vertAxis!.bottom = this._titleLabel!.paddedTop;
        this._vertAxis!.top = this.top;
      }
    }

    // Create the direct label strip here so it can take its height from
    // the vertical axis
    const shouldAddDirectLabelStrip = this._store.settings.chart.hasDirectLabels
      && this.type === 'line'
      && /*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
        this._store.model!.multi;
    if (shouldAddDirectLabelStrip) {
      this._directLabelStrip?.remove();
      this._directLabelStrip = new DirectLabelStrip(
        this.paraview, this._vertAxis?.height ?? this._height);
      this._directLabelStrip.updateSize();
    }

    if (this._shouldAddLegend && this._store.settings.legend.position === 'east' && this._store.type !== 'venn') {
      this.createLegend('east');
    }

    if (this._store.settings.axis.horiz.isDrawAxis && horizFacet) {
      this._createHorizAxis(horizFacet!, this._chartInfo as PlaneChartInfo, this._width
        - (this._vertAxis?.width ?? 0)
        - (this._directLabelStrip?.width ?? 0)
        - (this._legends.east?.width ?? this._legends.west?.width ?? 0));
      this.append(this._horizAxis!);
      if (this._store.settings.chart.title.position === 'top') {
        this._horizAxis!.bottom = this.bottom;
      } else {
        this._horizAxis!.bottom = this._titleLabel!.paddedTop;
      }
      this._horizAxis!.left = this._vertAxis?.right ?? 0;
    }

    ////////////////////////////////////////////
    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    // const horizAxisFacet = this._store.model!.getAxisFacet('horiz') ?? this._store.model!.facetMap['x']!;
    // const vertAxisFacet = this._store.model!.getAxisFacet('vert') ?? this._store.model!.facetMap['y']!;
    ////////////////////////////////////////////

    // Update tick label IDs now that JIM selectors have been created
    //this._horizAxis.updateTickLabelIds();
    // this._vertAxis.updateTickLabelIds();

    // XXX Change this method to set axis.titleText
    this._titleText = this._store.title
      ?? this._store.settings.chart.title.text;
      //?? `${this._vertAxis.titleText} by ${this._horizAxis.titleText}`;

    const plotWidth = this._width
      - (this._vertAxis?.width ?? 0)
      - (this._directLabelStrip?.width ?? 0)
      - (this._legends.east?.width ?? this._legends.west?.width ?? 0);
    const plotHeight = this._height
      - (this._horizAxis?.height ?? 0)
      - (this._titleLabel?.paddedHeight ?? 0)
      - (this._legends.south?.paddedHeight ?? 0);
    this._chartLayers?.remove();
    this._chartLayers = new PlotLayerManager(this, plotWidth, plotHeight);
    this._chartLayers.dataLayer.init();
    this.append(this._chartLayers);
    this._chartLayers.left = this._vertAxis?.right ?? this._legends.west?.right ?? 0;
    this._chartLayers.bottom = this._horizAxis?.top ?? this._height;

    // At this point, we're fully connected to the root of the view tree,
    // so we can safely observe
    this._chartLayers.dataLayer.observeStore();
    this._chartLayers.dataLayer.observeNotices();

    if (this._directLabelStrip) {
      this.insert(this._directLabelStrip, -1);
      this._directLabelStrip.left = this._chartLayers.right;
      this._directLabelStrip.top = this._chartLayers.top;
    }

    if (this._legends.east) {
      this._legends.east.left = this._chartLayers.right;
      this._legends.east.top = this._chartLayers.top;
    }
    if (this._legends.west) {
      this._legends.west.left = this.left;
      this._legends.west.top = this._chartLayers.top;
    }
    if (this._legends.south) {
      this._legends.south.bottom = this.bottom;
      this._legends.south.centerX = this.centerX;
    }

    if (this._horizAxis) {
      this._horizAxis.addGridRules(this._chartLayers.height);
    }
    if (this._vertAxis) {
      this._vertAxis.addGridRules(this._chartLayers.width);
    }

  }

  protected _createHorizAxis(facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    this._horizAxis?.remove();
    this._horizAxis = new HorizAxis(this.paraview, facet, chartInfo, length);
    const horizAxisFacet = this._chartInfo.horizFacet!;
    this._horizAxis.setAxisLabelText(horizAxisFacet.label);
    this._horizAxis.createComponents();
    this._horizAxis.layoutComponents();
    this._horizAxis.updateSize();
  }

  protected _createVertAxis(facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    this._vertAxis?.remove();
    this._vertAxis = new VertAxis(this.paraview, facet, chartInfo, length);
    const vertAxisFacet = this._chartInfo.vertFacet!;
    this._vertAxis.setAxisLabelText(vertAxisFacet.label);
    this._vertAxis.createComponents();
    this._vertAxis.layoutComponents();
    this._vertAxis.updateSize();
  }

  protected get _shouldAddLegend(): boolean {
    return this._store.settings.legend.isDrawLegend &&
      (this._store.settings.legend.isAlwaysDrawLegend
        // XXX direct label strip won't exist when this is called
        || (this._directLabelStrip && this._store.settings.chart.hasLegendWithDirectLabels)
        || (!this._directLabelStrip && this._store.model!.multi));
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this._chartInfo.settingDidChange(path, oldValue, newValue);
    if (['chart.size.width', 'chart.size.height', 'chart.fontScale'].includes(path)) {
      this.updateSize();
      this._populate();
      //this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  async storeDidChange(key: string, value: any): Promise<void> {
    await super.storeDidChange(key, value);
    return this._chartInfo.storeDidChange(key, value);
  }

  // noticePosted(key: string, value: any): void {
  //   this.log.info('NOTICE', key);
  //   if (key === 'animRevealEnd') {
  //     const shouldAddDirectLabelStrip = this._store.settings.chart.hasDirectLabels
  //       && this.type === 'line'
  //       && /*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
  //         this._store.model!.multi;
  //     if (shouldAddDirectLabelStrip) {
  //       const horizAxisPos = this._store.settings.axis.horiz.position;
  //       const plotRow = (this._chartInfo.axisInfo && horizAxisPos === 'north'
  //         ? 1
  //         : 0) + (this._titleLabel ? 1 : 0);
  //       this.log.info('PLOT ROW', plotRow);
  //       // this._directLabelStrip = new DirectLabelStrip(this._chartLayers.dataLayer as LinePlotView);
  //       // this._grid.append(this._directLabelStrip, {
  //       //   x: 2,
  //       //   y: plotRow,
  //       //   height: 1
  //       // });
  //     }
  //   }
  // }

  get chartInfo() {
    return this._chartInfo;
  }

  protected _createId() {
    return 'doc-view';
  }

  get role() {
    return 'graphics-document';
  }

  get roleDescription() {
    return `${this.type} chart`;
  }

  get chartLayers() {
    return this._chartLayers;
  }

  get titleText() {
    return this._titleText;
  }

  setTitleText(text?: string) {
    this._titleText = text
      ?? this._store.settings.chart.title.text
      ?? '[TITLE]';
    if (this._titleLabel) {
      this._titleLabel.text = this._titleText;
    }
  }

  get horizAxis() {
    return this._horizAxis;
  }

  get vertAxis() {
    return this._vertAxis;
  }

  get xAxis() {
    return this.getAxisForCoord('x');
  }

  get yAxis() {
    return this.getAxisForCoord('y');
  }

  getAxisForCoord(coord: AxisCoord) {
    if (this._horizAxis?.coord === coord) {
      return this._horizAxis;
    } else if (this._vertAxis?.coord === coord) {
      return this._vertAxis;
    }
    this.log.info('no axis!', this._horizAxis, this._vertAxis, coord)
    return undefined;
  }

  /*protected get _hotkeyActions() {
    return hotkeyActions.global;
  }

  get keymap() {
    return keymaps.global;
  }*/

  private createTitle() {
    const align = this._store.settings.chart.title.align ?? 'center';
    this._titleLabel?.remove();
    this._titleLabel = new Label(this.paraview, {
      id: 'chart-title',
      role: 'heading',
      classList: ['chart-title'],
      text: this._titleText,
      wrapWidth: this._width,
      justify: align
    });
    const isTop = this._store.settings.chart.title.position === 'top';
    this._titleLabel.padding = {
      top: isTop ? 0 : this._store.settings.chart.title.margin,
      right: 0,
      bottom: isTop ? this._store.settings.chart.title.margin : 0,
      left: 0
    };
    this._titleLabel.canHeightFlex = false;
    let titleRow = 0;
    const titleMargin = this._store.settings.chart.title.margin;
    const titlePos = this._store.settings.chart.title.position;
    this.append(this._titleLabel);
    if (isTop) {
      this._titleLabel.top = this.top;
    } else {
      this._titleLabel.bottom = this.bottom;
    }
    if (align === 'start') {
      this._titleLabel.left = this.left;
    } else if (align === 'end') {
      this._titleLabel.right = this.right;
    } else {
      this._titleLabel.centerX = this.centerX;
    }
  }

  protected _childDidResize(_kid: View) {
    this.updateSize(false);
  }

  protected _boundingSizeDidChange() {
    this.paraview.computeViewBox();
  }

  /*updateAllKeymaps() {
    const update = (v: View) => {
      v.updateKeymap();
      v.children.forEach(update);
    };
    update(this);
  }*/

  createLegend(position: CardinalDirection) {
    const items = this._chartInfo.legend();
    const margin = this._store.settings.legend.margin;
    if (position === 'east') {
      this._legends.east?.remove();
      this._legends.east = new Legend(this.paraview, items);
      this._legends.east.padding = {
        top: 0,
        right: 0,
        bottom: 0,
        left: margin
      };
      this.append(this._legends.east);
      // this._legends.east.updateSize();
      // this._grid.setColGap(this._directLabelStrip ? 2 : 1, margin);
    } else if (position === 'west') {
      this._legends.west?.remove();
      this._legends.west = new Legend(this.paraview, items);
      this._legends.west.padding = {
        top: 0,
        right: margin,
        bottom: 0,
        left: 0
      };
      this.append(this._legends.west);
      // this._grid.addColumnLeft();
    } else if (position === 'south') {
      this._legends.south?.remove();
      this._legends.south = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: 300 // this._chartLayers.paddedWidth
      });
      this._legends.south.padding = {
        top: margin,
        right: 0,
        bottom: 0,
        left: 0
      };
      this.append(this._legends.south);
    } else if (position === 'north') {
      this._legends.north?.remove();
      this._legends.north = new Legend(this.paraview, items, {
        orientation: 'horiz',
        wrapWidth: this._chartLayers.paddedWidth
      });
      // this._grid.insertRow(this._store.settings.chart.title.isDrawTitle && this._store.title ? 1 : 0);
      // this._grid.append(this._legends.north, {
      //   x: 1,
      //   y: 0,
      //   width: 1,
      //   colAlign: 'center',
      //   //margin: {bottom: margin}
      // });
    }
  }

}