import { LoadError, LoadErrorCode } from '../loader/paraloader';
import type { BrailleGrade, BrailleTranslationProvider } from './braille_translation_provider';
import { nabccToUnicode } from './nabcc_to_unicode';

const CACHE_LIMIT = 1000;

function isUnicodeBraille(text: string): boolean {
  return text.length > 0 && [...text].every(character => {
    const codePoint = character.codePointAt(0)!;
    return character === '\n' || (codePoint >= 0x2800 && codePoint <= 0x28ff);
  });
}

/** Routes Grade 1 to the simple mapping and Grade 2 to an optional provider. @internal */
export class BrailleTranslationService {
  private provider?: BrailleTranslationProvider;
  private initialization?: Promise<void>;
  private isProviderReady = false;
  private cache = new Map<string, string>();

  async register(provider: BrailleTranslationProvider): Promise<void> {
    if (this.provider && this.provider !== provider) {
      throw new Error('A Braille translation provider is already registered for this chart');
    }
    if (!this.provider) {
      this.provider = provider;
      const initialization = Promise.resolve()
        .then(() => provider.ready())
        .then(() => {
          this.isProviderReady = true;
          this.cache.clear();
        })
        .catch(error => {
          if (this.initialization === initialization) {
            this.provider = undefined;
            this.initialization = undefined;
            this.isProviderReady = false;
            this.cache.clear();
          }
          throw new LoadError(
            LoadErrorCode.BRAILLE_TRANSLATION_ERROR,
            `Braille translation provider failed to initialize: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      this.initialization = initialization;
    }
    await this.initialization;
  }

  translate(text: string, grade: BrailleGrade): string {
    if (!text) return text;
    const translator = Number(grade) === 2 && this.provider && this.isProviderReady
      ? 'provider'
      : 'simple';
    const key = `${translator}\0${grade}\0${text}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    // Grade 1 preserves the former simple character mapping. A provider adds
    // Grade 2 literary Braille without changing that baseline behavior.
    let translated: string;
    let cacheable = true;
    try {
      translated = translator === 'provider'
        ? this.provider!.translate(text)
        : nabccToUnicode(text);
      if (translator === 'provider' && !isUnicodeBraille(translated)) {
        throw new Error('Provider returned non-Braille output');
      }
    } catch {
      // A provider is an enhancement, not a requirement. Preserve a complete
      // tactile chart if it cannot translate one particular label.
      translated = nabccToUnicode(text);
      cacheable = translator !== 'provider';
    }
    if (cacheable) {
      this.cache.set(key, translated);
      if (this.cache.size > CACHE_LIMIT) {
        this.cache.delete(this.cache.keys().next().value!);
      }
    }
    return translated;
  }
}
