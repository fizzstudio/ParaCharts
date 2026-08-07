// Ported from https://git.fizz.studio/aluminum/localization/src/commit/81ccdeeabe2448fcacadc05fb674b154fa94a71a/src/localization.ts
//   on 7/1/2026

import type { PrimitiveType } from 'intl-messageformat';

import { LanguageTag } from './language-tag';

import { KNOWN_LOCALES } from './known-locales';

import type { Locale, Message, RegionCode, ScriptCode, CurrencyCode, CalendarCode, DateTimeField } from './types';

import { MessageFormatter } from './message-formatter';
import type { ResourceOptions } from './message-formatter';


/**
 * Wrapper class for Localization functions.
 *
 * Provides a {@link MessageFormatter} and various Intl functions.
 *
 * Construct via {@link make} static function.
 */
export class Localization {
	protected _locales: string[];
	protected _messageFormatter!: MessageFormatter;

	protected _timeOptions: Intl.DateTimeFormatOptions;
	protected _dateOptions: Intl.DateTimeFormatOptions;
	protected _dateTimeOptions: Intl.DateTimeFormatOptions;
	protected _numberOptions: Intl.NumberFormatOptions;
	protected _listOptions: Intl.ListFormatOptions;

	protected _languageOptions: Intl.DisplayNamesOptions;
	protected _regionOptions: Intl.DisplayNamesOptions;
	protected _scriptOptions: Intl.DisplayNamesOptions;
	protected _currencyOptions: Intl.DisplayNamesOptions;
	protected _calendarOptions: Intl.DisplayNamesOptions;
	protected _dateTimeFieldOptions: Intl.DisplayNamesOptions;

	protected _languageMap: (Map<string, Locale[]> | null);

	/**
	 * Construct a localization object for a given set of locales.
	 * @param locales ordered list of locale resources to load.
	 * @param options Options object or a version string.
	 */
	static async make(locales: readonly string[], options?: (ResourceOptions | string)): Promise<Localization> {
		const localization = new Localization(locales);

		if (typeof options === 'string') {
			options = {
				version: options,
			};
		}
		await localization._setup(options ?? {});
		return localization;
	}

	/**
	 * Protected constructor, use make
	 * @hidden
	 */
	protected constructor(locales: readonly string[]) {
		this._locales = [...locales];

		this._timeOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric' };
		this._dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
		this._dateTimeOptions = {
			year: 'numeric', month: 'numeric', day: 'numeric',
			hour: 'numeric', minute: 'numeric', second: 'numeric',
		};
		this._numberOptions = {};
		this._listOptions = { localeMatcher: 'best fit', type: 'unit', style: 'long' };

		this._languageOptions = { type: 'language', languageDisplay: 'dialect' };
		this._regionOptions = { type: 'region' };
		this._scriptOptions = { type: 'script' };
		this._currencyOptions = { type: 'currency' };
		this._calendarOptions = { type: 'calendar' };
		this._dateTimeFieldOptions = { type: 'dateTimeField' };

		this._languageMap = null;
	}

	/**
	 * Setup locales.
	 */
	protected async _setup(options: ResourceOptions): Promise<void> {
		if (options.defaultLocale && (!this._locales.includes(options.defaultLocale))) {
			this._locales.push(options.defaultLocale);
		}
		this._messageFormatter = await MessageFormatter.make(this._locales, options);
	}

	/**
	 * Insert additional {@link Message} for a locale.
	 */
	insertMessage(locale: string, key: string, message: Message): void {
		this._messageFormatter.insertMessage(locale, key, message);
	}

	/**
	 * Set default options for {@link timeFormatter} and {@link localizeTime},
	 * does not impact {@link ICU!time | time arguments}.
	 */
	setDefaultTimeOptions(options: Intl.DateTimeFormatOptions): void {
		this._timeOptions = options;
	}

	/**
	 * Set default options for {@link dateFormatter} and {@link localizeDate},
	 * does not impact {@link ICU!date | date arguments}.
	 */
	setDefaultDateOptions(options: Intl.DateTimeFormatOptions): void {
		this._dateOptions = options;
	}

	/**
	 * Set default options for {@link dateTimeFormatter} and {@link localizeDateTime},
	 * does not impact {@link ICU!date | date arguments} or {@link ICU!date | date arguments}.
	 */
	setDefaultDateTimeOptions(options: Intl.DateTimeFormatOptions): void {
		this._dateTimeOptions = options;
	}

