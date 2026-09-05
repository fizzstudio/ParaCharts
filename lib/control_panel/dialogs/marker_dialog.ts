
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
    protected numSettings = 1;
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
                if (this.hasMadeDialog || !this._paraState.thresholds.length) {
                    return;
                }
                this.settingGroupLabels = [];
                if (['line', 'stepline'].includes(this._paraState.type)) {
                    this.numSettings = 2;
                }
                const sortedHorizThresholds = this._paraState.thresholds.filter(t => t.orientation == 'horiz').sort((a, b) => b.align - a.align);
                const sortedVertThresholds = this._paraState.thresholds.filter(t => t.orientation == 'vert').sort((a, b) => a.align - b.align);
                const getLabel = (t: Threshold) => {
                    return t.text ?? t.align;
                }
                const addGroupLabel = (labelText: string) => {
                    this.settingGroupLabels.push(html`<div style="font-weight: bold">${labelText}</div>`);
                }
                const addSettingControls = (id: string) => {
                    this._paraState.settingControls.insert('marker.isChangeThresholdHighlightColor', { instanceID: id }, undefined, undefined, id);
                    if (['line', 'stepline'].includes(this._paraState.type)) {
                        this._paraState.settingControls.insert('marker.isMakeThresholdHighlightDashed', { instanceID: id }, undefined, undefined, id);
                    }
                }
                if (sortedHorizThresholds.length > 0 && sortedVertThresholds.length == 0) {
                    //Only horizontal thresholds
                    for (let i = 0; i < sortedHorizThresholds.length; i++) {
                        const threshold = sortedHorizThresholds[i];
                        const id = `threshold-${i}`;
                        if (i == 0) {
                            addGroupLabel(`Above ${getLabel(threshold)}`);
                        }
                        else {
                            const prevThreshold = sortedHorizThresholds[i - 1];
                            addGroupLabel(`Above ${getLabel(threshold)} but below ${getLabel(prevThreshold)}`);
                        }
                        addSettingControls(id);
                    }
                    const nextId = `threshold-${this._paraState.thresholds.length}`;
                    addGroupLabel(`Below ${getLabel(sortedHorizThresholds.at(-1)!)}`);
                    addSettingControls(nextId);
                }
                else if (sortedHorizThresholds.length == 0 && sortedVertThresholds.length > 0) {
                    //Only vertical thresholds
                    for (let i = 0; i < sortedVertThresholds.length; i++) {
                        const threshold = sortedVertThresholds[i];
                        const id = `threshold-${i}`;
                        if (i == 0) {
                            addGroupLabel(`Left of ${getLabel(threshold)}`);
                        }
                        else {
                            const prevThreshold = sortedVertThresholds[i - 1];
                            addGroupLabel(`Left of ${getLabel(threshold)} but right of ${getLabel(prevThreshold)}`);
                        }
                        addSettingControls(id);
                    }
                    const nextId = `threshold-${this._paraState.thresholds.length}`;
                    addGroupLabel(`Right of ${getLabel(sortedVertThresholds.at(-1)!)}`);
                    addSettingControls(nextId);
                }
                else {
                    //Horizontal and vertical thresholds
                    for (let i = 0; i < sortedHorizThresholds.length + 1; i++) {
                        for (let j = 0; j < sortedVertThresholds.length + 1; j++) {
                            const id = `threshold-${j + i * (sortedVertThresholds.length + 1)}`
                            if (i < sortedHorizThresholds.length && j < sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i];
                                const vertThreshold = sortedVertThresholds[j];
                                if (i == 0 && j == 0) {
                                    addGroupLabel(`Above ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)}`);
                                }
                                else if (i == 0) {
                                    const prevVertThreshold = sortedVertThresholds[j - 1];
                                    addGroupLabel(`Above ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)}`);
                                }
                                else if (j == 0) {
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1];
                                    addGroupLabel(`Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Left of ${getLabel(vertThreshold)}`);
                                }
                                else {
                                    const prevVertThreshold = sortedVertThresholds[j - 1];
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1];
                                    addGroupLabel(`Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)}`);
                                }
                            }
                            else if (i == sortedHorizThresholds.length && j == sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i - 1];
                                const vertThreshold = sortedVertThresholds[j - 1];
                                addGroupLabel(`Below ${getLabel(horizThreshold)}. Right of ${getLabel(vertThreshold)}`);
                            }
                            else if (i == sortedHorizThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i - 1];
                                const vertThreshold = sortedVertThresholds[j];
                                if (j == 0) {
                                    addGroupLabel(`Below ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)}`);
                                }
                                else {
                                    const prevVertThreshold = sortedVertThresholds[j - 1];
                                    addGroupLabel(`Below ${getLabel(horizThreshold)}. Left of ${getLabel(vertThreshold)} but right of ${getLabel(prevVertThreshold)}`);
                                }
                            }
                            else if (j == sortedVertThresholds.length) {
                                const horizThreshold = sortedHorizThresholds[i];
                                const vertThreshold = sortedVertThresholds[j - 1];
                                if (i == 0) {
                                    addGroupLabel(`Above ${getLabel(horizThreshold)}. Right of ${getLabel(vertThreshold)}`);
                                }
                                else {
                                    const prevHorizThreshold = sortedHorizThresholds[i - 1];
                                    addGroupLabel(`Above ${getLabel(horizThreshold)} but below ${getLabel(prevHorizThreshold)}. Right of ${getLabel(vertThreshold)}`);
                                }
                            }
                            addSettingControls(id)
                        }
                    }
                }
                this.hasMadeDialog = true;
            }
        });
    }

    render() {
        const vertLength = this._paraState.thresholds.filter(t => t.orientation == 'horiz').length + 1;
        const horizLength = this._paraState.thresholds.filter(t => t.orientation == 'vert').length + 1;
        const content = this._paraState.settingControls.getContent('controlPanel.tabs.chart.marker.dialog');
        for (let i = 0; i < this.settingGroupLabels.length; i++) {
            const label = this.settingGroupLabels[i];
            const index = i * ((content.length - i) / this.settingGroupLabels.length) + i;
            content.splice(index, 0, label);
        }
        // If either dimension is zero, fall back to the original linear layout.
        const rows = Math.max(1, vertLength);
        const cols = Math.max(1, horizLength);
        if (vertLength === 0 || horizLength === 0) {
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

        // Build cells where each cell contains a label followed by `numSettings` controls.
        const cells: TemplateResult[][] = [];
        const snapshot = content.slice();
        const labelSet = new Set(this.settingGroupLabels);
        const totalCells = rows * cols;
        let cursor = 0;
        for (let i = 0; i < totalCells; i++) {
            // Find next label in the snapshot starting from cursor
            let labelIndex = -1;
            for (let k = cursor; k < snapshot.length; k++) {
                if (labelSet.has(snapshot[k])) {
                    labelIndex = k;
                    break;
                }
            }
            if (labelIndex === -1) {
                // No more labeled groups; push an empty cell
                cells.push([html``]);
                continue;
            }
            const cellItems: TemplateResult[] = [];
            const label = snapshot[labelIndex];
            cellItems.push(label);
            // collect up to numSettings controls after the label
            let collected = 0;
            let scanIndex = labelIndex + 1;
            while (collected < this.numSettings && scanIndex < snapshot.length) {
                const item = snapshot[scanIndex];
                // stop if we hit the next label
                if (labelSet.has(item)) break;
                cellItems.push(item);
                collected++;
                scanIndex++;
            }
            // advance cursor to scanIndex for next search
            cursor = scanIndex;
            cells.push(cellItems);
        }

        return html`
            <fizz-dialog
                ${ref(this._dialogRef)}
                title="Marker Settings"
                .buttons=${[{ tag: 'cancel', text: this.btnText }]}
            >
                <table style="width:100%; border-collapse:collapse;">
                    ${Array.from({ length: rows }).map((_, r) => {
            const rowCells = cells.slice(r * cols, r * cols + cols);
            return html`<tr>
                        ${rowCells.map(cellItems =>
                html`<td style="padding:8px;border:1px solid var(--fizz-border,#e6e6e6);vertical-align:top">
                            ${cellItems.length ? html`<div>
                                <div style="text-align:center;margin-bottom:6px">
                                ${cellItems[0]}
                                </div>
                                ${cellItems.slice(1).map(i => html`<div style="margin-top:6px">${i}</div>`)}
                                </div>` : html``}</td>`)}
                            </tr>`;
        })}
                </table>
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