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
  private _highlightIndex: number | null = null;
  private _manualOverride = false;

  constructor(private _store: ParaStore) {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      console.warn('Speech Synthesis unsupported');
    }
  }

  get highlightIndex(): number | null {
    return this._highlightIndex;
  }

  get manualOverride(): boolean {
    return this._manualOverride;
  }

  set manualOverride(manualOverride: boolean) {
    this._manualOverride = manualOverride;
  }

  speak(msg: string, highlights: Highlight[], startFrom = 0) {
    if (this._voice) {
      this.shutUp();

      this._utterance = this.speakText(msg);

      const getHighlightIndex = (wordIndex: number) =>
        highlights.findIndex(hl => wordIndex >= hl.start && wordIndex < hl.end);

      const lastSpans = new Set<HTMLElement>();
      const spans = this._store.paraChart.captionBox.getSpans();
      let prevNavcode = '';
      this._utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const highlightIndex = getHighlightIndex(event.charIndex);
        if (highlightIndex === -1) {
          this._highlightIndex = null;
          return;
        }
        this._highlightIndex = highlightIndex;
        const highlight = highlights[this._highlightIndex];
        prevNavcode = this.doHighlight(highlight, prevNavcode);
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
        // So that on the initial transition from auto-narration to manual
        // span navigation, we don't remove any highlights added in manual mode
        if (!this._manualOverride) {
          this._store.clearHighlight();
          this._store.clearAllSeriesLowlights();
        }
        this._highlightIndex = null;
        if (prevNavcode) {
          this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
          prevNavcode = '';
        }
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

  doHighlight(highlight: Highlight, prevNavcode: string) {
    if (highlight.navcode) {
      if (highlight.navcode.startsWith('series')) {
        const segments = highlight.navcode.split(/-/);
        this._store.lowlightOtherSeries(...segments.slice(1));
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
      this._store.clearAllSeriesLowlights();
      if (prevNavcode) {
        this._store.paraChart.paraView.documentView!.chartInfo.didRemoveHighlight(prevNavcode);
        prevNavcode = '';
      }
    }
    return prevNavcode;
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
