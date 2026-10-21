
/** @internal */
export class DataBinner {

  private _min!: number;
  private _max!: number;
  private _range!: number;
  private _binnedData!: number[];

  constructor(public readonly data: number[], public readonly binCount: number) {
    this._init()
  }

  get binnedData(): readonly number[] {
    return this._binnedData;
  }

  private _init() {
    this._findMinMax();
    this._binData();
  }

  private _findMinMax() {
    this._min = Math.min(...this.data);
    this._max = Math.max(...this.data);
    this._range = this._max - this._min;
  }

  private _binData() {
    this._binnedData = [];
    // assign new dataset entries to bins
    this._binnedData = this.data.map(val =>
      Math.min(
        this.binCount - 1,
        Math.floor(this.binCount*(val - this._min)/this._range)));
  }
}
