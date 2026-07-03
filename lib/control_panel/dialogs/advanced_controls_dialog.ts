
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
@customElement('para-advanced-control-settings-dialog')
export class AdvancedControlSettingsDialog extends ParaComponent {
  private log: Logger = getLogger("AdvancedControlSettingsDialog");
  protected _dialogRef = createRef<Dialog>();

  /**
   * Close button text.
   */
  @property() btnText = 'Okay';

  static styles = css`
    fizz-dialog {
      --item-gap: 1rem;
    }
    #advanced {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.insert('controlPanel.tabLabelStyle');
    this._paraState.settingControls.insert('controlPanel.isCaptionVisible');
    this._paraState.settingControls.insert('controlPanel.isExplorationBarVisible');
    this._paraState.settingControls.insert('controlPanel.caption.isCaptionExternalWhenControlPanelClosed');
    this._paraState.settingControls.insert('controlPanel.caption.isExplorationBarBeside');
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Advanced Settings"
        .buttons=${[{tag: 'close', text: this.btnText}]}
      >
        <div id="advanced"
          class="advanced-views"
        >
          ${this._paraState.settingControls.getContent('controlPanel.tabs.controls.dialog.settings')}
        </div>
        <div>
          ${this._paraState.settingControls.getContent('controlPanel.tabs.controls.dialog.tabLabels')}
        </div>
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
    'para-advanced-control-settings-dialog': AdvancedControlSettingsDialog;
  }

}