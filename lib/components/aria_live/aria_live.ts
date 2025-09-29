
import { ParaComponent } from '../paracomponent';
import { ScreenReaderBridge, type AriaLiveHistoryDialog } from '.';
import { Voicing } from './voicing';
import { styles } from '../../view/styles';
import { type Announcement } from '../../store';

import { html, css, type PropertyValues } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { property, customElement } from 'lit/decorators.js';

@customElement('para-aria-live-region')
export class AriaLive extends ParaComponent {

  @property({type: Object}) announcement: Announcement = { text: '', html: '', highlights: [] };

  protected _srb!: ScreenReaderBridge;
  protected _voicing = new Voicing();
  protected _ariaLiveRef = createRef<HTMLElement>();
  protected _history: readonly string[] = [];
  protected _historyDialogRef = createRef<AriaLiveHistoryDialog>();

  get voicing() {
    return this._voicing;
  }

  protected _setHistory(history: readonly string[]) {
    this._history = history;
    this._historyDialogRef.value!.history = history;
  }

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('announcement') && this.announcement.text) {
      if (this.announcement.clear) {
        this._srb.clear();
      }
      this._srb.render(this.announcement.text, this.announcement.highlights);
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    // XXX the ref should be set at this point, but it isn't for some reason
    this._initAriaLiveRegion(this.shadowRoot?.querySelector('div')!);
  }

  protected _initAriaLiveRegion(element: HTMLElement) {
    ScreenReaderBridge.addAriaAttributes(element);
    element.setAttribute('lang', 'en');
    this._srb = new ScreenReaderBridge(element);

    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        if (mutation.addedNodes.length === 0) {
          return;
        }
        const addCC = mutation.addedNodes[0] as HTMLDivElement;

        const msg = addCC.getAttribute(ScreenReaderBridge.ORIGINAL_TEXT_ATTRIBUTE);
        const highlights = addCC.getAttribute(ScreenReaderBridge.ORIGINAL_HIGHLIGHT_ATTRIBUTE);

        // const timestamp = addCC.getAttribute("data-created")
        // Create a new array rather than mutating it so the assignment can
        // trigger a reactive update of the history dialog.
        this._setHistory([...this._history, msg ?? '']);

        if (msg
          && this._store.settings.ui.isVoicingEnabled
          && this._store.settings.ui.isAnnouncementEnabled) {
          this._voicing.speak(msg, JSON.parse(highlights!));
        }
      })
    });
    observer.observe(element, {
      childList: true
    });
  }

  showHistoryDialog() {
    this._historyDialogRef.value!.show();
  }

  clear() {
    this._srb.clear();
  }

  get lastAnnouncement() {
    return this._srb.lastCreatedElement?.textContent;
  }

  replay() {
    const msg = this.lastAnnouncement;
    if (msg) {
      this._store.announce(msg);
    }
  }

  static styles = [
    styles,
    css`
      div {
        white-space: pre-line;
      }
    `
  ];

  render() {
    // XXX hack
    this._voicing.rate = this._store.settings.ui.speechRate;
    return html`
      <div
        ${ref(this._ariaLiveRef)}
        class="sr-only"
        data-testid="sr-status"
      ></div>
      <para-aria-live-history-dialog
        ${ref(this._historyDialogRef)}
      ></para-aria-live-history-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-aria-live-region': AriaLive;
  }
}