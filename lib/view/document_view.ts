/* ParaCharts: The Document View
Copyright (C) 2025 Fizz Studio

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
import { ParaState } from '../state';
import { CardinalDirection, ConfigSetting } from '../config/config_types';
import { Facet, type ChartType } from '@fizz/paramanifest';
import { PlotLayerManager } from './layers';
import { HorizAxis, LabelOverlapError, VertAxis, type AxisCoord } from './axis';
import { Legend } from './legend';
import { DirectLabelStrip } from './direct_label_strip';
import { type LinePlotView } from './layers';
import { type ParaView } from '../paraview';
import { AxisInfo, AxisLabelInfo } from '../common';
import { svg, nothing } from 'lit';
import { CloseXView } from './close_x';

export type Legends = Partial<{ [dir in CardinalDirection]: Legend }>;

/**
 * Root of the view hierarchy.
 */
export class DocumentView extends Container(View) {
  declare public readonly paraview: ParaView;

  readonly type: ChartType;
  protected _titleLabel?: Label;
  protected _subtitleLabel?: Label;
  protected _chartLayers!: PlotLayerManager;
  protected _directLabelStrip: DirectLabelStrip | null = null;
  protected _horizAxis?: HorizAxis;
  protected _vertAxis?: VertAxis;
  protected _titleText!: string;
  protected _legends: Legends = {};
  protected _closeX: CloseXView;

  protected _paraState: ParaState;

  constructor(paraview: ParaView) {
    super(paraview);
    this.log = getLogger('DocumentView');
    this._paraState = paraview.paraState;
    this.observeNotices();
    this.type = this._paraState.type;
    this._closeX = new CloseXView(paraview, () => {
      paraview.paraChart.api.doAction('openExplainer');
    });
    this._closeX.updateSize();
  }

  init() {
    this.setTitleText(this._paraState.title);

    const expandedPadding = this._parsePadding(this._paraState.config.chart.padding);
    // XXX temp hack for cpanel icon
    const leftPad = Math.max(8 + 1.1 * 16, expandedPadding.left);
    this.padding = {
      left: leftPad,
      right: expandedPadding.right,
      top: expandedPadding.top,
      bottom: expandedPadding.bottom
    };
    this.updateSize();
    this._populate();
    this._closeX.right = this.paddedRight;
    this._closeX.top = this.paddedTop;
  }

