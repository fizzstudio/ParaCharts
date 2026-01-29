
import { DataLayer } from '..';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
import {
  type RadialSettings,
  type RadialChartType, type DeepReadonly,
  Setting,
} from '../../../../state';
import { Label, type LabelTextAnchor } from '../../../label';
import { type ParaView } from '../../../../paraview';
import { type Shape, SectorShape, PathShape } from '../../../shape';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { Vec2 } from '../../../../common/vector';
import { ClassInfo } from 'lit/directives/class-map.js';
import { datapointMatchKeyAndIndex, bboxOppositeAnchor } from '../../../../common/utils';
import { type BboxAnchorCorner } from '../../../base_view';

export type ArcType = 'circle' | 'semicircle';

export abstract class PastryPlotView extends DataLayer {

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

  constructor(
    paraview: ParaView,
    width: number,
    height: number,
    index: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, index, chartInfo);
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

    this._resetRadius();

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

  get datapointViews() {
    return super.datapointViews as RadialSlice[];
  }

  protected _completeDatapointLayout(): void {
    super._completeDatapointLayout();
    this._createLabels();
  }

  protected _animStep(bezT: number, linearT: number): void {
    super._animStep(bezT, linearT);
    this._createLabels();
  }

  init() {
    super.init();
    this._resizeToFitLabels();
    if (this.settings.centerLabel === 'title') {
      this.paraview.paraState.updateSettings(draft => {
        draft.chart.title.isDrawTitle = false;
      });
      this._centerLabel = new Label(this.paraview, {
        text: this.paraview.paraState.title,
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

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['color.colorPalette', 'color.colorVisionMode'].includes(path)) {
      if (newValue === 'pattern' || (newValue !== 'pattern' && oldValue === 'pattern')
        || this.paraview.paraState.settings.color.colorPalette === 'pattern') {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
      }
    }

    const settings = ['explode', 'orientationAngleOffset', 'insideLabels.contents', 'outsideLabels.contents'];
    if (settings.map(s => `type.${this.paraview.paraState.type}.${s}`).includes(path)) {
      this._resetRadius();
      this._chartLandingView.clearChildren();
      this._layoutDatapoints();
      // Needed to replace existing node datapoint views
      // this._createNavMap();
      // XXX `_resizeToFitLabels()` will recreate the datapoints, which may
      // cause inside labels to move outside, potentially requiring a second
      // resize. We don't currently do that...
      this._resizeToFitLabels();
      this.paraview.requestUpdate();
    }

    super.settingDidChange(path, oldValue, newValue);
  }

  protected _resetRadius() {
    this._radius = Math.min(this._height, this._width) / 2;
    this._cx = this._width / 2;
    this._cy = this._height / 2;
  }

  protected _resizeToFitLabels() {
    while (true) {
      // NB: There may be outside labels even if they are disabled if
      // one or more inside labels was moved to the outside for space
      const labels = this.datapointViews
        .map(dp => dp.outsideLabel)
        .filter(label => label) as Label[];
      if (!labels.length) return;

      let minScale = 1;
      const minX = Math.min(...labels.map(label => label.paddedLeft));
      if (minX < 0) {
        const slice = this.datapointViews.find(slice => slice.outsideLabel?.paddedLeft === minX)!;
        const v = slice.shapes[0].arcCenter.subtract(slice.shapes[0].loc);
        const x = Math.abs(v.x);
        const scale = Math.max((x + minX) / x, 0.5);
        if (scale < minScale) {
          minScale = scale;
        }
      }
      const maxX = Math.max(...labels.map(label => label.paddedRight));
      if (maxX > this._width) {
        // Not every slice may have an outside label
        const slice = this.datapointViews.find(slice => slice.outsideLabel?.paddedRight === maxX)!;
        const v = slice.shapes[0].arcCenter.subtract(slice.shapes[0].loc);
        const x = Math.abs(v.x);
        const scale = Math.max((x - (maxX - this._width)) / x, 0.5);
        if (scale < minScale) {
          minScale = scale;
        }
      }
      const minY = Math.min(...labels.map(label => label.paddedTop));
      if (minY < 0) {
        const slice = this.datapointViews.find(slice => slice.outsideLabel?.paddedTop === minY)!;
        const v = slice.shapes[0].arcCenter.subtract(slice.shapes[0].loc);
        const y = Math.abs(v.y);
        const scale = Math.max((y + minY) / y, 0.5);
        if (scale < minScale) {
          minScale = scale;
        }
      }
      const maxY = Math.max(...labels.map(label => label.paddedBottom));
      if (maxY > this._height) {
        const slice = this.datapointViews.find(slice => slice.outsideLabel?.paddedBottom === maxY)!;
        const v = slice.shapes[0].arcCenter.subtract(slice.shapes[0].loc);
        const y = Math.abs(v.y);
        const scale = Math.max((y - (maxY - this._height)) / y, 0.5);
        if (scale < minScale) {
          minScale = scale;
        }
      }

      if (Math.round(minScale * 100) < 100) {
        this._radius *= minScale;
        this._chartLandingView.clearChildren();
        this._layoutDatapoints();
        //this._createNavMap();
      } else {
        break;
      }
    }
  }

  protected _createDatapoints() {
    const xs = this.paraview.paraState.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('x')!, this.paraview.paraState.getFormatType('pieSliceLabel'))
    );
    const ys = this.paraview.paraState.model!.series[0].datapoints.map(dp =>
      dp.facetValueNumericized('y')!);

    const totalValue = ys.reduce((a, b) => a + b, 0);
    const seriesView = new SeriesView(this, this.paraview.paraState.model!.seriesKeys[0], false);
    this._chartLandingView.append(seriesView);

    let accum = 0;
    for (const [category, i] of enumerate(xs)) {
      const value = ys.at(i)!;

      // modify percentage by arc degree, for circle fragments
      const percentage = this._arc * value / totalValue;
      // if (i) {
      //   accum += percentage;
      // }
      const datapointView = this._createSlice(seriesView, {
        value,
        category,
        seriesIdx: i,
        percentage,
        accum,
        numDatapoints: xs.length
      });
      seriesView.append(datapointView);
      accum += percentage;
    }
  }

