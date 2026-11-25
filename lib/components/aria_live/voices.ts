// VOICE SELECTION: new file. System voice discovery, local-only resolution and
// per-language voice preferences for self-voicing. See
// _ignore/ai/prompts/tts.md and _ignore/ai/claude/voice-selection-report.md.

import { Logger, getLogger } from '@fizz/logger';
import { PreferenceManager } from '../../state/preference_manager';

const log: Logger = getLogger('Voices');

// ---------------------------------------------------------------------------
// Inventory: one shared list for the page
// ---------------------------------------------------------------------------

type VoiceListener = (voices: readonly SpeechSynthesisVoice[]) => void;

/**
 * The browser's voice list, shared by every chart on the page.
 *
 * getVoices() is often empty on first call (Chrome loads voices
 * asynchronously and fires 'voiceschanged' when ready; voices can also change
 * when the user installs one). Only one 'voiceschanged' listener is ever
 * registered, however many charts subscribe.
 */
class VoiceInventory {
  protected _voices: readonly SpeechSynthesisVoice[] = [];
  protected _listeners = new Set<VoiceListener>();
  protected _isListening = false;

  get isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /** Current voices, deduplicated by voiceURI. May be empty while loading. */
  get voices(): readonly SpeechSynthesisVoice[] {
    this._ensureListening();
    return this._voices;
  }

  /** True once the browser has reported at least one voice. */
  get isLoaded(): boolean {
    return this.voices.length > 0;
  }

  subscribe(listener: VoiceListener): () => void {
    this._ensureListening();
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  protected _ensureListening() {
    if (this._isListening || !this.isSupported) return;
    this._isListening = true;
    this._refresh();
    window.speechSynthesis.addEventListener('voiceschanged', () => this._refresh());
  }

  protected _refresh() {
    const seen = new Set<string>();
    this._voices = window.speechSynthesis.getVoices().filter(voice => {
      if (seen.has(voice.voiceURI)) return false;
      seen.add(voice.voiceURI);
      return true;
    });
    // Development builds only: make the full inventory easy to inspect
    if (import.meta.env.DEV) {
      logVoiceInventory(this._voices);
    }
    this._listeners.forEach(listener => listener(this._voices));
  }
}

export const voiceInventory = new VoiceInventory();

/**
 * Print the voice inventory as a table. Called automatically in development
 * builds when the inventory changes; never called in production builds.
 */
export function logVoiceInventory(voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices) {
  console.table(voices.map(v => ({
    name: v.name,
    voiceURI: v.voiceURI,
    lang: v.lang,
    localService: v.localService,
    default: v.default,
  })));
}

// ---------------------------------------------------------------------------
// Preferences: one saved voice per speech language
// ---------------------------------------------------------------------------

const VOICE_PREFS_KEY = 'paracharts:voicePreferences:v1';

/**
 * Persisted to localStorage, never to the chart: a voice is a device-specific
 * user preference, not an authoring property. voiceURI is stored rather than
 * an index, since voice order and availability vary by browser and device.
 */
interface StoredVoicePrefs {
  /** Speech language (e.g. 'en-US') → voiceURI. Absent means the default voice. */
  voiceURIByLang?: Record<string, string>;
  /**
   * VOICE SELECTION (language dropdown): speech language → chosen voice locale
   * (e.g. 'en-GB'). Absent means the browser-preferred locale.
   */
  localeByLang?: Record<string, string>;
}

class VoicePrefManager extends PreferenceManager<StoredVoicePrefs> {
  constructor() {
    super(VOICE_PREFS_KEY);
  }

  /** Saved voiceURI for a language, or '' for the default voice. */
  get(lang: string): string {
    return this.load().voiceURIByLang?.[lang] ?? '';
  }

  /** Save a voiceURI for a language; '' clears it (default voice). */
  set(lang: string, voiceURI: string) {
    this.save({ voiceURIByLang: setOrDelete(this.load().voiceURIByLang, lang, voiceURI) });
  }

