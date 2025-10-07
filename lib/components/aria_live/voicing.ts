import { Highlight } from '@fizz/parasummary';
import { ParaStore } from '../../store';

export class Voicing {
  private _voice: SpeechSynthesis | null = null;
  private _lang: string = 'en-US';
  // private _lang: string = 'en-AU';
  private _rate: number = 1.0;
  private _volume: number = 1.0;
  private _pitch: number = 1.0;
  private _utterance: SpeechSynthesisUtterance | null = null;

  constructor(private _store: ParaStore) {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      console.warn('Speech Synthesis unsupported');
    }
  }

  speak(msg: string, highlights: Highlight[]) {
    if (this._voice) {
      this.shutUp();

      // Keep the utterance around until it finishes playing so it doesn't
      // get GC'd
      this._utterance = new SpeechSynthesisUtterance(msg);
      this._utterance.rate = this._rate;
      this._utterance.lang = this._lang;
      this._utterance.pitch = this._pitch;
      this._utterance.volume = this._volume;

      const lastSpans = new Set<HTMLElement>();
      this._utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const wordIndex = event.charIndex;
        for (const highlight of highlights) {
          if (wordIndex >= highlight.start && wordIndex < highlight.end) {
            this._store.highlight(highlight.id);
            const spans = this._store.paraChart.captionBox.getSpans();
            for (const span of spans) {
              if (span.dataset.navcode === `${highlight.id}`) {
                span.classList.add('highlight');
                lastSpans.add(span);
              } else {
                span.classList.remove('highlight');
                lastSpans.delete(span);
              }
            }
            console.log('highlight point ', highlight.id, ' at ', wordIndex);
          }
        }
      };
      this._utterance.onend = (event: SpeechSynthesisEvent) => {
        for (const span of lastSpans) {
          span.classList.remove('highlight');
        }
        this._store.clearHighlight();
      };
      this._voice.speak(this._utterance);
    }
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
    console.log('Shut Up!');
    if (this._voice && this._voice.speaking) {
      this._voice.cancel();
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
