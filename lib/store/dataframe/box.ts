/* ParaCharts: Boxed Data
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

import { Datatype } from "@fizz/paramanifest";
import { calendarEquals, CalendarPeriod, parseCalendar } from "../calendar_period";

// TODO: This type lacks a completeness type check. This could be implemented by testing in Vitest
// that `keyof ScalarMap extends Datatype` and vice versa and `ScalarMap[Datatype] extends Scalar` 
// and vice versa. 
export type ScalarMap = {
  number: number,
  string: string,
  date: CalendarPeriod
}

/**
 * Box holding a series value and its source "raw" value.
 * @public
 */
export abstract class Box<T extends Datatype> {
  public readonly value: ScalarMap[T];
  
  constructor(public readonly raw: string) {
    this.value = this.convertRaw(raw);
  }

  abstract convertRaw(raw: string): ScalarMap[T];

  abstract isNumber(): this is {value: number};

  abstract isString(): this is {value: string};

  abstract isDate(): this is {value: CalendarPeriod};

  abstract isEqual(other: Box<T>): boolean;
}

/**
 * Box holding a number.
 * @public
 */
export class NumberBox extends Box<'number'> {

  convertRaw(raw: string): number {
    const val = parseFloat(raw);
    if (isNaN(val)) {
      throw new Error('x values in Numeric Datapoints must be numbers');
    }
    return val;
  }

  public isNumber(): this is {value: number} {
    return true;
  }

  public isString(): this is {value: string} {
    return false;
  }

  public isDate(): this is {value: CalendarPeriod} {
    return false;
  }

  public isEqual(other: Box<'number'>) {
    return this.value === other.value;
  }

}

/**
 * Box holding a string.
 * @public
 */
export class StringBox extends Box<'string'> {

  convertRaw(raw: string): string {
    return raw;
  }
  
  public isNumber(): this is {value: number} {
    return false;
  }

  public isString(): this is {value: string} {
    return true;
  }

  public isDate(): this is {value: CalendarPeriod} {
    return false;
  }

  public isEqual(other: Box<'string'>) {
    return this.value === other.value;
  }

}

/**
 * Box holding a date.
 * @public
 */
export class DateBox extends Box<'date'> {

  convertRaw(raw: string): CalendarPeriod {
    const date = parseCalendar(raw);
    if (date === null) {
      throw new Error('x values in Calendar Datapoints must be parsable');
    }
    return date;
  }
  
  public isNumber(): this is {value: number} {
    return false;
  }

  public isString(): this is {value: string} {
    return false;
  }

  public isDate(): this is {value: CalendarPeriod} {
    return true;
  }

  public isEqual(other: Box<'date'>): boolean {
    return calendarEquals(this.value, other.value);
  }

}

type BoxConstructor<T extends Datatype> = new (raw: string) => Box<T>;

type BoxConstructorMap = { [T in Datatype]: BoxConstructor<T> };

export const BOX_CONSTRUCTORS: BoxConstructorMap = {
  string: StringBox,
  number: NumberBox,
  date: DateBox
}