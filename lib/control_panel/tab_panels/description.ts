
//import { styles } from '../../styles';
import { StatusBarHistoryDialog} from '../dialogs';
import { ScreenReaderBridge } from '../../screenreaderbridge';
import { ControlPanelTabPanel } from './tab_panel';

import { 
  html, css, PropertyValues,
} from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';


@customElement('para-description-panel')
export class DescriptionPanel extends ControlPanelTabPanel {

  @property() caption = '';

  @property() visibleStatus = '';

  protected _statusBarHistory: readonly string[] = [];
  protected _srb!: ScreenReaderBridge;
  protected _statusBarRef = createRef<HTMLDivElement>();
  protected _historyDialogRef = createRef<StatusBarHistoryDialog>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
      #description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      #desc-footer {
        background-color: var(--themeColorLight);
        margin: -0.19rem -0.25rem 0px;
        padding: 0.2rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-direction: row;
        justify-content: space-between;
      }
      #statusbar {
        white-space: pre-line;
      }
    `
  ];

  get statusBar() {
    return this._statusBarRef.value!;
  }

  get statusBarHistory() {
    return this._statusBarHistory;
  }

  set statusBarHistory(history: readonly string[]) {
    this._statusBarHistory = history;
    this._historyDialogRef.value!.history = history;
  }

  // get speechRate() {
  //   return this._controller.voice.rate;
  // }

  // set speechRate(rate: number) {
  //   this._controller.voice.rate = rate;
  // }

  protected firstUpdated(_changedProperties: PropertyValues) {
    this._initStatusBar();
  }

  protected _initStatusBar() {
    // Do this after the status bar has been created
    ScreenReaderBridge.addAriaAttributes(this.statusBar);
    this.statusBar.setAttribute('lang', 'en');
    this._srb = new ScreenReaderBridge(this.statusBar);  

    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        if(mutation.addedNodes.length === 0){
          return;
        }
        const addCC = mutation.addedNodes[0] as HTMLDivElement;

        const msg = addCC.getAttribute('data-original-text');
      
        // const timestamp = addCC.getAttribute("data-created")
        // Create a new array rather than mutating it so the assignment can
        // trigger a reactive update of the history dialog.
        this.statusBarHistory = [...this._statusBarHistory, msg ?? ''];

        if (msg
          && this._store.settings.ui.isVoicingEnabled 
          && this._store.settings.ui.isAnnouncementEnabled) {
          this._controller.voice.speak(msg);
        }
      })
    });
    observer.observe(this.statusBar, {
      childList: true
    });    
  }

  announce(text: string) {
    this._srb.render(text);
  }

  replay() {
    const msg = this._srb.lastCreatedElement?.textContent;
    if (msg) {
      this.announce(msg);
    }
  }

  clearStatusBar() {
    this._srb.clear();
  }

  render() {
    const styles = {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    };
    return html`
      <figcaption>
        <div id="description" style=${styleMap(styles)}>
          <div 
            id="caption" 
            ?hidden=${!this.controlPanel.settings.isCaptionVisible}
          >
            ${this.caption}
          </div>
          <div id="desc-footer">
            <div id="status_split">
              <div id="visiblestatus">${this.visibleStatus}</div>
              <div id="statusbar" 
                ${ref(this._statusBarRef)}
                class=${this.controlPanel.settings.isStatusBarVisible ? '' : 'sr-only'}
              ></div>
            </div>
            <button
              @click=${() => this._historyDialogRef.value?.show()}
            >
              History
            </button>
          </div>
        </div>
      </figcaption>
      <todo-status-bar-history-dialog 
        ${ref(this._historyDialogRef)}
        id="output-dialog" 
      ></todo-status-bar-history-dialog>

    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-description-panel': DescriptionPanel;
  }
}