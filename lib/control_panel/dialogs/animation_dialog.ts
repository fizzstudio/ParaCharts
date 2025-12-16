
import { ParaComponent } from '../../components';
import { Logger, getLogger } from '../../common/logger';

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
    #animation-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    // isAnimationEnabled: boolean;
    // animateRevealTimeMs: number;
    // animationType: AnimationType;
    // animationOrigin: AnimationOrigin;
    // animationOriginValue: number;

    // this._store.settingControls.add({
    //   type: 'checkbox',
    //   key: 'animation.isAnimationEnabled',
    //   label: 'Animation enabled',
    //   parentView: 'controlPanel.tabs.controls.dialog.animation',
    // });
    this._store.settingControls.add({
      type: 'radio',
      key: 'animation.animationType',
      label: 'Animation type',
      options: {
        buttons: {
          yAxis: {
            label: 'Y-axis'
          },
          xAxis: {
            label: 'X-axis'
          },
        },
        layout: 'horiz'
      },
      parentView: 'controlPanel.tabs.controls.dialog.animation'
    });
    this._store.settingControls.add({
      type: 'textfield',
      key: 'animation.animateRevealTimeMs',
      label: 'Animation rate',
      options: {
        inputType: 'number',
        min: 0,
        max: 10000
      },
      parentView: 'controlPanel.tabs.controls.dialog.animation',
    });
    this._store.settingControls.add({
      type: 'radio',
      key: 'animation.animationOrigin',
      label: 'Animation origin',
      options: {
        buttons: {
          baseline: {
            label: 'Bottom'
          },
          top: {
            label: 'Top'
          },
          initialValue: {
            label: 'Initial Value'
          },
          custom: {
            label: 'Custom'
          },
        },
        layout: 'horiz'
      },
      parentView: 'controlPanel.tabs.controls.dialog.animation'
    });

    this._store.settingControls.add({
      type: 'textfield',
      key: 'animation.animationOriginValue',
      label: 'Animation origin value',
      options: {
        inputType: 'number',
        min: 0,
        max: 10000
      },
      parentView: 'controlPanel.tabs.controls.dialog.animation',
    });
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Animation Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        <div id="animation-controls">
          ${this._store.settingControls.getContent('controlPanel.tabs.controls.dialog.animation')}
        </div>
      </fizz-dialog>
    `;
  }

  /**
   * Show the dialog
   */
  async show() {
    await this._dialogRef.value!.show(() => this._dialogRef.value!.button('cancel')!.focus());
  }
}

declare global {

  interface HTMLElementTagNameMap {
    'para-animation-dialog': AnimationDialog;
  }

}