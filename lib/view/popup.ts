import { Vec2 } from "../common/vector";
import { ParaView } from "../paraview";
import { View } from "./base_view";
import { Label, LabelOptions } from "./label";
import { PathShape, ShapeOptions } from "./shape";
import { ParaComponent } from "../components";
import { logging } from "../common";
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';
import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

export interface PopupLabelOptions extends LabelOptions {

}

export interface PopupShapeOptions extends ShapeOptions {
    shape?: "box" | "boxWithArrow"
}




export class Popup extends View {
    protected label: Label;
    protected box: PathShape;
    protected leftPadding = this.paraview.store.settings.popup.leftPadding;
    protected rightPadding = this.paraview.store.settings.popup.rightPadding;
    protected downPadding = this.paraview.store.settings.popup.downPadding;
    protected upPadding = this.paraview.store.settings.popup.upPadding;
    protected horizShift = 0;


    constructor(paraview: ParaView, private popupLabelOptions: PopupLabelOptions, private popupShapeOptions: PopupShapeOptions) {
        super(paraview);
        if (this.popupLabelOptions.y) {
            this.popupLabelOptions.y -= this.paraview.store.settings.popup.margin
        }
        if (!this.popupLabelOptions.wrapWidth) {
            this.popupLabelOptions.wrapWidth = this.paraview.store.settings.popup.maxWidth
        }
        this.label = new Label(this.paraview, this.popupLabelOptions)
        this.shiftLabel()

        if (this.popupShapeOptions.fill) {
            this.popupShapeOptions.fill = `${this.popupShapeOptions.fill.slice(0, -1)}, ${this.paraview.store.settings.popup.opacity})`
        }
        if (!this.popupShapeOptions.shape) {
            this.popupShapeOptions.shape = this.paraview.store.settings.popup.shape
        }
        this.box = this.generateBox(popupShapeOptions)

        this.append(this.box)
        this.append(this.label)
        if (popupLabelOptions.id) {
            this.id = popupLabelOptions.id;
        }
    }

    generateBox(options: PopupShapeOptions) {
        let boxType = options.shape ?? "box"
        let label = this.label
        let y = label.bottom
        let x = label.x
        let width = label.width
        let height = label.height
        if (boxType === "boxWithArrow") {
            let shape = new PathShape(this.paraview, {
                points: [new Vec2(x - width / 2 - this.leftPadding, y - height - this.upPadding),
                new Vec2(x - width / 2 - this.leftPadding, y + this.downPadding),

                new Vec2(x - Math.min(width / 4, 15) + this.horizShift, y + this.downPadding),
                new Vec2(x + this.horizShift, y + this.downPadding + 10),
                new Vec2(x + Math.min(width / 4, 15) + this.horizShift, y + this.downPadding),

                new Vec2(x + width / 2 + this.rightPadding, y + this.downPadding),
                new Vec2(x + width / 2 + this.rightPadding, y - height - this.upPadding),
                new Vec2(x - width / 2 - this.leftPadding, y - height - this.upPadding)],
                fill: options.fill,
                stroke: options.stroke,
            })
            return shape
        }
        else {
            let shape = new PathShape(this.paraview, {
                points: [new Vec2(x - width / 2 - this.leftPadding, y - height - this.upPadding),
                new Vec2(x - width / 2 - this.leftPadding, y + this.downPadding),
                new Vec2(x + width / 2 + this.rightPadding, y + this.downPadding),
                new Vec2(x + width / 2 + this.rightPadding, y - height - this.upPadding),
                new Vec2(x - width / 2 - this.leftPadding, y - height - this.upPadding)],
                fill: options.fill,
                stroke: options.stroke,
            })
            return shape
        }
    }

    shiftLabel() {
        if (this.label.right + this.rightPadding > this.paraview.documentView!.chartLayers.width) {
            this.popupLabelOptions.x = this.label.x - (this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5)
            this.horizShift = Math.min((this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5), this.label.width / 2 - 5)
            this.label = new Label(this.paraview, this.popupLabelOptions)
        }
        if (this.label.left - this.leftPadding < 0) {
            this.popupLabelOptions.x = this.label.x + (this.leftPadding - this.label.left + 5)
            this.horizShift = - Math.min((this.leftPadding - this.label.left + 5), this.label.width / 2 - 5)
            this.label = new Label(this.paraview, this.popupLabelOptions)
        }
        //Note shifting the label up away from the datapoint in the event of text wrap
        //has lower priority than shifting it down from the top of the screen
        if (this.label.y - this.label.bottom < 0) {
            this.label.y += (this.label.y - this.label.bottom)
        }
        if (this.label.top < 0) {
            this.label.y -= (this.label.top)
        }
    }
}

/**
 * @public
 */
@customElement('para-popup-settings-dialog')
export class PopupSettingsDialog extends logging(ParaComponent) {

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
            type: 'dropdown',
            key: 'popup.shape',
            label: 'Shape',
            options: { options: ["box", "boxWithArrow"] },
            parentView: 'controlPanel.tabs.chart.dialog.popups'
        });
        this._store.settingControls.add({
            type: 'dropdown',
            key: 'popup.activation',
            label: 'Activate popups on',
            options: { options: ["onHover", "onFocus", "onSelect"] },
            parentView: 'controlPanel.tabs.chart.dialog.popups'
        });
        this._store.settingControls.add({
            type: 'slider',
            key: 'popup.opacity',
            label: 'Opacity',
            options: {
                min: 0,
                max: 1,
                //highBound: this._store.settings.sonification.hertzUpper - 1,
                step: .1
            },
            parentView: 'controlPanel.tabs.chart.dialog.popups'
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.maxWidth',
            label: 'Max width',
            options: {
                inputType: 'number',
                min: 0,
                max: 300
            },
            value: 150,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.leftPadding',
            label: 'Left padding',
            options: {
                inputType: 'number',
                min: 0,
                max: 100
            },
            value: 10,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.rightPadding',
            label: 'Right padding',
            options: {
                inputType: 'number',
                min: 0,
                max: 100
            },
            value: 10,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.upPadding',
            label: 'Up padding',
            options: {
                inputType: 'number',
                min: 0,
                max: 100
            },
            value: 10,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.downPadding',
            label: 'Down padding',
            options: {
                inputType: 'number',
                min: 0,
                max: 100
            },
            value: 10,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.margin',
            label: 'Vertical margin',
            options: {
                inputType: 'number',
                min: 0,
                max: 100
            },
            value: 40,
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });

    }

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Popup Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        <div id="controls">
          <div id="popup-settings"
            class="popup-views"
          >
            ${this._store.settingControls.getContent('controlPanel.tabs.chart.dialog.popups')}
          </div>
        </div>
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
        'para-popup-settings-dialog': PopupSettingsDialog;
    }
}