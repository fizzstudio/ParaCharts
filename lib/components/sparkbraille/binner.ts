
/** @internal */
export class DataBinner {

  private min!: number;
  private max!: number;
  private range!: number;
  private _binnedData!: number[];

  constructor(public readonly data: number[], public readonly binCount: number) {
    this.init()
  }

  get binnedData(): readonly number[] {
    return this._binnedData;
  }

  private init() {
    this.findMinMax();
    this.binData();
  }

  private findMinMax() {
    this.min = Math.min(...this.data);
    this.max = Math.max(...this.data);
    this.range = this.max - this.min;    
  }

  binData() {
    this._binnedData = [];
    // assign new dataset entries to bins
    this._binnedData = this.data.map(val => 
      Math.min(
        this.binCount - 1, 
        Math.floor(this.binCount*(val - this.min)/this.range)));
  }
}
