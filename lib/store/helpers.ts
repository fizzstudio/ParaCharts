import { Scalar } from "./dataframe/box";

type Key = string | number;

type DataRecord<X extends Key, Y extends Key> = { x: X, y: Y };

function mapRecordsInner<X extends Key, Y extends Key, A extends X | Y, B extends X | Y>(
  dimension: 'x' | 'y', records: DataRecord<X, Y>[]
): Record<A, B[]> {
  const recordsAB = records as DataRecord<A, B>[];
  const dimensionConst = dimension === 'x' ? 'x' as const : 'y' as const;
  const map = {} as Record<A, B[]>;
  for (const record of recordsAB) {
    if (!(record[dimensionConst] in map)) {
      map[record[dimensionConst]] = [] as B[];
    }
    map
  }
}

function mapRecords<X extends string | number, Y extends string | number>(
  dimension: 'x', records: DataRecord<X, Y>[],
): Record<X, Y[]>
function mapRecords<X extends string | number, Y extends string | number>(
  dimension: 'y', records: DataRecord<X, Y>[],
): Record<Y, X[]>
function mapRecords<X extends string | number, Y extends string | number>(
  dimension: 'x' | 'y', records: DataRecord<X, Y>[]
): Record<X, Y[]> | Record<Y, X[]> {
  /*const map = dimension === 'x' ? {} as Record<X, Y[]> : {} as Record<Y, X[]>;
  for (const record of records) {
    if (!(record[dimension] in map)) {
      map[record[dimension]] = [] as B[];
    }
    map*/
}

class Map2D<X extends string | number, Y extends string | number> {
  private xMap?: Record<X, Y[]>;
  private yMap?: Record<Y, X[]>;

  constructor(private records: DataRecord<X, Y>[]) {}

  atIndex(index: number): DataRecord<X, Y> | null {
    return this.records[index] ?? null;
  }

  atX(x: X): Y[] {

  }
}