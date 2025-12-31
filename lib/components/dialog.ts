
import { ParaComponent } from '../components';

import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';

import { LitElement, html, css, nothing, type PropertyValueMap, type TemplateResult } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { type Ref, ref, createRef } from 'lit/directives/ref.js';


/**
 * Simple dialog that displays a message and a single
 * button to close the dialog.
 * @public
 */
@customElement('para-dialog')
export class ParaDialog extends ParaComponent {

  /**
   * Title text.
   */
  @property() title = '';

  /**
   * Close button text.
   */
  @property() btnText = 'Close';

  /**
   * Generic dialog.
   */
  @property({type: Array}) contentArray: string[] = [];

  /**
   * Content text.
   */
  @state() protected _content!: TemplateResult;

  protected _dialogRef: Ref<Dialog> = createRef();

  static styles = css`
    .contentArray {
      align-self: stretch;
    }

    button {
      margin: 0.2rem;
      background-color: var(--theme-color);
      color: var(--theme-contrast-color);
      border: thin solid var(--theme-color);
      border-radius: 0.2em;
      padding: 0.2em;
    }


    pre {
      height: 60vh;
      width: 80vw;
      padding: 1rem;
      overflow-y:
      scroll; background-color:
      black; color: white;
    }

    table {
      border-collapse: collapse;
      margin: 0 2rem;
    }

    th, td {
      border-bottom: 1px solid hsl(0, 0%, 75%);
      padding: 0.35em 2.5em;
      text-align: left;
    }

    tbody th {
      font-weight: normal;
      padding-left: 0;
    }

    td:last-of-type {
      padding-right: 0;
    }
  `;

  render() {
    const buttons = [{tag: 'cancel', text: this.btnText}];
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="${this.title}"
        .buttons=${buttons}
      >
        ${this._content}
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   * @param contentArray - status bar display contentArray.
   */
  // async show(title: string, contentArray: string[]) {
  async show(title: string, content: TemplateResult = html``): Promise<string | void> {
    this.title = title;
    this._content = content;
    await this._dialogRef.value!.show(() => this._dialogRef.value!.button('cancel')!.focus());
  }
}

declare global {

  interface HTMLElementTagNameMap {
    'para-dialog': ParaDialog;
  }

}