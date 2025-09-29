import { Highlight } from '@fizz/parasummary';

export class Voicing {
  private _voice: SpeechSynthesis | null = null;
  private _lang: string = 'en-US';
  // private _lang: string = 'en-AU';
  private _rate: number = 1.0;
  private _volume: number = 1.0;
  private _pitch: number = 1.0;
  
  constructor() {
    this._voice = window.speechSynthesis;
    if (!this._voice) {
      console.warn('Speech Synthesis unsupported');
    }
  }

  speak(msg: string, highlights: Highlight[]) {
    if (this._voice) {
      this.shutUp();
  
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = this._rate;
      utterance.lang = this._lang;
      utterance.pitch = this._pitch;
      utterance.volume = this._volume;

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const wordIndex = event.charIndex;
        // Highlighting here
      }
  
      this._voice.speak(utterance);
    }
  }

  shutUp() {
    console.log('Shut Up!')
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
