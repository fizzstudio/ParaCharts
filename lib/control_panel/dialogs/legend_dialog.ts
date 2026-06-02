
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-legend-settings-dialog')
export class LegendSettingsDialog extends SettingControlContainer {

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
        this._paraState.settingControls.insert('legend.isAlwaysDrawLegend');
        this._paraState.settingControls.insert('legend.itemOrder');
        this._paraState.settingControls.insert('legend.position');
        document.addEventListener('paranotice', (e: CustomEvent<any>) => {
            if (e.detail.value.key === 'manifestSet') {
                if (['bar', 'column', 'line'].includes(this._paraState.type)) {
                    this._paraState.settingControls.insert('legend.useDirectLegends');
                }
            }
        });
    }

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Legend Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.legend.dialog')}
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
        'para-legend-settings-dialog': LegendSettingsDialog;
    }

}