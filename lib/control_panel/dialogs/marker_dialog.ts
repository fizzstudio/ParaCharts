
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-marker-settings-dialog')
export class MarkerSettingsDialog extends SettingControlContainer {

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
                if (!this._paraState.thresholds.length) {
                    return/*
                    this._paraState.settingControls.insert('marker.highlightStyle');
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor');
                    this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed');
                    */
                }
                for (let threshold of this._paraState.thresholds) {
                    this._paraState.settingControls.insert('marker.highlightStyle', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                    this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                }
            }
        });
    }

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Marker Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.marker.dialog')}
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
        'para-marker-settings-dialog': MarkerSettingsDialog;
    }

}