  computeSize(): [number, number] {
    return [
      this._paraState.config.chart.width - this._padding.left - this._padding.right,
      this._paraState.config.chart.height - this._padding.top - this._padding.bottom
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
    if (this._paraState.config.chart.title.isDrawTitle && this._paraState.title) {
      this.createTitle();
    }
    if (this._paraState.config.chart.subtitle.isDrawSubtitle
      && this._paraState.chartInfo.conciseSummary
    ) {
      this._createSubtitle();
    }
    this._positionTitles();

    if (this._shouldAddLegend && this._paraState.config.legend.position === 'north' && this._paraState.type !== 'venn') {
      this.createLegend('north');
    }

    // const horizAxisPos = this._paraState.settings.axis.horiz.position;

    const horizFacet = this.paraview.paraState.chartInfo.getFacetForOrientation('horiz');
    const vertFacet = this.paraview.paraState.chartInfo.getFacetForOrientation('vert');
    //const axisInfo = this._chartInfo.axisInfo;

    // Initially create axes to compute the size of each axis
    // along the shorter dimension
    if (this._paraState.config.axis.horiz.isDrawAxis && horizFacet) {
      this._createHorizAxis(horizFacet!, this.paraview.paraState.chartInfo as PlaneChartInfo, this._width);
      // console.log('H-AXIS HEIGHT', this._horizAxis!.height);
    }
    if (this._paraState.config.axis.vert.isDrawAxis && vertFacet) {
      this._createVertAxis(vertFacet!, this.paraview.paraState.chartInfo as PlaneChartInfo, this._height);
      // console.log('V-AXIS WIDTH', this._vertAxis!.width);
    }

    // Create any west legend bc it affects the position of the vert axis
    if (this._shouldAddLegend && this._paraState.config.legend.position === 'west' && this._paraState.type !== 'venn') {
      this.createLegend('west');
    }

    if (this._shouldAddLegend && this._paraState.config.legend.position === 'south' && this._paraState.type !== 'venn') {
      this.createLegend('south');
    }
    // Recreate the axes using the size info computed above
    if (this._paraState.config.axis.vert.isDrawAxis && vertFacet) {
      this._createVertAxis(vertFacet!, this.paraview.paraState.chartInfo as PlaneChartInfo, this._height
        - (this._titleLabel?.paddedHeight || 0)
        - (this._subtitleLabel?.paddedHeight || 0)
        - (this._legends.north?.paddedHeight || 0)
        - (this._legends.south?.paddedHeight || 0)
        - (this._horizAxis?.height || 0)
      );
      this.append(this._vertAxis!);
    }

    // Create the direct label strip here so it can take its height from
    // the vertical axis
    if (this._shouldAddDirectLabelStrip) {
      this._directLabelStrip?.remove();
      this._directLabelStrip = new DirectLabelStrip(
        this.paraview, this._vertAxis?.height ?? this._height);
      this._directLabelStrip.updateSize();
    }

    if (this._shouldAddLegend && this._paraState.config.legend.position === 'east' && this._paraState.type !== 'venn') {
      this.createLegend('east');
    }

    if (this._paraState.config.axis.horiz.isDrawAxis && horizFacet) {
      this._createHorizAxis(horizFacet!, this.paraview.paraState.chartInfo as PlaneChartInfo, this._width
        - (this._vertAxis?.width ?? 0)
        - (this._directLabelStrip?.width ?? 0)
        - (this._legends.east?.width ?? this._legends.west?.width ?? 0));
      this.append(this._horizAxis!);
    }

    ////////////////////////////////////////////
    // FIXME (@simonvarey): This is a temporary fix until we guarantee that plane charts
    //   have two axes
    // const horizAxisFacet = this._paraState.model!.getAxisFacet('horiz') ?? this._paraState.model!.facetMap['x']!;
    // const vertAxisFacet = this._paraState.model!.getAxisFacet('vert') ?? this._paraState.model!.facetMap['y']!;
    ////////////////////////////////////////////

    // Update tick label IDs now that JIM selectors have been created
    //this._horizAxis.updateTickLabelIds();
    // this._vertAxis.updateTickLabelIds();

    // XXX Change this method to set axis.titleText
    this._titleText = this._paraState.title
      ?? this._paraState.config.chart.title.text;
    //?? `${this._vertAxis.titleText} by ${this._horizAxis.titleText}`;

    const plotWidth = this._width
      - (this._vertAxis?.width ?? 0)
      - (this._directLabelStrip?.width ?? 0)
      - (this._legends.east?.width ?? this._legends.west?.width ?? 0);
    const plotHeight = this._height
      - (this._legends.north?.paddedHeight ?? 0)
      - (this._titleLabel?.paddedHeight ?? 0)
      - (this._subtitleLabel?.paddedHeight ?? 0)
      - (this._horizAxis?.height ?? 0)
      - (this._legends.south?.paddedHeight ?? 0);
    this._chartLayers?.remove();
    this._chartLayers = new PlotLayerManager(this.paraview, plotWidth, plotHeight);
    this.append(this._chartLayers);
    this._chartLayers.createLayers();
    this._chartLayers.dataLayer.init();

    // At this point, we're fully connected to the root of the view tree,
    // so we can safely observe
    this._chartLayers.dataLayer.observeStore();
    this._chartLayers.dataLayer.observeNotices();

    if (this._directLabelStrip) {
      this.insert(this._directLabelStrip, -1);
    }

    this._positionLegends();
    this._positionAxes();
    this._positionLayers();
    this._positionDirectLabelStrip();

    if (this._horizAxis) {
      this._horizAxis.addGridRules(this._chartLayers.height);
    }
    if (this._vertAxis) {
      this._vertAxis.addGridRules(this._chartLayers.width);
    }
    if (this._paraState.config.legend.useDirectLegends) {
      if (this._legends.east) {
        this._legends.east.makeDirect("east");
      }
      if (this._legends.west) {
        this._legends.west.makeDirect("west");
      }
      if (this._legends.north) {
        this._legends.north.makeDirect("north");
      }
      if (this._legends.south) {
        this._legends.south.makeDirect("south");
      }
    }
  }

  protected _positionLegends() {
    if (this._legends.north) {
      this._legends.north.top = this._subtitleLabel?.paddedBottom ?? this._titleLabel?.paddedBottom ?? this.top;
      this._legends.north.centerX = this.centerX;
    }
    if (this._legends.east) {
      this._legends.east.right = this.right;
      this._legends.east.top = this._subtitleLabel?.paddedBottom ?? this._titleLabel?.paddedBottom ?? this.top;
    }
    if (this._legends.west) {
      this._legends.west.left = this.left;
      this._legends.west.top = this._subtitleLabel?.paddedBottom ?? this._titleLabel?.paddedBottom ?? this.top;
    }
    if (this._legends.south) {
      this._legends.south.bottom = this.bottom;
      this._legends.south.centerX = this.centerX;
    }
  }

  protected _positionAxes() {
    if (this._vertAxis) {
      this._vertAxis.left = this._legends.west?.paddedRight ?? this.left;
      if (this._legends.north) {
        this._vertAxis.paddedTop = this._legends.north.paddedBottom;
      } else if (this._subtitleLabel && this._paraState.config.chart.title.position === 'top') {
        this._vertAxis.top = this._subtitleLabel!.paddedBottom;
      } else if (this._titleLabel && this._paraState.config.chart.title.position === 'top') {
        this._vertAxis.top = this._titleLabel!.paddedBottom;
      } else {
        this._vertAxis.top = this.top;
      }
    }
    if (this._horizAxis) {
      if (this._titleLabel && this._paraState.config.chart.title.position === 'bottom') {
        this._horizAxis.bottom = this._titleLabel.paddedTop;
      } else if (this._subtitleLabel && this._paraState.config.chart.title.position === 'bottom') {
        this._horizAxis.bottom = this._subtitleLabel.paddedTop;
      } else if (this._legends.south) {
        this._horizAxis.bottom = this._legends.south.paddedTop;
      } else {
        this._horizAxis.bottom = this.bottom;
      }
      this._horizAxis.left = this._vertAxis?.right ?? 0;
    }
  }

  protected _positionLayers() {
    if (this._vertAxis) {
      this._chartLayers.left = this._vertAxis.right;
    } else if (this._horizAxis) {
      this._chartLayers.centerX = this._horizAxis?.centerX;
    } else if (this._legends.west) {
      this._chartLayers.left = this._legends.west.right;
    } else {
      this._chartLayers.left = 0;
    }
    this._chartLayers.bottom = this._horizAxis?.top ?? this._height;
  }

  protected _positionDirectLabelStrip() {
    if (this._directLabelStrip) {
      this._directLabelStrip.left = this._chartLayers.right;
      this._directLabelStrip.top = this._chartLayers.top;
    }
  }

  protected _createHorizAxis(facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    while (true) {
      try {
        this._horizAxis?.remove();
        this._horizAxis = new HorizAxis(this.paraview, facet, chartInfo, length);
        const horizAxisFacet = this.paraview.paraState.chartInfo.horizFacet!;
        this._horizAxis.setAxisLabelText(horizAxisFacet.label);
        this._horizAxis.createComponents();
        this._horizAxis.layoutComponents();
        this._horizAxis.updateSize();
        break;
      } catch (e) {
        if (e instanceof LabelOverlapError) {
          this._paraState.updateConfig(draft => {
            draft.axis.horiz.isStaggerLabels = true;
          }, true);
        } else {
          throw e;
        }
      }
    }
  }

  protected _createVertAxis(facet: Facet, chartInfo: PlaneChartInfo, length: number) {
    this._vertAxis?.remove();
    this._vertAxis = new VertAxis(this.paraview, facet, chartInfo, length);
    const vertAxisFacet = this.paraview.paraState.chartInfo.vertFacet!;
    this._vertAxis.setAxisLabelText(vertAxisFacet.label);
    this._vertAxis.createComponents();
    this._vertAxis.layoutComponents();
    this._vertAxis.updateSize();
  }

  protected get _shouldAddDirectLabelStrip(): boolean {
    return this._paraState.config.chart.hasDirectLabels
      && this.type === 'line'
      && /*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
      this._paraState.model!.multi;
  }

  protected get _shouldAddLegend(): boolean {
    return this._paraState.config.legend.isAlwaysDrawLegend;
    /*
    return this._paraState.config.legend.isDrawLegend &&
      (this._paraState.config.legend.isAlwaysDrawLegend
        // XXX direct label strip won't exist when this is called
        || (this._shouldAddDirectLabelStrip && this._paraState.config.chart.hasLegendWithDirectLabels)
        || (!this._shouldAddDirectLabelStrip && this._paraState.model!.multi));
        */
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting) {
    this.paraview.paraState.chartInfo.settingDidChange(path, oldValue, newValue);
    if (['chart.width', 'chart.height', 'chart.fontScale'].includes(path)) {
      this.updateSize();
      this._populate();
      //this.paraview.requestUpdate();
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  async storeDidChange(key: string, value: any): Promise<void> {
    await super.storeDidChange(key, value);
  }

  // noticePosted(key: string, value: any): void {
  //   this.log.info('NOTICE', key);
  //   if (key === 'animRevealEnd') {
  //     const shouldAddDirectLabelStrip = this._paraState.settings.chart.hasDirectLabels
  //       && this.type === 'line'
  //       && /*this._chartLayers.dataLayer.settings.isAlwaysShowSeriesLabel || */
  //         this._paraState.model!.multi;
  //     if (shouldAddDirectLabelStrip) {
  //       const horizAxisPos = this._paraState.settings.axis.horiz.position;
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
      ?? this._paraState.config.chart.title.text
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
    this._titleLabel?.remove();
    this._titleLabel = new Label(this.paraview, {
      id: 'chart-title',
      role: 'heading',
      classList: ['chart-title'],
      text: this._titleText,
      wrapWidth: this._width,
      justify: this._paraState.config.chart.title.align
    });
    const isTop = this._paraState.config.chart.title.position === 'top';
    this._titleLabel.padding = {
      top: isTop ? 0 : this._paraState.config.chart.title.margin,
      right: 0,
      bottom: isTop ? this._paraState.config.chart.title.margin : 0,
      left: 0
    };
    this._titleLabel.canHeightFlex = false;
    this.append(this._titleLabel);
  }

  removeTitle() {
    this._titleLabel?.remove();
  }

  protected _createSubtitle() {
    this._subtitleLabel?.remove();
    this._subtitleLabel = new Label(this.paraview, {
      id: 'chart-subtitle',
      role: 'heading',
      classList: ['chart-subtitle'],
      text: this._paraState.chartInfo.conciseSummary.text,
      wrapWidth: this._width,
      justify: this._paraState.config.chart.subtitle.align
    });
    const isTop = this._paraState.config.chart.title.position === 'top';
    this._subtitleLabel.padding = {
      top: isTop ? 0 : this._paraState.config.chart.subtitle.margin,
      right: 0,
      bottom: isTop ? this._paraState.config.chart.subtitle.margin : 0,
      left: 0
    };
    this._subtitleLabel.canHeightFlex = false;
    this.append(this._subtitleLabel);
  }

  protected _positionTitles() {
    if (this._paraState.config.chart.title.position === 'top') {
      if (this._titleLabel) {
        this._titleLabel.top = this.top;
        if (this._subtitleLabel) {
          this._subtitleLabel.top = this._titleLabel.paddedBottom;
        }
      } else if (this._subtitleLabel) {
        this._subtitleLabel.top = this.top;
      }
    } else {
      if (this._subtitleLabel) {
        this._subtitleLabel.bottom = this.bottom;
        if (this._titleLabel) {
          this._titleLabel.bottom = this._subtitleLabel.paddedTop;
        }
      } else if (this._titleLabel) {
        this._titleLabel.bottom = this.bottom;
      }
    }
    if (this._titleLabel) {
      if (this._paraState.config.chart.title.align === 'start') {
        this._titleLabel.left = this.left;
      } else if (this._paraState.config.chart.title.align === 'end') {
        this._titleLabel.right = this.right;
      } else {
        this._titleLabel.centerX = this.centerX;
      }
    }
    if (this._subtitleLabel) {
      if (this._paraState.config.chart.subtitle.align === 'start') {
        this._subtitleLabel.left = this.left;
      } else if (this._paraState.config.chart.subtitle.align === 'end') {
        this._subtitleLabel.right = this.right;
      } else {
        this._subtitleLabel.centerX = this.centerX;
      }
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
    const items = this.paraview.paraState.chartInfo.legend();
    const margin = this._paraState.config.legend.margin;
    if (position === 'east') {
      this._legends.east?.remove();
      this._legends.east = new Legend(this.paraview, items,
        {
          orientation: 'vert',
          rowGap: 5
        });
      this._legends.east.padding = {
        top: 0,
        right: 0,
        bottom: 0,
        left: margin,
      };
      this.append(this._legends.east);
      // this._legends.east.updateSize();
      // this._grid.setColGap(this._directLabelStrip ? 2 : 1, margin);
    } else if (position === 'west') {
      this._legends.west?.remove();
      this._legends.west = new Legend(this.paraview, items,
        {
          orientation: 'vert',
          rowGap: 5
        });
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
        wrapWidth: this._width,
        rowGap: 5
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
        wrapWidth: this._width,
        rowGap: 5
      });
      this._legends.north.padding = {
        top: 0,
        right: 0,
        bottom: margin,
        left: 0
      };
      // this._grid.insertRow(this._paraState.settings.chart.title.isDrawTitle && this._paraState.title ? 1 : 0);
      // this._grid.append(this._legends.north, {
      //   x: 1,
      //   y: 0,
      //   width: 1,
      //   colAlign: 'center',
      //   //margin: {bottom: margin}
      // });
      this.append(this._legends.north);
    }
  }

  content() {
    return svg`
      ${this._titleLabel && this._paraState.isTitleHighlighted
        ? this._titleLabel.renderHighlight('bg') : ''}
      ${this._horizAxis && this._paraState.isHorizontalAxisHighlighted
        ? this._horizAxis.renderHighlight('bg') : ''}
      ${this._vertAxis && this._paraState.isVerticalAxisHighlighted
        ? this._vertAxis.renderHighlight('bg') : ''}
      ${this._legends.east && this._paraState.isEastLegendHighlighted
        ? this._legends.east.renderHighlight('bg') : ''}
      ${this._legends.west && this._paraState.isWestLegendHighlighted
        ? this._legends.west.renderHighlight('bg') : ''}
      ${this._legends.north && this._paraState.isNorthLegendHighlighted
        ? this._legends.north.renderHighlight('bg') : ''}
      ${this._legends.south && this._paraState.isSouthLegendHighlighted
        ? this._legends.south.renderHighlight('bg') : ''}
      ${this._paraState.index === 0 ? this._closeX.render() : ''}
      ${super.content()}
      ${this._titleLabel && this._paraState.isTitleHighlighted
        ? this._titleLabel.renderHighlight('fg') : ''}
      ${this._horizAxis && this._paraState.isHorizontalAxisHighlighted
        ? this._horizAxis.renderHighlight('fg') : ''}
      ${this._vertAxis && this._paraState.isVerticalAxisHighlighted
        ? this._vertAxis.renderHighlight('fg') : ''}
      ${this._legends.east && this._paraState.isEastLegendHighlighted
        ? this._legends.east.renderHighlight('fg') : ''}
      ${this._legends.west && this._paraState.isWestLegendHighlighted
        ? this._legends.west.renderHighlight('fg') : ''}
      ${this._legends.north && this._paraState.isNorthLegendHighlighted
        ? this._legends.north.renderHighlight('fg') : ''}
      ${this._legends.south && this._paraState.isSouthLegendHighlighted
        ? this._legends.south.renderHighlight('fg') : ''}
    `;
  }

}