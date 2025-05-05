
import { ParaComponent } from '../../components';

import * as ui from '@fizz/ui-components';

import {html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';

@customElement('para-aria-live-history-dialog')
export class AriaLiveHistoryDialog extends ParaComponent {
  protected _dialogRef: Ref<ui.Dialog> = createRef();

  /**
   * Close button text.
   */
  @property() btnText = 'Okay';

  /**
   * Status bar history.
   */
  @property({type: Array}) history: readonly string[] = [];

  static styles = css`
    .history {
      align-self: stretch;
    }
  `;

  render() {
    const buttons = [{tag: 'cancel', text: this.btnText}];
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)} 
        title="History" 
        .buttons=${buttons}
      >
        <ul class="history"
        >
          ${
            this.history.map(item => html`
              <li>${item}</li>
            `)
          }
        </ul>
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   */
  async show() {
    //this.history = history;
    // Even though `history` is reactive, the container's `ccHistory` is just
    // getting mutated, so the above assignment won't trigger an update on its own.
    //this.requestUpdate();
    await this._dialogRef.value!.show(() => this._dialogRef.value!.button('cancel')!.focus());
  }
}

declare global {

  interface HTMLElementTagNameMap {
    'para-aria-live-history-dialog': AriaLiveHistoryDialog;
  }

}