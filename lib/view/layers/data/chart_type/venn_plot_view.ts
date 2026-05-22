
import { svg, TemplateResult } from 'lit';
import { DataLayer } from '..';
import { type BaseChartInfo } from '../../../../chart_types';
import { DatapointView, SeriesView } from '../../../data';
import {
  type VennSettings,
  type DeepReadonly,
  Setting,
} from '../../../../state';
import { Label, type LabelTextAnchor } from '../../../label';
import { type DataLayerContext } from '../../../view_context';
import { type Shape, CircleShape, ArcShape, PathShape } from '../../../shape';
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
type ArcRegionSide = 'inside' | 'outside';
type RegionPredicate = (point: Point) => boolean;
const alphaLSE = 1.0;

// --- 3-circle Venn geometry helpers (ported from VennDiagrams/Venn.ts) ---

function getArcFlags(circle: Circle, p1: Point, p2: Point): { largeArcFlag: number; sweepFlag: number } {
  const angle = (point: Point) => Math.atan2(point.y - circle.center.y, point.x - circle.center.x);
  let a1 = angle(p1);
  let a2 = angle(p2);
  if (a1 < 0) a1 += 2 * Math.PI;
  if (a2 < 0) a2 += 2 * Math.PI;
  let delta = a2 - a1;
  if (delta < 0) delta += 2 * Math.PI;
  const largeArcFlag = delta > Math.PI ? 1 : 0;
  return { largeArcFlag, sweepFlag: 1 };
}

function isInsideCircle(circle: Circle, p: Point): boolean {
  const dx = p.x - circle.center.x;
  const dy = p.y - circle.center.y;
  return Math.sqrt(dx * dx + dy * dy) <= circle.radius + 1e-6;
}

function findTripleIntersectionPoints(
  circle1: Circle, circle2: Circle, circle3: Circle,
  points: IntersectionPoint[]
): IntersectionPoint[] {
  return points.filter(p =>
    isInsideCircle(circle1, p) &&
    isInsideCircle(circle2, p) &&
    isInsideCircle(circle3, p)
  );
}

function averagePoints(points: Point[]): Point {
  const result: Point = { x: 0, y: 0 };
  for (const point of points) {
    result.x += point.x;
    result.y += point.y;
  }
  result.x /= points.length;
  result.y /= points.length;
  return result;
}

function sortPointsByAngle(points: IntersectionPoint[]): IntersectionPoint[] {
  const center = averagePoints(points);
  return points.slice().sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

function describeTripleIntersectionPath(points: IntersectionPoint[]): string {
  const [p1, p2, p3] = points;
  if (!p1 || !p2 || !p3) return '';
  const shared1 = p1.circles.find(c => p2.circles.includes(c))!;
  const shared2 = p2.circles.find(c => p3.circles.includes(c))!;
  const shared3 = p3.circles.find(c => p1.circles.includes(c))!;
  const arc1 = getArcFlags(shared1, p1, p2);
  const arc2 = getArcFlags(shared2, p2, p3);
  const arc3 = getArcFlags(shared3, p3, p1);
  return [
    `M ${p1.x},${p1.y}`,
    `A ${shared1.radius},${shared1.radius} 0 ${arc1.largeArcFlag} 1 ${p2.x},${p2.y}`,
    `A ${shared2.radius},${shared2.radius} 0 ${arc2.largeArcFlag} 1 ${p3.x},${p3.y}`,
    `A ${shared3.radius},${shared3.radius} 0 ${arc3.largeArcFlag} 1 ${p1.x},${p1.y}`,
    'Z',
  ].join(' ');
}

function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}

function pointOnCircle(circle: Circle, angle: number): Point {
  return {
    x: circle.center.x + circle.radius * Math.cos(angle),
    y: circle.center.y + circle.radius * Math.sin(angle),
  };
}

