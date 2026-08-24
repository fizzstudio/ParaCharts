
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
        document.addEventListener('paranotice', (e: CustomEvent<any>) => {
            if (e.detail.key === 'docView created') {
                if (!this._paraState._legends.length) {
                    const id = `legend-${0}`;
                    this._paraState.settingControls.insert('legend.isAlwaysDrawLegend', { instanceID: id }, undefined, undefined, id);
                    this._paraState.settingControls.insert('legend.itemOrder', { instanceID: id }, undefined, undefined, id);
                    this._paraState.settingControls.insert('legend.position', { instanceID: id }, undefined, undefined, id);
                    if (['bar', 'column', 'line'].includes(this._paraState.type)) {
                        this._paraState.settingControls.insert('legend.useDirectLegends', { instanceID: id }, undefined, undefined, id);
                    }
                }
                for (let legend of this._paraState._legends) {
                    this._paraState.settingControls.insert('legend.isAlwaysDrawLegend', { instanceID: legend.id }, undefined, undefined, legend.id);
                    this._paraState.settingControls.insert('legend.itemOrder', { instanceID: legend.id }, undefined, undefined, legend.id);
                    this._paraState.settingControls.insert('legend.position', { instanceID: legend.id }, undefined, undefined, legend.id);
                    if (['bar', 'column', 'line'].includes(this._paraState.type)) {
                        this._paraState.settingControls.insert('legend.useDirectLegends', { instanceID: legend.id }, undefined, undefined, legend.id);
                    }
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