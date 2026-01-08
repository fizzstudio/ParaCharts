
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
    #controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._store.settingControls.add({
      type: 'radio',
      key: 'controlPanel.tabLabelStyle',
      label: 'Tab label style',
      options: {
        buttons: {
          icon: {
            label: 'Icon only'
          },
          iconLabel: {
            label: 'Icon and label'
          },
          label: {
            label: 'Label only'
          }
        },
        layout: 'horiz'
      },
      parentView: 'controlPanel.tabs.controls.dialog.tabLabels'
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'controlPanel.isCaptionVisible',
      label: 'Caption visible',
      parentView: 'controlPanel.tabs.controls.dialog.settings',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'controlPanel.isExplorationBarVisible',
      label: 'Exploration bar visible',
      parentView: 'controlPanel.tabs.controls.dialog.settings',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'controlPanel.caption.isCaptionExternalWhenControlPanelClosed',
      label: 'Caption external when control panel closed',
      parentView: 'controlPanel.tabs.controls.dialog.settings',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'controlPanel.caption.isExplorationBarBeside',
      label: 'Exploration bar is beside caption',
      parentView: 'controlPanel.tabs.controls.dialog.settings',
    });
  }

  render() {
    return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Advanced Settings"
        .buttons=${[{tag: 'cancel', text: this.btnText}]}
      >
        <div id="controls">
          <div id="advanced"
            class="advanced-views"
          >
            ${this._store.settingControls.getContent('controlPanel.tabs.controls.dialog.settings')}
          </div>
          <div>
            ${this._store.settingControls.getContent('controlPanel.tabs.controls.dialog.tabLabels')}
          </div>
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
    'para-advanced-control-settings-dialog': AdvancedControlSettingsDialog;
  }

}