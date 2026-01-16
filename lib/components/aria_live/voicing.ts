import { Highlight } from '@fizz/parasummary';
import { ParaState } from '../../state';
import { Logger, getLogger } from '@fizz/logger';

export class Voicing {
  protected _voice: SpeechSynthesis | null = null;
  protected _lang: string = 'en-US';
  protected _rate: number = 1.0;
  protected _volume: number = 1.0;
  protected _pitch: number = 1.0;
  protected _utterance: SpeechSynthesisUtterance | null = null;
  protected _highlightIndex: number | null = null;
  protected _speakingCount = 0;
  private log: Logger = getLogger("Voicing");

  constructor(protected _paraState: ParaState) {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      this.log.warn('Speech Synthesis unsupported');
    }
  }

  get highlightIndex(): number | null {
    return this._highlightIndex;
  }

  get isSpeaking(): boolean {
    return this._speakingCount > 0;
  }

  speak(msg: string, highlights: Highlight[], startFrom = 0) {
    if (this._voice) {
      this.shutUp();

      this._utterance = this.speakText(msg);
      this._speakingCount++;
      // Get the index of the highlight containing the word
      const getHighlightIndex = (wordIndex: number) =>
        highlights.findIndex(hl => wordIndex >= hl.start && wordIndex < hl.end);

      this._utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const highlightIndex = getHighlightIndex(event.charIndex);
        if (highlightIndex === -1) {
          this._highlightIndex = null;
          return;
        }
        this._highlightIndex = highlightIndex;
        const highlight = highlights[this._highlightIndex];
        this._paraState.postNotice('landmarkStart', highlight);
      };

      this._utterance.onend = (event: SpeechSynthesisEvent) => {
        this._paraState.postNotice('landmarkEnd', null);
        this._speakingCount--;
      };
    }
  }

  speakText(text: string): SpeechSynthesisUtterance {
    // Keep the utterance around until it finishes playing so it doesn't
    // get GC'd
    this._utterance = new SpeechSynthesisUtterance(text);
    this._utterance.rate = this._rate;
    this._utterance.lang = this._lang;
    this._utterance.pitch = this._pitch;
    this._utterance.volume = this._volume;
    this._voice!.speak(this._utterance);
    return this._utterance;
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
      this._highlightIndex = null;
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
