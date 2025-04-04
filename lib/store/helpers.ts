import { XyPoint } from "@fizz/paramanifest";

export type AllSeriesData = Record<string, XyPoint[]>;

type PropKey = string | number;

type DataRecord<X extends PropKey, Y extends PropKey> = { x: X, y: Y };

function mapRecords<X extends PropKey, Y extends PropKey>(
  dimension: 'x' | 'y', records: DataRecord<X, Y>[]
): Record<(X | Y), (X | Y)[]> {
  const map = {} as Record<(X | Y), (X | Y)[]>;
  for (const record of records) {
    if (!(record[dimension] in map)) {
      map[record[dimension]] = [] as (X | Y)[];
    }
    map[record[dimension]].push(record[dimension === 'x' ? 'y' : 'x']);
  }
  return map;
}

export class Map2D<X extends string | number, Y extends string | number> {
  private xMap?: Record<X, Y[]>;
  private yMap?: Record<Y, X[]>;

  constructor(private records: DataRecord<X, Y>[]) { }

  atIndex(index: number): DataRecord<X, Y> | null {
    return this.records[index] ?? null;
  }

  atX(x: X): Y[] | null {
    if (!(this.xMap)) {
      this.xMap = mapRecords('x', this.records) as Record<X, Y[]>;
    }
    return this.xMap[x] ?? null;
  }

  atY(y: Y): X[] | null {
    if (!(this.yMap)) {
      this.yMap = mapRecords('y', this.records) as Record<Y, X[]>;
    }
    return this.yMap[y] ?? null;
  }
}

const MEMBERS = Symbol.for('Ordered-Map-Members');

export class OrderedMap<V> {
  private readonly [MEMBERS]: { key: string, value: V }[];
  [n: number]: V | null;
  [k: string]: V | null;

  constructor(...members: { key: string, value: V }[]) {
    this[MEMBERS] = members;
    this[MEMBERS].forEach((member, index) => {
      this[member.key] = member.value;
      this[index] = member.value;
    })
  }
}

export function enumerate<T>(iterable: Iterable<T>): [T, number][] {
  const enumerations: [T, number][] = [];
  let index = 0;
  for (const member of iterable) {
    enumerations.push([member, index]);
    index++;
  }
  return enumerations;
}

export function arrayEqual<T>(lhs: T[], rhs: T[]): boolean {
  if (lhs.length !== rhs.length) {
    return false;
  }
  lhs.forEach((l, index) => {
    if (l !== rhs[index]) {
      return false;
    }
  });
  return true;
}