function describeRegionArc(
  circle: Circle,
  from: Point,
  to: Point,
  side: ArcRegionSide,
  regionPredicate: RegionPredicate
): string {
  const startAngle = normalizeAngle(Math.atan2(from.y - circle.center.y, from.x - circle.center.x));
  const endAngle = normalizeAngle(Math.atan2(to.y - circle.center.y, to.x - circle.center.x));
  const clockwiseDelta = normalizeAngle(endAngle - startAngle);
  const counterClockwiseDelta = clockwiseDelta === 0 ? 2 * Math.PI : 2 * Math.PI - clockwiseDelta;
  const probeDistance = 1;

  const candidates = [
    { sweepFlag: 1, largeArcFlag: clockwiseDelta > Math.PI ? 1 : 0, delta: clockwiseDelta },
    { sweepFlag: 0, largeArcFlag: counterClockwiseDelta > Math.PI ? 1 : 0, delta: counterClockwiseDelta },
  ];

  for (const candidate of candidates) {
    const direction = candidate.sweepFlag === 1 ? 1 : -1;
    const midpointAngle = normalizeAngle(startAngle + direction * candidate.delta / 2);
    const midpoint = pointOnCircle(circle, midpointAngle);
    const dx = midpoint.x - circle.center.x;
    const dy = midpoint.y - circle.center.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const scale = side === 'inside' ? -probeDistance / length : probeDistance / length;
    const probe = {
      x: midpoint.x + dx * scale,
      y: midpoint.y + dy * scale,
    };

    if (regionPredicate(probe)) {
      return `A ${circle.radius},${circle.radius} 0 ${candidate.largeArcFlag} ${candidate.sweepFlag} ${to.x},${to.y}`;
    }
  }

  const fallback = candidates[0]!;
  return `A ${circle.radius},${circle.radius} 0 ${fallback.largeArcFlag} ${fallback.sweepFlag} ${to.x},${to.y}`;
}

function makeRegionPredicate(included: Circle[], excluded: Circle[]): RegionPredicate {
  return (point: Point) => included.every(circle => isInsideCircle(circle, point))
    && excluded.every(circle => !isInsideCircle(circle, point));
}

function describeAOnlyPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const AB = nonTriplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const AC = nonTriplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const ABTriple = triplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const ACTriple = triplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const A = AB.circles.find(c => c.name === 'A')!;
  const C = AC.circles.find(c => c.name === 'C')!;
  const B = AB.circles.find(c => c.name === 'B')!;
  const predicate = makeRegionPredicate([A], [B, C]);
  return [
    `M ${AB.x},${AB.y}`,
    describeRegionArc(A, AB, AC, 'inside', predicate),
    describeRegionArc(C, AC, ACTriple, 'outside', predicate),
    describeRegionArc(A, ACTriple, ABTriple, 'inside', predicate),
    describeRegionArc(B, ABTriple, AB, 'outside', predicate),
    'Z',
  ].join(' ');
}

function describeBOnlyPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const BC = nonTriplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const BA = nonTriplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const ABTriple = triplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const BCTriple = triplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const B = BC.circles.find(c => c.name === 'B')!;
  const A = BA.circles.find(c => c.name === 'A')!;
  const C = BC.circles.find(c => c.name === 'C')!;
  const predicate = makeRegionPredicate([B], [A, C]);
  return [
    `M ${BC.x},${BC.y}`,
    describeRegionArc(B, BC, BA, 'inside', predicate),
    describeRegionArc(A, BA, ABTriple, 'outside', predicate),
    describeRegionArc(B, ABTriple, BCTriple, 'inside', predicate),
    describeRegionArc(C, BCTriple, BC, 'outside', predicate),
    'Z',
  ].join(' ');
}

function describeCOnlyPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const AC = nonTriplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const BC = nonTriplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const ACTriple = triplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const BCTriple = triplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const C = BC.circles.find(c => c.name === 'C')!;
  const B = BC.circles.find(c => c.name === 'B')!;
  const A = AC.circles.find(c => c.name === 'A')!;
  const predicate = makeRegionPredicate([C], [A, B]);
  return [
    `M ${AC.x},${AC.y}`,
    describeRegionArc(C, AC, BC, 'inside', predicate),
    describeRegionArc(B, BC, BCTriple, 'outside', predicate),
    describeRegionArc(C, BCTriple, ACTriple, 'inside', predicate),
    describeRegionArc(A, ACTriple, AC, 'outside', predicate),
    'Z',
  ].join(' ');
}

function describeABPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const AC = triplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const AB = nonTriplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const BC = triplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const A = AB.circles.find(c => c.name === 'A')!;
  const C = AC.circles.find(c => c.name === 'C')!;
  const B = BC.circles.find(c => c.name === 'B')!;
  return [
    `M ${AC.x},${AC.y}`,
    `A ${A.radius},${A.radius} 0 0 1 ${AB.x},${AB.y}`,
    `A ${B.radius},${B.radius} 0 0 1 ${BC.x},${BC.y}`,
    `A ${C.radius},${C.radius} 0 0 0 ${AC.x},${AC.y}`,
    'Z',
  ].join(' ');
}

function describeACPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const AC = nonTriplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const AB = triplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const BC = triplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const A = AB.circles.find(c => c.name === 'A')!;
  const C = AC.circles.find(c => c.name === 'C')!;
  const B = BC.circles.find(c => c.name === 'B')!;
  return [
    `M ${AC.x},${AC.y}`,
    `A ${A.radius},${A.radius} 0 0 1 ${AB.x},${AB.y}`,
    `A ${B.radius},${B.radius} 0 0 0 ${BC.x},${BC.y}`,
    `A ${C.radius},${C.radius} 0 0 1 ${AC.x},${AC.y}`,
    'Z',
  ].join(' ');
}

function describeBCPath(triplePoints: IntersectionPoint[], nonTriplePoints: IntersectionPoint[]): string {
  const AB = triplePoints.find(p => hasNames(p, 'A', 'B'))!;
  const BC = nonTriplePoints.find(p => hasNames(p, 'B', 'C'))!;
  const AC = triplePoints.find(p => hasNames(p, 'A', 'C'))!;
  const A = AB.circles.find(c => c.name === 'A')!;
  const C = AC.circles.find(c => c.name === 'C')!;
  const B = BC.circles.find(c => c.name === 'B')!;
  return [
    `M ${AB.x},${AB.y}`,
    `A ${B.radius},${B.radius} 0 0 1 ${BC.x},${BC.y}`,
    `A ${C.radius},${C.radius} 0 0 1 ${AC.x},${AC.y}`,
    `A ${A.radius},${A.radius} 0 0 0 ${AB.x},${AB.y}`,
    'Z',
  ].join(' ');
}

function hasNames(p: IntersectionPoint, name1: string, name2: string): boolean {
  const names = p.circles.map(c => c.name);
  return names.includes(name1) && names.includes(name2);
}

export class VennPlotView extends DataLayer {
  protected _cx!: number;
  protected _cy!: number;
  protected _radius!: number;
  protected _circleCenters: Point[] = [];
  protected _seriesLeaders: PathShape[] = [];
  protected _seriesLabelItems: Label[] = [];
  protected _intersectionPoints: Point[] = [];
  protected _threeCircleRegionPaths: Array<{ d: string; fill: string }> = [];

