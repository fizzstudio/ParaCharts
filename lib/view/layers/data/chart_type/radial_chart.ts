
import { DataLayer } from '..';
import { ChartLandingView, DatapointView, SeriesView } from '../../../data';
import {
  type RadialSettings,
  type RadialChartType, type DeepReadonly,
  Setting,
  Direction, directions,
  SparkBrailleInfo,
  HorizDirection
} from '../../../../store';
import { Label, LabelTextCorners, type LabelTextAnchor } from '../../../label';
import { type ParaView } from '../../../../paraview';
import { SectorShape } from '../../../shape/sector';
import { PathShape } from '../../../shape/path';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { Vec2 } from '../../../../common/vector';
import { ClassInfo } from 'lit/directives/class-map.js';
import { interpolate } from '@fizz/templum';
import { queryMessages, describeSelections, getDatapointMinMax } from '../../../../store/query_utils';
import { Shape } from '../../../shape/shape';
import {
  NavLayer, NavNode,
} from '../navigation';

export type ArcType = 'circle' | 'semicircle';

export abstract class RadialChart extends DataLayer {

  //protected _radius!: Required<RadiusSettings>;
  protected _cx!: number;
  protected _cy!: number;
  protected _radius!: number;
  protected _arcType: ArcType = 'circle';
  // start slices at 12 o'clock
  protected _startAngleOffset = -0.25;
  // values 0 to 1
  protected _arc = 1;
  // TODO: calculate radius_divisor based on longest label, for pie and donut
  protected _radiusDivisor = 2.3;

  protected _centerLabel: Label | null = null;

  constructor(paraview: ParaView, index: number) {
    super(paraview, index);
  }

  protected _addedToParent() {
    super._addedToParent();
    //this.options = this.chart_obj.options[this.chart_type] || {};
    //if (!this.options.center_label) {
    // HACK: if center_label options not specified, add empty object to prevent errors on read
    //  this.options.center_label = {};
    //}
    //this.orientation = orientation;
    //this.title = title;
    //this.label = null;

    // const radius: Partial<RadiusSettings> = this._settings.radius ?? {};
    // radius.innerPercent ??= 0.6;

    this._cx = this._width / 2;
    this._cy = this._height / 2;
    this._radius = Math.min(this._height, this._width) / 2;

    if (this._arcType === 'semicircle') {
      this._arc = 0.5; // semicircle
      this._startAngleOffset = -0.25; // 9 o'clock
      // if y_offset not explicitly set in options, override default to set to vertical baseline, not vertically centered
      //      this.center_label.y_offset = this.options.center_label.y_offset ? this.options.center_label.y_offset : 0; // vertical baseline
    }

    // if (radius.outer === undefined) {
    //   let outerRadiusCalc = Math.min(this._height, this._width)/this._radiusDivisor;
    //   // for gauge charts that don't take up full height, move gauge down
    //   if (this._arc < 1) {
    //     outerRadiusCalc = Math.max(this._height, this._width)/this._radiusDivisor;
    //     radius.outer = outerRadiusCalc;
    //     this._cy = radius.outer;
    //   } else {
    //     radius.outer = outerRadiusCalc;
    //   }
    // }
    // if (radius.inner === undefined) {
    //   radius.inner = radius.outer*radius.innerPercent;
    // }
    // this._radius = radius as RadiusSettings;

    // for gauge charts that don't take up full height, move gauge down
    // if (this._arc < 1) {
    //   this._cy = this._radius.outer;
    // }

    // optional central label
    /*this.centerLabel = {
      label: null,
      label_pattern: this.options.center_label.label_pattern,
      is_render: this.options.center_label.is_render || false,
      value: null,
      value_index: this.options.center_label.value_index || 0,
      unit: null,
      subtext: this.options.center_label.subtext || null,
      class: null,
      x: 0,
      y: 0,
      y_offset: this.options.center_label.y_offset || 0.33,
      font_size_percent: this.options.center_label.font_size_percent || 0.8,
      unit_size_percent: this.options.center_label.unit_size_percent || 0.8
    };*/

    //this.label_font_size = chart_obj.options.axis.r.tick.font_size;
    //this.label_margin = chart_obj.options.axis.r.tick.margin;
  }

  // get radius() {
  //   return this._radius;
  // }

  get settings() {
    return super.settings as DeepReadonly<RadialSettings>;
  }

  get cx() {
    return this._cx;
  }

  get cy() {
    return this._cy;
  }

  get arcType() {
    return this._arcType;
  }

