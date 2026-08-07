// Ported from https://git.fizz.studio/aluminum/localization/src/commit/81ccdeeabe2448fcacadc05fb674b154fa94a71a/src/language-tag.ts
//   on 7/1/2026

/**
 * A locale string in BCP 47 format.
 *
 * Parse with {@link LanguageTag}.
 */
export type Locale = string;

/**
 * An {@link ICU!Message | ICU Message} string,
 * or an object containing nested Messages.
 */
export type Message = (string | { [key: string]: Message });

/**
 * ISO 3166 region code or UN M49 region.
 */
export type RegionCode = string;

/**
 * ISO 15924 script code.
 */
export type ScriptCode = string;

/**
 * ISO 4217 currency code.
 */
export type CurrencyCode = string;

/**
 * Unicode locale identifier for caldendars.
 */
export type CalendarCode = string;

/**
 * Field in a date/time value.
 */
export type DateTimeField = ('era' | 'year' | 'quarter' | 'month' | 'weekOfYear' | 'weekday' | 'day' | 'dayPeriod'
                             | 'hour' | 'minute' | 'second' | 'timeZoneName');
