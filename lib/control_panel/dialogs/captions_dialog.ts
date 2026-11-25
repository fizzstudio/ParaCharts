// CAPTIONS DIALOG: new file. Caption typography and Tour Guide highlight
// options, opened from the Audio tab's narrative section.

import { SettingControlContainer } from '../setting_control_container';
import { defaultConfig } from '../../config/config_defaults';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

const CAPTIONS_VIEW = 'controlPanel.tabs.audio.captions.dialog';

type CaptionColorKey = 'phraseHighlightColor' | 'wordHighlightColor';

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

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
    label.color-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    label.color-label::first-letter,
    button::first-letter {
      text-transform: capitalize;
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
        <button @click=${() => this._resetToDefaults()}>
          ${l10n.localize('cpanel.tabs.audio.captions_dialog.reset')}
        </button>
      </fizz-dialog>
    `;
  }

  protected _renderColor(key: CaptionColorKey, cssProperty: string, label: string) {
    return html`
      <label class="color-label">
        ${label}
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
