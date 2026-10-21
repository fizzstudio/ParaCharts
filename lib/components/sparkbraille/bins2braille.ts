
const cellDots =[ [1,2,3,7], [4,5,6,8] ];

/** @internal */
export class BinsToBraille {
  private _cellArray: number[][] = [];

  constructor(private readonly _binnedData: readonly number[], private _isBar = false) {
    this._init()
  }

  get cells(): ReadonlyArray<ReadonlyArray<number>> {
    return this._cellArray;
  }

  private _init() {
    this._buildGlyphs();
  }

  private _buildGlyphs() {
    let glyph: number[] = [];
    for (let r = 0; r < this._binnedData.length; ++r) {
      const bin = this._binnedData[r];

      // switch column on every odd number
      const col = r % 2;

      glyph.push(cellDots[col][3 - bin]);

      if (this._isBar) {
        // fill in additional dots to zero baseline
        for (let i = 0; i < bin; i++) {
          glyph.push(cellDots[col][3 - i]);
        }
      }

      if (col || this._binnedData.length === r + 1) {
        // reset new glyph every 2 records
        this._cellArray.push(glyph);
        glyph = [];
      }
    }
  }
}
