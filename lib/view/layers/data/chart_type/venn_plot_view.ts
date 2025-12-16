
import { DataLayer } from '..';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
import {
  type VennSettings,
  type DeepReadonly,
  Setting,
} from '../../../../store';
import { Label, type LabelTextAnchor } from '../../../label';
import { type ParaView } from '../../../../paraview';
import { type Shape, CircleShape } from '../../../shape';
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

  constructor(
    paraview: ParaView,
    width: number,
    height: number,
    index: number,
    chartInfo: BaseChartInfo
  ) {
    super(paraview, width, height, index, chartInfo);
	this._resetRadius();
  }


  protected _addedToParent() {
    super._addedToParent();
  }

  get settings() {
    return super.settings as DeepReadonly<VennSettings>;
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
    return super.datapointViews as VennRegionView[];
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
  /*
  describeAOnlyPath(
    tripleIntersectionPoints: IntersectionPoint[],
    nonTriplePoints: IntersectionPoint[],
    circleToFill: Circle
  ): SVGTemplateResult {
    const AB = nonTriplePoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
    )!;
    const AC = nonTriplePoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
    )!;
    const BC = tripleIntersectionPoints.find(
      (p) =>
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
    )!;
    const A = AB.circles.find((c) => c.name === "A")!;
    const C = AC.circles.find((c) => c.name === "C")!;
    const B = BC.circles.find((c) => c.name === "B")!;
    const pathData = [
      `M ${AB.x},${AB.y}`,
      `A ${A.radius},${A.radius} 0 1 1 ${AC.x},${AC.y}`,
      `A ${C.radius},${C.radius} 0 0 0 ${BC.x},${BC.y}`,
      `A ${B.radius},${B.radius} 0 0 0 ${AB.x},${AB.y}`,
      "Z",
    ].join(" ");
    return svg`<path d="${pathData}" fill="blue" stroke="none"></path>`;
  }
  */
  /*
   describeBOnlyPath(
     tripleIntersectionPoints: IntersectionPoint[],
     nonTriplePoints: IntersectionPoint[],
     circleToFill: Circle
   ): SVGTemplateResult {
     const BC = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
     )!;
     const BA = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "A") ||
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "B")
     )!;
     const AC = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
     )!;
     const B = BC.circles.find((c) => c.name === "B")!;
     const A = BA.circles.find((c) => c.name === "A")!;
     const C = AC.circles.find((c) => c.name === "C")!;
     const pathData = [
       `M ${BC.x},${BC.y}`,
       `A ${B.radius},${B.radius} 0 1 1 ${BA.x},${BA.y}`,
       `A ${A.radius},${A.radius} 0 0 0 ${AC.x},${AC.y}`,
       `A ${C.radius},${C.radius} 0 0 0 ${BC.x},${BC.y}`,
       "Z",
     ].join(" ");
     return svg`<path d="${pathData}" fill="red" stroke="none"></path>`;
   }
  */
  /*
   describeCOnlyPath(
    tripleIntersectionPoints: IntersectionPoint[],
    nonTriplePoints: IntersectionPoint[],
    circleToFill: Circle
  ): SVGTemplateResult {
    const AC = nonTriplePoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
    )!;
    const BC = nonTriplePoints.find(
      (p) =>
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
    )!;
    const AB = tripleIntersectionPoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
    )!;
    const C = BC.circles.find((c) => c.name === "C")!;
    const B = AB.circles.find((c) => c.name === "B")!;
    const A = AC.circles.find((c) => c.name === "A")!;
    const pathData = [
      `M ${AC.x},${AC.y}`,
      `A ${C.radius},${C.radius} 0 1 1 ${BC.x},${BC.y}`,
      `A ${B.radius},${B.radius} 0 0 0 ${AB.x},${AB.y}`,
      `A ${A.radius},${A.radius} 0 0 0 ${AC.x},${AC.y}`,
      "Z",
    ].join(" ");
    return svg`<path d="${pathData}" fill="deeppink" stroke="none"></path>`;
  }
  */
  /*
   describeCOnlyPath(
     tripleIntersectionPoints: IntersectionPoint[],
     nonTriplePoints: IntersectionPoint[],
     circleToFill: Circle
   ): SVGTemplateResult {
     const AC = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
     )!;
     const BC = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
     )!;
     const AB = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
     )!;
     const C = BC.circles.find((c) => c.name === "C")!;
     const B = AB.circles.find((c) => c.name === "B")!;
     const A = AC.circles.find((c) => c.name === "A")!;
     const pathData = [
       `M ${AC.x},${AC.y}`,
       `A ${C.radius},${C.radius} 0 1 1 ${BC.x},${BC.y}`,
       `A ${B.radius},${B.radius} 0 0 0 ${AB.x},${AB.y}`,
       `A ${A.radius},${A.radius} 0 0 0 ${AC.x},${AC.y}`,
       "Z",
     ].join(" ");
     return svg`<path d="${pathData}" fill="deeppink" stroke="none"></path>`;
   }
   */
  /*
  describeABPath(
    tripleIntersectionPoints: IntersectionPoint[],
    nonTriplePoints: IntersectionPoint[],
    circleToFill: Circle
  ): SVGTemplateResult {
    const AC = tripleIntersectionPoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
    )!;
    const AB = nonTriplePoints.find(
      (p) =>
        (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
    )!;
    const BC = tripleIntersectionPoints.find(
      (p) =>
        (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
        (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
    )!;
    const A = AB.circles.find((c) => c.name === "A")!;
    const C = AC.circles.find((c) => c.name === "C")!;
    const B = BC.circles.find((c) => c.name === "B")!;
    const pathData = [
      `M ${AC.x},${AC.y}`,
      `A ${A.radius},${A.radius} 0 0 1 ${AB.x},${AB.y}`,
      `A ${B.radius},${B.radius} 0 0 1 ${BC.x},${BC.y}`,
      `A ${C.radius},${C.radius} 0 0 0 ${AC.x},${AC.y}`,
      "Z",
    ].join(" ");
    return svg`<path d="${pathData}" fill="yellow" stroke="none"></path>`;
  }
  */
  /*
   describeACPath(
     tripleIntersectionPoints: IntersectionPoint[],
     nonTriplePoints: IntersectionPoint[],
     circleToFill: Circle
   ): SVGTemplateResult {
     const AC = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
     )!;
     const AB = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
     )!;
     const BC = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
     )!;
     const A = AB.circles.find((c) => c.name === "A")!;
     const C = AC.circles.find((c) => c.name === "C")!;
     const B = BC.circles.find((c) => c.name === "B")!;
     const pathData = [
       `M ${AC.x},${AC.y}`,
       `A ${A.radius},${A.radius} 0 0 1 ${AB.x},${AB.y}`,
       `A ${B.radius},${B.radius} 0 0 0 ${BC.x},${BC.y}`,
       `A ${C.radius},${C.radius} 0 0 1 ${AC.x},${AC.y}`,
       "Z",
     ].join(" ");
     return svg`<path d="${pathData}" fill="green" stroke="none"></path>`;
   }
  */
  /*
   describeBCPath(
     tripleIntersectionPoints: IntersectionPoint[],
     nonTriplePoints: IntersectionPoint[],
     circleToFill: Circle
   ): SVGTemplateResult {
     const AB = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
     )!;
     const BC = nonTriplePoints.find(
       (p) =>
         (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
     )!;
     const AC = tripleIntersectionPoints.find(
       (p) =>
         (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
         (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
     )!;
     const A = AB.circles.find((c) => c.name === "A")!;
     const C = AC.circles.find((c) => c.name === "C")!;
     const B = BC.circles.find((c) => c.name === "B")!;
     const pathData = [
       `M ${AB.x},${AB.y}`,
       `A ${B.radius},${B.radius} 0 0 1 ${BC.x},${BC.y}`,
       `A ${C.radius},${C.radius} 0 0 1 ${AC.x},${AC.y}`,
       `A ${A.radius},${A.radius} 0 0 0 ${AB.x},${AB.y}`,
       "Z",
     ].join(" ");
     return svg`<path d="${pathData}" fill="yellow" stroke="none"></path>`;
   }
   */
  /*
   drawPath(d: string, fill: string = "green", stroke: string = "black"): void {
     const path = document.createElementNS(svgNS, "path");
     path.setAttribute("d", d);
     path.setAttribute("fill", fill);
     path.setAttribute("stroke", stroke);
     path.setAttribute("fill-opacity", "1");
     svg.appendChild(path);
   }
   */
  /*
   sortPointsByAngle(points: IntersectionPoint[]): IntersectionPoint[] {
     const center = averagePoints(points);
     return points.slice().sort((a, b) => {
       const angleA = Math.atan2(a.y - center.y, a.x - center.x);
       const angleB = Math.atan2(b.y - center.y, b.x - center.x);
       return angleA - angleB;
     });
   }
   */
  /*
   findTripleIntersectionPoints(
     circle1: Circle,
     circle2: Circle,
     circle3: Circle,
     points: IntersectionPoint[]
   ): IntersectionPoint[] {
     return points.filter(
       (p) =>
         this.isInsideCircle(circle1, p) &&
         this.isInsideCircle(circle2, p) &&
         this.isInsideCircle(circle3, p)
     );
   }
   */
  /*
   drawCircle(
     circle: Circle,
     fill: string = "none",
     stroke: string = "black"
   ): void {
     const c = document.createElementNS(svgNS, "circle");
     c.setAttribute("cx", circle.center.x.toString());
     c.setAttribute("cy", circle.center.y.toString());
     c.setAttribute("r", circle.radius.toString());
     c.setAttribute("fill", fill);
     c.setAttribute("stroke", stroke);
     svg.appendChild(c);
   }
 */
  protected _completeDatapointLayout(): void {
    super._completeDatapointLayout();
  }

  init() {
    super.init();
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    super.settingDidChange(path, oldValue, newValue);
  }


  protected _resetRadius() {
    this._radius = Math.min(this._height, this._width) / 3;
    this._cx = this._width / 2;
    this._cy = this._height / 2;
  }

  protected _createDatapoints() {
    const seriesKeys = this.paraview.store.model!.seriesKeys;
	let mult: number = -1;
    seriesKeys.forEach(seriesKey => {
        const seriesView = new SeriesView(this, seriesKey);
        this._chartLandingView.append(seriesView);
        const region = new VennRegionView(seriesView, mult*0.5*this._radius, 0);
        seriesView.append(region);
		mult = 1;
    });
}

  protected _createLabels() {
  }

  protected _resolveOutsideLabelCollisions() {
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

/*
export interface RadialDatapointParams {
  category: string;
  value: number;
  seriesIdx: number;
  percentage: number;
  accum: number;
  numDatapoints: number;
}
*/
export class VennRegionView extends DatapointView {
  declare readonly chart: VennPlotView;
  declare protected _shapes: PathShape[];
  protected _xOff: number;
  protected _yOff: number;
  constructor(parent: SeriesView, x_offset: number = 0, y_offset: number = 0) {
    super(parent);
	this._xOff = x_offset;
	this._yOff = y_offset;
    this._isStyleEnabled = true;
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

  /*
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
  */
  get styleInfo() {
    return { fill: 'red', stroke: 'black', strokeWidth: 1 };
    //const style = super.styleInfo;
    //delete style.strokeWidth;
    //delete style.stroke;
    //return style;
  }

  get x() {
    return super.x;
  }

  get y() {
    return super.y;
  }

  protected _createSymbol() {
    const cx = this.chart.cx;
    const cy = this.chart.cy;
    const r = this.chart._radius;

    const circle = new CircleShape(this.paraview, {
      x: cx + this._xOff,
      y: cy + this._yOff,
      r: r,
      stroke: 'black',
      fill: 'red'
    });
    this._shapes = [circle];
    this.append(circle);
  }


  protected _createShapes() {
    this._createSymbol();
  }
  /*
  focusRingShape() {
    return this._focusRingShape;
  }
  */
}
