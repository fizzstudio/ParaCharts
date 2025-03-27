import { enumerate } from "./helpers";

export type Record2D = { x: string, y: string };

function mapRecords(dimension: 'x' | 'y', records: Record2D[]): Record<string, string[]> {
  const map = {} as Record<string, string[]>;
  for (const record of records) {
    if (!(record[dimension] in map)) {
      map[record[dimension]] = [] as string[];
    }
    map[record[dimension]].push(record[dimension === 'x' ? 'y' : 'x']);
  }
  return map;
}

export class Series2D {
  [i: number]: Record2D;
  private xMap?: Record<string, string[]>;
  private yMap?: Record<string, string[]>;

  constructor(public readonly key: string, private readonly records: Record2D[]) {
    this.records.forEach((record, index) => this[index] = record);
  }

  atX(x: string): string[] | null {
    if (!(this.xMap)) {
      this.xMap = mapRecords('x', this.records);
    }
    return this.xMap[x] ?? null;
  }

  atY(y: string): string[] | null {
    if (!(this.yMap)) {
      this.yMap = mapRecords('y', this.records);
    }
    return this.yMap[y] ?? null;
  }
}

// Like a dictionary for series
export class Model2D {
  public readonly keys: string[] = [];
  private keyMap: Record<string, Series2D> = {};
  [i: number]: Series2D;

  constructor(private readonly series: Series2D[]) {
    for (const [aSeries, seriesIndex] of enumerate(this.series)) {
      if (this.keys.includes(aSeries.key)) {
        throw new Error('Non-unique key');
      }
      this.keys.push(aSeries.key);
      this[seriesIndex] = aSeries;
      this.keyMap[aSeries.key] = aSeries;
    }
  }

  atKey(key: string): Series2D | null {
    return this.keyMap[key] ?? null;
  }
}