import { Highlight } from '@fizz/chartsignal-internal';
import { Logger, getLogger } from '@fizz/logger';
import { ParaState } from '../../state';
// VOICE SELECTION
import { resolveVoice, voiceInventory, type VoiceResolution } from './voices';

// WORD HIGHLIGHT: payload of the 'wordStart' notice. `offset` is relative to
// the phrase's own text (not the whole message), so it can be applied inside
// the matching caption span regardless of any text between spans.
export interface WordHighlight {
  phrasecode: string;
  offset: number;
  length: number;
}

// UTTERANCE GC FIX: strong references to every utterance from speak() until it
// ends. Chrome can garbage-collect a SpeechSynthesisUtterance that nothing
// references while it is still speaking; its event handlers then stop firing
// (no more 'boundary', so phrase and word highlights freeze) although the audio
// continues. Suspected cause of the intermittent "word highlight stops midway"
// problem; see _ignore/ai/claude/word-highlight-stops-midway-report.md.
// `_utterance` alone isn't enough: it holds only the latest utterance, and it
// belongs to a Voicing instance, which is replaced if the aria-live region
// reconnects (AriaLive.connectedCallback). This set is module-level, so it
// outlives both.
const liveUtterances = new Set<SpeechSynthesisUtterance>();
// Safety cap in case an engine never fires 'end'/'error' for some utterance
const MAX_LIVE_UTTERANCES = 50;

function retainUtterance(utterance: SpeechSynthesisUtterance) {
  liveUtterances.add(utterance);
  // addEventListener, not onend/onerror, so other code can still assign those
  const release = () => liveUtterances.delete(utterance);
  utterance.addEventListener('end', release);
  utterance.addEventListener('error', release);
  if (liveUtterances.size > MAX_LIVE_UTTERANCES) {
    // Sets iterate in insertion order, so this drops the oldest
    liveUtterances.delete(liveUtterances.values().next().value!);
  }
}

export class Voicing {
  protected _voice: SpeechSynthesis | null = null;
  protected _lang: string = 'en-US';
  protected _rate: number = 1.0;
  protected _volume: number = 1.0;
  protected _pitch: number = 1.0;
  protected _utterance: SpeechSynthesisUtterance | null = null;
  protected _highlightIndex: number | null = null;
  protected _speakingCount = 0;
  // VOICE SELECTION (preview start/stop): called once when the current preview
  // ends for any reason (finished, stopped, or replaced by other speech)
  protected _onPreviewEnd: (() => void) | null = null;
  private log: Logger = getLogger("Voicing");

