import { html, css, TemplateResult, PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { type Unsubscribe } from '@lit-app/state';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { Logger, getLogger } from '@fizz/logger';
import { Highlight, HighlightedSummary } from '@fizz/chartsignal-internal';
import { ParaComponent } from '../components';
import { ParaChart } from '../parachart/parachart';
import { ConfigSetting } from '../config/config_types';
// WORD HIGHLIGHT: payload type of the 'wordStart' notice
import { type WordHighlight } from '../components/aria_live/voicing';

type HoverListener = (event: PointerEvent) => void;

@customElement('para-caption-box')
export class ParaCaptionBox extends ParaComponent {
  private log: Logger = getLogger("ParaCaptionBox");
  protected _lastSpans = new Set<HTMLElement>();
  protected _prevSpanIdx = 0;
  protected _highlightManualOverride = false;

  @property({ attribute: false }) parachart!: ParaChart;

  protected _globalStateChangeUnsub!: Unsubscribe;
  protected _paraStateChangeUnsub!: Unsubscribe;
  protected _spans: HTMLSpanElement[] = [];
  protected _isEBarVisible = false;
  protected _captionRef = createRef<HTMLElement>();
  // WORD HIGHLIGHT: the Range this caption box contributes to the shared
  // 'para-tour-word' highlight. CSS.highlights is document-wide, so each
  // caption box adds and removes only its own range rather than replacing the
  // registry entry (keeps multiple charts on a page independent).
  protected _wordRange: Range | null = null;

  static styles = [
    css`
      figcaption.external {
        border: var(--caption-border);
      }
      #caption-box {
        display: grid;
        grid-template-columns: var(--caption-grid-template-columns);
      }
      #caption {
        padding: 0.25rem;
      }
      #caption.solo {
        grid-column: 1 / 3
      }
      #exploration-bar {
        background-color: var(--fizz-theme-color-light);
        padding: 0.2rem;
        display: var(--exploration-bar-display);
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
      }
      #exploration-bar-text {
        align-self: flex-start;
      }
      #caption span.highlight {
        background-color: var(--fizz-theme-color-light);
      }
      #exploration-bar span.highlight {
        background-color: white;
      }
      #exploration-bar.hidden {
        /* Using this rather than 'hidden' attr to override flex display */
        display: none;
      }
      /* WORD HIGHLIGHT: per-word Tour Guide mark, drawn with the CSS Custom
         Highlight API. Override from page CSS by setting
         --paracharts-tour-word-highlight-background / -color on para-chart or
         an ancestor (when the caption is externalized it is moved outside
         para-chart, so set them on a shared ancestor such as body).
         ::highlight() supports only color, background-color, text-decoration,
         text-shadow and a few others. */
      :host {
        --tour-word-highlight-background: var(--paracharts-tour-word-highlight-background, var(--fizz-theme-color, navy));
        --tour-word-highlight-color: var(--paracharts-tour-word-highlight-color, white);
      }
      ::highlight(para-tour-word) {
        background-color: var(--tour-word-highlight-background);
        color: var(--tour-word-highlight-color);
      }
    `
  ];

  get highlightManualOverride() {
    return this._highlightManualOverride;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._paraState.setCaption();
    this._globalStateChangeUnsub = this._globalState.subscribe(() => {
      this.requestUpdate();
    }, '_currentParaState');
    this._paraStateChangeUnsub = this._paraState.subscribe(() => {
      this.requestUpdate();
    }, '_caption');
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._globalStateChangeUnsub();
    this._paraStateChangeUnsub();
    // WORD HIGHLIGHT: don't leave this box's Range in the document-wide registry
    this._clearWord();
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (!this._paraState.config.ui.isTourGuideEnabled) return;
    const spans = this.getSpans();
    this._spans = this._spans.filter(span => spans.includes(span));
    spans.forEach((span, i) => {
      // Only add the listeners once
      if (!this._spans.includes(span)) {
        this._spans.push(span);
        span.addEventListener('pointerenter', (e: PointerEvent) => {
          if (!this._paraState.config.ui.isTourGuideEnabled
            || this.parachart.paraView.ariaLiveRegion.voicing.isSpeaking) return;
          // NB: this requires there be an announcement, so it only works
          // in NH mode
          // const highlight = this._paraState.announcement.highlights[i];
          const highlight = this._paraState.caption.highlights![i];
          this._paraState.postNotice('landmarkStart', highlight);
        });
        // span.addEventListener('pointerleave', (e: PointerEvent) => {
        //   if (!this._paraState.settings.ui.isNarrativeHighlightEnabled) return;
        // });
      }
    });
  }

  clearStatusBar() {
    this.parachart.clearAriaLive();
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting) {
    if (path === 'ui.isTourGuideEnabled' && !newValue) {
      this._prevSpanIdx = 0;
      this._highlightManualOverride = false;
      this._lastSpans.clear();
      // WORD HIGHLIGHT
      this._clearWord();
    }
    // WORD HIGHLIGHT: turning the word highlight off removes any current mark
    if (path === 'ui.isTourGuideWordHighlightEnabled' && !newValue) {
      this._clearWord();
    }
  }

  noticePosted(key: string, value: any, count: number) {
    if (this._paraState.config.ui.isTourGuideEnabled) {
      if (key === 'landmarkStart') {
        const highlight: Highlight = value;
        for (const span of this.getSpans()) {
          if (span.dataset.phrasecode === `${highlight.phrasecode}`) {
            span.classList.add('highlight');
            this._lastSpans.add(span);
          } else {
            span.classList.remove('highlight');
            this._lastSpans.delete(span);
          }
        }
      } else if (key === 'landmarkEnd') {
        // WORD HIGHLIGHT: the word mark always goes when speech ends, even if
        // the phrase stays lit under manual override
        this._clearWord();
        if (!this._highlightManualOverride) {
          for (const span of this._lastSpans) {
            span.classList.remove('highlight');
          }
        }
      // WORD HIGHLIGHT: mark/unmark the word currently being spoken
      } else if (key === 'wordStart') {
        if (this._paraState.config.ui.isTourGuideWordHighlightEnabled) {
          this._showWord(value as WordHighlight);
        }
      } else if (key === 'wordEnd') {
        this._clearWord();
      }
    }
  }

  highlightSpan(next = true) {
    const getMsg = (idx: number) => {
      const div = document.createElement('div');
      div.innerHTML = this._paraState.announcement.html;
      return (div.children[idx] as HTMLElement).innerText;
    };

    const voicing = this.parachart.paraView.ariaLiveRegion.voicing;
    let idx = this._prevSpanIdx;
    if (!this._highlightManualOverride) {
      idx = voicing.highlightIndex ?? -1;
      this._highlightManualOverride = true;
    }
    // idx = Math.min(
    //   this._paraState.announcement.highlights.length - 1,
    //   Math.max(0, idx + (next ? 1 : -1)));
    idx = Math.min(
      this._paraState.caption.highlights!.length - 1,
      Math.max(0, idx + (next ? 1 : -1)));

    this._prevSpanIdx = idx;

    // const highlight = this._paraState.announcement.highlights[idx];
    const highlight = this._paraState.caption.highlights![idx];
    if (this._paraState.config.ui.isVoicingEnabled) {
      //const msg = getMsg(idx);
      const msg = this._captionRef.value!.firstElementChild!.children[idx].textContent;
      voicing.shutUp();
      // WORD HIGHLIGHT: was speakText(msg); speakPhrase also posts per-word
      // notices. msg is this span's textContent, so offsets match the DOM.
      voicing.speakPhrase(msg!, highlight);
    }
    this._paraState.postNotice('landmarkStart', highlight);
  }

  clearSpanHighlights() {
    for (const span of this.getSpans()) {
      span.classList.remove('highlight');
    }
  }

  // WORD HIGHLIGHT: the shared highlight object, created on first use.
  // CSS Custom Highlight API: Chrome/Edge 105+, Safari 17.2+, Firefox 140+;
  // returns null where unsupported, leaving only the phrase highlight.
  // NB: globalThis.Highlight because Highlight from chartsignal shadows the DOM class.
  protected _wordHighlight(): globalThis.Highlight | null {
    if (!('highlights' in CSS)) return null;
    let hl = CSS.highlights.get('para-tour-word');
    if (!hl) {
      hl = new globalThis.Highlight();
      CSS.highlights.set('para-tour-word', hl);
    }
    return hl;
  }

  // WORD HIGHLIGHT: mark one word inside the caption span for its phrase
  protected _showWord(word: WordHighlight) {
    this._clearWord();
    const hl = this._wordHighlight();
    if (!hl || word.length <= 0) return;
    const span = Array.from(this._captionRef.value?.querySelectorAll('span') ?? [])
      .find(s => s.dataset.phrasecode === `${word.phrasecode}`);
    if (!span) return;
    // Walk the span's text nodes to turn phrase offsets into a DOM Range;
    // the word may cross text nodes if the phrase has inline markup
    const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const end = word.offset + word.length;
    let pos = 0;
    let isStartSet = false;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const len = node.textContent!.length;
      if (!isStartSet && word.offset < pos + len) {
        range.setStart(node, word.offset - pos);
        isStartSet = true;
      }
      if (isStartSet && end <= pos + len) {
        range.setEnd(node, end - pos);
        hl.add(range);
        this._wordRange = range;
        return;
      }
      pos += len;
    }
  }

  // WORD HIGHLIGHT: remove only this caption box's range from the shared highlight
  protected _clearWord() {
    if (this._wordRange) {
      this._wordHighlight()?.delete(this._wordRange);
      this._wordRange = null;
    }
  }

  renderSummary(summary: HighlightedSummary | string, idPrefix: string): TemplateResult {
    if (typeof summary === 'string') {
      summary = { text: summary, html: summary };
    }
    return html`
      <article>
        ${unsafeHTML(summary.html)}
      </article>
    `
  }

  getSpans() {
    return Array.from(this.renderRoot.querySelectorAll('span'));
  }

  render() {
    this.style.maxWidth = `${this._paraState.config.chart.width}px`;
    const announcementTarget = this._paraState.announcement.target;
    const sendToEBar = announcementTarget === 'all' || announcementTarget === 'explorationbar';
    this._isEBarVisible = sendToEBar
      && !!this._paraState.announcement.text
      && this._paraState.announcement.text !== this._paraState.caption.text;
    const isCaptionSolo = !this._isEBarVisible || !this._paraState.config.controlPanel.isExplorationBarVisible;
    return html`
      <figcaption class=${this.parachart.isControlPanelOpen ? '' : 'external'}>
        <div id="caption-box">
          <div
            ${ref(this._captionRef)}
            id="caption"
            class=${isCaptionSolo ? 'solo' : ''}
            ?hidden=${!this._paraState.config.controlPanel.isCaptionVisible}
          >
            ${this.renderSummary(this._paraState.caption, 'caption')}
          </div>
          <div
            id="exploration-bar"
            class=${isCaptionSolo ? 'hidden' : ''}
          >
            <div
              id="exploration-bar-text"
              aria-hidden="true"
            >
              ${this._paraState.announcement.text === this._paraState.caption.text
                ? ''
                : this.renderSummary(this._paraState.announcement, 'statusbar')}
            </div>
            ${!this._paraState.config.controlPanel.caption.isCaptionExternalWhenControlPanelClosed
              || this.parachart.isControlPanelOpen
              ? html`
                <button
                  @click=${() => {
                    this.parachart.showAriaLiveHistory();
                  }}
                >
                  History
                </button>`
              : ''
            }
          </div>
        </div>
      </figcaption>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-caption-box': ParaCaptionBox;
  }
}