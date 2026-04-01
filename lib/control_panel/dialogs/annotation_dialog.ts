
import { Dialog } from '@fizz/ui-components';
import { TemplateResult, css, html } from 'lit';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { ParaDialog } from '../../components';

import { customElement, property, state } from 'lit/decorators.js';

interface AnnotationDialogOptions{
  showRemove?: boolean;
}


/**
 * @public
 */
@customElement('para-annotation-dialog')
export class AnnotationDialog extends ParaDialog {
  /**
   * Title text.
   */
  @property() title = 'Add annotation';

  /**
 * Add button text.
 */
  @property() addBtnText = 'Annotate';

  /**
   * Close button text.
   */
  @property() cancelBtnText = 'Cancel';

  /**
 * Close button text.
 */
  @property() removeBtnText = 'Remove annotation';

  /**
   * Generic dialog.
   */
  @property({ type: Array }) contentArray: string[] = [];

  /**
   * Content text.
   */
  @state() protected _content!: TemplateResult;

  protected _dialogRef: Ref<Dialog> = createRef();
    protected _options: AnnotationDialogOptions = {};

  render() {
    const buttons = [{ tag: 'add', text: this.addBtnText }, { tag: 'cancel', text: this.cancelBtnText }];
    if (this._options.showRemove){
      buttons.push({ tag: 'remove', text: this.removeBtnText });
    }
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
  async show(title: string, content: TemplateResult = html``, options: AnnotationDialogOptions) {
    this.title = title;
    this._content = content;
    if (options) {
      this._options = options;
    }
    const result = await this._dialogRef.value!.show(() => this._dialogRef.value!.button('close')!.focus());
    const returnText = this._dialogRef.value!.getElementsByTagName("input").namedItem("annot")!.value;
    this._dialogRef.value!.getElementsByTagName("input").namedItem("annot")!.value = ''
    return {result: result, text: returnText}
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-annotation-dialog': AnnotationDialog;
  }
}