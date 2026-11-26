// VOICE BLOCKLIST: new file. Data only: which system voices ParaCharts doesn't
// offer for narration. The matching logic is in voices.ts ("Eligibility").
// See _ignore/ai/prompts/voices.md and _ignore/ai/claude/voice-blocklist-report.md.
//
// Four kinds of voice, kept distinct:
//
// 1. Inherently inappropriate for accessible narration: novelty, musical and
//    deliberately distorted voices. They're jokes or effects, not speech
//    voices. BLOCKED (VOICE_BLOCKLISTS, reasons 'novelty', 'musical',
//    'distorted').
// 2. Excluded for established quality concerns: legacy voices with known poor
//    intelligibility, and development or test voices that were never meant for
//    users. BLOCKED (reasons 'legacy-low-quality', 'development-test').
// 3. Candidates for further testing: voices that may belong in 1 or 2, but
//    haven't been evaluated. NOT blocked (VOICE_EVALUATION_CANDIDATES).
// 4. Ordinary voices that sound relatively synthetic (e.g. eSpeak NG, Flite,
//    Pico): NOT blocked, and not listed. On some systems they're the only local
//    voice, and a synthetic voice is far better than none.
//
// Rules for adding entries:
// - Add only voices observed in a real browser or OS inventory. Don't add
//   speculative entries, especially for platforms with no entries yet.
// - `identifiers` must be verified, exact voiceURI values. They're matched
//   exactly (ignoring case), never as substrings.
// - Names and aliases are matched exactly after normalization (case,
//   whitespace and a redundant locale suffix; see normalizeVoiceName). Never
//   add "Enhanced" or "Premium" variants: those are separate, better voices.
// - Whether a voice fires `boundary` events (needed for word highlighting) is
//   a separate concern. Never block a voice for that.

/** The vendor whose voice an entry describes. */
export type VoiceVendor = 'apple' | 'microsoft' | 'google';

/**
 * A platform, used only as supporting evidence when a voice's identifier
 * doesn't name its vendor (e.g. Chrome on macOS, whose voiceURI is just the
 * voice name).
 */
export type VoicePlatform = 'macos' | 'ios' | 'ipados' | 'windows' | 'linux' | 'android' | 'chromeos';

export type VoiceExclusionReason =
  | 'novelty'             // a joke or character voice
  | 'musical'             // sung or played as music rather than spoken
  | 'distorted'           // deliberately distorted or effects-processed speech
  | 'legacy-low-quality'  // an old voice with established poor intelligibility
  | 'development-test';   // a sample or test voice, not meant for users

export interface VoiceBlocklistEntry {
  vendor: VoiceVendor;
  /**
   * Platforms where this vendor's voice is a system voice. A name-only match
   * (no vendor-specific identifier) needs the current platform to be one of
   * these.
   */
  platforms: readonly VoicePlatform[];
  /** The current voice name. */
  name: string;
  /** Earlier or alternative names for the same voice. */
  aliases?: readonly string[];
  /** Verified, vendor-specific voiceURI values. */
  identifiers?: readonly string[];
  reason: VoiceExclusionReason;
  /** Evidence or explanation, for reviewers. */
  note?: string;
}

/** A voice to evaluate before deciding whether to block it. Never blocked. */
export interface VoiceEvaluationCandidate {
  vendor: VoiceVendor;
  platforms: readonly VoicePlatform[];
  name: string;
  identifiers?: readonly string[];
  note?: string;
}

const APPLE: readonly VoicePlatform[] = ['macos'];
const WINDOWS: readonly VoicePlatform[] = ['windows'];

/**
 * Apple identifier for an old-style macOS voice. Verified 2026-11-25 on
 * macOS 14.2.1 with NSSpeechSynthesizer.availableVoices and
 * attributesForVoice (identifier → VoiceName); see the report. Safari exposes
 * these as voiceURI. Chrome uses the voice name instead.
 */
const appleId = (suffix: string) => `com.apple.speech.synthesis.voice.${suffix}`;

/**
 * VOICE BLOCKLIST (Eloquence): the locales each macOS Eloquence voice is
 * installed in. Verified 2026-11-25 on macOS 14.2.1 with NSSpeechSynthesizer:
 * Eddy, Flo, Grandma, Grandpa, Rocko, Sandy and Shelley have all ten; Reed
 * has all but fr-FR.
 */
