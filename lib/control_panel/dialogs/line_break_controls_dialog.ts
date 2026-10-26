
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-line-break-controls-dialog')
export class LineBreakControlsDialog extends SettingControlContainer {

    protected _dialogRef = createRef<ui.Dialog>();

    /**
     * Close button text.
     */
    @property() btnText = 'Okay';

    static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
  `;

    connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Line break controls"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
       <div>
          <button
            @click=${() => {
                this._paraState.addUserLineBreaks()
            }
            }
          >
            ${this._globalState.l10n.localize('cpanel.tabs.annotations.add_line_breaks')}
          </button>
        </div>
         <div>
          <button
            @click=${() => {
                this._paraState.clearUserLineBreaks()
                this._paraState.clearUserTrendLines()
            }
            }
          >
            ${this._globalState.l10n.localize('cpanel.tabs.annotations.remove_line_breaks')}
          </button>
        </div>
         <div>
          <button
            @click=${() => {
                this._paraState.updateConfig(draft => {
                    draft.controlPanel.isMDRAnnotationsVisible = !this._paraState.config.controlPanel.isMDRAnnotationsVisible;
                });
                this._paraState.showMDRAnnotations()
            }
            }
          >
            ${this._globalState.l10n.localize('cpanel.tabs.annotations.show_annotations')}
          </button>
        </div>
      </fizz-dialog>
    `;
    }

    /**
     * Show the dialog
     */
    async show() {
        await this._dialogRef.value!.show();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'para-line-break-controls-dialog': LineBreakControlsDialog;
    }

}