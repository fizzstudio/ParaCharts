export type CalendarPeriod = {
  year?: number,
  quarter?: number,
  month?: number,
  day?: number
}

export function parseCalendar(input: string): CalendarPeriod | null {
  return { year: parseInt(input) };
}

export function calendarEquals(lhs: CalendarPeriod, rhs: CalendarPeriod): boolean {
  return lhs.year === rhs.year;
}

export function calendarString(period: CalendarPeriod): string {
  throw new Error('not implemented');
}