const ELOQUENCE_LOCALES = ['de-DE', 'en-GB', 'en-US', 'es-ES', 'es-MX', 'fi-FI', 'fr-CA', 'fr-FR', 'it-IT', 'pt-BR'];

/**
 * Apple identifiers of an Eloquence voice, one per locale
 * (com.apple.eloquence.<locale>.<Name>). The OS names them per locale, e.g.
 * "Eddy (German (Germany))"; normalizeVoiceName() removes a suffix naming the
 * voice's own locale, so name matching uses the bare name.
 */
const eloquenceIds = (name: string, locales = ELOQUENCE_LOCALES) =>
  locales.map(locale => `com.apple.eloquence.${locale}.${name}`);

/**
 * macOS novelty, musical and distorted voices.
 *
 * The renamed voices keep their old identifiers. On macOS 14.2.1:
 * Wobble = …voice.Deranged, Jester = …voice.Hysterical,
 * Superstar = …voice.Princess, Organ = …voice.Organ. The old names are kept
 * as aliases for older systems and browsers. "Pipe Organ" is a historical name
 * from the prompt; it isn't shown on this system.
 *
 * The reasons are my categorization; review them if they matter.
 */
const MACOS: readonly VoiceBlocklistEntry[] = [
  { vendor: 'apple', platforms: APPLE, name: 'Albert', identifiers: [appleId('Albert')], reason: 'novelty' },
  { vendor: 'apple', platforms: APPLE, name: 'Bad News', identifiers: [appleId('BadNews')], reason: 'musical' },
  { vendor: 'apple', platforms: APPLE, name: 'Bahh', identifiers: [appleId('Bahh')], reason: 'novelty' },
  { vendor: 'apple', platforms: APPLE, name: 'Bells', identifiers: [appleId('Bells')], reason: 'musical' },
  { vendor: 'apple', platforms: APPLE, name: 'Boing', identifiers: [appleId('Boing')], reason: 'novelty' },
  { vendor: 'apple', platforms: APPLE, name: 'Bubbles', identifiers: [appleId('Bubbles')], reason: 'distorted' },
  { vendor: 'apple', platforms: APPLE, name: 'Cellos', identifiers: [appleId('Cellos')], reason: 'musical' },
  { vendor: 'apple', platforms: APPLE, name: 'Good News', identifiers: [appleId('GoodNews')], reason: 'musical' },
  { vendor: 'apple', platforms: APPLE, name: 'Jester', aliases: ['Hysterical'],
    identifiers: [appleId('Hysterical')], reason: 'novelty' },
  { vendor: 'apple', platforms: APPLE, name: 'Organ', aliases: ['Pipe Organ'],
    identifiers: [appleId('Organ')], reason: 'musical' },
  { vendor: 'apple', platforms: APPLE, name: 'Superstar', aliases: ['Princess'],
    identifiers: [appleId('Princess')], reason: 'novelty' },
  { vendor: 'apple', platforms: APPLE, name: 'Trinoids', identifiers: [appleId('Trinoids')], reason: 'distorted' },
  { vendor: 'apple', platforms: APPLE, name: 'Whisper', identifiers: [appleId('Whisper')], reason: 'distorted' },
  { vendor: 'apple', platforms: APPLE, name: 'Wobble', aliases: ['Deranged'],
    identifiers: [appleId('Deranged')], reason: 'distorted' },
  { vendor: 'apple', platforms: APPLE, name: 'Zarvox', identifiers: [appleId('Zarvox')], reason: 'distorted' },

  // VOICE BLOCKLIST (user decision, 2026-11-25): poor quality for narration,
  // after listening on macOS. Fred, Junior, Kathy and Ralph were evaluation
  // candidates; they're old MacinTalk voices. Identifiers verified as above.
  { vendor: 'apple', platforms: APPLE, name: 'Fred', identifiers: [appleId('Fred')], reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Junior', identifiers: [appleId('Junior')], reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Kathy', identifiers: [appleId('Kathy')], reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Ralph', identifiers: [appleId('Ralph')], reason: 'legacy-low-quality' },

  // VOICE BLOCKLIST (user decision, 2026-11-25): Eloquence voices, poor
  // quality for narration. Each is installed in ten locales (eloquenceIds).
  // Rocko added later the same day (user decision). Reed is an evaluation
  // candidate.
  { vendor: 'apple', platforms: APPLE, name: 'Eddy', identifiers: eloquenceIds('Eddy'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Flo', identifiers: eloquenceIds('Flo'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Grandma', identifiers: eloquenceIds('Grandma'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Grandpa', identifiers: eloquenceIds('Grandpa'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Rocko', identifiers: eloquenceIds('Rocko'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Sandy', identifiers: eloquenceIds('Sandy'), reason: 'legacy-low-quality' },
  { vendor: 'apple', platforms: APPLE, name: 'Shelley', identifiers: eloquenceIds('Shelley'), reason: 'legacy-low-quality' },
];

/**
 * Windows legacy and development voices. Chrome and Edge on Windows don't
 * expose a vendor identifier (voiceURI is the display name, e.g.
 * "Microsoft David - English (United States)"), so none are listed. Matching
 * is by name: the "Microsoft" prefix identifies the vendor, and
 * "Sample TTS Voice" needs Windows as supporting evidence.
 */
const WINDOWS_ENTRIES: readonly VoiceBlocklistEntry[] = [
  { vendor: 'microsoft', platforms: WINDOWS, name: 'Microsoft Sam', reason: 'legacy-low-quality' },
  { vendor: 'microsoft', platforms: WINDOWS, name: 'Microsoft Mike', reason: 'legacy-low-quality' },
  { vendor: 'microsoft', platforms: WINDOWS, name: 'Microsoft Mary', reason: 'legacy-low-quality' },
  { vendor: 'microsoft', platforms: WINDOWS, name: 'Sample TTS Voice', reason: 'development-test',
    note: 'Sample voice shipped with the Microsoft Speech SDK' },
];

/**
 * Linux: deliberately empty. Voice inventories depend on the installed engines
 * (eSpeak, eSpeak NG, Festival, Flite, MBROLA, Pico TTS, Piper), usually
 * through Speech Dispatcher, and on the distribution and browser. Never block
 * an engine as a whole: it may be the user's only local voice. eSpeak NG
 * "variants" (e.g. whisper or croak effects) may be distinguishable by name or
 * voiceURI, but that hasn't been verified in a browser yet; add entries only
 * after observing them.
 */
const LINUX: readonly VoiceBlocklistEntry[] = [];

/** Platforms with no verified entries yet. Don't add speculative ones. */
const ANDROID: readonly VoiceBlocklistEntry[] = [];
const IOS: readonly VoiceBlocklistEntry[] = [];
const IPADOS: readonly VoiceBlocklistEntry[] = [];
const CHROMEOS: readonly VoiceBlocklistEntry[] = [];

/**
 * Blocklists by platform. The platform key is for organization and review.
 * Matching uses every entry, with each entry's own `platforms` as evidence, so
 * a vendor identifier found on another platform (e.g. an Apple identifier in a
 * browser on iOS) still matches.
 */
export const VOICE_BLOCKLISTS: Readonly<Record<VoicePlatform, readonly VoiceBlocklistEntry[]>> = {
  macos: MACOS,
  windows: WINDOWS_ENTRIES,
  linux: LINUX,
  android: ANDROID,
  ios: IOS,
  ipados: IPADOS,
  chromeos: CHROMEOS,
};

/**
 * Voices to evaluate for quality before deciding whether to block them. Not
 * blocked, and not used by matching. Listed here so the decision isn't lost.
 */
export const VOICE_EVALUATION_CANDIDATES: readonly VoiceEvaluationCandidate[] = [
  { vendor: 'apple', platforms: APPLE, name: 'Bruce', identifiers: [appleId('Bruce')],
    note: 'Not listed by NSSpeechSynthesizer on macOS 14.2.1, although its asset is present' },
  // VOICE BLOCKLIST (user decision, 2026-11-25): Fred, Junior, Kathy and Ralph
  // moved to the blocklist. Reed (Eloquence) added here; it has no fr-FR voice.
  { vendor: 'apple', platforms: APPLE, name: 'Reed',
    identifiers: eloquenceIds('Reed', ELOQUENCE_LOCALES.filter(l => l !== 'fr-FR')) },
  { vendor: 'microsoft', platforms: WINDOWS, name: 'Microsoft Anna' },
];