	/**
	 * Set default options for {@link numberFormatter} and {@link localizeNumber},
	 * does not impact {@link ICU!number | number arguments}.
	 */
	setDefaultNumberOptions(options: Intl.NumberFormatOptions): void {
		this._numberOptions = options;
	}

	/**
	 * Set default options for {@link listFormatter} and {@link localizeList}.
	 */
	setDefaultListOptions(options: Intl.ListFormatOptions): void {
		this._listOptions = options;
	}

	/**
	 * Set default options for {@link languageDisplay}.
	 */
	setDefaultLanguageOptions(options: Intl.DisplayNamesOptions): void {
		this._languageOptions = options;
	}

	/**
	 * Set default options for {@link regionDisplay}.
	 */
	setDefaultRegionOptions(options: Intl.DisplayNamesOptions): void {
		this._regionOptions = options;
	}

	/**
	 * Set default options for {@link scriptDisplay}.
	 */
	setDefaultScriptOptions(options: Intl.DisplayNamesOptions): void {
		this._scriptOptions = options;
	}

	/**
	 * Set default options for {@link currencyDisplay}.
	 */
	setDefaultCurrencyOptions(options: Intl.DisplayNamesOptions): void {
		this._currencyOptions = options;
	}

	/**
	 * Set default options for {@link calendarDisplay}.
	 */
	setDefaultCalendarOptions(options: Intl.DisplayNamesOptions): void {
		this._calendarOptions = options;
	}

	/**
	 * Set default options for {@link dateTimeFieldDisplay}.
	 */
	setDefaultDateTimeFieldOptions(options: Intl.DisplayNamesOptions): void {
		this._dateTimeFieldOptions = options;
	}

	/**
	 * Get a time formatter.
	 *
	 * For normal use, use {@link localizeTime}
	 */
	timeFormatter(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
		return new Intl.DateTimeFormat(this._locales, options ?? this._timeOptions);
	}

	/**
	 * Get a date formatter.
	 *
	 * For normal use, use {@link localizeDate}
	 */
	dateFormatter(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
		return new Intl.DateTimeFormat(this._locales, options ?? this._dateOptions);
	}

	/**
	 * Get a date/time formatter.
	 *
	 * For normal use, use {@link localizeDateTime}
	 */
	dateTimeFormatter(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
		return new Intl.DateTimeFormat(this._locales, options ?? this._dateTimeOptions);
	}

	/**
	 * Get a number formatter.
	 *
	 * For normal use, use {@link localizeNumber}
	 */
	numberFormatter(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
		return new Intl.NumberFormat(this._locales, options ?? this._numberOptions);
	}

	/**
	 * Get a list formatter.
	 *
	 * For normal use, use {@link localizeList}
	 */
	listFormatter(options?: Intl.ListFormatOptions): Intl.ListFormat {
		return new Intl.ListFormat(this._locales, options ?? this._listOptions);
	}


	/**
	 * Get a language display object.
	 *
	 * For normal use, use {@link languageName}
	 */
	languageDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._languageOptions;
		options.type = 'language';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get a region display object.
	 *
	 * For normal use, use {@link regionName}
	 */
	regionDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._regionOptions;
		options.type = 'region';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get a script display object.
	 *
	 * For normal use, use {@link scriptName}
	 */
	scriptDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._scriptOptions;
		options.type = 'script';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get a currency display object.
	 *
	 * For normal use, use {@link currencyName}
	 */
	currencyDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._currencyOptions;
		options.type = 'currency';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get a calendar display object.
	 *
	 * For normal use, use {@link calendarName}
	 */
	calendarDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._calendarOptions;
		options.type = 'calendar';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get a dateTimeField display object.
	 *
	 * For normal use, use {@link dateTimeFieldName}
	 */
	dateTimeFieldDisplay(options?: Intl.DisplayNamesOptions): Intl.DisplayNames {
		options = options ?? this._dateTimeFieldOptions;
		options.type = 'dateTimeField';
		return new Intl.DisplayNames(this._locales, options);
	}

	/**
	 * Get locale of message that will be used for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 */
	locale(key: string): Locale {
		return this._messageFormatter.locale(key);
	}

	/**
	 * Create a localized string for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 * @param args arguments passed to the found {@link ICU!Message | ICU Message}.
	 */
	localize(key: string, args: Record<string, PrimitiveType> = {}): string {
		return this._messageFormatter.format(key, args);
	}

