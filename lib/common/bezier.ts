
import { Vec2 } from './vector'

export class Bezier {
  protected _pts: Vec2[];

  constructor(x2: number, y2: number, x3: number, y3: number, numSegs: number) {
    this._pts = [];
    const p2 = new Vec2(x2, y2);
    const p3 = new Vec2(x3, y3);
    for (let i = 0; i < numSegs; i++) {
      const t = i/numSegs;
      const t2 = t*t;
      const t3 = t2*t;
      this._pts.push(
        p2.multiplyScalar(3*(t3 - 2*t2 + t)).add(
          p3.multiplyScalar(3*(t2 - t3)).add(
            new Vec2(t3, t3))));
    }
    this._pts.push(new Vec2(1, 1));
  }

  // copy() {
  //   cdef Bezier c = Bezier.__new__(Bezier)
  //   c.pts = [v.copy() for v in self.pts]
  //   return c
  // }

  eval(x: number) {
    for (let i = 0; i < this._pts.length - 1; i++) {
      if (x <= this._pts[i + 1].x) {
        const p0 = this._pts[i];
        const p1 = this._pts[i + 1];
        return p0.lerp(p1, (x - p0.x)/(p1.x - p0.x)).y;
      }
    }
  }
}
