// Ported from https://git.fizz.studio/aluminum/localization/src/commit/81ccdeeabe2448fcacadc05fb674b154fa94a71a/src/language-tag.ts
//   on 7/1/2026

const bcp47re = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line @stylistic/max-len

/**
 * BCP 47 Language extension
 */
export type LanguageExtension = {
	singleton: string;
	extensions: string[];
};

/**
 * BCP 47 grandfathered language type.
 */
export type GrandfatheredLanguage = {
	irregular: (string | null);
	regular: (string | null);
};

/**
 * Language tag class.
 */
export class LanguageTag {
	language: (string | null) = null;
	extendedLanguageSubtags: string[] = [];
	script: (string | null) = null;
	region: (string | null) = null;
	variants: string[] = [];
	extensions: LanguageExtension[] = [];
	privateuses: string[] = [];
	grandfathered: (GrandfatheredLanguage | null) = null;

	/**
	 * Construct a LanguageTag from a string.
	 */
	constructor(languageTag: string) {
		this.parse(languageTag);
	}

	/**
	 * Parse a language tag.
	 */
	parse(languageTag: string): void {
		this.language = null;
		this.extendedLanguageSubtags = [];
		this.script = null;
		this.region = null;
		this.variants = [];
		this.extensions = [];
		this.privateuses = [];
		this.grandfathered = null;

		const parts = bcp47re.exec(languageTag);
		if (!parts) {
			return;
		}

		parts.shift();

		if (parts[0] || parts[1]) {
			this.grandfathered = {
				irregular: parts[0] || null,
				regular: parts[1] || null,
			};
		}

		if (parts[2]) {
			const langParts = parts[2].split('-');
			this.language = langParts.shift() ?? null;
			this.extendedLanguageSubtags = langParts;
		}

		this.script = parts[3] || null;
		this.region = parts[4] || null;

		if (parts[5]) {
			this.variants = parts[5].split('-');
			this.variants.shift();
		}

		if (parts[6]) {
			const extensionParts = parts[6].split('-');
			extensionParts.shift();
			let singleton: (string | null) = null;
			let extensions: string[] = [];

			while (extensionParts.length) {
				const extension = extensionParts.shift()!;
				if (1 === extension.length) {
					if (singleton) {
						this.extensions.push({ singleton: singleton, extensions: extensions });
						singleton = extension;
						extensions = [];
					}
					else {
						singleton = extension;
					}
				}
				else {
					extensions.push(extension);
				}
			}
			if (singleton) {
				this.extensions.push({ singleton: singleton, extensions: extensions });
			}
		}

		if (parts[7]) {
			const privateuses = parts[7].split('-');
			privateuses.shift();
			privateuses.shift();
			this.privateuses = privateuses;
		}

		if (parts[8]) {
			const privateuses = parts[8].split('-');
			privateuses.shift();
			this.privateuses = privateuses;
		}
	}

	/**
	 * Convert to string.
	 */
	toString(): string {
		if (this.grandfathered) {
			return this.grandfathered.irregular ?? this.grandfathered.regular!;
		}

		if (! this.language) {
			return '';
		}

		let value = this.language;
		if (this.extendedLanguageSubtags.length) {
			value += '-' + this.extendedLanguageSubtags.join('-');
		}
		if (this.script) {
			value += '-' + this.script;
		}
		if (this.region) {
			value += '-' + this.region;
		}
		if (this.variants.length) {
			value += '-' + this.variants.join('-');
		}
		for (const extension of this.extensions) {
			value += '-' + extension.singleton;
			if (extension.extensions.length) {
				value += '-' + extension.extensions.join('-');
			}
		}
		if (this.privateuses.length) {
			if (this.language) {
				value += '-x-' + this.privateuses.join('-');
			}
			else {
				value = 'x-' + this.privateuses.join('-');
			}
		}
		return value;
	}

	/**
	 * Compare to other tag.
	 */
	equals(other: LanguageTag): boolean {
		return (this.toString() == '' + other);
	}

