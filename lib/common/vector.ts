
/**
 * Basic 2D vector class.
 */
export class Vec2 {

  constructor(protected _x = 0, protected _y = 0) {
  }

  get x() {
    return this._x;
  }

  set x(x: number) {
    this._x = x;
  }

  get y() {
    return this._y;
  }

  set y(y: number) {
    this._y = y;
  }

  clone() {
    return new Vec2(this._x, this._y);
  }

  equal(other: Vec2) {
    return this._x === other._x && this._y === other._y;
  }

  setX(x: number) {
    return new Vec2(x, this._y);
  }

  setY(y: number) {
    return new Vec2(this._x, y);
  }

  add(other: Vec2) {
    return new Vec2(
      this._x + other._x,
      this._y + other._y,
    );
  }

  addScalar(scalar: number) {
    return new Vec2(
      this._x + scalar,
      this._y + scalar,
    );
  }

  addX(x: number) {
    return new Vec2(
      this._x + x,
      this._y,
    );
  }

  addY(y: number) {
    return new Vec2(
      this._x,
      this._y + y,
    );
  }

  subtract(other: Vec2) {
    return new Vec2(
      this._x - other._x,
      this._y - other._y,
    );
  }

  subtractScalar(scalar: number) {
    return new Vec2(
      this._x - scalar,
      this._y - scalar,
    );
  }

  subtractX(x: number) {
    return new Vec2(
      this._x - x,
      this._y,
    );
  }

  subtractY(y: number) {
    return new Vec2(
      this._x,
      this._y - y,
    );
  }

  multiply(other: Vec2) {
    return new Vec2(
      this._x * other._x,
      this._y * other._y,
    );
  }

  multiplyScalar(scalar: number) {
    return new Vec2(
      this._x * scalar,
      this._y * scalar,
    );
  }

  divide(other: Vec2) {
    return new Vec2(
      this._x / other._x,
      this._y / other._y,
    );
  }

  divideScalar(scalar: number) {
    return new Vec2(
      this._x / scalar,
      this._y / scalar,
    );
  }

  dot(other: Vec2) {
    return this._x*other._x + this._y*other._y;
  }

  length() {
    return Math.sqrt(this.dot(this));
  }

  normalize() {
    return this.divideScalar(this.length());
  }

  project(other: Vec2) {
    return other.multiplyScalar(this.dot(other) / other.dot(other));
  }

  rotate(rads: number) {
    // NB: In a normal Cartesian coordinate system, with the below,
    // positive rotations are clockwise. The SVG coordinate system
    // is vertically mirrored, though, so they will appear
    // counter-clockwise.
    const m00 = Math.cos(rads);
    const m01 = Math.sin(rads);
    const m10 = -m01;
    const m11 = m00;
    return new Vec2(
      this._x*m00 + this._y*m01,
      this._x*m10 + this._y*m11
    );
  }

  lerp(other: Vec2, t: number): Vec2 {
    return new Vec2(
      this._x*(1 - t) + other._x*t,
      this._y*(1 - t) + other._y*t
    );
  }

}
