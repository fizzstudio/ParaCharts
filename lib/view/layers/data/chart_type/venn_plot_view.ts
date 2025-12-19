
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
import { type Shape, CircleShape, ArcShape } from '../../../shape';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { Vec2 } from '../../../../common/vector';
import { ClassInfo } from 'lit/directives/class-map.js';
import { datapointMatchKeyAndIndex, bboxOppositeAnchor } from '../../../../common/utils';
import { type BboxAnchorCorner } from '../../../base_view';

type Rectangle = [number, number]; // [width, height]
type Position = [number, number];  // [x, y]
type Point = { x: number; y: number };
type Circle = { center: Point; radius: number; name: string };
type WordRect = { word: string; width: number; height: number };
type IntersectionPoint = { x: number; y: number; circles: Circle[] };
const alphaLSE = 1.0;
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

  protected logSumExpMax(x: number, y: number): number {
    return (1.0 / alphaLSE) * Math.log(
      Math.exp(alphaLSE * x) + Math.exp(alphaLSE * y)
    );
  }
  protected logSumExpMin(x: number, y: number): number {
    return (1.0 / alphaLSE) * Math.log(
      Math.exp(-alphaLSE * x) + Math.exp(-alphaLSE * y)
    );
  }

  protected computeLayout2(
    rectangles: Rectangle[],
    positions: number[],
    circleCenter1: Position,
    circleCenter2: Position,
    circleRadius: number,
    circleBools: [boolean, boolean]
  ): number[] {
    const solution = this.minimize(
      (positions: number[]) => this.cost2(
        rectangles.map(([w, h]) => [w + 50, h + 50]),
        positions,
        circleCenter1,
        circleCenter2,
        circleRadius,
        circleBools
      ),
      Array.from(positions, () => 0)
    );
    return solution.argument;
  }
  protected unitVector(n: number, idx: number) {
    let v = Array(n).fill(0);
    v[idx] = 1;
    return v;
  }
  protected lineMinimization(f: (x: number[]) => number, x: number[], dir: number[], tol: number = 1e-5, maxIter: number = 50) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let a = -1000, b = 1000;
    let c = b - (b - a) / phi;
    let d = a + (b - a) / phi;

    function fAlpha(alpha: number) {
        return f(x.map((xi, idx) => xi + alpha * dir[idx]));
    }

    let fc = fAlpha(c);
    let fd = fAlpha(d);
    let iter = 0;

    while (Math.abs(b - a) > tol && iter < maxIter) {
		// console.log(`Iteration ${iter}: a=${a}, b=${b}, c=${c}, d=${d}`);
        if (fc < fd) {
            b = d;
            d = c;
            fd = fc;
            c = b - (b - a) / phi;
            fc = fAlpha(c);
        } else {
            a = c;
            c = d;
            fc = fd;
            d = a + (b - a) / phi;
            fd = fAlpha(d);
        }
        iter++;
    }

    const alphaMin = (b + a) / 2;
    return { alpha: alphaMin, fval: fAlpha(alphaMin) };
  }

  protected minimize(f: (x: number []) => number, x0: number [], tol: number = 1e-6, maxIter: number = 200) {
    const n = x0.length;
    let x = x0.slice();
    let dirs = [];
    for (let i = 0; i < n; i++) dirs.push(this.unitVector(n, i));

    let fx = f(x);
    let iter = 0;

    while (iter < maxIter) {
        iter++;
        let xStart = x.slice();
        let fxStart = fx;
        let biggestDecrease = 0;
        let biggestDirIdx = -1;

        for (let i = 0; i < n; i++) {
            let { alpha, fval } = this.lineMinimization(f, x, dirs[i]);
            x = x.map((xi, idx) => xi + alpha * dirs[i][idx]);
            let decrease = fx - fval;
            if (decrease > biggestDecrease) {
                biggestDecrease = decrease;
                biggestDirIdx = i;
            }
            fx = fval;
        }

        if (2 * Math.abs(fxStart - fx) <= tol * (Math.abs(fxStart) + Math.abs(fx)) + 1e-10) {
            break;
        }

        let newDir = x.map((xi, idx) => xi - xStart[idx]);
        let { alpha: alphaNew, fval: fxNew } = this.lineMinimization(f, x, newDir);
        x = x.map((xi, idx) => xi + alphaNew * newDir[idx]);
        fx = fxNew;

        if (biggestDirIdx >= 0) dirs[biggestDirIdx] = this.normalize(newDir);
    } 
    return { argument: x, fncvalue: fx };
  }
  protected normalize(v: number[]): number[] {
    const norm = Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
    return norm > 0 ? v.map(vi => vi / norm) : v;
  }
  protected cost2(
    rectangles: Rectangle[],
    positions: number[],
    circleCenter1: [number, number],
    circleCenter2: [number, number],
    circleRadius: number,
    circleBools: [boolean, boolean]
  ): number {
    const nRects = rectangles.length;
    const reshapedPositions: Position[] = [];
    for (let i = 0; i < nRects; i++) {
      reshapedPositions.push([positions[2 * i], positions[2 * i + 1]]);
    }
    let costVal = 0;
    for (let k = 0; k < nRects; k++) {
      const [w, h] = rectangles[k];
      const [x, y] = reshapedPositions[k];
      const corners: Position[] = [
        [x - w / 2, y - h / 2],
        [x + w / 2, y - h / 2],
        [x - w / 2, y + h / 2],
        [x + w / 2, y + h / 2],
      ];
      for (const [cx, cy] of corners) {
        const dists = [0, 0];
        const dx1 = cx - circleCenter1[0];
        const dy1 = cy - circleCenter1[1];
        dists[0] = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const dx2 = cx - circleCenter2[0];
        const dy2 = cy - circleCenter2[1];
        dists[1] = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        for (let p = 0; p < circleBools.length; p++) {
          const circleCoeff = circleBools[p] ? 1 : -1;
          const penalty = Math.min(0, circleCoeff * ((circleRadius - 20) - dists[p]));
          costVal += 100 * penalty * penalty;
        }
      }
    }

    for (let i = 0; i < nRects; i++) {
      const [w1, h1] = rectangles[i];
      const [x1, y1] = reshapedPositions[i];

      for (let j = i + 1; j < nRects; j++) {
        const [w2, h2] = rectangles[j];
        const [x2, y2] = reshapedPositions[j];

        const dx = Math.max(
          0,
          Math.min(x1 + w1 / 2, x2 + w2 / 2) -
          Math.max(x1 - w1 / 2, x2 - w2 / 2)
        );

        const dy = Math.max(
          0,
          Math.min(y1 + h1 / 2, y2 + h2 / 2) -
          Math.max(y1 - h1 / 2, y2 - h2 / 2)
        );

        const overlapArea = dx * dy;
        costVal += 100 * overlapArea;
      }
    }

    return costVal;
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
    for (let idx = 0; idx < seriesKeys.length; idx++) {
      const series = this.paraview.store.model!.series.find(
        s => s.key === seriesKeys[idx]
      );
      if (!series) continue;

      for (let dpIdx = 0; dpIdx < series.datapoints.length; dpIdx++) {
        const dp = series.datapoints[dpIdx];
        //console.log(`Series "${seriesKeys[idx]}" datapoint:`, dp.facetValue('item'));
      }
    }
    let mult: number = -1;
    const colArr = ["blue", "yellow"];
    let regionIdx: number = 0;
    seriesKeys.forEach(seriesKey => {
      const seriesView = new SeriesView(this, seriesKey);
      this._chartLandingView.append(seriesView);
      const region = new VennRegionView(
        seriesView,
        mult * 0.5 * this._radius,
        0,
        this._radius,
        colArr[regionIdx]
      );
      seriesView.append(region);
      mult = 1;
      regionIdx += 1;
    });

    const intersections = this.getIntersections(
      { center: { x: this._cx - 0.5 * this._radius, y: this._cy }, radius: this._radius, name: 'A' },
      { center: { x: this._cx + 0.5 * this._radius, y: this._cy }, radius: this._radius, name: 'B' }
    );

    if (intersections.length === 2) {
      const [p1, p2] = intersections;
      const arc = new ArcShape(this.paraview, {
        r: this._radius,
        points: [
          new Vec2(p1.x, p1.y),
          new Vec2(p2.x, p2.y),
          new Vec2(p2.x, p2.y),
          new Vec2(p1.x, p1.y)
        ],
        fill: "red",
        stroke: "black",
        strokeWidth: 1
      });
      this.append(arc);
      this._createLabels();
    }
  }
  protected _createLabels() {
    const rectanglesA: [number, number][] = [];
    const rectanglesB: [number, number][] = [];
    const rectanglesAB: [number, number][] = [];
    const pointsA: Datapoint[] = [];
    const pointsB: Datapoint[] = [];
    const pointsAB: Datapoint[] = [];

    //console.log('length of datapointViews:', this.datapointViews.length);

    const allDatapoints: Datapoint[] = [];
    for (const series of this.paraview.store.model!.series) {
      allDatapoints.push(...series.datapoints);
    }

    allDatapoints.forEach((dp) => {
      //console.log(JSON.stringify(dp, null, 2));
      let inA: boolean = false;
      let inB: boolean = false;
      if (dp.seriesKey === "flying_animals" && dp.facetValue('membership') == 'included') {
        inA = true;
      }
      if (dp.seriesKey === "aquatic_animals" && dp.facetValue('membership') == 'included') {
        inB = true;
      }
      const w = 10;
      const h = 10;

      //console.log('[inA, inB]', inA, inB);

      if (inA && !inB) {
        rectanglesA.push([w, h]);
        pointsA.push(dp);
      } else if (!inA && inB) {
        rectanglesB.push([w, h]);
        pointsB.push(dp);
      } else if (inA && inB) {
        rectanglesAB.push([w, h]);
        pointsAB.push(dp);
      }
    });

    const circle1: [number, number] = [this._cx - 0.5 * this._radius, this._cy];
    const circle2: [number, number] = [this._cx + 0.5 * this._radius, this._cy];

    const placeLabels = (rects: [number, number][], points: Datapoint[], mask: [boolean, boolean]) => {
      const initialPositions = Array(rects.length * 2).fill(200);
      const layout = this.computeLayout2(rects, initialPositions, circle1, circle2, this._radius, mask);
      console.log('HEY LOOK computeLayout2 returned', layout);
      //console.log('args:', {rects, initialPositions, circle1, circle2, _radius: this._radius, mask});
      points.forEach((dp, i) => {
        const x = layout[2 * i];
        const y = layout[2 * i + 1];
        const label = new Label(this.paraview, {
          text: String(dp.facetValue('item') ?? ''),
          x,
          y,
        });
        this.append(label);
      });
    };
    placeLabels(rectanglesA, pointsA, [true, false]);
    placeLabels(rectanglesB, pointsB, [false, true]);
    placeLabels(rectanglesAB, pointsAB, [true, true]);
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
  declare protected _shape: CircleShape;
  protected _xOff: number;
  protected _yOff: number;
  protected _color: string;
  protected _r: number;
  constructor(parent: SeriesView, x_offset: number = 0, y_offset: number = 0, r: number = 0, color = "red") {
    super(parent);
    this._xOff = x_offset;
    this._yOff = y_offset;
    this._r = r;
    this._isStyleEnabled = true;
    this._color = color;
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
    return { fill: 'none', stroke: 'black', strokeWidth: 1 };
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
    const r = this._r;

    const circle = new CircleShape(this.paraview, {
      x: cx + this._xOff,
      y: cy + this._yOff,
      r: r,
      stroke: 'black',
      fill: this._color
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
