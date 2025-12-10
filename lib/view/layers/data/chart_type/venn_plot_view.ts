
import { DataLayer } from '..';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
import {
  type RadialSettings,
  type RadialChartType, type DeepReadonly,
  Setting,
} from '../../../../store';
import { Label, type LabelTextAnchor } from '../../../label';
import { type ParaView } from '../../../../paraview';
import { type Shape, SectorShape, PathShape } from '../../../shape';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { Vec2 } from '../../../../common/vector';
import { ClassInfo } from 'lit/directives/class-map.js';
import { datapointMatchKeyAndIndex, bboxOppositeAnchor } from '../../../../common/utils';
import { type BboxAnchorCorner } from '../../../base_view';

type Point = { x: number; y: number };
type Circle = { center: Point; radius: number; name: string };
type WordRect = { word: string; width: number; height: number };
type IntersectionPoint = { x: number; y: number; circles: Circle[] };

export class VennPlotView extends DataLayer {

  protected _cx!: number;
  protected _cy!: number;
  protected _radius!: number;
  // TODO: calculate radius_divisor based on longest label, for pie and donut
  protected _radiusDivisor = 2.3;

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
    this._resetRadius();
  }

  get settings() {
    return super.settings as DeepReadonly<RadialSettings>;
  }

  get cx() {
    return this._cx;
  }

  get cy() {
    return this._cy;
  }

  get radius() {
    return this._radius;
  }

  get datapointViews() {
    return super.datapointViews as RadialSlice[];
  }

  getIntersections(circle1: Circle, circle2: Circle): Point[] {
    const EPSILON = 1e-6;
    const dx = circle2.center.x - circle1.center.x;
    const dy = circle2.center.y - circle1.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (
      circle1.radius + circle2.radius < distance ||
      distance < Math.abs(circle1.radius - circle2.radius)
    ) {
      return [];
    }
    const a =
      (circle1.radius ** 2 - circle2.radius ** 2) / (2 * distance) +
      distance / 2;
    const h = Math.sqrt(circle1.radius ** 2 - a ** 2);
    const x_p =
      circle1.center.x + (a * (circle2.center.x - circle1.center.x)) / distance;
    const y_p =
      circle1.center.y + (a * (circle2.center.y - circle1.center.y)) / distance;
    const x_pair1 =
      x_p + (h / distance) * (circle2.center.y - circle1.center.y);
    const x_pair2 =
      x_p - (h / distance) * (circle2.center.y - circle1.center.y);
    const y_pair1 =
      y_p - (h / distance) * (circle2.center.x - circle1.center.x);
    const y_pair2 =
      y_p + (h / distance) * (circle2.center.x - circle1.center.x);
    if (
      Math.abs(x_pair1 - x_pair2) < EPSILON &&
      Math.abs(y_pair1 - y_pair2) < EPSILON
    ) {
      return [{ x: x_pair1, y: y_pair1 }];
    }
    return [
      { x: x_pair1, y: y_pair1 },
      { x: x_pair2, y: y_pair2 },
    ];
  }

  protected _completeDatapointLayout(): void {
    super._completeDatapointLayout();
    this._createLabels();
  }
  init() {
    super.init();
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['color.colorPalette', 'color.colorVisionMode'].includes(path)) {
      if (newValue === 'pattern' || (newValue !== 'pattern' && oldValue === 'pattern')
        || this.paraview.store.settings.color.colorPalette === 'pattern') {
        this.paraview.createDocumentView();
        this.paraview.requestUpdate();
      }
    }

    const settings = ['explode', 'orientationAngleOffset', 'insideLabels.contents', 'outsideLabels.contents'];
    if (settings.map(s => `type.${this.paraview.store.type}.${s}`).includes(path)) {
      this._resetRadius();
      this._chartLandingView.clearChildren();
      this._layoutDatapoints();
      this.paraview.requestUpdate();
    }

    super.settingDidChange(path, oldValue, newValue);
  }

  protected _resetRadius() {
    this._radius = Math.min(this._height, this._width) / 3;
    this._cx = this._width / 2;
    this._cy = this._height / 2;
  }

  protected _createDatapoints() {
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

    slices.slice(1).forEach((s, i) => {
      // Move each label up out of collision with the one onscreen below it.
      if (s.outsideLabel!.intersects(slices[i].outsideLabel!)) {
        const oldY = s.outsideLabel!.y;
        s.outsideLabel!.bottom = slices[i].outsideLabel!.top - this.settings.outsideLabels.vertGap; // - s.categoryLabel!.height;
        const diff = s.outsideLabel!.y - oldY;
        s.adjustLeader(diff);
      }
    });
  }

  focusRingShape(): Shape | null {
    const chartInfo = this._parent.docView.chartInfo;
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

export class VennRegionView extends DatapointView {
  declare readonly chart: VennPlotView;
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
      // visited: this.paraview.store.isVisited(this.seriesKey, this.index),
      // selected: this.paraview.store.isSelected(this.seriesKey, this.index)
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
    const gap = this.paraview.store.settings.ui.focusRingGap;
    const oldCentralAngle = shape.centralAngle;
    shape.centralAngle += 2 * gap * 360 / (2 * Math.PI * shape.r);
    shape.orientationAngle -= (shape.centralAngle - oldCentralAngle) / 2;
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
      stroke: this.paraview.store.colors.colorValueAt(this.color),
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
        fill: this.paraview.store.colors.contrastValueAt(this.color)
      };
      this.append(this._insideLabel);
    }
  }

  focusRingShape() {
    return this._focusRingShape;
  }
}