  get startAngleOffset() {
    return this._startAngleOffset;
  }

  get radius() {
    return this._radius;
  }

  init() {
    super.init();
    if (this.settings.categoryLabel.isDrawEnabled) {
      // this needs to happen after the datapoints have been created and laid out
      this._createLabels();
      this._resizeToFitLabels();
      if (this.settings.centerLabel === 'title') {
        this.paraview.store.updateSettings(draft => {
          draft.chart.title.isDrawTitle = false;
        });
        this._centerLabel = new Label(this.paraview, {
          text: this.paraview.store.title,
          centerX: this._cx,
          centerY: this._cy,
          textAnchor: 'middle',
          wrapWidth: 2 * (this.radius - this.settings.annularThickness * this.radius)
            - this.settings.centerLabelPadding * 2,
          id: 'chart-title',
          classList: ['chart-title']
        });
        this.append(this._centerLabel);
      }
      // const labels = this.datapointViews.map(dp => (dp as RadialSlice).categoryLabel!);
      // const minX = Math.min(...labels.map(label => label.left));
      // const maxX = Math.max(...labels.map(label => label.right));
      // this._width = maxX - minX;
      // this._parent.width = this._width;
      // if (minX < 0) {
      //   this.datapointViews.forEach(dp => {
      //     dp.x += -minX;
      //   });
      //   this._cx += -minX;
      // }
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['color.colorPalette', 'color.colorVisionMode'].includes(path)) {
      if (newValue === 'pattern' || (newValue !== 'pattern' && oldValue === 'pattern')
        || this.paraview.store.settings.color.colorPalette === 'pattern') {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
      }
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  protected _createNavMap() {
    super._createNavMap();
    const layer = new NavLayer(this._navMap, 'slices');
    directions.forEach(dir => {
      this._navMap.node('top', {})!.connect(dir, layer);
    });
    const nodes = this._chartLandingView.children[0].children.map((datapointView, i) => {
      const node = new NavNode(layer, 'datapoint', {
        seriesKey: datapointView.seriesKey,
        index: datapointView.index
      });
      node.addDatapointView(datapointView);
      node.connect('out', this._navMap.root);
      node.connect('up', this._navMap.root);
      return node;
    });
    nodes.slice(0, -1).forEach((node, i) => {
      node.connect('right', layer.get('datapoint', i + 1)!);
    });
    nodes.at(-1)!.connect('right', nodes[0]);
  }

  protected _resizeToFitLabels() {
    const labels = this.datapointViews.map(dp => (dp as RadialSlice).categoryLabel!);
    const minX = Math.min(...labels.map(label => label.left));
    if (minX < 0) {
      console.log('OLD WIDTH', this._width);
      this._parent.logicalWidth += -minX;
      console.log('NEW WIDTH', this._width, minX);
      this.datapointViews.forEach(dp => {
        dp.x += -minX;
      });
      this._cx += -minX;
    }
    const maxX = Math.max(...labels.map(label => label.right));
    if (maxX > this._width) {
      const diff = maxX - this._width;
      this._parent.logicalWidth += diff;
      console.log('NEW WIDTH', this._width);
    }
    const minY = Math.min(...labels.map(label => label.top));
    if (minY < 0) {
      this._parent.logicalHeight += -minY;
      console.log('NEW HEIGHT', this._height);
      this.datapointViews.forEach(dp => {
        dp.y += -minY;
      });
      this._cy += -minY;
    }
    const maxY = Math.max(...labels.map(label => label.bottom));
    if (maxY > this._height) {
      const diff = maxY - this._height;
      this._parent.logicalHeight += diff;
      console.log('NEW HEIGHT', this._height);
    }
  }

  protected _createDatapoints() {
    const xs = this.paraview.store.model!.series[0].datapoints.map(dp =>
      dp.facetValue('x') as string
    );
    const ys = this.paraview.store.model!.series[0].datapoints.map(dp =>
      dp.facetValueNumericized('y')!);

    // const indep = this._model.indepVar;
    // const xs: string[] = [];
    // for (const [i, record] of this._model.data) {
    //   xs.push(this._model.format(
    //     xSeries.atBoxed(i), `${this.parent.docView.type as RadialChartType}Slice`));
    //   //const xId = utils.strToId(xs.at(-1)!);
    // }

    const total = ys.reduce((a, b) => a + b, 0);
    const seriesView = new SeriesView(this, this.paraview.store.model!.keys[0], false);
    this._chartLandingView.append(seriesView);

    let accum = 0;
    for (const [x, i] of enumerate(xs)) {
      const currDatapoint = ys.at(i)!;

      /*if (this.center_label.is_render && this.center_label.value_index === j) {
        // set percentage as center label value
        // TODO: allow other values for center label
        this.center_label.value = Math.round(percentage * 100);
        this.center_label.unit = `%`;
        // this.center_label.subtext = independent_datapoint.value.format;
        this.center_label.class = `series_${j}`
      }*/

      // const text = this._model.format(
      //   xSeries.atBoxed(i), `${this.parent.docView.type as RadialChartType}Slice`);
      // modify percentage by arc degree, for circle fragments
      const percentage = this._arc * currDatapoint / total;
      if (i) {
        accum += percentage / 2;
      }
      const datapointView = this._createSlice(seriesView, {
        seriesIdx: i,
        percentage,
        accum,
        numDatapoints: xs.length
      });
      seriesView.append(datapointView);
      accum += percentage / 2;
    }
  }

  protected _createLabels() {
    const xs = this.paraview.store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('x')!, this.paraview.store.getFormatType('pieSliceLabel'))
    );
    const ys = this.paraview.store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('y')!, this.paraview.store.getFormatType('pieSliceLabel'))
    );
    for (const [x, i] of enumerate(xs)) {
      const slice = this._chartLandingView.children[0].children[i] as RadialSlice;
      const arcCenter = slice.shapes[0].arcCenter;
      // Distance of cat label from chart circumference
      const arcDistVec = slice.shapes[0].orientationVector.multiplyScalar(
        this.settings.categoryLabel.outsideArcDistance);
      let catLabelLoc: Vec2;
      let catLabelAnchor: LabelTextAnchor;
      const sliceCenter = slice.shapes[0].loc.add(arcCenter).divideScalar(2);
      let catLabelPosProp: keyof LabelTextCorners = 'topLeft';
      if (this.settings.categoryLabel.position === 'inside') {
        catLabelLoc = sliceCenter;
        catLabelAnchor = 'middle';
      } else if (this.settings.categoryLabel.position === 'outside') {
        catLabelLoc = arcCenter.add(arcDistVec);
        if (catLabelLoc.x > this.cx) {
          catLabelLoc.x += this.settings.categoryLabel.outsideHorizShift;
          catLabelAnchor = 'start';
        } else {
          catLabelLoc.x -= this.settings.categoryLabel.outsideHorizShift;
          catLabelAnchor = 'end';
        }
        if (catLabelLoc.y > this.cy) {
          catLabelPosProp = catLabelAnchor === 'start' ? 'topLeft' : 'topRight';
        } else {
          catLabelPosProp = catLabelAnchor === 'start' ? 'bottomLeft' : 'bottomRight';
        }
      } else {
        // XXX not very useful, is it?
        catLabelLoc = new Vec2();
        catLabelAnchor = 'middle';
      }
      slice.categoryLabel = new Label(this.paraview, {
        text: x,
        id: slice.id + '-rlb',
        classList: ['radial-category-label'],
        role: 'datapoint',
        [catLabelPosProp]: catLabelLoc,
        textAnchor: catLabelAnchor,
      });
      const underlineStart = slice.categoryLabel.textCorners[catLabelPosProp.endsWith('Left')
        ? 'bottomLeft'
        : 'bottomRight'].addY(this.settings.categoryLabel.underlineGap);
      slice.leader = this._createCategoryLabelLeader(slice, arcCenter, underlineStart);
      slice.valueLabel = new Label(this.paraview, {
        // XXX value will not always be a percentage
        text: ys[i] + '%',
        id: slice.id + '-vlb',
        classList: ['radial-value-label'],
        role: 'datapoint',
        loc: slice.shapes[0].loc.add(
          slice.shapes[0].orientationVector.multiplyScalar(this.radius * this.settings.valueLabel.position)),
        textAnchor: 'middle',
      });
      if (!Object.values(slice.valueLabel.textCorners).every(point =>
        slice.shapes[0].containsPoint(point))) {
        slice.categoryLabel.text += `: ${slice.valueLabel.text}`;
        slice.valueLabel = null;
        slice.leader = this._createCategoryLabelLeader(slice, arcCenter, underlineStart);
      } else {
        slice.valueLabel.styleInfo = {
          fill: this.paraview.store.colors.contrastValueAt(i)
        };
      }
      // Labels draw as children of the slice so the highlights layer can `use` them
      slice.append(slice.leader);
      slice.append(slice.categoryLabel);
      if (slice.valueLabel) {
        slice.append(slice.valueLabel);
      }
    }
    if (this.settings.categoryLabel.position === 'outside') {
      this._resolveLabelCollisions();
    }
  }

  protected _createCategoryLabelLeader(slice: RadialSlice, arcCenter: Vec2, underlineStart: Vec2) {
    return new PathShape(this.paraview, {
      points: [arcCenter, underlineStart, underlineStart.x > slice.categoryLabel!.centerX
        ? underlineStart.subtractX(slice.categoryLabel!.width)
        : underlineStart.addX(slice.categoryLabel!.width)],
      stroke: this.paraview.store.colors.colorValueAt(slice.color),
      strokeWidth: 2
    });
  }

  protected _resolveLabelCollisions() {
    const slices = [...this.datapointViews] as RadialSlice[];
    // Sort slices according to label height onscreen from lowest to highest
    slices.sort((a, b) => b.categoryLabel!.y - a.categoryLabel!.y);

    // const leaderLabelOffset = this.paraview.store.settings.chart.isDrawSymbols
    //   ? -this._chart.settings.seriesLabelPadding
    //   : 0;

    slices.slice(1).forEach((s, i) => {
      // Move each label up out of collision with the one onscreen below it.
      if (s.categoryLabel!.intersects(slices[i].categoryLabel!)) {
        const oldY = s.categoryLabel!.y;
        s.categoryLabel!.bottom = slices[i].categoryLabel!.top - this.settings.categoryLabel.outsideLabelGap; // - s.categoryLabel!.height;
        const diff = s.categoryLabel!.y - oldY;
        s.leader!.points = [
          s.leader!.points[0],
          s.leader!.points[1].addY(diff),
          s.leader!.points[2].addY(diff)];
      }
    });

    // colliders.forEach(c => {
    //   // NB: this value already includes the series label padding
    //   c.label.x += (this._chart.settings.leaderLineLength + leaderLabelOffset);
    //   this.leaders.push(new LineLabelLeader(c.endpoint, c.label, this._chart));
    //   this.prepend(this.leaders.at(-1)!);
    // });
  }

  protected abstract _createSlice(seriesView: SeriesView, params: RadialDatapointParams): RadialSlice;

  legend() {
    const xs = this.paraview.store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('x')!, this.paraview.store.getFormatType('pieSliceLabel')));
    const ys = this.paraview.store.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('y')!, this.paraview.store.getFormatType('pieSliceValue')));
    return xs.map((x, i) => ({
      label: `${x}: ${ys[i]}`,
      color: i,
      datapointIndex: i
    }));
  }

  protected _playDatapoints(datapoints: Datapoint[]): void {
  }

  playDir(dir: HorizDirection): void {

  }

  protected _sparkBrailleInfo() {
    return  {
      data: JSON.stringify(this._navMap.cursor.datapointViews[0].series.datapoints.map(dp => ({
          // XXX shouldn't assume x is string (or that we have an 'x' facet, for that matter)
          label: dp.facetValue('x') as string,
          value: dp.facetValueAsNumber('y')
        }))),
      isProportional: true
    };
  }

  queryData(): void {
    const targetView = this.chartLandingView.focusLeaf
    // TODO: localize this text output
    // focused view: e.options!.focus
    // all visited datapoint views: e.options!.visited
    // const focusedDatapoint = e.targetView;
    let msgArray: string[] = [];
    let seriesLengths = [];
    for (let series of this.paraview.store.model!.series) {
      seriesLengths.push(series.rawData.length)
    }
    if (targetView instanceof ChartLandingView) {
      this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
      return
    }
    else if (targetView instanceof SeriesView) {
      msgArray.push(interpolate(
        queryMessages.seriesKeyLength,
        { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
      ));
      //console.log('queryData: SeriesView:', targetView);
    }
    else if (targetView instanceof DatapointView) {
      const selectedDatapoints = this.paraview.store.selectedDatapoints;
      const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
      /*
      msgArray.push(replace(
        queryMessages.datapointKeyLength,
        {
          seriesKey: targetView.seriesKey,
          datapointXY: `${targetView.series[visitedDatapoint.index].x.raw}, ${targetView.series[visitedDatapoint.index].y.raw}`,
          datapointIndex: targetView.index + 1,
          datapointCount: targetView.series.length
        }
      ));
      */
      //console.log(msgArray)
      if (selectedDatapoints.length) {
        console.log("in here")
        const selectedDatapointViews = []

        for (let datapoint of selectedDatapoints) {
          const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
          selectedDatapointViews.push(selectedDatapointView)
        }
        // if there are selected datapoints, compare the current datapoint against each of those
        //console.log(targetView.series.rawData)
        const selectionMsgArray = describeSelections(this.paraview, targetView, selectedDatapointViews as DatapointView[]);
        msgArray = msgArray.concat(selectionMsgArray);
      } else {
        //console.log('tv', targetView)
        // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
        msgArray.push(interpolate(
          queryMessages.percentageOfChart,
          {
            chartKey: targetView.seriesKey,
            datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
            datapointIndex: targetView.index + 1,
            datapointCount: targetView.series.length
          }));
        if (this.paraview.store.model!.numSeries > 1) {
          msgArray.push(interpolate(
            queryMessages.percentageOfSeries,
            {
              seriesKey: targetView.seriesKey,
              datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
              datapointIndex: targetView.index + 1,
              datapointCount: targetView.series.length
            }));
        }
        //const datapointMsgArray = describeAdjacentDatapoints(this.paraview, targetView);
        //msgArray = msgArray.concat(datapointMsgArray);
      }
      // also add the high or low indicators
      const minMaxMsgArray = getDatapointMinMax(this.paraview,
        targetView.series[visitedDatapoint.index].facetBox("y")!.raw as unknown as number, targetView.seriesKey);
      //console.log('minMaxMsgArray', minMaxMsgArray)z
      msgArray = msgArray.concat(minMaxMsgArray)
    }
    this.paraview.store.announce(msgArray);
  }

  focusRingShape(): Shape | null {
    if (this._navMap.cursor.type === 'datapoint') {
      return this._navMap.cursor.at(0)!.focusRingShape();
    }
    return null;
  }

}

