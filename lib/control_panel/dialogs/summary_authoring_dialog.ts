import { ParaComponent } from '../../components';
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

@customElement('para-summary-dialog')
export class SummaryAuthoringTool extends ParaComponent {
  @property() summaryText = '';
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
        .buttons=${[
        { tag: 'cancel', text: this.btnText },
        { tag: 'save', text: 'Save' }
      ]}
      >
      <div id="content">
        <textarea
        rows="6"
        style="width: 100%;"
        .value=${this.summaryText}
        @input=${(e: Event) => {
        this.summaryText = (e.target as HTMLTextAreaElement).value;
      }}
        ></textarea>
      </div>
      </fizz-dialog>
    `;
  }
  async show() {
    const clicked = await this._dialogRef.value!.show(() =>
      this._dialogRef.value!.button('cancel')!.focus()
    );

    // If the user clicked Save, emit a custom event with the current summaryText
    if (clicked === 'save') {
      this.dispatchEvent(new CustomEvent('summary-saved', {
        detail: { text: this.summaryText },
        bubbles: true,
        composed: true
      }));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-summary-dialog': SummaryAuthoringTool;
  }
}