import { ParaComponent } from '../../components';
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

@customElement('para-summary-dialog')
export class SummaryAuthoringTool extends ParaComponent {

    protected _dialogRef = createRef<Dialog>();

    @property() btnText = 'Close';

    static styles = css`
    #content {
      padding: 1rem;
    }
  `;

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Test Dialog"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        <div id="content">
          This is a test dialog. If you can see this, it is wired up correctly.
        </div>
      </fizz-dialog>
    `;
    }

    async show() {
        await this._dialogRef.value!.show(() =>
            this._dialogRef.value!.button('cancel')!.focus()
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'para-summary-dialog': SummaryAuthoringTool;
    }
}