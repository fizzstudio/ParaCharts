// VOICE BLOCKLIST: unit tests for voice eligibility and filtered voice
// resolution. Every inventory here is synthetic: nothing depends on the voices
// installed on the machine running the tests.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VOICE_BLOCKLISTS, VOICE_EVALUATION_CANDIDATES, type VoicePlatform
} from '../../../lib/components/aria_live/voice_blocklist';
import {
  VoiceInventory, checkVoiceEligibility, eligibleVoices, normalizeVoiceName, inferVoiceVendor,
  detectVoicePlatform, voiceLocales, defaultLocale, selectedLocale, defaultVoiceForLocale,
  resolveVoice, voicesForLocale, voiceDiagnostics, logVoiceInventory, voicePrefs,
  languageName,
} from '../../../lib/components/aria_live/voices';

interface VoiceSpec {
  name: string;
  voiceURI?: string;
  lang?: string;
  localService?: boolean;
  default?: boolean;
}

/** A synthetic SpeechSynthesisVoice. Chrome-style by default: voiceURI = name. */
function voice(spec: VoiceSpec): SpeechSynthesisVoice {
  return {
    name: spec.name,
    voiceURI: spec.voiceURI ?? spec.name,
    lang: spec.lang ?? 'en-US',
    localService: spec.localService ?? true,
    default: spec.default ?? false,
  } as SpeechSynthesisVoice;
}

const isEligible = (spec: VoiceSpec, platform: VoicePlatform | 'unknown') =>
  checkVoiceEligibility(voice(spec), platform).eligible;

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Resolution functions read the platform and browser languages from navigator. */
function stubNavigator(platform = 'MacIntel', userAgent = MAC_UA, languages = ['en-US']) {
  vi.stubGlobal('navigator', { platform, userAgent, languages, language: languages[0], maxTouchPoints: 0 });
}

describe('macOS blocklist', () => {
  const entries = VOICE_BLOCKLISTS.macos;

  it('has every voice from the initial list', () => {
    const names = entries.flatMap(e => [e.name, ...(e.aliases ?? [])]);
    for (const name of ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged',
      'Good News', 'Hysterical', 'Jester', 'Organ', 'Pipe Organ', 'Princess', 'Superstar', 'Trinoids',
      'Whisper', 'Wobble', 'Zarvox']) {
      expect(names).toContain(name);
    }
  });

  for (const entry of VOICE_BLOCKLISTS.macos) {
    it(`blocks ${entry.name} by name on macOS (Chrome style)`, () => {
      expect(isEligible({ name: entry.name }, 'macos')).toBe(false);
    });
    for (const id of entry.identifiers ?? []) {
      it(`blocks ${entry.name} by identifier ${id} on any platform (Safari style)`, () => {
        const result = checkVoiceEligibility(voice({ name: entry.name, voiceURI: id }), 'unknown');
        expect(result.eligible).toBe(false);
        expect(result.matchedBy).toBe('identifier');
      });
    }
  }
});