  constructor(
    paraview: DataLayerContext,
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

  protected _threeCircleRegionPrefix(): string {
    return `${this.id || 'venn'}-region`;
  }

  protected _renderThreeCircleRegionHighlight(stroke: string, strokeWidth: number): TemplateResult {
    if (this._circleCenters.length !== 3) {
      return svg``;
    }
    const cursor = this.paraview.paraState.chartInfo.navMap?.cursor;
    if (!cursor?.isNodeType('venn-part')) {
      return svg``;
    }

    const seriesKeys = this.paraview.paraState.model!.seriesKeys;
    const ids = {
      clip: {
        a: `${this._threeCircleRegionPrefix()}-clip-a`,
        b: `${this._threeCircleRegionPrefix()}-clip-b`,
        c: `${this._threeCircleRegionPrefix()}-clip-c`,
      },
      outside: {
        a: `${this._threeCircleRegionPrefix()}-outside-a`,
        b: `${this._threeCircleRegionPrefix()}-outside-b`,
        c: `${this._threeCircleRegionPrefix()}-outside-c`,
      },
      inside: {
        a: `${this._threeCircleRegionPrefix()}-inside-a`,
        b: `${this._threeCircleRegionPrefix()}-inside-b`,
        c: `${this._threeCircleRegionPrefix()}-inside-c`,
      },
      only: {
        a: `${this._threeCircleRegionPrefix()}-a-only`,
        b: `${this._threeCircleRegionPrefix()}-b-only`,
        c: `${this._threeCircleRegionPrefix()}-c-only`,
      },
    };
    const circles = {
      a: this._circleCenters[0]!,
      b: this._circleCenters[1]!,
      c: this._circleCenters[2]!,
    };
    const seriesToCircle = new Map(seriesKeys.map((seriesKey, index) => [seriesKey, (['a', 'b', 'c'] as const)[index]! ]));
    const currentCircle = seriesToCircle.get(cursor.options.seriesKey);
    if (!currentCircle) {
      return svg``;
    }

    const outlineCircle = (
      circleKey: 'a' | 'b' | 'c',
      options: { clipId?: string; maskId?: string } = {}
    ) => svg`<circle
      cx=${circles[circleKey].x}
      cy=${circles[circleKey].y}
      r=${this._radius}
      fill="none"
      stroke=${stroke}
      stroke-width=${strokeWidth}
      clip-path=${options.clipId ? `url(#${options.clipId})` : undefined}
      mask=${options.maskId ? `url(#${options.maskId})` : undefined}
      pointer-events="none"
    />`;

    if (cursor.options.part === 'triple') {
      return svg`
        ${outlineCircle('a', { clipId: ids.clip.b, maskId: ids.inside.c })}
        ${outlineCircle('b', { clipId: ids.clip.c, maskId: ids.inside.a })}
        ${outlineCircle('c', { clipId: ids.clip.a, maskId: ids.inside.b })}
      `;
    }

    if (cursor.options.part === 'pair' && cursor.options.otherSeriesKey) {
      const otherCircle = seriesToCircle.get(cursor.options.otherSeriesKey);
      if (!otherCircle) {
        return svg``;
      }
      const excludedCircle = (['a', 'b', 'c'] as const).find(key => key !== currentCircle && key !== otherCircle)!;
      return svg`
        ${outlineCircle(currentCircle, { clipId: ids.clip[otherCircle], maskId: ids.outside[excludedCircle] })}
        ${outlineCircle(otherCircle, { clipId: ids.clip[currentCircle], maskId: ids.outside[excludedCircle] })}
        ${outlineCircle(excludedCircle, { clipId: ids.clip[currentCircle], maskId: ids.inside[otherCircle] })}
      `;
    }

    const otherCircles = (['a', 'b', 'c'] as const).filter(key => key !== currentCircle);
    return svg`
      ${outlineCircle(currentCircle, { maskId: ids.only[currentCircle] })}
      ${outlineCircle(otherCircles[0]!, { clipId: ids.clip[currentCircle], maskId: ids.outside[otherCircles[1]!] })}
      ${outlineCircle(otherCircles[1]!, { clipId: ids.clip[currentCircle], maskId: ids.outside[otherCircles[0]!] })}
    `;
  }

  protected _renderThreeCircleRegions(): TemplateResult {
    if (this._circleCenters.length !== 3) {
      return svg``;
    }

    const [circleA, circleB, circleC] = this._circleCenters.map((center, index) => ({
      center,
      radius: this._radius,
      name: ['A', 'B', 'C'][index]!,
    })) as [Circle, Circle, Circle];

    const colors = this.paraview.paraState.colors;
    const regionOpacity = 0.7;
    const prefix = this._threeCircleRegionPrefix();
    const clipAId = `${prefix}-clip-a`;
    const clipBId = `${prefix}-clip-b`;
    const clipCId = `${prefix}-clip-c`;
    const outsideAId = `${prefix}-outside-a`;
    const outsideBId = `${prefix}-outside-b`;
    const outsideCId = `${prefix}-outside-c`;
    const insideAId = `${prefix}-inside-a`;
    const insideBId = `${prefix}-inside-b`;
    const insideCId = `${prefix}-inside-c`;
    const aOnlyId = `${prefix}-a-only`;
    const bOnlyId = `${prefix}-b-only`;
    const cOnlyId = `${prefix}-c-only`;

    const renderCircle = (circle: Circle, fill: string) => svg`<circle
      cx=${circle.center.x}
      cy=${circle.center.y}
      r=${circle.radius}
      fill=${fill}
    />`;

    return svg`
      <defs>
        <clipPath id=${clipAId}>${renderCircle(circleA, 'white')}</clipPath>
        <clipPath id=${clipBId}>${renderCircle(circleB, 'white')}</clipPath>
        <clipPath id=${clipCId}>${renderCircle(circleC, 'white')}</clipPath>

        <mask id=${outsideAId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleA, 'black')}
        </mask>
        <mask id=${outsideBId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleB, 'black')}
        </mask>
        <mask id=${outsideCId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleC, 'black')}
        </mask>

