/* ParaCharts: Boxed Values
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { Decimal } from 'decimal.js';

/** @public */
export type DatapointValueRelationship = 'equal' | 'less' | 'greater';

function findMinMax(
  thisValue: number, otherValue: number
): { minValue: number, maxValue: number, relationship: DatapointValueRelationship } {
  if (thisValue < otherValue) {
    return { minValue: thisValue, maxValue: otherValue, relationship: 'less' };
  }
  return { minValue: otherValue, maxValue: thisValue, relationship: 'greater' };
}

export type CalendarPeriod = {
  year?: number,
  quarter?: number,
  month?: number,
  day?: number
}

/**
 * Types that can be stored in a `Series`.
 * @public
 */
export type Scalar = string | number | CalendarPeriod;

/** @public */
export interface DatapointComparison {
  relationship: DatapointValueRelationship;
  diff: number;
  percentageDiff: number;
}

/**
 * Box holding a series value and its source "raw" value.
 * @public
 */
export abstract class Box<T extends Scalar> {
  
  constructor(public readonly value: T, public readonly raw?: Scalar) {}

  abstract isNumber(): this is {value: number};

  abstract isString(): this is {value: string};

  abstract isCalendarPeriod(): this is {value: CalendarPeriod};

  get number(): number {
    if (this.isNumber()) {
      return this.value;
    }
    throw new Error('boxed value is not a number');
  }

  get string(): string {
    if (this.isString()) {
      return this.value;
    }
    throw new Error('boxed value is not a string');
  }

  get calendarPeriod(): CalendarPeriod {
    if (this.isCalendarPeriod()) {
      return this.value;
    }
    throw new Error('boxed value is not a date');
  }

  abstract toNumber(): number;

  abstract toString(): string;

  abstract toCalendarPeriod(): CalendarPeriod;

  abstract isEqual(other: Box<T>): boolean;

  abstract compare(other: Box<T>): DatapointComparison;
}

/**
 * Box holding a number.
 * @public
 */
export class NumberBox extends Box<number> {

  isNumber(): this is {value: number} {
    return true;
  }

  isString(): this is {value: string} {
    return false;
  }

  isCalendarPeriod(): this is {value: CalendarPeriod} {
    return false;
  }

  toNumber() {
    return this.value;
  }

  toString() {
    return this.value.toString();
  }

  // TODO: This should either be a more sophisticated algorithm, nor shouldn't be possible at all
  toCalendarPeriod() {
    return { year: this.value };
  }

  isEqual(other: Box<number>) {
    return this.value === other.value;
  }

  compare(other: Box<number>): DatapointComparison {
    /*if (!other.isNumber()) {
      throw new Error('must compare number with number');
    }*/
    const result: DatapointComparison = {
      diff: 0,
      relationship: 'equal',
      percentageDiff: 0
    };

    if (this.value !== other.value) {
      const { minValue, maxValue, relationship } = findMinMax(this.value, other.value);
      result.relationship = relationship;
      const minDecimal = new Decimal(minValue);
      const maxDecimal = new Decimal(maxValue);
      result.diff = maxDecimal.sub(minDecimal).toNumber();
      result.percentageDiff = maxDecimal.sub(minDecimal).dividedBy(minDecimal).times(100).toNumber();  
    }
    return result;
  }

}

/**
 * Box holding a string.
 * @public
 */
export class StringBox extends Box<string> {
  
  isNumber(): this is {value: number} {
    return false;
  }

  isString(): this is {value: string} {
    return true;
  }

  isCalendarPeriod(): this is {value: CalendarPeriod} {
    return false;
  }

  toNumber() {
    return parseFloat(this.value);
  }

  toString() {
    return this.value;
  }

  // TODO: This should either be a more sophisticated algorithm, nor shouldn't be possible at all
  toCalendarPeriod() {
    return { year: parseInt(this.value) };
  }

  isEqual(other: Box<string>) {
    return this.value === other.value;
  }

  compare(_other: StringBox): DatapointComparison {
    throw new Error('string boxes cannot be compared');
  }

}

/**
 * Box holding a calendar period.
 * @public
 */
export class CalendarPeriodBox extends Box<CalendarPeriod> {
  
  isNumber(): this is {value: number} {
    return false;
  }

  isString(): this is {value: string} {
    return false;
  }

  isCalendarPeriod(): this is {value: CalendarPeriod} {
    return true;
  }

  // TODO: This should be a more sophisticated algorithm
  toNumber() {
    let value = 0;
    value += this.value.year ?? 0;
    value += (this.value.quarter ?? 0) / 4;
    return value;
  }

  toString() {
    return this.value.toString();
  }

  toCalendarPeriod() {
    return { ...this.value };
  }

  isEqual(other: Box<CalendarPeriod>) {
    return this.toNumber() === other.toNumber();
  }

  compare(other: CalendarPeriodBox): DatapointComparison {
    /*if (!other.isDate()) {
      throw new Error('must compare date with date');
    }*/
    const result: DatapointComparison = {
      diff: 0,
      relationship: 'equal',
      percentageDiff: 0
    };

    const thisValue = this.toNumber();
    const otherValue = other.toNumber();
    if (thisValue !== otherValue) {
      const { minValue, maxValue, relationship } = findMinMax(thisValue, otherValue);
      result.relationship = relationship;
      const minDecimal = new Decimal(minValue);
      const maxDecimal = new Decimal(maxValue);
      result.diff = maxDecimal.sub(minDecimal).toNumber();
      result.percentageDiff = maxDecimal.sub(minDecimal).dividedBy(minDecimal).times(100).toNumber();  
    }
    return result;
  }

}