  /** Saved voice locale for a language, or '' for the browser-preferred one. */
  getLocale(lang: string): string {
    return this.load().localeByLang?.[lang] ?? '';
  }

  /** Save a voice locale for a language; '' clears it. */
  setLocale(lang: string, locale: string) {
    this.save({ localeByLang: setOrDelete(this.load().localeByLang, lang, locale) });
  }
}

function setOrDelete(map: Record<string, string> | undefined, key: string, value: string) {
  const copy = { ...map };
  if (value) {
    copy[key] = value;
  } else {
    delete copy[key];
  }
  return copy;
}

export const voicePrefs = new VoicePrefManager();

// ---------------------------------------------------------------------------
// Locales: the language dropdown
// ---------------------------------------------------------------------------

const primaryLang = (lang: string) => lang.toLowerCase().split(/[-_]/)[0];
const normLang = (lang: string) => lang.toLowerCase().replace('_', '-');
const sameLang = (a: string, b: string) => normLang(a) === normLang(b);

/**
 * VOICE SELECTION: every locale that has at least one voice (local or remote),
 * as reported by the voices (e.g. 'en-US', 'en-GB', 'fr-FR'). Locales in the
 * speech language come first, then the rest; alphabetical by display name
 * within each.
 */
export function voiceLocales(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices): string[] {
  const primary = primaryLang(lang);
  const locales = [...new Set(voices.map(v => v.lang))];
  const rank = (locale: string) => primaryLang(locale) === primary ? 0 : 1;
  return locales.sort((a, b) => rank(a) - rank(b) || languageName(a).localeCompare(languageName(b)));
}

/**
 * VOICE SELECTION: the locale to use when the user hasn't chosen one, taken
 * from the browser's language settings (navigator.languages, in order).
 *
 * The chart text is in `lang` (e.g. 'en-US'), so the browser preference is
 * used only within that language: a browser set to en-GB picks British
 * voices, but a browser set to fr-FR doesn't make an English chart speak with
 * a French voice. Falls back to the speech language's own locale, then any
 * locale of the same language, then the first locale with voices.
 */
export function defaultLocale(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices): string {
  const locales = voiceLocales(lang, voices);
  const primary = primaryLang(lang);
  const browserLangs = typeof navigator !== 'undefined'
    ? (navigator.languages?.length ? navigator.languages : [navigator.language])
    : [];
  for (const browserLang of browserLangs) {
    if (primaryLang(browserLang) !== primary) continue;
    const exact = locales.find(l => sameLang(l, browserLang));
    if (exact) return exact;
  }
  return locales.find(l => sameLang(l, lang))
    ?? locales.find(l => primaryLang(l) === primary)
    ?? locales[0]
    ?? lang;
}

/**
 * VOICE SELECTION: the locale shown in the language dropdown: the saved one
 * (if it still has voices), else the saved voice's own locale, else the
 * browser-preferred default.
 */
export function selectedLocale(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices): string {
  const locales = voiceLocales(lang, voices);
  const saved = voicePrefs.getLocale(lang);
  if (saved && locales.some(l => sameLang(l, saved))) return saved;
  const savedVoice = voices.find(v => v.voiceURI === voicePrefs.get(lang));
  if (savedVoice) return savedVoice.lang;
  return defaultLocale(lang, voices);
}

// ---------------------------------------------------------------------------
// Resolution: which voice an utterance should use
// ---------------------------------------------------------------------------

/**
 * - `unknown`: no voices reported yet (still loading, or the browser never
 *   lists them); the utterance voice is left unset, as before this feature
 * - `selected`: the saved voice is available and used
 * - `default`: the default voice for the selected locale, a local voice
 * - `unavailable`: the saved voice isn't available; the default used instead
 * - `no-local`: no local voice exists, and nothing remote was chosen explicitly
 */
export type VoiceStatus = 'unknown' | 'selected' | 'default' | 'unavailable' | 'no-local';

export interface VoiceResolution {
  voice: SpeechSynthesisVoice | null;
  status: VoiceStatus;
  /** False only when speaking would mean an implicit remote voice. */
  canSpeak: boolean;
}

let hasWarnedNoLocal = false;

/**
 * VOICE SELECTION: the default (local) voice for a locale: the locale's local
 * voice marked `default`, else its first local voice by name. Null if the
 * locale has no local voices.
 */
export function defaultVoiceForLocale(locale: string,
  voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices): SpeechSynthesisVoice | null {
  const local = voicesForLocale(locale, voices).local;
  return local.find(v => v.default) ?? local[0] ?? null;
}

/**
 * Pick the voice for `lang`, honoring the saved preference.
 *
 * Local-only policy: the default voice never resolves to a remote voice. A
 * remote voice is used only when the user explicitly selected it. The browser's
 * own default (an utterance with no voice) may be remote (e.g. Chrome's online
 * voices), so the default is resolved to an explicit local voice instead: the
 * default voice of the selected locale (see selectedLocale), else a local
 * voice anywhere in the speech language, else any local default voice, else
 * any local voice.
 */
export function resolveVoice(lang: string, savedURI = voicePrefs.get(lang),
  voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices): VoiceResolution {
  if (!voices.length) {
    return { voice: null, status: 'unknown', canSpeak: true };
  }
  let isSavedMissing = false;
  if (savedURI) {
    const saved = voices.find(v => v.voiceURI === savedURI);
    if (saved) {
      return { voice: saved, status: 'selected', canSpeak: true };
    }
    isSavedMissing = true;
  }
  const local = voices.filter(v => v.localService);
  const primary = primaryLang(lang);
  const voice = defaultVoiceForLocale(selectedLocale(lang, voices), voices)
    ?? local.find(v => v.default && primaryLang(v.lang) === primary)
    ?? local.find(v => primaryLang(v.lang) === primary)
    ?? local.find(v => v.default)
    ?? local[0]
    ?? null;
  if (!voice) {
    // Resolution runs per utterance and per dialog render, so warn only once
    if (!hasWarnedNoLocal) {
      hasWarnedNoLocal = true;
      log.warn('No local speech synthesis voice is available; not using a remote voice implicitly.');
    }
    return { voice: null, status: 'no-local', canSpeak: false };
  }
  return { voice, status: isSavedMissing ? 'unavailable' : 'default', canSpeak: true };
}

// ---------------------------------------------------------------------------
// Presentation: the voice dropdown
// ---------------------------------------------------------------------------

/**
 * Display name for a locale, as the browser names it in dialect form:
 * 'American English' for en-US, 'British English' for en-GB, falling back to
 * the code.
 */
export function languageName(lang: string, displayLocale = 'en'): string {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(lang.replace('_', '-')) ?? lang;
  } catch {
    return lang;
  }
}

/**
 * VOICE SELECTION: the voices of one locale, local and remote kept apart,
 * each sorted by name.
 */
export function voicesForLocale(locale: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.voices) {
  const inLocale = voices.filter(v => sameLang(v.lang, locale))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    local: inLocale.filter(v => v.localService),
    remote: inLocale.filter(v => !v.localService),
  };
}

/**
 * VOICE SELECTION: a voice's name without a redundant locale suffix. Some
 * browsers name voices like "Eddy (English (United States))"; once the
 * language dropdown has chosen the locale, the suffix only adds noise. Only a
 * suffix that exactly matches the locale's standard display name is removed,
 * so distinguishing suffixes like "(Enhanced)" are kept.
 */
export function voiceDisplayName(voice: SpeechSynthesisVoice): string {
  let standardName = voice.lang;
  try {
    standardName = new Intl.DisplayNames(['en'], { type: 'language', languageDisplay: 'standard' })
      .of(voice.lang.replace('_', '-')) ?? voice.lang;
  } catch {}
  const suffix = ` (${standardName})`;
  return voice.name.endsWith(suffix) ? voice.name.slice(0, -suffix.length) : voice.name;
}
