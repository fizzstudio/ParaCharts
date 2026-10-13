
const cellDots =[ [1,2,3,7], [4,5,6,8] ];

/** @internal */
export class BinsToBraille {
  private cellArray: number[][] = [];

  constructor(private readonly binnedData: readonly number[], private isBar = false) {
    this.init()
  }

  get cells(): ReadonlyArray<ReadonlyArray<number>> {
    return this.cellArray;
  }

  private init() {
    this.buildGlyphs();
  }

  private buildGlyphs() {    
    let glyph: number[] = [];
    for (let r = 0; r < this.binnedData.length; ++r) {
      const bin = this.binnedData[r];

      // switch column on every odd number
      const col = r % 2;

      glyph.push(cellDots[col][3 - bin]);

      if (this.isBar) {
        // fill in additional dots to zero baseline
        for (let i = 0; i < bin; i++) {
          glyph.push(cellDots[col][3 - i]);
        }
      }

      if (col || this.binnedData.length === r + 1) {
        // reset new glyph every 2 records
        this.cellArray.push(glyph);
        glyph = [];
      }
    }
  }
}