export interface RadialDatapointParams {
  seriesIdx: number;
  percentage: number;
  accum: number;
  numDatapoints: number;
}

export abstract class RadialSlice extends DatapointView {

  declare readonly chart: RadialChart;
  declare protected _shapes: SectorShape[];


  protected _categoryLabel: Label | null = null;
  protected _valueLabel: Label | null = null;
  protected _leader: PathShape | null = null;

  constructor(parent: SeriesView, protected _params: RadialDatapointParams) {
    super(parent);
    this._isStyleEnabled = true;
  }

  get categoryLabel() {
    return this._categoryLabel;
  }

  set categoryLabel(label: Label | null) {
    this._categoryLabel = label;
  }

  get valueLabel() {
    return this._valueLabel;
  }

  set valueLabel(label: Label | null) {
    this._valueLabel = label;
  }

  get leader() {
    return this._leader;
  }

  set leader(leader: PathShape | null) {
    this._leader = leader;
  }

  get shapes() {
    return this._shapes;
  }

  get role() {
    return 'graphics-symbol';
  }

  get roleDescription() {
    return 'datapoint';
  }

  get classInfo() {
    const classInfo: ClassInfo = { ['radial-slice']: true, ...super.classInfo };
    return classInfo;
  }

  get styleInfo() {
    const style = super.styleInfo;
    delete style.strokeWidth;
    delete style.stroke;
    return style;
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    if (this._categoryLabel) {
      this._categoryLabel.x += x - this._x;
    }
    if (this._valueLabel) {
      this._valueLabel.x += x - this._x;
    }
    if (this._leader) {
      this._leader.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._categoryLabel) {
      this._categoryLabel.y += y - this._y;
    }
    if (this._valueLabel) {
      this._valueLabel.y += y - this._y;
    }
    if (this._leader) {
      this._leader.y += y - this._y;
    }
    super.y = y;
  }

  protected _createSymbol() {
  }

  focusRingShape() {
    const shape = this._shapes[0].clone();
    const gap = this.paraview.store.settings.ui.focusRingGap;
    shape.centralAngle += 2 * gap * 360 / (2 * Math.PI * shape.r);
    if (shape.annularThickness! < 1) {
      shape.r += gap;
      // a0/r0 = A
      // r1 = r0 + D
      // a1 = a0 + D
      // A1 = (a0 + D)/(r0 + D)
      const a0 = shape.annularThickness! * shape.r;
      shape.annularThickness = (a0 + 2 * gap) / (shape.r + gap);
    } else {
      shape.scale = (shape.r + gap) / shape.r;
    }
    return shape;
  }

  completeLayout() {
    super.completeLayout();
  }

}