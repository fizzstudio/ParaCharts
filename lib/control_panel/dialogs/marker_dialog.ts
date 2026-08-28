
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css, svg, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';



/**
 * @public
 */
@customElement('para-marker-settings-dialog')
export class MarkerSettingsDialog extends SettingControlContainer {

    protected _dialogRef = createRef<ui.Dialog>();
    protected settingGroupLabels: TemplateResult[] = []
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
                this.settingGroupLabels = [];
                if (!this._paraState.thresholds.length) {
                    return/*
                    this._paraState.settingControls.insert('marker.highlightStyle');
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor');
                    this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed');
                    */
                }
                for (let i = 0; i < this._paraState.thresholds.length; i++) {
                    const threshold = this._paraState.thresholds[i]
                    //this._paraState.settingControls.insert('marker.highlightStyle', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                    if (i == 0) {
                        this.settingGroupLabels.push(svg`Above ${threshold.label ?? threshold.align}`)
                    }
                    else {
                        this.settingGroupLabels.push(svg`Above ${threshold.label ?? threshold.align} but below ${this._paraState.thresholds[i - 1].label ?? this._paraState.thresholds[i - 1].align}`)
                    }
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                    this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: threshold.id }, undefined, undefined, threshold.id);
                }
                const nextId = `threshold-${this._paraState.thresholds.length}`;
                //this._paraState.settingControls.insert('marker.highlightStyle', { instanceID: nextId }, undefined, undefined, nextId);
                this.settingGroupLabels.push(svg`Below ${this._paraState.thresholds.at(-1)!.label ?? this._paraState.thresholds.at(-1)!.align}`)
                this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: nextId }, undefined, undefined, nextId);
                this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: nextId }, undefined, undefined, nextId);
            }
        });
    }

    render() {
        const content = this._paraState.settingControls.getContent('controlPanel.tabs.chart.marker.dialog');
        for (let i = 0; i < this.settingGroupLabels.length; i++) {
            const label = this.settingGroupLabels[i];
            const index = i * ((content.length - i) / this.settingGroupLabels.length) + i;
            content.splice(index, 0, label);
        }
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Marker Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${content}
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