	/**
	 * Get an unprocessed message for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 * @returns Message may be an {@link ICU!Message | ICU Message} string.
	 * or an object with nested messages.
	 */
	localMessage(key: string): Message {
		return this._messageFormatter.get(key);
	}

	/**
	 * Get a localized time string.
	 *
	 * Used for stand-alone time display, for times within other messages,
	 * use a {@link ICU!time | time argument}.
	 */
	localizeTime(date: (string | Date), options?: Intl.DateTimeFormatOptions): string {
		if (! date) {
			return '';
		}
		if (! (date instanceof Date)) {
			date = new Date(date);
		}
		return this.timeFormatter(options).format(date);
	}

	/**
	 * Get a localized date string.
	 *
	 * Used for stand-alone date display, for dates within other messages,
	 * use a {@link ICU!date | date argument}.
	 */
	localizeDate(date: (string | Date), options?: Intl.DateTimeFormatOptions): string {
		if (! date) {
			return '';
		}
		if (! (date instanceof Date)) {
			date = new Date(date);
		}
		return this.dateFormatter(options).format(date);
	}

	/**
	 * Get a localized date/time string.
	 *
	 * Used for stand-alone date/time display, for date/times within other messages,
	 * use a {@link ICU!date | date argument}
	 * and {@link ICU!time | time argument}.
	 */
	localizeDateTime(date: (string | Date), options?: Intl.DateTimeFormatOptions): string {
		if (! date) {
			return '';
		}
		if (! (date instanceof Date)) {
			date = new Date(date);
		}
		return this.dateTimeFormatter(options).format(date);
	}

	/**
	 * Get a localized number string.
	 *
	 * Used for stand-alone number display, for numbers within other messages,
	 * use a {@link ICU!number | number argument}.
	 */
	localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
		return this.numberFormatter(options).format(value);
	}

	/**
	 * Get a localized list.
	 *
	 * Used for combining a list of strings using proper punctuation and conjunctions for the selected locale.
	 */
	localizeList(items: string[], options?: Intl.ListFormatOptions): string {
		return this.listFormatter(options).format(items);
	}

	/**
	 * Get a language name.
	 */
	languageName(locale: Locale, options?: Intl.DisplayNamesOptions): string {
		return (this.languageDisplay(options).of(locale) ?? '');
	}

	/**
	 * Get a region name.
	 */
	regionName(regionCode: RegionCode, options?: Intl.DisplayNamesOptions): string {
		return (this.regionDisplay(options).of(regionCode) ?? '');
	}

	/**
	 * Get a script name.
	 */
	scriptName(scriptCode: ScriptCode, options?: Intl.DisplayNamesOptions): string {
		return (this.scriptDisplay(options).of(scriptCode) ?? '');
	}

	/**
	 * Get a currency name.
	 */
	currencyName(currencyCode: CurrencyCode, options?: Intl.DisplayNamesOptions): string {
		return (this.currencyDisplay(options).of(currencyCode) ?? '');
	}

	/**
	 * Get a calendar name.
	 */
	calendarName(calendarCode: CalendarCode, options?: Intl.DisplayNamesOptions): string {
		return (this.calendarDisplay(options).of(calendarCode) ?? '');
	}

	/**
	 * Get a dateTime field name.
	 */
	dateTimeFieldName(field: DateTimeField, options?: Intl.DisplayNamesOptions): string {
		return (this.dateTimeFieldDisplay(options).of(field) ?? '');
	}

	/**
	 * Get language to locales map.
	 */
	protected _languages(): Map<string, Locale[]> {
		if (this._languageMap) {
			return this._languageMap;
		}
		this._languageMap = new Map();
		for (const locale of KNOWN_LOCALES) {
			const tag = new LanguageTag(locale);
			if (! tag.language) {
				continue;
			}
			if (this._languageMap.has(tag.language)) {
				this._languageMap.get(tag.language)!.push(locale);
			}
			else {
				this._languageMap.set(tag.language, [locale]);
			}
		}
		return this._languageMap;
	}

	/**
	 * Get a sorted list of all known languages.
	 * @returns array of language component of a BCP 47 tag
	 */
	languages(options?: Intl.DisplayNamesOptions): string[] {
		const display = this.languageDisplay(options);
		return [...this._languages().keys()].sort((a, b) => (display.of(a) ?? '').localeCompare(display.of(b) ?? ''));
	}

	/**
	 * Get a list of all known locales for a language.
	 */
	locales(language: string): Locale[] {
		return (this._languages().get(language) ?? [language]);
	}
}
