// CAPTIONS DIALOG: new file. Caption typography and Tour Guide highlight
// options, opened from the Audio tab's narrative section.

import { SettingControlContainer } from '../setting_control_container';
import { defaultConfig } from '../../config/config_defaults';
// VOICE SELECTION
import { type ParaChart } from '../../parachart/parachart';
import { type Voicing } from '../../components/aria_live/voicing';
import {
  voiceInventory, voicePrefs, voiceLocales, selectedLocale, voicesForLocale,
  defaultVoiceForLocale, languageName, voiceDisplayName,
} from '../../components/aria_live/voices';

import * as ui from '@fizz/ui-components';

import { html, css, nothing } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

const CAPTIONS_VIEW = 'controlPanel.tabs.audio.captions.dialog';

type CaptionColorKey = 'phraseHighlightColor' | 'wordHighlightColor';

// VOICE SELECTION: development-only preview utterances that exercise text
// normalization. Not localized and never shown in production builds.
const DEV_PREVIEW_SAMPLES: [label: string, text: string][] = [
  ['Negative numbers', 'Net income was -3,250 in Q2, down from -1,200 in Q1, a change of -170.8 percent.'],
  ['Decimals and percentages', 'Growth was 3.75% this year, versus 0.5% last year and 12.25% in 2019.'],
  ['Currency', 'Revenue reached $12,500.75 in January, €8,300 in February, and £1.2M for the year.'],
  ['Large numbers', 'World population passed 8,045,311,447 in 2023; the budget is $1.4 trillion.'],
  ['Dates and ranges', 'Sales peaked on 2024-03-15, between Jan 5, 2023 and 02/28/2024, over 2005–2018.'],
  ['Scientific notation', 'The value is 6.022e23, with an error of 1.5 × 10^-4.'],
  ['Units', 'It travels at 120 km/h, weighs 1,450 kg, at 22 °C, in a room of 45 m².'],
  ['Acronyms and abbreviations', 'GDP in the US and EU rose; NASA and the WHO reported Q3 results at 10 a.m. EST, per Dr. Lee.'],
  ['Short datapoint', 'March, 14,250. 3 of 12.'],
  ['Long overview', 'This line chart compares the numbers of passenger car sales in different nations over time from 2005 to 2018. The 4 lines show the numbers of passenger car sales for China, U.S., Japan and Germany. All the lines trend upward overall, and China is consistently the highest, rising from 3.97 million in 2005 to 23.71 million in 2018, an increase of 497.2 percent.'],
];

/**
 * @public
 */
@customElement('para-captions-dialog')
export class CaptionsDialog extends SettingControlContainer {

  protected _dialogRef = createRef<ui.Dialog>();

  /**
   * Close button text.
   */
  @property() btnText = 'Okay';

  // VOICE SELECTION: set by the Audio tab, to reach the chart's Voicing
  @property({ attribute: false }) parachart?: ParaChart;