	/**
	 * Get resource name (usually base language).
	 */
	resourceName(): string {
		if (this.grandfathered) {
			switch (this.grandfathered.regular ?? this.grandfathered.irregular) {
				case 'art-lojban': return 'jbo';
				case 'cel-gaulish': return 'cel-gaulish';
				case 'en-GB-oed': return 'en';
				case 'i-ami': return 'ami';
				case 'i-bnn': return 'bnn';
				case 'i-default': return 'en';
				case 'i-enochian': return 'en'; // deprecated
				case 'i-hak': return 'hak';
				case 'i-klingon': return 'tlh';
				case 'i-lux': return 'lb';
				case 'i-mingo': return 'en'; // ??
				case 'i-navajo': return 'nv';
				case 'i-pwn': return 'pwn';
				case 'i-tao': return 'tao';
				case 'i-tay': return 'tay';
				case 'i-tsu': return 'tsu';
				case 'no-bok': return 'no';
				case 'no-nyn': return 'no';
				case 'sgn-BE-FR': return 'sfb';
				case 'sgn-BE-NL': return 'vgt';
				case 'sgn-CH-DE': return 'sgg';
				case 'zh-guoyu': return 'zh';
				case 'zh-hakka': return 'zh';
				case 'zh-min': return 'zh';
				case 'zh-min-nan': return 'zh';
				case 'zh-xiang': return 'zh';
			}
		}
		return (this.language ?? '');
	}

	/**
	 * Get list of keys used to find associated resources (most specific to least specific).
	 */
	resourceKeys(): string[] {
		if (this.grandfathered) {
			switch (this.grandfathered.regular ?? this.grandfathered.irregular) {
				case 'art-lojban': return ['jbo'];
				case 'cel-gaulish': return ['xcg', 'xga', 'xtg'];
				case 'en-GB-oed': return ['en-GB-oxendict', 'en-GB', 'en'];
				case 'i-ami': return ['ami'];
				case 'i-bnn': return ['bnn'];
				case 'i-default': return ['en'];
				case 'i-enochian': return ['en']; // deprecated
				case 'i-hak': return ['hak'];
				case 'i-klingon': return ['tlh'];
				case 'i-lux': return ['lb'];
				case 'i-mingo': return ['en']; // ??
				case 'i-navajo': return ['nv'];
				case 'i-pwn': return ['pwn'];
				case 'i-tao': return ['tao'];
				case 'i-tay': return ['tay'];
				case 'i-tsu': return ['tsu'];
				case 'no-bok': return ['nb', 'no'];
				case 'no-nyn': return ['nn', 'no'];
				case 'sgn-BE-FR': return ['sfb'];
				case 'sgn-BE-NL': return ['vgt'];
				case 'sgn-CH-DE': return ['sgg'];
				case 'zh-guoyu': return ['cmn', 'zh'];
				case 'zh-hakka': return ['hak', 'zh'];
				case 'zh-min': return ['cdo', 'cpx', 'czo', 'mnp', 'nan', 'zh'];
				case 'zh-min-nan': return ['nan', 'zh'];
				case 'zh-xiang': return ['hsn', 'zh'];
			}
		}

		let key = this.language;
		if (! key) {
			return [];
		}
		const keys: string[] = [key];
		for (const subtag of this.extendedLanguageSubtags) {
			key += '-' + subtag;
			keys.unshift(key);
		}
		if (this.script) {
			key += '-' + this.script;
			keys.unshift(key);
		}
		if (this.region) {
			key += '-' + this.region;
			keys.unshift(key);
		}
		for (const variant of this.variants) {
			key += '-' + variant;
			keys.unshift(key);
		}
		for (const extension of this.extensions) {
			key += '-' + extension.singleton;
			if (extension.extensions.length) {
				key += '-' + extension.extensions.join('-');
			}
			keys.unshift(key);
		}
		if (this.privateuses.length) {
			if (this.language) {
				key += '-x-' + this.privateuses.join('-');
				keys.unshift(key);
			}
			else {
				keys.unshift('x-' + this.privateuses.join('-'));
			}
		}
		return keys;
	}
}
