
import { DataLayer } from '..';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
import {
  type VennSettings,
  type DeepReadonly,
  Setting,
} from '../../../../state';
import { Label, type LabelTextAnchor } from '../../../label';
import { type ParaView } from '../../../../paraview';
import { type Shape, CircleShape, ArcShape } from '../../../shape';
import { Datapoint, enumerate } from '@fizz/paramodel';
import { formatBox, formatXYDatapoint } from '@fizz/parasummary';
import { Vec2 } from '../../../../common/vector';
import { ClassInfo } from 'lit/directives/class-map.js';
import { datapointMatchKeyAndIndex, bboxOppositeAnchor } from '../../../../common/utils';
import { type BboxAnchorCorner } from '../../../base_view';

type ItemEntry = {
  inA: boolean;
  inB: boolean;
  datapoints: Datapoint[];
};
type Rectangle = [number, number];
type Position = [number, number];
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

  protected computeLayout(
    rectangles: Rectangle[],
    positions: number[],
    circleCenter1: Position,
    circleCenter2: Position,
    circleRadius: number,
    circleBools: [boolean, boolean]
  ): number[] {
    const solution = this.minimize(
      (positions: number[]) => this.cost(
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

  protected minimize(f: (x: number[]) => number, x0: number[], tol: number = 1e-6, maxIter: number = 200) {
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

  protected cost(
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

  protected findTripleIntersectionPoints(circle1: Circle, circle2: Circle, circle3: Circle, points: IntersectionPoint[]): IntersectionPoint[] {
    return points.filter(p =>
      this.isInsideCircle(circle1, p) &&
      this.isInsideCircle(circle2, p) &&
      this.isInsideCircle(circle3, p)
    );
  }

  protected isInsideCircle(circle: Circle, p: Point): boolean {
    const dx = p.x - circle.center.x;
    const dy = p.y - circle.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const epsilon = 1e-6;
    return distance <= circle.radius + epsilon;
  }

  protected _completeDatapointLayout(): void {
    super._completeDatapointLayout();
    this._createLabels();
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

  protected _createDatapoints2Circles() {
    const seriesKeys = this.paraview.paraState.model!.seriesKeys;
    for (let idx = 0; idx < seriesKeys.length; idx++) {
      const series = this.paraview.paraState.model!.series.find(
        s => s.key === seriesKeys[idx]
      );
      if (!series) continue;

      for (let dpIdx = 0; dpIdx < series.datapoints.length; dpIdx++) {
        const dp = series.datapoints[dpIdx];
      }
    }
    let mult: number = -1;
    let regionIdx: number = 0;
    seriesKeys.forEach(seriesKey => {
      const seriesView = new SeriesView(this, seriesKey);
      this._chartLandingView.append(seriesView);
      const region = new VennRegionView(
        seriesView,
        mult * 0.5 * this._radius,
        0,
        this._radius
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
        segments: [
          {
            start: new Vec2(p1.x, p1.y),
            end: new Vec2(p2.x, p2.y),
            largeArc: 0,
            sweep: 0
          },
          {
            start: new Vec2(p2.x, p2.y),
            end: new Vec2(p1.x, p1.y),
            largeArc: 0,
            sweep: 0
          }
        ],
        stroke: "white",
        fill: "mediumseagreen",
        strokeWidth: 5,
      });

      this.append(arc);
    }
  }

  protected _createDatapoints3Circles() {
    const seriesKeys = this.paraview.paraState.model!.seriesKeys;
    const radius = this._radius * 0.9;
    const cx = this._cx;
    const cy = this._cy;

    const offsetX = radius * 0.7;
    const offsetY = radius * 0.6;

    const centers: { x: number; y: number }[] = [
      { x: cx - offsetX * 0.7, y: cy + offsetY },
      { x: cx + offsetX * 0.7, y: cy + offsetY },
      { x: cx, y: cy - offsetY * 0.7},
    ];

    const circle1 = { center: { x: cx - offsetX * 0.7, y: cy + offsetY }, radius: radius, name: "A" };
    const circle2 = { center: { x: cx + offsetX * 0.7, y: cy + offsetY }, radius: radius, name: "B" };
    const circle3 = { center: { x: cx, y: cy - offsetY * 0.7}, radius: radius, name: "C" };

    seriesKeys.forEach((seriesKey, i) => {
      const seriesView = new SeriesView(this, seriesKey);
      this._chartLandingView.append(seriesView);

      const center = centers[i];

      const region = new VennRegionView(
        seriesView,
        center.x - cx,
        center.y - cy,
        radius
      );

      seriesView.append(region);
    });

    const [p1, p2] = this.getIntersections(
      { center: { x: cx - offsetX * 0.7, y: cy + offsetY }, radius: radius, name: 'A' },
      { center: { x: cx + offsetX * 0.7, y: cy + offsetY }, radius: radius, name: 'B' }
    );

    const [p3, p4] = this.getIntersections(
      { center: { x: cx - offsetX * 0.7, y: cy + offsetY }, radius: radius, name: 'A' },
      { center: { x: cx, y: cy - offsetY * 0.7}, radius: radius, name: 'C' }
    );

    const [p5, p6] = this.getIntersections(
      { center: { x: cx + offsetX * 0.7, y: cy + offsetY }, radius: radius, name: 'B' },
      { center: { x: cx, y: cy - offsetY * 0.7}, radius: radius, name: 'C' }
    );

    if (p1 && p2 && p3 && p4 && p5 && p6) {
      const points: IntersectionPoint[] = [
        { x: p1.x, y: p1.y, circles: [circle1, circle2] },
        { x: p2.x, y: p2.y, circles: [circle1, circle2] },
        { x: p3.x, y: p3.y, circles: [circle1, circle3] },
        { x: p4.x, y: p4.y, circles: [circle1, circle3] },
        { x: p5.x, y: p5.y, circles: [circle2, circle3] },
        { x: p6.x, y: p6.y, circles: [circle2, circle3] },
      ];
      const tripleIntersectionPoints = this.findTripleIntersectionPoints(circle1, circle2, circle3, points);
      const keep = tripleIntersectionPoints;
      const sortedPoints = this.sortPointsByAngle(tripleIntersectionPoints);
      const [sp1, sp2, sp3] = sortedPoints;
      console.log("extreme ", sortedPoints);
      const tripleArc = new ArcShape(this.paraview, {
        r: radius,
        segments: [
          {
            start: new Vec2(sp1.x, sp1.y),
            end: new Vec2(sp2.x, sp2.y),
            largeArc: 0,
            sweep: 1
          },
          {
            start: new Vec2(sp2.x, sp2.y),
            end: new Vec2(sp3.x, sp3.y),
            largeArc: 0,
            sweep: 1
          },
          {
            start: new Vec2(sp3.x, sp3.y),
            end: new Vec2(sp1.x, sp1.y),
            largeArc: 0,
            sweep: 1
          }
        ],
        stroke: "white",
        fill: "red",
        strokeWidth: 5
      });
      this.append(tripleArc);

      const nonTriplePoints = points.filter(
        p => !keep.some(tp => tp.x === p.x && tp.y === p.y)
      );

      // AB non-triple intersection (outside C)
      const AB = nonTriplePoints.find(
        p =>
          (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
          (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
      )!;

      // Triple intersections involving A and C, B and C
      const AC = tripleIntersectionPoints.find(
        p =>
          (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
      )!;

      const BC = tripleIntersectionPoints.find(
        p =>
          (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
      )!;

      // Build AB lens arc (matches describeABPath semantics)
      const abArc = new ArcShape(this.paraview, {
        r: radius,
        segments: [
          {
            start: new Vec2(AC.x, AC.y),
            end: new Vec2(AB.x, AB.y),
            largeArc: 0,
            sweep: 1
          },
          {
            start: new Vec2(AB.x, AB.y),
            end: new Vec2(BC.x, BC.y),
            largeArc: 0,
            sweep: 1
          },
          {
            start: new Vec2(BC.x, BC.y),
            end: new Vec2(AC.x, AC.y),
            largeArc: 0,
            sweep: 0
          }
        ],
        stroke: "white",
        fill: "blue",
        strokeWidth: 5
      });

      this.append(abArc);

      // AC non-triple intersection (outside B)
      const AC_nonTriple = nonTriplePoints.find(
        p =>
          (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
      )!;

      // Triple intersections involving A+B and B+C
      const AB_triple = tripleIntersectionPoints.find(
        p =>
          (p.circles[0]!.name === "A" && p.circles[1]!.name === "B") ||
          (p.circles[0]!.name === "B" && p.circles[1]!.name === "A")
      )!;

      const BC_triple = tripleIntersectionPoints.find(
        p =>
          (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
      )!;

      const acArc = new ArcShape(this.paraview, {
        r: radius,
        segments: [
          {
            start: new Vec2(AB_triple.x, AB_triple.y),
            end: new Vec2(AC_nonTriple.x, AC_nonTriple.y),
            largeArc: 0,
            sweep: 0
          },
          {
            start: new Vec2(AC_nonTriple.x, AC_nonTriple.y),
            end: new Vec2(BC_triple.x, BC_triple.y),
            largeArc: 0,
            sweep: 0
          },
          {
            start: new Vec2(BC_triple.x, BC_triple.y),
            end: new Vec2(AB_triple.x, AB_triple.y),
            largeArc: 0,
            sweep: 1
          }
        ],
        stroke: "white",
        fill: "hotpink",
        strokeWidth: 5
      });

      this.append(acArc);

      // BC non-triple intersection (outside A)
      const BC_nonTriple = nonTriplePoints.find(
        p =>
          (p.circles[0]!.name === "B" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "B")
      )!;
      const AC_triple = tripleIntersectionPoints.find(
        p =>
          (p.circles[0]!.name === "A" && p.circles[1]!.name === "C") ||
          (p.circles[0]!.name === "C" && p.circles[1]!.name === "A")
      )!;

      const bcArc = new ArcShape(this.paraview, {
        r: radius,
        segments: [
          {
            start: new Vec2(AC_triple.x, AC_triple.y),
            end: new Vec2(BC_nonTriple.x, BC_nonTriple.y),
            largeArc: 0,
            sweep: 0
          },
          {
            start: new Vec2(BC_nonTriple.x, BC_nonTriple.y),
            end: new Vec2(AB_triple.x, AB_triple.y),
            largeArc: 0,
            sweep: 0
          },
          {
            start: new Vec2(AB_triple.x, AB_triple.y),
            end: new Vec2(AC_triple.x, AC_triple.y),
            largeArc: 0,
            sweep: 1
          }
        ],
        stroke: "white",
        fill: "gold",
        strokeWidth: 5
      });

      this.append(bcArc);

    }
  }

  protected averagePoints(points: Point[]): Point {
    const result: Point = { x: 0, y: 0 };
    for (const point of points) {
      result.x += point.x;
      result.y += point.y;
    }
    result.x /= points.length;
    result.y /= points.length;
    return result;
  }

  protected sortPointsByAngle(points: IntersectionPoint[]): IntersectionPoint[] {
    const center = this.averagePoints(points);

    return points.slice().sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });
  }
  protected _createDatapoints() {
    const seriesKeys = this.paraview.paraState.model!.seriesKeys;

    switch (seriesKeys.length) {
      case 2:
        this._createDatapoints2Circles();
        break;

      case 3:
        this._createDatapoints3Circles();
        break;

      default:
        throw new Error(
          `VennPlotView supports only 2 or 3 series, got ${seriesKeys.length}`
        );
    }
  }

  protected _createLabels() {
    const seriesKeys = this.paraview.paraState.model!.series.map(s => s.key);
    if (seriesKeys.length !== 2) {
      return;
    }

    const [seriesAKey, seriesBKey] = seriesKeys;

    const rectanglesA: [number, number][] = [];
    const rectanglesB: [number, number][] = [];
    const rectanglesAB: [number, number][] = [];
    const pointsA: Datapoint[] = [];
    const pointsB: Datapoint[] = [];
    const pointsAB: Datapoint[] = [];

    const allDatapoints: Datapoint[] = [];
    for (const series of this.paraview.paraState.model!.series) {
      allDatapoints.push(...series.datapoints);
    }

    const itemMap = new Map<string, ItemEntry>();

    for (const dp of allDatapoints) {
      const item = String(dp.facetValue("item") ?? "");

      let entry = itemMap.get(item);
      if (!entry) {
        entry = { inA: false, inB: false, datapoints: [] };
        itemMap.set(item, entry);
      }

      entry.datapoints.push(dp);

      if (
        dp.seriesKey === seriesAKey &&
        dp.facetValue("membership") === "included"
      ) {
        entry.inA = true;
      }

      if (
        dp.seriesKey === seriesBKey &&
        dp.facetValue("membership") === "included"
      ) {
        entry.inB = true;
      }
    }

    const w = 80;
    const h = 10;

    for (const entry of itemMap.values()) {
      const dp = entry.datapoints[0];

      if (entry.inA && !entry.inB) {
        rectanglesA.push([w, h]);
        pointsA.push(dp);
      } else if (!entry.inA && entry.inB) {
        rectanglesB.push([w, h]);
        pointsB.push(dp);
      } else if (entry.inA && entry.inB) {
        rectanglesAB.push([w, h]);
        pointsAB.push(dp);
      }
    }

    const circle1: [number, number] = [
      this._cx - 0.5 * this._radius,
      this._cy,
    ];
    const circle2: [number, number] = [
      this._cx + 0.5 * this._radius,
      this._cy,
    ];

    const placeLabels = (
      rects: [number, number][],
      points: Datapoint[],
      mask: [boolean, boolean]
    ) => {
      const initialPositions = Array(rects.length * 2).fill(200);
      const layout = this.computeLayout(
        rects,
        initialPositions,
        circle1,
        circle2,
        this._radius,
        mask
      );

      points.forEach((dp, i) => {
        const x = layout[2 * i];
        const y = layout[2 * i + 1];
        const label = new Label(this.paraview, {
          text: String(dp.facetValue("item") ?? ""),
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

  focusRingShape(): Shape | null {
    const chartInfo = this._parent.parent.chartInfo;
    const cursor = chartInfo.navMap!.cursor;
    if (cursor.isNodeType('datapoint')) {
      return this.datapointView(cursor.options.seriesKey, cursor.options.index)!.focusRingShape();
    }
    return null;
  }
}

export class VennRegionView extends DatapointView {
  declare readonly chart: VennPlotView;
  protected _circle?: CircleShape;
  declare protected _shape: CircleShape;
  protected _xOff: number;
  protected _yOff: number;
  protected _r: number;

  constructor(parent: SeriesView, x_offset: number = 0, y_offset: number = 0, r: number = 0) {
    super(parent);
    this._xOff = x_offset;
    this._yOff = y_offset;
    this._r = r;
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

  get styleInfo() {
    // use the SeriesView's styleInfo as the base
    const parentStyle = this._parent.styleInfo;

    return {
      fill: parentStyle.fill,
      stroke: "white",
      strokeWidth: "5"
    };
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
    this._circle?.remove();

    this._circle = new CircleShape(this.paraview, {
      x: cx + this._xOff,
      y: cy + this._yOff,
      r,
      stroke: 'white',
    });
    this._shapes = [this._circle];

    this.append(this._circle);
  }
  protected _createShapes() {
    this._createSymbol();
  }
}
