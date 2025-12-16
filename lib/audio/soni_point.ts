import { Model, PlaneDatapoint } from '@fizz/paramodel';

/**
 * A sonifiable datapoint.
 */
export class SoniPoint {

  static fromModelDatapoint(datapoint: PlaneDatapoint, model: Model): SoniPoint {
    const xNominal = model.getFacet('x')!.datatype !== 'number';
    // Pastry chart datapoints currently fake being plane datapoints,
    // and so don't have indep and dep keys
    let x = datapoint.facetValueNumericized(datapoint.indepKey ?? 'x')!;
    let y = datapoint.facetValueNumericized(datapoint.depKey ?? 'y')!;
    x = xNominal
      ? datapoint.datapointIndex
      : x;
    const xInterval = model.getFacetInterval('x')!;
    const yInterval = model.getFacetInterval('y')!;
    const xMin = xNominal
      ? 0
      : xInterval.start;
    const xMax = xNominal
      ? (model.atKey(datapoint.seriesKey)!.datapoints.length - 1)
      : xInterval.end;
    return new SoniPoint(x, y, xMin, xMax, yInterval.start, yInterval.end);
  }

  constructor(
    protected _x: number,
    protected _y: number,
    protected _xMin: number,
    protected _xMax: number,
    protected _yMin: number,
    protected _yMax: number
  ) {}

  get x(): number {
    return this._x;
  }

  set x(x: number) {
    this._x = x;
  }

  get y(): number {
    return this._y;
  }

  set y(y: number) {
    this._y = y;
  }

  get xMin(): number {
    return this._xMin;
  }

  get xMax(): number {
    return this._xMax;
  }

  get yMin(): number {
    return this._yMin;
  }

  get yMax(): number {
    return this._yMax;
  }

  get xPan(): number {
    return (this._x - this._xMin) / this.xRange;
  }

  get xRange(): number {
    return this._xMax - this._xMin;
  }

  get yRange(): number {
    return this._yMax - this._yMin;
  }
}