        <mask id=${insideAId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="black" />
          ${renderCircle(circleA, 'white')}
        </mask>
        <mask id=${insideBId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="black" />
          ${renderCircle(circleB, 'white')}
        </mask>
        <mask id=${insideCId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="black" />
          ${renderCircle(circleC, 'white')}
        </mask>

        <mask id=${aOnlyId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleB, 'black')}
          ${renderCircle(circleC, 'black')}
        </mask>
        <mask id=${bOnlyId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleA, 'black')}
          ${renderCircle(circleC, 'black')}
        </mask>
        <mask id=${cOnlyId} maskUnits="userSpaceOnUse" x="0" y="0" width=${this._width} height=${this._height}>
          <rect x="0" y="0" width=${this._width} height=${this._height} fill="white" />
          ${renderCircle(circleA, 'black')}
          ${renderCircle(circleB, 'black')}
        </mask>
      </defs>

      <circle
        cx=${circleA.center.x}
        cy=${circleA.center.y}
        r=${circleA.radius}
        fill=${colors.colorValueAt(0)}
        fill-opacity=${regionOpacity}
        mask=${`url(#${aOnlyId})`}
        pointer-events="none"
      />
      <circle
        cx=${circleB.center.x}
        cy=${circleB.center.y}
        r=${circleB.radius}
        fill=${colors.colorValueAt(1)}
        fill-opacity=${regionOpacity}
        mask=${`url(#${bOnlyId})`}
        pointer-events="none"
      />
      <circle
        cx=${circleC.center.x}
        cy=${circleC.center.y}
        r=${circleC.radius}
        fill=${colors.colorValueAt(2)}
        fill-opacity=${regionOpacity}
        mask=${`url(#${cOnlyId})`}
        pointer-events="none"
      />

      <circle
        cx=${circleA.center.x}
        cy=${circleA.center.y}
        r=${circleA.radius}
        fill=${colors.colorValueAt(3)}
        fill-opacity=${regionOpacity}
        clip-path=${`url(#${clipBId})`}
        mask=${`url(#${outsideCId})`}
        pointer-events="none"
      />
      <circle
        cx=${circleA.center.x}
        cy=${circleA.center.y}
        r=${circleA.radius}
        fill=${colors.colorValueAt(4)}
        fill-opacity=${regionOpacity}
        clip-path=${`url(#${clipCId})`}
        mask=${`url(#${outsideBId})`}
        pointer-events="none"
      />
      <circle
        cx=${circleB.center.x}
        cy=${circleB.center.y}
        r=${circleB.radius}
        fill=${colors.colorValueAt(5)}
        fill-opacity=${regionOpacity}
        clip-path=${`url(#${clipCId})`}
        mask=${`url(#${outsideAId})`}
        pointer-events="none"
      />

      <circle
        cx=${circleA.center.x}
        cy=${circleA.center.y}
        r=${circleA.radius}
        fill=${colors.colorValueAt(6)}
        fill-opacity=${regionOpacity}
        clip-path=${`url(#${clipBId})`}
        mask=${`url(#${insideCId})`}
        pointer-events="none"
      />
    `;
  }

  content(): TemplateResult {
    const visitedColor = this.paraview.paraState.colors.colorValue('visit');
    const visitedStrokeWidth = this.paraview.paraState.config.chart.strokeWidth
      * this.paraview.paraState.config.chart.strokeHighlightScale;
    const visitedRings = this.datapointViews
      .filter(v => this.paraview.paraState.isVisited(v.seriesKey, v.index))
      .map(v => svg`<circle
        cx=${this._cx + v.xOff}
        cy=${this._cy + v.yOff}
        r=${v.r}
        fill="none"
        stroke=${visitedColor}
        stroke-width=${visitedStrokeWidth}
        pointer-events="none"
      />`);

    // Highlight for venn-part navigation
    const cursor = this.paraview.paraState.chartInfo.navMap?.cursor;
    let vennPartHighlight: TemplateResult = svg``;
    if (cursor?.isNodeType('venn-part') && this._intersectionPoints.length === 2) {
      const [p1, p2] = this._intersectionPoints;
      const r = this._radius;
      const seriesKeys = this.paraview.paraState.model!.seriesKeys;
      const seriesIndex = seriesKeys.indexOf(cursor.options.seriesKey);
      if (cursor.options.part === 'only') {
        // Crescent shape: outer arc of this circle + inner arc of the other circle as the cut boundary.
        // Series 0 (left/A): CCW major arc of A (large=1,sweep=0) then CW minor arc of B back (large=0,sweep=1)
        // Series 1 (right/B): CW major arc of B (large=1,sweep=1) then CCW minor arc of A back (large=0,sweep=0)
        const crescentD = seriesIndex === 0
          ? `M ${p1.x},${p1.y} A ${r},${r} 0 1,0 ${p2.x},${p2.y} A ${r},${r} 0 0,1 ${p1.x},${p1.y} Z`
          : `M ${p1.x},${p1.y} A ${r},${r} 0 1,1 ${p2.x},${p2.y} A ${r},${r} 0 0,0 ${p1.x},${p1.y} Z`;
        vennPartHighlight = svg`<path
          d=${crescentD}
          fill="none"
          stroke=${visitedColor}
          stroke-width=${visitedStrokeWidth}
          pointer-events="none"
        />`;
      } else {
        // lens / intersection shape
        const d = `M ${p1.x},${p1.y} A ${r},${r} 0 0,1 ${p2.x},${p2.y} A ${r},${r} 0 0,1 ${p1.x},${p1.y} Z`;
        vennPartHighlight = svg`<path
          d=${d}
          fill="none"
          stroke=${visitedColor}
          stroke-width=${visitedStrokeWidth}
          pointer-events="none"
        />`;
      }
    } else if (cursor?.isNodeType('venn-part') && this._circleCenters.length === 3) {
      vennPartHighlight = this._renderThreeCircleRegionHighlight(visitedColor, visitedStrokeWidth);
    }

    return svg`
      ${this._renderThreeCircleRegions()}
      ${super.content()}
      ${visitedRings}
      ${vennPartHighlight}
      ${this._seriesLeaders.map(l => l.render())}
      ${this._seriesLabelItems.map(l => l.render())}
    `;
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

  protected _createDatapoints() {
    const seriesKeys = this.paraview.paraState.model!.seriesKeys;
    const n = seriesKeys.length;
    const d = 0.5 * this._radius;

    this._circleCenters = [];

    seriesKeys.forEach((seriesKey, i) => {
      const angle = n === 2
        ? Math.PI + i * Math.PI
        : n === 3
          ? [5 * Math.PI / 6, Math.PI / 6, -Math.PI / 2][i]!
          : -Math.PI / 2 + i * (2 * Math.PI / n);
      const xOff = d * Math.cos(angle);
      const yOff = d * Math.sin(angle);
      this._circleCenters.push({ x: this._cx + xOff, y: this._cy + yOff });

      const seriesView = new SeriesView(this, seriesKey);
      this._chartLandingView.append(seriesView);
      const region = new VennRegionView(seriesView, xOff, yOff, this._radius);
      seriesView.append(region);
    });

    if (n === 2) {
      const intersections = this.getIntersections(
        { center: this._circleCenters[0], radius: this._radius, name: 'A' },
        { center: this._circleCenters[1], radius: this._radius, name: 'B' }
      );
      this._intersectionPoints = intersections;

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
          stroke: "white",
          fill: "mediumseagreen",
          strokeWidth: 5,
        });
        this.append(arc);
      }
    } else if (n === 3) {
      this._intersectionPoints = [];
      this._threeCircleRegionPaths = [];
      const names = ['A', 'B', 'C'] as const;
      const circles: Circle[] = this._circleCenters.map((center, i) => ({
        center,
        radius: this._radius,
        name: names[i]!,
      }));
      const [circleA, circleB, circleC] = circles as [Circle, Circle, Circle];

      const ab = this.getIntersections(circleA, circleB);
      const ac = this.getIntersections(circleA, circleC);
      const bc = this.getIntersections(circleB, circleC);

      if (ab.length === 2 && ac.length === 2 && bc.length === 2) {
        const [p1, p2] = ab as [Point, Point];
        const [p3, p4] = ac as [Point, Point];
        const [p5, p6] = bc as [Point, Point];

        const allPoints: IntersectionPoint[] = [
          { x: p1.x, y: p1.y, circles: [circleA, circleB] },
          { x: p2.x, y: p2.y, circles: [circleA, circleB] },
          { x: p3.x, y: p3.y, circles: [circleA, circleC] },
          { x: p4.x, y: p4.y, circles: [circleA, circleC] },
          { x: p5.x, y: p5.y, circles: [circleB, circleC] },
          { x: p6.x, y: p6.y, circles: [circleB, circleC] },
        ];

        const triplePoints = findTripleIntersectionPoints(circleA, circleB, circleC, allPoints);

        if (triplePoints.length >= 3) {
          const sortedTriple = sortPointsByAngle(triplePoints);
          const nonTriplePoints = allPoints.filter(
            p => !triplePoints.some(tp => tp.x === p.x && tp.y === p.y)
          );

          const colors = this.paraview.paraState.colors;
          const colorA   = colors.colorValueAt(0);
          const colorB   = colors.colorValueAt(1);
          const colorC   = colors.colorValueAt(2);
          const colorAB  = colors.colorValueAt(3);
          const colorAC  = colors.colorValueAt(4);
          const colorBC  = colors.colorValueAt(5);
          const colorABC = colors.colorValueAt(6);

          this._threeCircleRegionPaths = [
            { d: describeAOnlyPath(triplePoints, nonTriplePoints),            fill: colorA   },
            { d: describeBOnlyPath(triplePoints, nonTriplePoints),            fill: colorB   },
            { d: describeCOnlyPath(triplePoints, nonTriplePoints),            fill: colorC   },
            { d: describeABPath(triplePoints, nonTriplePoints),               fill: colorAB  },
            { d: describeACPath(triplePoints, nonTriplePoints),               fill: colorAC  },
            { d: describeBCPath(triplePoints, nonTriplePoints),               fill: colorBC  },
            { d: describeTripleIntersectionPath(sortedTriple),                fill: colorABC },
          ];
        }
      }
    } else {
      this._intersectionPoints = [];
      this._threeCircleRegionPaths = [];
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
        label.styleInfo = { fill: 'white' };
        this.append(label);
      });
    };

    placeLabels(rectanglesA, pointsA, [true, false]);
    placeLabels(rectanglesB, pointsB, [false, true]);
    placeLabels(rectanglesAB, pointsAB, [true, true]);

    this._createSeriesLabels();
  }

  protected _createSeriesLabels(): void {
    const series = this.paraview.paraState.model!.series;
    if (series.length !== 2) return;

    this._seriesLeaders = [];
    this._seriesLabelItems = [];

    // Series 0 (A): label top-left, just above circle A
    const circleACenterX = this._cx - 0.5 * this._radius;
    const circleBCenterX = this._cx + 0.5 * this._radius;

    const leaderLen = 25;
    const label0X = circleACenterX - leaderLen;
    const label0Y = this._cy - this._radius - 8;
    const leader0Start = new Vec2(circleACenterX, this._cy - this._radius);
    const leader0End = new Vec2(label0X, label0Y);

    // Series 1 (B): label bottom-right, just below circle B
    const label1X = circleBCenterX + leaderLen;
    const label1Y = this._cy + this._radius + 18;
    const leader1Start = new Vec2(circleBCenterX, this._cy + this._radius);
    const leader1End = new Vec2(label1X, label1Y);

    const configs = [
      { series: series[0], leaderStart: leader0Start, leaderEnd: leader0End, labelX: label0X, labelY: label0Y, textAnchor: 'end' as LabelTextAnchor },
      { series: series[1], leaderStart: leader1Start, leaderEnd: leader1End, labelX: label1X, labelY: label1Y, textAnchor: 'start' as LabelTextAnchor },
    ];

    configs.forEach(({ series: s, leaderStart, leaderEnd, labelX, labelY, textAnchor }, i) => {
      const colorValue = this.paraview.paraState.colors.colorValueAt(i);
      const leader = new PathShape(this.paraview, {
        points: [leaderStart, leaderEnd],
        stroke: colorValue,
      });
      leader.classInfo = { 'label-leader': true };
      this._seriesLeaders.push(leader);

      const label = new Label(this.paraview, {
        text: s.getLabel(),
        x: labelX,
        y: labelY,
        textAnchor,
      });
      this._seriesLabelItems.push(label);
    });
  }


  protected _resolveOutsideLabelCollisions() {
  }

  focusRingShape(): Shape | null {
    const chartInfo = this.paraview.paraState.chartInfo;
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

  get xOff() { return this._xOff; }
  get yOff() { return this._yOff; }
  get r() { return this._r; }

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

  get classInfo() {
    // Suppress the `visited` CSS class so the global `.datapoint.visited` rule
    // doesn't override the fill. We handle the visited highlight via
    // _shapeStyleInfo (stroke only).
    const base = super.classInfo;
    return { ...base, visited: false };
  }

  protected _shapeStyleInfo(_shapeIndex: number) {
    const parentStyle = this._parent.styleInfo;
    const numSeries = this.paraview.paraState.model?.seriesKeys.length ?? 2;
    if (numSeries >= 3) {
      return {
        fill: 'none',
        stroke: parentStyle.fill,
        strokeWidth: '3',
      };
    }
    return {
      fill: parentStyle.fill,
      stroke: 'white',
      strokeWidth: '5',
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

  completeLayout() {
    super.completeLayout();
    // Prevent HighlightsLayer from rendering a <use> copy of this filled circle
    // on top of the item labels (which are in the DataLayer above). The visited
    // state is shown via the stroke color change in _shapeStyleInfo instead.
    this._parent.chart.unregisterDatapoint(this);
  }
}
