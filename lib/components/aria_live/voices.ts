// VOICE SELECTION: new file. System voice discovery, local-only resolution and
// per-language voice preferences for self-voicing. See
// _ignore/ai/prompts/tts.md and _ignore/ai/claude/voice-selection-report.md.

import { Logger, getLogger } from '@fizz/logger';
import { PreferenceManager } from '../../state/preference_manager';
// VOICE BLOCKLIST: declarative blocklist data; matching is in "Eligibility" below
import {
  VOICE_BLOCKLISTS, type VoiceBlocklistEntry, type VoicePlatform, type VoiceVendor
} from './voice_blocklist';

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
 *
 * VOICE BLOCKLIST: two inventories. `rawVoices` is everything the browser
 * reports (for diagnostics and quality assessment); `voices` is the eligible
 * inventory, with blocklisted voices removed, used for normal operation.
 * Exported (the class) so tests can create a fresh instance.
 */
export class VoiceInventory {
  protected _rawVoices: readonly SpeechSynthesisVoice[] = [];
  protected _voices: readonly SpeechSynthesisVoice[] = [];
  protected _listeners = new Set<VoiceListener>();
  protected _isListening = false;

  get isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /**
   * VOICE BLOCKLIST: eligible voices (blocklisted ones removed), deduplicated
   * by voiceURI. May be empty while loading, or if every voice is blocked.
   */
  get voices(): readonly SpeechSynthesisVoice[] {
    this._ensureListening();
    return this._voices;
  }

  /**
   * VOICE BLOCKLIST: every voice the browser reports, deduplicated by
   * voiceURI, including blocklisted ones. For diagnostics, and as the input to
   * the resolution functions, which apply eligibility themselves.
   */
  get rawVoices(): readonly SpeechSynthesisVoice[] {
    this._ensureListening();
    return this._rawVoices;
  }

  /**
   * True once the browser has reported at least one voice. VOICE BLOCKLIST:
   * based on the raw inventory, so "every voice is blocked" isn't mistaken
   * for "still loading".
   */
  get isLoaded(): boolean {
    return this.rawVoices.length > 0;
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
    this._rawVoices = window.speechSynthesis.getVoices().filter(voice => {
      if (seen.has(voice.voiceURI)) return false;
      seen.add(voice.voiceURI);
      return true;
    });
    // VOICE BLOCKLIST: the eligible inventory, recomputed on every change
    this._voices = eligibleVoices(this._rawVoices);
    // Development builds only: make the full inventory easy to inspect.
    // VOICE BLOCKLIST: the raw inventory, so excluded voices stay visible.
    if (import.meta.env.DEV) {
      logVoiceInventory(this._rawVoices);
    }
    this._listeners.forEach(listener => listener(this._voices));
  }
}

export const voiceInventory = new VoiceInventory();

/**
 * VOICE BLOCKLIST: one diagnostics row per voice, including excluded voices
 * and why they're excluded.
 */
export function voiceDiagnostics(voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices,
  platform: VoicePlatform | 'unknown' = detectVoicePlatform()) {
  return voices.map(v => {
    const result = checkVoiceEligibility(v, platform);
    return {
      name: v.name,
      normalizedName: result.normalizedName,
      voiceURI: v.voiceURI,
      lang: v.lang,
      localService: v.localService,
      default: v.default,
      eligible: result.eligible,
      blocklistEntry: result.entry?.name ?? '',
      matchedBy: result.matchedBy ?? '',
      reason: result.entry?.reason ?? '',
    };
  });
}

/**
 * Print the voice inventory as a table. Called automatically in development
 * builds when the inventory changes; never called in production builds.
 * VOICE BLOCKLIST: shows the raw inventory, with eligibility, the matched
 * blocklist entry and the exclusion reason.
 */
export function logVoiceInventory(voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices) {
  console.table(voiceDiagnostics(voices));
}

// ---------------------------------------------------------------------------
// VOICE BLOCKLIST: Eligibility (matching logic; the data is in voice_blocklist.ts)
// ---------------------------------------------------------------------------

/**
 * Case-insensitive, whitespace-tolerant form of a name: Unicode NFC,
 * lowercase, runs of whitespace collapsed to one space, trimmed.
 */