  protected _createLabels() {
    const xs = this.paraview.paraState.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('x')!, this.paraview.paraState.getFormatType('pieSliceLabel'))
    );
    const ys = this.paraview.paraState.model!.series[0].datapoints.map(dp =>
      formatBox(dp.facetBox('y')!, this.paraview.paraState.getFormatType('pieSliceLabel'))
    );
    for (const [x, i] of enumerate(xs)) {
      const slice = this._chartLandingView.children[0].children[i] as RadialSlice;
      if (this.settings.outsideLabels.contents) {
        slice.createOutsidelabel();
      }
      if (this.settings.insideLabels.contents) {
        slice.createInsideLabel();
      }
      // Labels draw as children of the slice so the highlights layer can `use` them
    }
    // NB: There may be outside labels even if they are disabled if
    // one or more inside labels was moved to the outside for space
    const outsideLabels = this.datapointViews
      .map(dp => dp.outsideLabel)
      .filter(label => label) as Label[];
    if (!outsideLabels.length) return;
    this._resolveOutsideLabelCollisions();
  }

  protected _resolveOutsideLabelCollisions() {
    // Only slices that have outside labels
    const slices = this.datapointViews.filter(slice => slice.outsideLabel);
    // Sort slices according to label vertical location onscreen from lowest to highest
    slices.sort((a, b) => b.outsideLabel!.y - a.outsideLabel!.y);

    // const leaderLabelOffset = this.paraview.paraState.settings.chart.isDrawSymbols
    //   ? -this._chart.settings.seriesLabelPadding
    //   : 0;

    slices.slice(1).forEach((s, i) => {
      // Move each label up out of collision with the one onscreen below it.
      if (s.outsideLabel!.intersects(slices[i].outsideLabel!)) {
        const oldY = s.outsideLabel!.y;
        s.outsideLabel!.bottom = slices[i].outsideLabel!.top - this.settings.outsideLabels.vertGap; // - s.categoryLabel!.height;
        const diff = s.outsideLabel!.y - oldY;
        s.adjustLeader(diff);
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

  focusRingShape(): Shape | null {
    const chartInfo = this._parent.parent.chartInfo;
    const cursor = chartInfo.navMap!.cursor;
    if (cursor.isNodeType('datapoint')) {
      return this.datapointView(cursor.options.seriesKey, cursor.options.index)!.focusRingShape();
    }
    return null;
  }

}

export interface RadialDatapointParams {
  category: string;
  value: number;
  seriesIdx: number;
  percentage: number;
  accum: number;
  numDatapoints: number;
}

export abstract class RadialSlice extends DatapointView {
  declare readonly chart: PastryPlotView;
  declare protected _shapes: SectorShape[];

  protected _outsideLabel: Label | null = null;
  protected _insideLabel: Label | null = null;
  protected _leader: PathShape | null = null;
  protected _focusRingShape: SectorShape | null = null;
  protected _centralAngle = 0;

  constructor(parent: SeriesView, protected _params: RadialDatapointParams) {
    super(parent);
    this._isStyleEnabled = true;
  }

  get percentage() {
    return this._params.percentage;
  }

  get outsideLabel() {
    return this._outsideLabel;
  }

  get insideLabel() {
    return this._insideLabel;
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
    const classInfo: ClassInfo = {
      ...super.classInfo,
      'pastry-slice': true,
      // bad workaround for the problem that, when a visited datapoint is recreated,
      // the store data cursor now has a ref to the old instance
      // visited: this.paraview.paraState.isVisited(this.seriesKey, this.index),
      // selected: this.paraview.paraState.isSelected(this.seriesKey, this.index)
    };
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
    if (this._outsideLabel) {
      this._outsideLabel.x += x - this._x;
    }
    if (this._insideLabel) {
      this._insideLabel.x += x - this._x;
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
    if (this._outsideLabel) {
      this._outsideLabel.y += y - this._y;
    }
    if (this._insideLabel) {
      this._insideLabel.y += y - this._y;
    }
    if (this._leader) {
      this._leader.y += y - this._y;
    }
    super.y = y;
  }

  protected _createSymbol() {
  }

  get isPositionRight() {
    return this.shapes[0].arcCenter.x > this.chart.cx;
  }

  get isPositionBottom() {
    return this.shapes[0].arcCenter.y > this.chart.cy;
  }

  protected _createShapes(): void {
    const shape = this._shapes[0].clone();
    const gap = this.paraview.paraState.settings.ui.focusRingGap;
    const oldCentralAngle = shape.centralAngle;
    shape.centralAngle += 2 * gap * 360 / (2 * Math.PI * shape.r);
    shape.orientationAngle -= (shape.centralAngle - oldCentralAngle)/2;
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
    //shape.loc = shape.loc.add(shape.orientationVector.multiplyScalar(-gap));
    this._focusRingShape = shape;
    super._createShapes();
  }

  protected _labelContents(contentsSetting: string): string {
    const tokens = contentsSetting.split(/:/);
    const fields = tokens.map(t => {
      let wrap = false;
      if (t[0] === '(' && t.at(-1) === ')') {
        wrap = true;
        t = t.slice(1, -1);
      }
      let str = '';
      if (t === 'series') {
        str = this.seriesKey;
      } else if (t === 'category') {
        str = this._params.category;
      } else if (t === 'percentage') {
        str = `${Math.round(this._params.percentage * 100)}%`;
      } else if (t === 'value') {
        str = `${this._params.value}`;
      } else {
        throw new Error(`invalid radial label content field '${t}'`);
      }
      return wrap ? `(${str})` : str;
    });
    return fields.join(' ');
  }

  createOutsidelabel(contents = '') {
    const sector = this.shapes[0];
    // Distance of label from chart circumference
    const arcDistVec = sector.orientationVector.multiplyScalar(
      this.chart.settings.outsideLabels.arcGap);
    let textAnchor: LabelTextAnchor = 'end';
    let bboxAnchor: BboxAnchorCorner = 'topLeft';
    let leftPad = 0;
    let rightPad = 0;
    const loc = sector.arcCenter.add(arcDistVec);
    if (this.isPositionRight) {
      loc.x += this.chart.settings.outsideLabels.horizShift;
      leftPad = this.chart.settings.outsideLabels.horizPadding;
      textAnchor = 'start';
    } else {
      loc.x -= this.chart.settings.outsideLabels.horizShift;
      rightPad = this.chart.settings.outsideLabels.horizPadding;
    }
    if (this.isPositionBottom) {
      bboxAnchor = textAnchor === 'start' ? 'topLeft' : 'topRight';
    } else {
      bboxAnchor = textAnchor === 'start' ? 'bottomLeft' : 'bottomRight';
    }
    this._outsideLabel?.remove();
    this._outsideLabel = new Label(this.paraview, {
      text: this._labelContents(contents || this.chart.settings.outsideLabels.contents),
      id: this.id + '-rlb',
      classList: ['pastry-outside-label'],
      role: 'datapoint',
      [bboxAnchor]: loc,
      textAnchor: textAnchor,
    });
    this._outsideLabel.padding = { left: leftPad, right: rightPad };
    this._leader?.remove();
    this._leader = this._createOutsideLabelLeader();
    this.append(this._leader);
    this.append(this._outsideLabel);
  }

  protected _createOutsideLabelLeader() {
    const underlineStart = new Vec2(
      (this.isPositionRight
        ? this._outsideLabel!.paddedLeft
        : this._outsideLabel!.paddedRight),
      this.chart.settings.outsideLabels.leaderStyle === 'direct'
        ? this._outsideLabel!.centerY
        : this._outsideLabel!.bottom
    ).addY(this.chart.settings.outsideLabels.leaderStyle === 'underline'
      ? this.chart.settings.outsideLabels.underlineGap
      : 0
    );
    const underlineSize = this.chart.settings.outsideLabels.leaderStyle === 'direct'
      ? this.chart.settings.outsideLabels.horizPadding
      : this._outsideLabel!.paddedWidth;
    const path = new PathShape(this.paraview, {
      points: [this.shapes[0].arcCenter, underlineStart, underlineStart.x > this._outsideLabel!.centerX
        ? underlineStart.subtractX(underlineSize)
        : underlineStart.addX(underlineSize)],
      stroke: this.paraview.paraState.colors.colorValueAt(this.color),
    });
    path.classInfo = { 'pastry-outside-label-leader': true };
    return path;
  }

  adjustLeader(diff: number) {
    this._leader!.points = [
      this._leader!.points[0],
      this._leader!.points[1].addY(diff),
      this._leader!.points[2].addY(diff)];
  }

  createInsideLabel() {
    const sector = this.shapes[0];
    let bboxAnchor: BboxAnchorCorner = 'topLeft';
    if (this.isPositionBottom) {
      bboxAnchor = this.isPositionRight ? 'topLeft' : 'topRight';
    } else {
      bboxAnchor = this.isPositionRight ? 'bottomLeft' : 'bottomRight';
    }
    this._insideLabel?.remove();
    // console.log('LABEL', this._labelContents(this.chart.settings.insideLabels.contents));
    this._insideLabel = new Label(this.paraview, {
      text: this._labelContents(this.chart.settings.insideLabels.contents),
      id: this.id + '-ilb',
      classList: ['pastry-inside-label'],
      role: 'datapoint',
      [bboxOppositeAnchor(bboxAnchor)]: sector.loc.add(
        sector.orientationVector.multiplyScalar(
          this.chart.radius * this.chart.settings.insideLabels.position)),
    });
    if (!Object.values(this._insideLabel.textCorners).every(point => sector.containsPoint(point))) {
      if (this._outsideLabel) {
        this._outsideLabel.text += `\n${this._insideLabel.text}`;
        // the old leader is still appended to the datapoint!
        const oldLeader = this._leader!;
        this._leader = this._createOutsideLabelLeader();
        this.replaceChild(oldLeader, this._leader);
      } else {
        this.createOutsidelabel(
          this.chart.settings.insideLabels.contents
          + (this.chart.settings.outsideLabels.contents
            ? ':' + this.chart.settings.outsideLabels.contents
            : ''));
      }
      this._insideLabel = null;
    } else {
      this._insideLabel.styleInfo = {
        fill: this.paraview.paraState.colors.contrastValueAt(this.color)
      };
      this.append(this._insideLabel);
    }
  }

  focusRingShape() {
    return this._focusRingShape;
  }

}
