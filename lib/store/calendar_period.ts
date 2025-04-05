export type CalendarPeriod = {
  year?: number,
  quarter?: number,
  month?: number,
  day?: number
}

export function parseCalendar(input: string): CalendarPeriod | null {
  throw new Error('not implemented');
}

export function calendarEquals(lhs: CalendarPeriod, rhs: CalendarPeriod, ): boolean {
  throw new Error('not implemented');
}