  constructor(protected _paraState: ParaState) {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      this.log.warn('Speech Synthesis unsupported');
    }
    // VOICE SELECTION: start voice discovery now, so the (often asynchronous)
    // voice list is likely ready by the first utterance
    // (reading .voices registers the single page-wide listener; see voices.ts)
    void voiceInventory.voices;
  }

  get highlightIndex(): number | null {
    return this._highlightIndex;
  }

  get isSpeaking(): boolean {
    return this._speakingCount > 0;
  }

  speak(msg: string, highlights: Highlight[]): Promise<void> {
    if (this._voice) {
      this.shutUp();
      // WORD HIGHLIGHT: landmarkStart is now posted only when the phrase index
      // changes, so reset it; otherwise a new message starting on the same
      // index as the last one would never post its first landmarkStart
      this._highlightIndex = null;

      // VOICE SELECTION: speakText() refuses to speak when only an implicit
      // remote voice is available; don't count it as speaking or wait on an
      // 'end' event that will never fire
      if (!this.speakText(msg)) {
        return Promise.resolve();
      }
      this._speakingCount++;
      // Get the index of the highlight containing the word
      const getHighlightIndex = (wordIndex: number) =>
        highlights.findIndex(hl => wordIndex >= hl.start && wordIndex < hl.end);

      this._utterance!.onboundary = (event: SpeechSynthesisEvent) => {
        const highlightIndex = getHighlightIndex(event.charIndex);
        if (highlightIndex === -1) {
          this._highlightIndex = null;
          return;
        }
        const highlight = highlights[highlightIndex];
        // WORD HIGHLIGHT: boundaries now fire per word, so only post
        // landmarkStart when the phrase changes. Previously it was re-posted on
        // every boundary, re-running the phrase's ParaAPI action for each word.
        if (highlightIndex !== this._highlightIndex) {
          this._highlightIndex = highlightIndex;
          this._paraState.postNotice('landmarkStart', highlight);
        }
        // WORD HIGHLIGHT: post the word being spoken, relative to its phrase
        if (event.name === 'word') {
          this._paraState.postNotice('wordStart', {
            phrasecode: highlight.phrasecode,
            offset: event.charIndex - highlight.start,
            // Cap at the phrase end: msg holds the whole message, and a merged
            // token (e.g. "2005 to 2018") must not run into the next phrase
            length: this._wordLength(msg, event, highlight.end - event.charIndex),
          } satisfies WordHighlight);
        }
      };

      const prom = new Promise<void>((resolve, reject) => {
        this._utterance!.onend = (event: SpeechSynthesisEvent) => {
          // WORD HIGHLIGHT: clear the word mark when speech finishes
          this._paraState.postNotice('wordEnd', null);
          this._paraState.postNotice('landmarkEnd', null);
          this._speakingCount--;
          resolve();
        };
      });
      return prom;
    }
    return Promise.resolve();
  }

  // VOICE SELECTION: now returns whether speech was started
  speakText(text: string): boolean {
    // VOICE SELECTION (preview start/stop): any new utterance replaces a
    // running preview, so report the preview as ended. Needed because engines
    // don't reliably fire 'end' or 'error' on a cancelled utterance.
    this._endPreview();
    // Keep the utterance around until it finishes playing so it doesn't
    // get GC'd
    this._utterance = new SpeechSynthesisUtterance(text);
    this._utterance.rate = this._rate;
    this._utterance.lang = this._lang;
    this._utterance.pitch = this._pitch;
    this._utterance.volume = this._volume;
    // VOICE SELECTION: use the saved voice for this language, or a local
    // System default. Previously no voice was set, so the browser chose one,
    // possibly a remote (online) voice. Rate, pitch and volume are unchanged.
    const { voice, canSpeak } = this.voiceResolution;
    if (!canSpeak) {
      // No local voice and no explicit remote choice: don't fall back to a
      // remote voice silently (the Caption Settings dialog explains why)
      return false;
    }
    if (voice) {
      this._utterance.voice = voice;
    }
    // UTTERANCE GC FIX: keep it alive until it ends
    retainUtterance(this._utterance);
    this._voice!.speak(this._utterance);
    return true;
  }

  /** VOICE SELECTION: the voice the next utterance will use, and why. */
  get voiceResolution(): VoiceResolution {
    return resolveVoice(this._lang);
  }

  /**
   * VOICE SELECTION: speak a voice preview with the current voice and speech
   * settings. Cancels anything already speaking (including a previous
   * preview) instead of queueing. Posts no notices, so it doesn't affect
   * highlights or navigation; the next normal utterance cancels it in turn.
   *
   * VOICE SELECTION (preview start/stop): `onEnd` is called exactly once when this preview ends,
   * whether it finishes, is stopped (stopPreview), or is replaced by any other
   * speech. Returns false (and doesn't call onEnd) if nothing was spoken.
   */
  preview(text: string, onEnd?: () => void): boolean {
    if (!this._voice) return false;
    this.shutUp();
    if (!this.speakText(text)) return false;
    this._onPreviewEnd = onEnd ?? null;
    const utterance = this._utterance!;
    // 'error' covers engines that report cancellation as an 'interrupted' error.
    // The identity check ignores late events from an utterance already replaced.
    utterance.onend = utterance.onerror = () => {
      if (this._utterance === utterance) this._endPreview();
    };
    return true;
  }

  /** VOICE SELECTION (preview start/stop): stop a running preview, if any. */
  stopPreview() {
    if (!this._onPreviewEnd) return;
    this.shutUp();
    this._endPreview();
  }

  /** VOICE SELECTION (preview start/stop): true while a preview is speaking. */
  get isPreviewing(): boolean {
    return !!this._onPreviewEnd;
  }

  // Clear the callback before calling it, so it runs at most once
  protected _endPreview() {
    const onEnd = this._onPreviewEnd;
    this._onPreviewEnd = null;
    onEnd?.();
  }

  /**
   * WORD HIGHLIGHT: speak a single phrase, posting 'wordStart' for each word.
   * Used by manual phrase navigation (ParaCaptionBox.highlightSpan). Unlike
   * speak(), this posts no landmark notices (the caller does that) and doesn't
   * change _speakingCount, matching the speakText() call it replaces.
   */
  speakPhrase(text: string, highlight: Highlight) {
    // VOICE SELECTION: speakText() may refuse (see there)
    if (!this.speakText(text)) return;
    this._utterance!.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name !== 'word') return;
      this._paraState.postNotice('wordStart', {
        phrasecode: highlight.phrasecode,
        // text is the phrase itself, so charIndex is already phrase-relative
        offset: event.charIndex,
        // text is a single phrase, so its end is the phrase end
        length: this._wordLength(text, event, text.length - event.charIndex),
      } satisfies WordHighlight);
    };
    this._utterance!.onend = () => this._paraState.postNotice('wordEnd', null);
  }

  /**
   * WORD HIGHLIGHT: length, in characters of `text`, of the token a 'word'
   * boundary event refers to, capped at `maxLength` (the characters left in
   * the current phrase) so the mark never spills into the next phrase.
   *
   * A "token" is not always one word. Speech engines normalize text before
   * speaking it, and can treat several words as one unit. Example, observed in
   * Chrome on macOS for "over time from 2005 to 2018.":
   *
   *   word 10 4  "from"
   *   word 15 12 "2005 to 2018"   <- one event for the whole year range
   *   word 27 1  "."
   *
   * There is no event for "to" or "2018", so the range must be highlighted as
   * a single unit while it is spoken (which matches what the listener hears).
   * An earlier version clamped every token to the first run of non-space
   * characters, which marked only "2005" and then nothing until the next phrase.
   *
   * So `charLength` is trusted as the token length when it is plausible:
   * - Engines that report the real token length (Chrome, per the log above):
   *   use it.
   * - MDN describes charLength as the characters *left to be spoken*, and some
   *   engines may report it that way. That value equals the rest of the
   *   utterance (`text.length - charIndex`), so when charLength reaches the end
   *   of `text`, it is ignored. (For the last word of an utterance both readings
   *   give the same answer, so nothing is lost.)
   * - Engines that omit charLength or report 0 (Safari and Firefox are
   *   unreliable): fall back to the run of non-space characters at charIndex.
   *   A merged token like the range above can't be detected this way; only its
   *   first word is marked.
   */
  protected _wordLength(text: string, event: SpeechSynthesisEvent, maxLength: number): number {
    const runLength = text.slice(event.charIndex).match(/^\S+/)?.[0].length ?? 0;
    const remaining = text.length - event.charIndex;
    const isTokenLength = !!event.charLength && event.charLength < remaining;
    return Math.max(0, Math.min(isTokenLength ? event.charLength : runLength, maxLength));
  }

  pause() {
    this._voice?.pause();
  }

  resume() {
    this._voice?.resume();
  }

  togglePaused() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  get isPaused() {
    return this._voice?.paused;
  }

  shutUp() {
    if (this._voice && this._voice.speaking) {
      this._voice.cancel();
      // UTTERANCE GC FIX: cancel() drops every queued and speaking utterance,
      // and engines don't reliably fire 'end' for them, so release them all
      liveUtterances.clear();
      this._highlightIndex = null;
      // WORD HIGHLIGHT: some engines don't fire 'end' on cancel(), so clear
      // the word mark explicitly
      this._paraState.postNotice('wordEnd', null);
    }
  }

  get lang() {
    return this._lang;
  }

  set lang(lang: string) {
    this._lang = lang;
  }

  get rate() {
    return this._rate;
  }

  set rate(rate: number) {
    this._rate = rate;
  }

  get volume() {
    return this._volume;
  }

  set volume(volume: number) {
    this._volume = volume;
  }

  get pitch() {
    return this._pitch;
  }

  set pitch(pitch: number) {
    this._pitch = pitch;
  }
}