  // VOICE SELECTION: re-render when the voice inventory changes
  @state() protected _voiceInventoryVersion = 0;
  // VOICE SELECTION: index into DEV_PREVIEW_SAMPLES, or -1 for the standard
  // localized preview (development builds only)
  @state() protected _devSampleIndex = -1;
  // VOICE SELECTION (preview start/stop): true while the preview is speaking;
  // switches the button between Preview and Stop
  @state() protected _isPreviewing = false;
  protected _unsubscribeVoices?: () => void;

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
    label.color-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    /* VOICE SELECTION: ::first-letter doesn't apply to flex containers like
       these labels, so the label text sits in an inline-block span; this
       matches the capitalized "Label:" style of the generated controls */
    .label-text {
      display: inline-block;
    }
    .label-text::first-letter,
    button::first-letter {
      text-transform: capitalize;
    }
    /* VOICE SELECTION: line 1 is language + voice, line 2 is preview + dev
       test text */
    .voice-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.5rem 1rem;
    }
    .voice-row label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .voice-row select {
      max-width: 16rem;
    }
    .voice-status:empty {
      display: none;
    }
    .voice-status {
      margin: 0;
      font-size: 0.875em;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // Font and spacing controls are generated from the config JSON
    // (controlPanel/caption.json, ui.json); colors are rendered by hand below
    // because there is no color control type.
    this._paraState.settingControls.insert('ui.isTourGuideWordHighlightEnabled');
    this._paraState.settingControls.insert('controlPanel.caption.fontFamily');
    this._paraState.settingControls.insert('controlPanel.caption.fontSize');
    this._paraState.settingControls.insert('controlPanel.caption.letterSpacing');
    this._paraState.settingControls.insert('controlPanel.caption.wordSpacing');
    this._paraState.settingControls.insert('controlPanel.caption.lineHeight');
    // VOICE SELECTION: track the shared voice inventory (one browser listener
    // for the whole page; see voices.ts)
    this._unsubscribeVoices = voiceInventory.subscribe(() => this._voiceInventoryVersion++);
  }

  // VOICE SELECTION
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribeVoices?.();
    // VOICE SELECTION (preview start/stop): don't leave a preview speaking
    this._voicing?.stopPreview();
  }

  render() {
    const l10n = this._globalState.l10n;
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title=${l10n.localize('cpanel.tabs.audio.captions_dialog.title')}
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._renderColor('phraseHighlightColor', '--caption-phrase-highlight-color',
          l10n.localize('cpanel.tabs.audio.captions_dialog.phrase_highlight_color'))}
        ${this._renderColor('wordHighlightColor', '--caption-word-highlight-color',
          l10n.localize('cpanel.tabs.audio.captions_dialog.word_highlight_color'))}
        ${this._paraState.settingControls.getContent(CAPTIONS_VIEW)}
        ${this._renderVoice()}
        <button @click=${() => this._resetToDefaults()}>
          ${l10n.localize('cpanel.tabs.audio.captions_dialog.reset')}
        </button>
      </fizz-dialog>
    `;
  }

  // VOICE SELECTION -------------------------------------------------------

  protected get _voicing(): Voicing | undefined {
    // The aria-live region exists only once the chart view has rendered
    try {
      return this.parachart?.paraView?.ariaLiveRegion?.voicing;
    } catch {
      return undefined;
    }
  }

  protected get _speechLang(): string {
    return this._voicing?.lang ?? 'en-US';
  }

  protected _renderVoice() {
    const l10n = this._globalState.l10n;
    const key = (k: string) => l10n.localize(`cpanel.tabs.audio.captions_dialog.${k}`);
    const isSupported = voiceInventory.isSupported;
    const lang = this._speechLang;
    const voices = voiceInventory.voices;
    const savedURI = voicePrefs.get(lang);
    const savedVoice = voices.find(v => v.voiceURI === savedURI);
    // Don't treat a saved voice as missing until the inventory has loaded
    const isSavedMissing = !!savedURI && voiceInventory.isLoaded && !savedVoice;
    const resolution = this._voicing?.voiceResolution;
    // VOICE SELECTION (language dropdown): the locale whose voices are listed;
    // defaults to the browser's language setting (see defaultLocale)
    const locale = selectedLocale(lang, voices);
    const { local, remote } = voicesForLocale(locale, voices);
    const localeDefault = defaultVoiceForLocale(locale, voices);
    const defaultLabel = localeDefault
      ? `${key('voice_default')} (${voiceDisplayName(localeDefault)})`
      : `${key('voice_default')} (${key('voice_none_local')})`;

    let status = '';
    if (!isSupported) {
      status = key('voice_status_unsupported');
    } else if (!voiceInventory.isLoaded) {
      status = key('voice_status_loading');
    } else if (resolution?.status === 'no-local') {
      status = key('voice_status_no_local');
    } else if (isSavedMissing) {
      status = `${key('voice_status_unavailable')} (${savedURI})`;
    } else if (savedVoice && !savedVoice.localService) {
      status = key('voice_status_remote');
    }

    return html`
      <!-- VOICE SELECTION line 1: language, then voices in that language -->
      <div class="voice-row">
        <label>
          <span class="label-text">${key('voice_language')}:</span>
          <select
            ?disabled=${!isSupported || !voiceInventory.isLoaded}
            @change=${(e: Event) => this._setLocale((e.target as HTMLSelectElement).value)}
          >
            ${voiceLocales(lang, voices).map(l => html`
              <option value=${l} ?selected=${l === locale}>${languageName(l)}</option>
            `)}
          </select>
        </label>
        <label>
          <span class="label-text">${key('voice')}:</span>
          <select
            ?disabled=${!isSupported}
            @change=${(e: Event) => this._setVoice((e.target as HTMLSelectElement).value)}
          >
            <option value="" ?selected=${!savedURI}>${defaultLabel}</option>
            ${isSavedMissing ? html`
              <option value=${savedURI} selected>${savedURI} (${key('voice_unavailable')})</option>
            ` : nothing}
            ${local.map(voice => html`
              <option value=${voice.voiceURI} ?selected=${voice.voiceURI === savedURI}>
                ${voiceDisplayName(voice)}
              </option>
            `)}
            ${remote.length ? html`
              <optgroup label=${key('voice_remote_group')}>
                ${remote.map(voice => html`
                  <option value=${voice.voiceURI} ?selected=${voice.voiceURI === savedURI}>
                    ${voiceDisplayName(voice)}
                  </option>
                `)}
              </optgroup>
            ` : nothing}
          </select>
        </label>
      </div>
      <!-- VOICE SELECTION line 2: preview, and test text in development builds -->
      <div class="voice-row">
        <!-- VOICE SELECTION (preview start/stop): one toggle button. Its
             label switches between "Preview voice" and "Stop preview"; focus
             stays on the same element. -->
        <button
          ?disabled=${!isSupported || !this._voicing}
          @click=${() => this._togglePreview()}
        >
          ${key(this._isPreviewing ? 'voice_preview_stop' : 'voice_preview')}
        </button>
        ${import.meta.env.DEV ? this._renderDevSamples() : nothing}
      </div>
      <p class="voice-status" role="status">${status}</p>
    `;
  }

  // Development builds only: choose a normalization test utterance for Preview
  protected _renderDevSamples() {
    return html`
      <label>
        <span class="label-text">Test text (dev):</span>
        <select @change=${(e: Event) => this._devSampleIndex = +(e.target as HTMLSelectElement).value}>
          <option value="-1" ?selected=${this._devSampleIndex === -1}>Chart description</option>
          ${DEV_PREVIEW_SAMPLES.map(([label], i) => html`
            <option value=${i} ?selected=${this._devSampleIndex === i}>${label}</option>
          `)}
        </select>
      </label>
    `;
  }

  // VOICE SELECTION (language dropdown): choosing a language lists its voices
  // and switches to that language's default voice (a local one; see
  // defaultVoiceForLocale). Saved per speech language. Doesn't speak.
  protected _setLocale(locale: string) {
    const lang = this._speechLang;
    voicePrefs.setLocale(lang, locale);
    voicePrefs.set(lang, '');
    this.requestUpdate();
  }

  // Saved per speech language; applies to the next utterance. Selecting a
  // voice does not speak (use Preview).
  protected _setVoice(voiceURI: string) {
    voicePrefs.set(this._speechLang, voiceURI);
    this.requestUpdate();
  }

  // VOICE SELECTION (preview start/stop): was _previewVoice(), which only
  // started. Now starts the preview, or stops it if it's speaking. The button
  // returns to "Preview voice" when the preview finishes, is stopped, or is
  // interrupted by chart speech (Voicing calls onEnd in every case).
  protected _togglePreview() {
    const voicing = this._voicing;
    if (!voicing) return;
    if (this._isPreviewing) {
      voicing.stopPreview();
      this._isPreviewing = false;
      return;
    }
    const text = import.meta.env.DEV && this._devSampleIndex >= 0
      ? DEV_PREVIEW_SAMPLES[this._devSampleIndex][1]
      : this._globalState.l10n.localize('cpanel.tabs.audio.captions_dialog.voice_preview_text');
    this._isPreviewing = voicing.preview(text, () => this._isPreviewing = false);
  }

  // -----------------------------------------------------------------------

  protected _renderColor(key: CaptionColorKey, cssProperty: string, label: string) {
    return html`
      <label class="color-label">
        <!-- VOICE SELECTION: label text in a span so it can be capitalized -->
        <span class="label-text">${label}:</span>
        <input type="color"
          .value=${this._currentHex(cssProperty)}
          @input=${(e: Event) => this._setColor(key, (e.target as HTMLInputElement).value)}>
      </label>
    `;
  }

  // The color actually in effect (config value, page CSS, or theme default),
  // read from the inherited --caption-* property so the picker shows what the
  // caption is using, then normalized to #rrggbb for <input type="color">.
  protected _currentHex(cssProperty: string): string {
    const value = getComputedStyle(this).getPropertyValue(cssProperty).trim();
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx || !value) return '#000000';
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    // fillStyle normalizes opaque colors to #rrggbb, translucent ones to rgba()
    return ctx.fillStyle.startsWith('#') ? ctx.fillStyle : '#000000';
  }

  protected _setColor(key: CaptionColorKey, hex: string) {
    this._paraState.updateConfig(draft => {
      draft.controlPanel.caption[key] = hex;
    });
  }

  // Back to the defaults, which hands every caption property back to page CSS
  // (see captionVar in parachart.ts)
  protected _resetToDefaults() {
    const defaults = defaultConfig.controlPanel.caption;
    this._paraState.updateConfig(draft => {
      draft.controlPanel.caption.fontFamily = defaults.fontFamily;
      draft.controlPanel.caption.fontSize = defaults.fontSize;
      draft.controlPanel.caption.letterSpacing = defaults.letterSpacing;
      draft.controlPanel.caption.wordSpacing = defaults.wordSpacing;
      draft.controlPanel.caption.lineHeight = defaults.lineHeight;
      draft.controlPanel.caption.phraseHighlightColor = defaults.phraseHighlightColor;
      draft.controlPanel.caption.wordHighlightColor = defaults.wordHighlightColor;
    });
    // VOICE SELECTION: also reset the language and voice for this chart's
    // speech language, back to the browser-preferred language and its default
    // local voice. These are device preferences in localStorage, not config,
    // so updateConfig() above doesn't cover them. Saved voices for other
    // speech languages are left alone. Doesn't speak.
    const lang = this._speechLang;
    voicePrefs.setLocale(lang, '');
    voicePrefs.set(lang, '');
    // localStorage changes don't trigger a Lit update
    this.requestUpdate();
  }

  /**
   * Show the dialog
   */
  async show() {
    // Re-render so the color pickers reflect the current computed colors
    this.requestUpdate();
    await this.updateComplete;
    await this._dialogRef.value!.show();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-captions-dialog': CaptionsDialog;
  }
}