// VOICE BLOCKLIST (user decision, 2026-11-25): MacinTalk and Eloquence voices
describe('macOS quality blocklist (user decision)', () => {
  it('has the added voices, and Reed only as a candidate', () => {
    const names = VOICE_BLOCKLISTS.macos.map(e => e.name);
    for (const name of ['Eddy', 'Flo', 'Fred', 'Grandma', 'Grandpa', 'Junior', 'Kathy', 'Ralph', 'Rocko', 'Sandy', 'Shelley']) {
      expect(names).toContain(name);
    }
    expect(names).not.toContain('Reed');
    expect(VOICE_EVALUATION_CANDIDATES.map(c => c.name)).toContain('Reed');
  });

  it('blocks Eloquence voices in every locale, by their per-locale OS names', () => {
    expect(isEligible({ name: 'Eddy (German (Germany))', lang: 'de-DE' }, 'macos')).toBe(false);
    expect(isEligible({ name: 'Flo (English (UK))', lang: 'en-GB' }, 'macos')).toBe(false);
    expect(isEligible({ name: 'Grandma (English (United States))' }, 'macos')).toBe(false);
    expect(isEligible({ name: 'Shelley (Portuguese (Brazil))', lang: 'pt-BR' }, 'macos')).toBe(false);
  });

  it('blocks Eloquence voices by per-locale identifier', () => {
    const result = checkVoiceEligibility(
      voice({ name: 'Sandy (French (Canada))', voiceURI: 'com.apple.eloquence.fr-CA.Sandy', lang: 'fr-CA' }), 'unknown');
    expect(result.matchedBy).toBe('identifier');
    expect(result.entry?.name).toBe('Sandy');
  });

  it('keeps Reed (an evaluation candidate)', () => {
    expect(isEligible({ name: 'Reed (English (US))' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Reed', voiceURI: 'com.apple.eloquence.en-US.Reed' }, 'unknown')).toBe(true);
  });

  it('blocks Rocko', () => {
    expect(isEligible({ name: 'Rocko (English (US))' }, 'macos')).toBe(false);
  });
});

describe('Windows blocklist', () => {
  for (const name of ['Microsoft Sam', 'Microsoft Mike', 'Microsoft Mary']) {
    it(`blocks ${name}, with or without the Windows locale suffix`, () => {
      expect(isEligible({ name }, 'windows')).toBe(false);
      expect(isEligible({ name: `${name} - English (United States)` }, 'windows')).toBe(false);
    });
    it(`blocks ${name} without platform evidence, since the name identifies the vendor`, () => {
      expect(isEligible({ name }, 'unknown')).toBe(false);
    });
  }

  it('blocks Sample TTS Voice on Windows only', () => {
    expect(isEligible({ name: 'Sample TTS Voice' }, 'windows')).toBe(false);
    expect(isEligible({ name: 'Sample TTS Voice' }, 'linux')).toBe(true);
  });

  it('keeps current Microsoft voices, including Natural voices', () => {
    for (const name of ['Microsoft David', 'Microsoft Zira', 'Microsoft Mark', 'Microsoft Hazel',
      'Microsoft Susan', 'Microsoft George', 'Microsoft Aria Online (Natural)']) {
      expect(isEligible({ name: `${name} - English (United States)` }, 'windows')).toBe(true);
    }
  });
});

describe('historical aliases', () => {
  it.each([
    ['Deranged', 'Wobble'], ['Hysterical', 'Jester'], ['Princess', 'Superstar'], ['Pipe Organ', 'Organ'],
  ])('%s matches the %s entry', (alias, current) => {
    const result = checkVoiceEligibility(voice({ name: alias }), 'macos');
    expect(result.eligible).toBe(false);
    expect(result.entry?.name).toBe(current);
    expect(result.matchedBy).toBe('alias');
  });

  it('a renamed voice is blocked by its old identifier (Wobble = …voice.Deranged)', () => {
    const result = checkVoiceEligibility(
      voice({ name: 'Wobble', voiceURI: 'com.apple.speech.synthesis.voice.Deranged' }), 'unknown');
    expect(result.entry?.name).toBe('Wobble');
    expect(result.matchedBy).toBe('identifier');
  });
});

describe('normalization', () => {
  it('ignores case and insignificant whitespace', () => {
    expect(isEligible({ name: '  bad   NEWS ' }, 'macos')).toBe(false);
    expect(isEligible({ name: 'ZARVOX' }, 'macos')).toBe(false);
  });

  it('ignores case in identifiers', () => {
    expect(isEligible({ name: 'x', voiceURI: 'COM.APPLE.SPEECH.SYNTHESIS.VOICE.BADNEWS' }, 'unknown')).toBe(false);
  });

  it('removes appended locale suffixes naming the voice\'s own locale', () => {
    expect(normalizeVoiceName(voice({ name: 'Bad News (English (United States))' }))).toBe('bad news');
    expect(normalizeVoiceName(voice({ name: 'Bad News (English (US))' }))).toBe('bad news');
    expect(normalizeVoiceName(voice({ name: 'Microsoft Mary - English (United States)' }))).toBe('microsoft mary');
    expect(isEligible({ name: 'Bad News (English (United States))' }, 'macos')).toBe(false);
  });

  it('keeps a suffix naming a different locale', () => {
    expect(normalizeVoiceName(voice({ name: 'Bells (French (France))', lang: 'en-US' })))
      .toBe('bells (french (france))');
  });
});

describe('vendor identification', () => {
  it('reads the vendor from restricted identifier patterns', () => {
    expect(inferVoiceVendor(voice({ name: 'Zarvox', voiceURI: 'com.apple.speech.synthesis.voice.Zarvox' }))).toBe('apple');
    expect(inferVoiceVendor(voice({ name: 'Zarvox', voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.Zarvox' })))
      .toBe('apple');
    expect(inferVoiceVendor(voice({ name: 'Microsoft Sam' }))).toBe('microsoft');
    expect(inferVoiceVendor(voice({ name: 'Google US English', localService: false }))).toBe('google');
    expect(inferVoiceVendor(voice({ name: 'Bad News' }))).toBe('unknown');
    expect(inferVoiceVendor(voice({ name: 'x', voiceURI: 'org.example.com.apple.voice' }))).toBe('unknown');
  });

  it('blocks an Apple voice by name when its URN names Apple, without platform evidence', () => {
    expect(isEligible({ name: 'Zarvox', voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.Zarvox' },
      'unknown')).toBe(false);
  });

  it('matches identifiers exactly, never as substrings', () => {
    expect(isEligible({ name: 'Albert (Premium)', voiceURI: 'com.apple.speech.synthesis.voice.Albert.premium' },
      'unknown')).toBe(true);
  });
});

describe('similarly named voices from unrelated vendors', () => {
  it('keeps a same-named voice whose identifiers name another vendor', () => {
    expect(isEligible({ name: 'Albert', voiceURI: 'Microsoft Albert - English (United States)' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Microsoft Whisper' }, 'macos')).toBe(true);
  });

  it('keeps same-named voices on platforms where the vendor isn\'t the system', () => {
    for (const platform of ['linux', 'windows', 'android', 'chromeos', 'unknown'] as const) {
      expect(isEligible({ name: 'Whisper' }, platform)).toBe(true);
      expect(isEligible({ name: 'Albert' }, platform)).toBe(true);
    }
  });

  it('keeps a same-named remote voice without vendor evidence', () => {
    expect(isEligible({ name: 'Bells', localService: false }, 'macos')).toBe(true);
  });

  it('doesn\'t match on substrings of names', () => {
    expect(isEligible({ name: 'Bad Newsreader' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Albertine' }, 'macos')).toBe(true);
  });
});

describe('Enhanced and Premium variants', () => {
  it('keeps them, by name and by Apple identifier', () => {
    expect(isEligible({ name: 'Ava (Premium)' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Ava (Enhanced)' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Albert (Enhanced)' }, 'macos')).toBe(true);
    expect(isEligible({ name: 'Ava', voiceURI: 'com.apple.voice.premium.en-US.Ava' }, 'macos')).toBe(true);
    expect(normalizeVoiceName(voice({ name: 'Ava (Premium)' }))).toBe('ava (premium)');
  });
});

describe('unknown and ordinary voices', () => {
  it('keeps unknown voices on every platform', () => {
    for (const platform of ['macos', 'windows', 'linux', 'android', 'ios', 'ipados', 'chromeos', 'unknown'] as const) {
      expect(isEligible({ name: 'Zyxwv Voice' }, platform)).toBe(true);
    }
  });

  it('keeps evaluation candidates (not blocked yet)', () => {
    for (const candidate of VOICE_EVALUATION_CANDIDATES) {
      const platform = candidate.platforms[0];
      expect(isEligible({ name: candidate.name }, platform)).toBe(true);
      for (const id of candidate.identifiers ?? []) {
        expect(isEligible({ name: candidate.name, voiceURI: id }, platform)).toBe(true);
      }
    }
  });

  it('keeps Linux voices from several speech engines', () => {
    const linuxVoices = [
      voice({ name: 'English (America)', voiceURI: 'urn:moz-tts:speechd:English%20(America)?en-US' }),
      voice({ name: 'eSpeak NG English (America)' }),
      voice({ name: 'Festival kal_diphone' }),
      voice({ name: 'Flite slt' }),
      voice({ name: 'MBROLA us1' }),
      voice({ name: 'Pico en-US' }),
      voice({ name: 'Piper Amy (medium)' }),
      voice({ name: 'Whisper' }), // e.g. an eSpeak variant: not an Apple voice on Linux
    ];
    expect(eligibleVoices(linuxVoices, 'linux')).toHaveLength(linuxVoices.length);
  });
});

describe('platform detection', () => {
  it.each([
    [{ platform: 'MacIntel', userAgent: MAC_UA, maxTouchPoints: 0 }, 'macos'],
    [{ platform: 'MacIntel', userAgent: MAC_UA, maxTouchPoints: 5 }, 'ipados'],
    [{ platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 'windows'],
    [{ platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' }, 'linux'],
    [{ platform: 'Linux armv8l', userAgent: 'Mozilla/5.0 (Linux; Android 14)' }, 'android'],
    [{ platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, 'ios'],
    [{ platform: '', userAgent: '', userAgentData: { platform: 'macOS' } }, 'macos'],
    [{ platform: '', userAgent: '', userAgentData: { platform: 'Chrome OS' } }, 'chromeos'],
    [{ platform: '', userAgent: '' }, 'unknown'],
  ])('%o → %s', (nav, expected) => {
    expect(detectVoicePlatform(nav as unknown as Navigator)).toBe(expected);
  });
});

describe('filtered resolution', () => {
  beforeEach(() => {
    stubNavigator();
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('never chooses a blocklisted system default', () => {
    const voices = [voice({ name: 'Bad News', default: true }), voice({ name: 'Samantha' })];
    const r = resolveVoice('en-US', '', voices);
    expect(r.voice?.name).toBe('Samantha');
    expect(r.status).toBe('default');
  });

  it('never chooses a blocklisted locale default', () => {
    const voices = [voice({ name: 'Albert', default: true }), voice({ name: 'Samantha' })];
    expect(defaultVoiceForLocale('en-US', voices)?.name).toBe('Samantha');
  });

  it('treats a blocklisted saved voice as unavailable, falls back locally, and keeps the preference', () => {
    voicePrefs.set('en-US', 'Zarvox');
    const voices = [
      voice({ name: 'Zarvox' }),
      voice({ name: 'Samantha' }),
      voice({ name: 'Google US English', localService: false }),
    ];
    const r = resolveVoice('en-US', undefined, voices);
    expect(r.voice?.name).toBe('Samantha');
    expect(r.voice?.localService).toBe(true);
    expect(r.status).toBe('unavailable');
    expect(voicePrefs.get('en-US')).toBe('Zarvox');
  });

  it('a blocklisted saved voice doesn\'t choose the locale', () => {
    voicePrefs.set('en-US', 'Bells');
    const voices = [voice({ name: 'Bells', lang: 'en-GB' }), voice({ name: 'Samantha' }), voice({ name: 'Daniel', lang: 'en-GB' })];
    expect(selectedLocale('en-US', voices)).toBe('en-US');
  });

  it('hides a locale whose voices are all blocklisted', () => {
    const voices = [voice({ name: 'Bad News' }), voice({ name: 'Bells' }), voice({ name: 'Daniel', lang: 'en-GB' })];
    expect(voiceLocales('en-US', voices)).toEqual(['en-GB']);
    expect(defaultLocale('en-US', voices)).toBe('en-GB');
    expect(resolveVoice('en-US', '', voices).voice?.name).toBe('Daniel');
  });

  it('gives no-local, not a remote voice, when no eligible local voice remains', () => {
    const voices = [voice({ name: 'Bad News' }), voice({ name: 'Google US English', localService: false })];
    const r = resolveVoice('en-US', '', voices);
    expect(r).toEqual({ voice: null, status: 'no-local', canSpeak: false });
  });

  it('gives no-local, not unknown, when every voice is blocklisted', () => {
    expect(resolveVoice('en-US', '', [voice({ name: 'Zarvox' })]).status).toBe('no-local');
    expect(resolveVoice('en-US', '', []).status).toBe('unknown');
  });

  it('applies the filter on every resolution path, given the raw inventory', () => {
    const blocked = voice({ name: 'Whisper', default: true });
    const raw = [blocked, voice({ name: 'Samantha' }), voice({ name: 'Bubbles', lang: 'en-AU' })];
    expect(voiceLocales('en-US', raw)).not.toContain('en-AU');
    const { local, remote } = voicesForLocale('en-US', raw);
    expect([...local, ...remote]).not.toContain(blocked);
    expect(defaultVoiceForLocale('en-US', raw)).not.toBe(blocked);
    expect(resolveVoice('en-US', '', raw).voice).not.toBe(blocked);
    expect(resolveVoice('en-US', 'Whisper', raw).voice).not.toBe(blocked);
    expect(selectedLocale('en-US', raw)).toBe('en-US');
  });

  it('gives the same results for the raw and the eligible inventory', () => {
    const raw = [voice({ name: 'Bad News', default: true }), voice({ name: 'Samantha' }), voice({ name: 'Daniel', lang: 'en-GB' })];
    const eligible = eligibleVoices(raw, 'macos');
    expect(voiceLocales('en-US', eligible)).toEqual(voiceLocales('en-US', raw));
    expect(resolveVoice('en-US', '', eligible)).toEqual(resolveVoice('en-US', '', raw));
  });
});

describe('VoiceInventory', () => {
  let reported: SpeechSynthesisVoice[];
  let fireVoicesChanged: () => void;

  beforeEach(() => {
    stubNavigator();
    reported = [];
    const listeners: (() => void)[] = [];
    fireVoicesChanged = () => listeners.forEach(l => l());
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => reported,
        addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
      },
    });
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  });

  it('filters asynchronous inventory updates and keeps the raw inventory', () => {
    const inventory = new VoiceInventory();
    const updates: (readonly SpeechSynthesisVoice[])[] = [];
    inventory.subscribe(voices => updates.push(voices));
    expect(inventory.isLoaded).toBe(false);

    reported = [voice({ name: 'Samantha' }), voice({ name: 'Bad News' }), voice({ name: 'Samantha' })];
    fireVoicesChanged();

    expect(inventory.isLoaded).toBe(true);
    expect(inventory.rawVoices.map(v => v.name)).toEqual(['Samantha', 'Bad News']);
    expect(inventory.voices.map(v => v.name)).toEqual(['Samantha']);
    expect(updates.at(-1)?.map(v => v.name)).toEqual(['Samantha']);

    reported = [...reported, voice({ name: 'Alex' }), voice({ name: 'Cellos' })];
    fireVoicesChanged();
    expect(inventory.voices.map(v => v.name)).toEqual(['Samantha', 'Alex']);
  });

  it('is loaded, with no eligible voices, when every voice is blocklisted', () => {
    reported = [voice({ name: 'Zarvox' })];
    const inventory = new VoiceInventory();
    expect(inventory.isLoaded).toBe(true);
    expect(inventory.voices).toEqual([]);
  });
});

describe('diagnostics', () => {
  it('reports every voice, including excluded ones, with the entry and reason', () => {
    const rows = voiceDiagnostics([
      voice({ name: 'Samantha' }),
      voice({ name: 'Wobble', voiceURI: 'com.apple.speech.synthesis.voice.Deranged' }),
    ], 'macos');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'Samantha', eligible: true, blocklistEntry: '', reason: '' });
    expect(rows[1]).toMatchObject({
      name: 'Wobble', normalizedName: 'wobble', voiceURI: 'com.apple.speech.synthesis.voice.Deranged',
      lang: 'en-US', localService: true, default: false, eligible: false,
      blocklistEntry: 'Wobble', matchedBy: 'identifier', reason: 'distorted',
    });
  });

  it('logs the raw inventory as a table', () => {
    const table = vi.spyOn(console, 'table').mockImplementation(() => {});
    logVoiceInventory([voice({ name: 'Samantha' }), voice({ name: 'Bubbles' })]);
    const rows = table.mock.calls[0][0] as { name: string }[];
    expect(rows.map(r => r.name)).toEqual(['Samantha', 'Bubbles']);
    table.mockRestore();
  });
});

// VOICE SELECTION (subdivision names): locales with a Unicode subdivision
describe('languageName', () => {
  it('names plain locales as before', () => {
    expect(languageName('en-GB')).toBe('British English');
    expect(languageName('en_US')).toBe('American English');
  });

  it('adds a known subdivision (the macOS Scottish voice)', () => {
    expect(languageName('en-GB-u-sd-gbsct')).toBe('British English (Scotland)');
    expect(languageName('en_GB_u_sd_gbsct')).toBe('British English (Scotland)');
    expect(languageName('en-GB-u-sd-gbwls')).toBe('British English (Wales)');
  });

  it('shows an unknown subdivision code as itself', () => {
    expect(languageName('es-ES-u-sd-esct')).toBe('European Spanish (sd-esct)');
  });

  it('ignores other Unicode extensions', () => {
    expect(languageName('en-US-u-ca-gregory')).toBe('American English');
  });

  it('falls back to the code for an invalid tag', () => {
    expect(languageName('not a tag')).toBe('not a tag');
  });

  it('lists the Scottish locale apart from en-GB, sorted by its name', () => {
    stubNavigator();
    const voices = [
      voice({ name: 'Daniel', lang: 'en-GB' }),
      voice({ name: 'Fiona', lang: 'en-GB-u-sd-gbsct' }),
      voice({ name: 'Samantha', lang: 'en-US' }),
    ];
    expect(voiceLocales('en-US', voices).map(l => languageName(l)))
      .toEqual(['American English', 'British English', 'British English (Scotland)']);
    vi.unstubAllGlobals();
  });
});
