
import { ParaComponent } from '../../components';
import { Logger, getLogger } from '@fizz/logger';

import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

/**
 * @public
 */
@customElement('para-animation-dialog')
export class AnimationDialog extends ParaComponent {

  protected _dialogRef = createRef<Dialog>();

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

    // isAnimationEnabled: boolean;
    // animateRevealTimeMs: number;
    // animationType: AnimationType;
    // animationOrigin: AnimationOrigin;
    // animationOriginValue: number;

    // this._paraState.settingControls.add({
    //   type: 'checkbox',
    //   key: 'animation.isAnimationEnabled',
    //   label: 'Animation enabled',
    //   parentView: 'controlPanel.tabs.controls.dialog.animation',
    // });
    this._paraState.settingControls.insert('animation.animationType');
    this._paraState.settingControls.insert('animation.animateRevealTimeMs');
    this._paraState.settingControls.insert('animation.animationOrigin');
    this._paraState.settingControls.insert('animation.animationOriginValue');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Animation Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.controls.dialog.animation')}
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   */
  async show() {
    await this._dialogRef.value!.show(() => this._dialogRef.value!.button('close')!.focus());
  }
}

declare global {

  interface HTMLElementTagNameMap {
    'para-animation-dialog': AnimationDialog;
  }

}