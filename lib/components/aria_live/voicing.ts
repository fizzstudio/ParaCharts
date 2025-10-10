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
  private _highlightIndex = 0;

  constructor(private _store: ParaStore) {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      console.warn('Speech Synthesis unsupported');
    }
  }

  get highlightIndex(): number {
    return this._highlightIndex;
  }

  speak(msg: string, highlights: Highlight[], startFrom = 0) {
    if (this._voice) {
      this.shutUp();

      // const div = document.createElement('div');
      // div.innerHTML = msg;
      // console.log('DIV', div.children, startFrom);
      // div.replaceChildren(...Array.from(div.children).slice(startFrom));
      // msg = div.innerText;
      // console.log('MSG', msg);

      // Keep the utterance around until it finishes playing so it doesn't
      // get GC'd
      this._utterance = new SpeechSynthesisUtterance(msg);
      this._utterance.rate = this._rate;
      this._utterance.lang = this._lang;
      this._utterance.pitch = this._pitch;
      this._utterance.volume = this._volume;

      const getHighlightIndex = (wordIndex: number) =>
        highlights.findIndex(hl => wordIndex >= hl.start && wordIndex < hl.end);

      const lastSpans = new Set<HTMLElement>();
      const spans = this._store.paraChart.captionBox.getSpans();
      let prevNavcode = '';
      this._utterance.onboundary = (event: SpeechSynthesisEvent) => {
        this._highlightIndex = getHighlightIndex(event.charIndex);
        if (this._highlightIndex === -1) return;
        const highlight = highlights[this._highlightIndex];
        if (highlight.navcode) {
          if (highlight.navcode.startsWith('series')) {
            const segments = highlight.navcode.split(/-/);
            this._store.soloSeries = segments.slice(1).join('\t');
          } else {
            this._store.clearHighlight();
            this._store.highlight(highlight.navcode);
            if (prevNavcode) {
              this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
            }
            this._store.paraChart.paraView.documentView!.chartInfo.didAddHighlight(highlight.navcode);
          }
          prevNavcode = highlight.navcode;
        } else {
          this._store.clearHighlight();
          this._store.soloSeries = '';
          if (prevNavcode) {
            this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
            prevNavcode = '';
          }
        }
        for (const span of spans) {
          if (span.dataset.phrasecode === `${highlight.phrasecode}`) {
            span.classList.add('highlight');
            lastSpans.add(span);
          } else {
            span.classList.remove('highlight');
            lastSpans.delete(span);
          }
        }
        console.log('highlight point ', highlight.phrasecode, ' at ', event.charIndex);
      };
      this._utterance.onend = (event: SpeechSynthesisEvent) => {
        for (const span of lastSpans) {
          span.classList.remove('highlight');
        }
        this._store.clearHighlight();
        this._store.soloSeries = '';
        if (prevNavcode) {
          this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
          prevNavcode = '';
        }
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