export function normalizeVoiceText(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

const languageNameCache = new Map<string, string[]>();

/**
 * Standard display names of a locale, long and short: for en-US,
 * "English (United States)" and "English (US)". Cached per locale.
 */
function standardLanguageNames(lang: string): string[] {
  let names = languageNameCache.get(lang);
  if (!names) {
    names = [];
    for (const style of ['long', 'short'] as const) {
      try {
        const name = new Intl.DisplayNames(['en'], { type: 'language', languageDisplay: 'standard', style })
          .of(lang.replace('_', '-'));
        if (name && !names.includes(name)) names.push(name);
      } catch {}
    }
    languageNameCache.set(lang, names);
  }
  return names;
}

/**
 * A voice's name, normalized for blocklist matching.
 *
 * Reuses voiceDisplayName() to remove a redundant locale suffix ("Bad News
 * (English (United States))" → "Bad News"), then also removes the other
 * suffix forms seen in browsers: a short name ("Eddy (English (US))") and the
 * Windows style ("Microsoft David - English (United States)"). Only a suffix
 * naming the voice's own locale is removed. Quality designations such as
 * "(Enhanced)" and "(Premium)" are kept, so "Ava (Premium)" never matches
 * "Ava". Finally applies normalizeVoiceText().
 */
export function normalizeVoiceName(voice: SpeechSynthesisVoice): string {
  let name = normalizeVoiceText(voiceDisplayName(voice));
  for (const langName of standardLanguageNames(voice.lang)) {
    const n = normalizeVoiceText(langName);
    for (const suffix of [` (${n})`, ` - ${n}`]) {
      if (name.endsWith(suffix)) {
        name = name.slice(0, -suffix.length).trim();
      }
    }
  }
  return name;
}

/**
 * The vendor a voice's own identifiers name, or 'unknown'. Restricted
 * patterns only, never free substrings:
 * - Apple: voiceURI is an Apple identifier ("com.apple.…", as in Safari), or
 *   ends in one after a URN prefix ("…:com.apple.…"; the Firefox form, which
 *   is unverified).
 * - Microsoft: the name or voiceURI starts with the word "Microsoft" (Chrome
 *   and Edge on Windows).
 * - Google: the name starts with the word "Google" (Chrome's online voices).
 * Chrome on macOS reports voiceURI as the bare name, so it's 'unknown' there.
 */
export function inferVoiceVendor(voice: SpeechSynthesisVoice): VoiceVendor | 'unknown' {
  const uri = voice.voiceURI.trim().toLowerCase();
  const name = normalizeVoiceText(voice.name);
  if (/(^|:)com\.apple\./.test(uri)) return 'apple';
  if (/^microsoft\s/.test(name) || /^microsoft\s/.test(uri)) return 'microsoft';
  if (/^google\s/.test(name)) return 'google';
  return 'unknown';
}

/**
 * The current platform, used only as supporting evidence (see
 * checkVoiceEligibility). Prefers User-Agent Client Hints
 * (navigator.userAgentData.platform), then navigator.platform, then the
 * user-agent string. 'unknown' when it can't tell: name-only matches then need
 * vendor evidence from the voice itself.
 */
export function detectVoicePlatform(
  nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined
): VoicePlatform | 'unknown' {
  if (!nav) return 'unknown';
  const hinted = ((nav as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? '');
  const platform = (hinted || nav.platform || '').toLowerCase();
  const ua = (nav.userAgent || '').toLowerCase();
  if (platform.includes('android') || ua.includes('android')) return 'android';
  if (platform.includes('chrome os') || platform.includes('cros') || /\bcros\b/.test(ua)) return 'chromeos';
  if (/iphone|ipod/.test(platform) || /iphone|ipod/.test(ua) || platform === 'ios') return 'ios';
  if (platform.includes('ipad') || ua.includes('ipad')) return 'ipados';
  if (platform.startsWith('mac')) {
    // iPadOS Safari reports a Mac platform, but has a touch screen
    return (nav.maxTouchPoints ?? 0) > 1 ? 'ipados' : 'macos';
  }
  if (platform.startsWith('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';
  if (ua.includes('mac os x')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

export interface VoiceEligibility {
  eligible: boolean;
  normalizedName: string;
  vendor: VoiceVendor | 'unknown';
  /** The blocklist entry that matched, if any. */
  entry?: VoiceBlocklistEntry;
  matchedBy?: 'identifier' | 'name' | 'alias';
}

interface BlocklistIndex {
  byIdentifier: Map<string, VoiceBlocklistEntry>;
  byName: Map<string, { entry: VoiceBlocklistEntry, matchedBy: 'name' | 'alias' }[]>;
}

let blocklistIndex: BlocklistIndex | undefined;

/** Lookup tables for every entry in every platform's blocklist, built once. */
function getBlocklistIndex(): BlocklistIndex {
  if (!blocklistIndex) {
    const index: BlocklistIndex = { byIdentifier: new Map(), byName: new Map() };
    const addName = (name: string, entry: VoiceBlocklistEntry, matchedBy: 'name' | 'alias') => {
      const key = normalizeVoiceText(name);
      index.byName.set(key, [...(index.byName.get(key) ?? []), { entry, matchedBy }]);
    };
    for (const entry of Object.values(VOICE_BLOCKLISTS).flat()) {
      entry.identifiers?.forEach(id => index.byIdentifier.set(id.trim().toLowerCase(), entry));
      addName(entry.name, entry, 'name');
      entry.aliases?.forEach(alias => addName(alias, entry, 'alias'));
    }
    blocklistIndex = index;
  }
  return blocklistIndex;
}

const eligibilityCache = new WeakMap<SpeechSynthesisVoice,
  { platform: VoicePlatform | 'unknown', result: VoiceEligibility }>();

/**
 * Whether a voice may be offered and used. Matching order:
 *
 * 1. Vendor identifier: voiceURI exactly equals (ignoring case) a verified
 *    identifier in an entry. Blocked.
 * 2. Name or alias: the normalized name exactly equals an entry's normalized
 *    name or alias, and the vendor agrees:
 *    - the voice's own identifiers name a vendor (inferVoiceVendor): blocked
 *      only if it's the entry's vendor, so a similarly named voice from
 *      another vendor is kept;
 *    - they don't ('unknown'): blocked only if the current platform is one of
 *      the entry's platforms (supporting evidence) and the voice is local.
 * 3. Otherwise eligible. Ambiguity keeps the voice; unknown voices are kept.
 *
 * Results are cached per voice object and platform.
 */
export function checkVoiceEligibility(voice: SpeechSynthesisVoice,
  platform: VoicePlatform | 'unknown' = detectVoicePlatform()): VoiceEligibility {
  const cached = eligibilityCache.get(voice);
  if (cached && cached.platform === platform) return cached.result;
  const index = getBlocklistIndex();
  const normalizedName = normalizeVoiceName(voice);
  const vendor = inferVoiceVendor(voice);
  let result: VoiceEligibility = { eligible: true, normalizedName, vendor };
  const byId = index.byIdentifier.get(voice.voiceURI.trim().toLowerCase());
  if (byId) {
    result = { eligible: false, normalizedName, vendor, entry: byId, matchedBy: 'identifier' };
  } else {
    for (const { entry, matchedBy } of index.byName.get(normalizedName) ?? []) {
      const vendorAgrees = vendor === 'unknown'
        ? platform !== 'unknown' && entry.platforms.includes(platform) && voice.localService
        : vendor === entry.vendor;
      if (vendorAgrees) {
        result = { eligible: false, normalizedName, vendor, entry, matchedBy };
        break;
      }
    }
  }
  eligibilityCache.set(voice, { platform, result });
  return result;
}

/** The eligible voices of a list, in their original order. */
export function eligibleVoices(voices: readonly SpeechSynthesisVoice[],
  platform: VoicePlatform | 'unknown' = detectVoicePlatform()): SpeechSynthesisVoice[] {
  return voices.filter(v => checkVoiceEligibility(v, platform).eligible);
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
 *
 * VOICE BLOCKLIST: only eligible voices count, so a locale whose voices are
 * all blocklisted isn't listed. Like every resolution function below, it
 * accepts the raw or the eligible inventory and applies eligibility itself
 * (idempotent), so no path can skip the filter.
 */
export function voiceLocales(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices): string[] {
  voices = eligibleVoices(voices);
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
// VOICE BLOCKLIST: default is now the raw inventory; voiceLocales() filters
export function defaultLocale(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices): string {
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
export function selectedLocale(lang: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices): string {
  // VOICE BLOCKLIST: a blocklisted saved voice doesn't decide the locale
  voices = eligibleVoices(voices);
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
// VOICE BLOCKLIST: default is now the raw inventory; voicesForLocale() filters,
// so a blocklisted locale or system default is never chosen
export function defaultVoiceForLocale(locale: string,
  voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices): SpeechSynthesisVoice | null {
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
 *
 * VOICE BLOCKLIST: only eligible voices are considered. A blocklisted voice is
 * never chosen automatically, even as the system or locale default. A saved
 * voice that is now blocklisted is treated like a missing one: status
 * 'unavailable' and a local fallback, never a remote one. The saved
 * preference isn't overwritten. If every local voice is blocklisted, the
 * status is 'no-local'.
 */
export function resolveVoice(lang: string, savedURI = voicePrefs.get(lang),
  voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices): VoiceResolution {
  // VOICE BLOCKLIST: "no voices reported" is decided before filtering, so an
  // all-blocklisted inventory gives 'no-local', not 'unknown'
  if (!voices.length) {
    return { voice: null, status: 'unknown', canSpeak: true };
  }
  voices = eligibleVoices(voices);
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
 * VOICE SELECTION (subdivision names): English names for the Unicode
 * subdivision codes (`-u-sd-…`) seen in voice locales. Intl has no subdivision
 * names, so this small table supplies them. macOS uses en-GB-u-sd-gbsct for
 * its Scottish voice (Fiona); Wales and England are included as likely
 * siblings. English only, like the rest of languageName().
 */
const SUBDIVISION_NAMES: Record<string, string> = {
  gbsct: 'Scotland',
  gbwls: 'Wales',
  gbeng: 'England',
};

/**
 * Display name for a locale, as the browser names it in dialect form:
 * 'American English' for en-US, 'British English' for en-GB, falling back to
 * the code.
 *
 * VOICE SELECTION (subdivision names): Intl.DisplayNames throws on a tag with
 * Unicode extensions, so en-GB-u-sd-gbsct used to fall back to the raw code.
 * The language is now named from the base tag (en-GB), and a subdivision
 * (`sd`) is added in parentheses: 'British English (Scotland)'. An unknown
 * subdivision code is shown as itself: 'British English (sd-xxxx)'. Other
 * extensions are ignored.
 */
export function languageName(lang: string, displayLocale = 'en'): string {
  try {
    const locale = new Intl.Locale(lang.replace(/_/g, '-'));
    const name = new Intl.DisplayNames([displayLocale], { type: 'language' }).of(locale.baseName)
      ?? locale.baseName;
    const sd = locale.toString().match(/-u(?:-[a-z0-9]{3,8})*?-sd-([a-z0-9]{3,8})/i)?.[1]?.toLowerCase();
    if (!sd) return name;
    return `${name} (${SUBDIVISION_NAMES[sd] ?? `sd-${sd}`})`;
  } catch {
    return lang;
  }
}

/**
 * VOICE SELECTION: the voices of one locale, local and remote kept apart,
 * each sorted by name. VOICE BLOCKLIST: eligible voices only.
 */
export function voicesForLocale(locale: string, voices: readonly SpeechSynthesisVoice[] = voiceInventory.rawVoices) {
  const inLocale = eligibleVoices(voices).filter(v => sameLang(v.lang, locale))
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

// ---------------------------------------------------------------------------
// VOICE BLOCKLIST: development-only diagnostics
// ---------------------------------------------------------------------------

/**
 * In development builds only, `window.paraVoices` in the browser console:
 * - `paraVoices.table()`: the raw inventory with eligibility (as logged on load)
 * - `paraVoices.excluded()`: the excluded voices only
 * - `paraVoices.preview('Bad News')`: speak a sample with any voice, including
 *   an excluded one, by voiceURI or name (case-insensitive, normalized), to
 *   evaluate blocklist decisions without editing code
 * - `paraVoices.stop()`: stop the preview
 * import.meta.env.DEV is false in production builds, so this block is removed
 * from them. The preview cancels any other speech on the page.
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Keep the utterance referenced while it speaks (see UTTERANCE GC FIX in voicing.ts)
  let devPreviewUtterance: SpeechSynthesisUtterance | null = null;
  (window as unknown as { paraVoices: unknown }).paraVoices = {
    table: () => logVoiceInventory(),
    excluded: () => voiceDiagnostics().filter(row => !row.eligible),
    preview: (nameOrURI: string, text = 'The line chart shows revenue from 2005 to 2018, rising by 45 percent.') => {
      if (!voiceInventory.isSupported) return;
      const key = normalizeVoiceText(nameOrURI);
      const raw = voiceInventory.rawVoices;
      const voice = raw.find(v => v.voiceURI === nameOrURI)
        ?? raw.find(v => normalizeVoiceText(v.name) === key || normalizeVoiceName(v) === key);
      if (!voice) {
        console.warn(`paraVoices.preview: no voice named "${nameOrURI}"`);
        return;
      }
      window.speechSynthesis.cancel();
      devPreviewUtterance = new SpeechSynthesisUtterance(text);
      devPreviewUtterance.voice = voice;
      devPreviewUtterance.lang = voice.lang;
      window.speechSynthesis.speak(devPreviewUtterance);
      return voiceDiagnostics([voice])[0];
    },
    stop: () => {
      window.speechSynthesis?.cancel();
      devPreviewUtterance = null;
    },
  };
}
