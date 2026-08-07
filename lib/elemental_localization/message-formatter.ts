// Ported from https://git.fizz.studio/aluminum/localization/src/commit/81ccdeeabe2448fcacadc05fb674b154fa94a71a/src/message-formatter.ts
//   on 7/1/2026

import { IntlMessageFormat } from 'intl-messageformat';
import type { PrimitiveType } from 'intl-messageformat';

import { Utils } from '@elemental/utils';

import { LanguageTag } from './language-tag';
import type { Locale, Message } from './types';

/**
 * Options for loading resource files.
 * @property path base URL for loading resource files, may be relative path.
 * @property defaultLocale locale to always load if not provided.
 * @property version version of locale files, 'development' or '0.0.0' will bypass browser cache
 * @property retry retry loading every second on network errors
 * @interface
 */
export type ResourceOptions = {
	path?: (string | undefined);
	defaultLocale?: (Locale | undefined);
	version?: (string | undefined);
	retry?: (boolean | undefined);
};

/**
 * Message formatter manages and formats localized messages.
 *
 * Used internally by {@link Localization}.
 */
export class MessageFormatter {
	protected _debug = false;
	protected _locales: Locale[] = [];
	protected _formatterCache: Map<string, IntlMessageFormat> = new Map();

	protected _resources: Map<string, Promise<void>> = new Map();
	protected _messages: Record<string, Message> = {};

	/**
	 * Load a message resource file.
	 */
	protected static async _fetchResource(url: string, options: ResourceOptions): Promise<void> {
		let version = options.version;
		if (('development' == version?.toLowerCase()) || ('0.0.0' == version)) {
			version += `-${Math.random() * Number.MAX_SAFE_INTEGER}`;
		}
		url += ((options.version) ? `?version=${version}` : '');
		while (true) {
			try {
				console.log('fetching message resource at', url);
				const response = await fetch(url, { redirect: 'follow' });
				if (! response.ok) {
					console.log('loading message resource failed', url);
					return;
				}
				MessageFormatter._messages = Utils.mergePatch(MessageFormatter._messages, await response.json());
				return;
			}
			catch (error) {
				if (options.retry) {
					console.log('fetch failed, retry in 1 sec', error);
					await Utils.wait(1000);
				}
				else {
					console.log('fetch failed', error);
					break;
				}
			}
		}
	}

	/**
	 * Load a message resource for a locale.
	 */
	protected async _loadResource(name: string, options: ResourceOptions): Promise<void> {
		if (!this._resources.has(name)) {
			if ()
			const path = (options.path ?? '/assets/locales');
			const resource = MessageFormatter._fetchResource(`${path}/${name}.json`, options);
			MessageFormatter._resources.set(name, resource);
			return resource;
		}
		return MessageFormatter._resources.get(name);
	}

	/**
	 * Load a message resource for a locale.
	 */
	protected static async _loadResourcePath(name: string, options: ResourceOptions): Promise<void> {
		const path = (options.path ?? '/assets/locales');
		const resource = MessageFormatter._fetchResource(`${path}/${name}.json`, options);
		MessageFormatter._resources.set(name, resource);
		return resource;
	}

	/**
	 * Construct a MessageFormatter.
	 * @param locales ordered list of locale resources to load.
	 * @param options Options object.
	 */
	static async make(locales: Locale[], options: ResourceOptions): Promise<MessageFormatter> {
		const formatter = new MessageFormatter();

		await formatter._setLocales(locales, options);
		return formatter;
	}

	/**
	 * Protected constructor, use make.
	 * @hidden
	 */
	protected constructor() {
	}

	/**
	 * Set locales, load resources.
	 */
	protected async _setLocales(locales: Locale[], options: ResourceOptions): Promise<void> {
		this._formatterCache.clear();

		const uniqueLocales: Set<string> = new Set();
		const languages = locales.map((locale) => new LanguageTag(locale));
		const resourceKeys = languages.map((language) => language.resourceKeys());
		for (const keys of Utils.zipLongest(...resourceKeys)) {
			for (const key of keys) {
				if ((!key) || uniqueLocales.has(key)) {
					continue;
				}
				uniqueLocales.add(key);
				this._loadResource(key, options);
			}
		}
		this._locales = Array.from(uniqueLocales.values());
		for (const locale of this._locales) { // wait for all to load
			await this._loadResource(locale, options);
		}
		if (this._debug) {
			console.log('Set locales', this._locales);
		}
	}

	/**
	 * Insert additional message for a locale.
	 */
	insertMessage(locale: string, key: string, message: Message): void {
		this._formatterCache.clear();

		let messages = message;
		const subKeys = key.split('.');
		let subKey = subKeys.pop();
		while (subKey) {
			const subMessages: any = {};
			subMessages[subKey] = messages;
			messages = subMessages;
			subKey = subKeys.pop();
		}

		const localMessages: any = {};
		localMessages[locale] = messages;
		MessageFormatter._messages = Utils.mergePatch(MessageFormatter._messages, localMessages);
	}

	/**
	 * Get message and effective locale for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 */
	getMessageAndLocale(key: string): [Message, Locale] {
		for (const locale of this._locales) {
			let messages = MessageFormatter._messages[locale];
			if (! messages) {
				continue;
			}
			const subKeys = key.split('.');
			for (const subKey of subKeys.slice(0, -1)) {
				messages = (messages as any)[subKey];
				if (! messages) {
					break;
				}
			}
			if (! messages) {
				continue;
			}
			const message = (messages as any)[subKeys[subKeys.length - 1]];
			if (message) {
				return [message, locale];
			}
		}
		console.log('Localized message not found for', key);
		return ['', ''];
	}

	/**
	 * Get message for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 * @returns Message may be an {@link ICU!Message | ICU Message} string.
	 * or an object with nested messages.
	 */
	get(key: string): Message {
		const [message, _] = this.getMessageAndLocale(key);
		return message;
	}

	/**
	 * Test if a message is present for a given key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 */
	hasKey(key: string): boolean {
		if (0 == this._locales.length) {
			return false;
		}
		return (!! this.get(key));
	}

	/**
	 * Helper method to get formatter for a key.
	 */
	protected _formatter(key: string): (IntlMessageFormat | null) {
		let formatter = this._formatterCache.get(key);
		if (! formatter) {
			const [message, locale] = this.getMessageAndLocale(key);
			if (! (message && locale)) {
				return null;
			}
			formatter = new IntlMessageFormat((message as string), locale);
			this._formatterCache.set(key, formatter);
		}
		return formatter;
	}

	/**
	 * Get effective locale for a key.
	 * @param key lookup key for the message in a resource file, may contain '.'s to access nested objects.
	 */
	locale(key: string): Locale {
		if (0 == this._locales.length) {
			return '';
		}
		const formatter = this._formatter(key);
		return (formatter?.resolvedOptions().locale ?? '');
	}

	/**
	 * Format an {@link ICU!Message | ICU Message}.
	 * @param key lookup key for the message, may contain '.'s to access nested objects.
	 * @param args arguments passed to the found {@link ICU!Message | ICU Message}.
	 */
	format(key: string, args: Record<string, PrimitiveType> = {}): string {
		if (0 == this._locales.length) {
			return '';
		}
		//const formatter = this._formatter(key);
		const template = this._templates(key) as typeof TEMPLATE_TYPES.key;
		try {
			return ((formatter?.format(args) as string) || '');
		}
		catch (error) {
			console.error(error);
			return '';
		}
	}
}
