
import { SettingControlContainer } from '../setting_control_container';

import * as ui from '@fizz/ui-components';

import { html, css, svg, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { Threshold } from '../../view/layers/annotation/threshold';



/**
 * @public
 */
@customElement('para-marker-settings-dialog')
export class MarkerSettingsDialog extends SettingControlContainer {

    protected _dialogRef = createRef<ui.Dialog>();
    protected settingGroupLabels: TemplateResult[] = []
    protected hasMadeDialog = false;
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
                if (this.hasMadeDialog) {
                    return;
                }
                this.settingGroupLabels = [];
                if (!this._paraState.thresholds.length) {
                    return;
                }
                const sortedHorizThresholds = this._paraState.thresholds.filter(t => t.orientation == 'horiz').sort((a, b) => b.align - a.align);
                const sortedVertThresholds = this._paraState.thresholds.filter(t => t.orientation == 'vert').sort((a, b) => a.align - b.align);
                const getLabel = (t: Threshold) => {
                    return t.text ?? t.align;
                }
                if (sortedHorizThresholds.length > 0 && sortedVertThresholds.length == 0) {
                    for (let i = 0; i < sortedHorizThresholds.length; i++) {
                        const threshold = sortedHorizThresholds[i];
                        const id = `threshold-${i}`
                        if (i == 0) {
                            this.settingGroupLabels.push(svg`Above ${threshold.text ?? threshold.align}`)
                        }
                        else {
                            this.settingGroupLabels.push(svg`Above ${threshold.text ?? threshold.align} but below ${sortedHorizThresholds[i - 1].text ?? sortedHorizThresholds[i - 1].align}`)
                        }
                        this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: id }, undefined, undefined, id);
                        if (['line', 'stepline'].includes(this._paraState.type)) {
                            this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: id }, undefined, undefined, id);
                        }

                    }
                    const nextId = `threshold-${this._paraState.thresholds.length}`;
                    this.settingGroupLabels.push(svg`Below ${this._paraState.thresholds.at(-1)!.text ?? this._paraState.thresholds.at(-1)!.align}`)
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: nextId }, undefined, undefined, nextId);
                    if (['line', 'stepline'].includes(this._paraState.type)) {
                        this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: nextId }, undefined, undefined, nextId);
                    }

                }
                else if (sortedHorizThresholds.length == 0 && sortedVertThresholds.length > 0) {
                    for (let i = 0; i < sortedVertThresholds.length; i++) {
                        const threshold = sortedVertThresholds[i];
                        const id = `threshold-${i}`
                        if (i == 0) {
                            this.settingGroupLabels.push(svg`Left of ${threshold.text ?? threshold.align}`)
                        }
                        else {
                            this.settingGroupLabels.push(svg`Left of ${threshold.text ?? threshold.align} but right of ${sortedVertThresholds[i - 1].text ?? sortedVertThresholds[i - 1].align}`)
                        }
                        this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: id }, undefined, undefined, id);
                        if (['line', 'stepline'].includes(this._paraState.type)) {
                            this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: id }, undefined, undefined, id);
                        }

                    }
                    const nextId = `threshold-${this._paraState.thresholds.length}`;
                    this.settingGroupLabels.push(svg`Right of ${sortedVertThresholds.at(-1)!.text ?? sortedVertThresholds.at(-1)!.align}`)
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: nextId }, undefined, undefined, nextId);
                    if (['line', 'stepline'].includes(this._paraState.type)) {
                        this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: nextId }, undefined, undefined, nextId);
                    }
                }
                else {
                    for (let i = 0; i < sortedHorizThresholds.length + 1; i++) {
                        for (let j = 0; j < sortedVertThresholds.length + 1; j++) {
                            const id = `threshold-${j + i * (sortedVertThresholds.length + 1)}`
                            if (i < sortedHorizThresholds.length && j < sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i];
                                const vertThreshold = sortedVertThresholds[j];
                                if (i == 0 && j == 0) {
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)} </div>`)
                                }
                                else if (i == 0) {
                                    const prevVertThreshold = sortedVertThresholds[j - 1]
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)} </div>`)
                                }
                                else if (j == 0) {
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1]
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Left of ${getLabel(vertThreshold)} </div>`)
                                }
                                else {
                                    const prevVertThreshold = sortedVertThresholds[j - 1]
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1]
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)} </div>`)
                                }
                            }
                            else if (i == sortedHorizThresholds.length && j == sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i - 1];
                                const vertThreshold = sortedVertThresholds[j - 1];
                                this.settingGroupLabels.push(html`<div style="font-weight: bold">Below ${getLabel(horizThreshold)}. Right of ${getLabel(vertThreshold)}</div>`)
                            }
                            else if (i == sortedHorizThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i - 1];
                                const vertThreshold = sortedVertThresholds[j];
                                if (j == 0) {
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Below ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)}</div>`)
                                }
                                else {
                                    const prevVertThreshold = sortedVertThresholds[j - 1]
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Below ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)}</div>`)
                                }
                            }
                            else if (j == sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i];
                                const vertThreshold = sortedVertThresholds[j - 1];
                                if (i == 0) {
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)}. Right of ${getLabel(vertThreshold)}</div>`)
                                }
                                else {
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1]
                                    this.settingGroupLabels.push(html`<div style="font-weight: bold">Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Right of ${getLabel(vertThreshold)}</div>`)
                                }
                            }
                            this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: id }, undefined, undefined, id);
                            if (['line', 'stepline'].includes(this._paraState.type)) {
                                this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: id }, undefined, undefined, id);
                            }
                        }
                    }
                }
                this.hasMadeDialog = true;
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