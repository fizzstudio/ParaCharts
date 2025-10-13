import { Vec2 } from "../common/vector";
import { ParaView } from "../paraview";
import { View } from "./base_view";
import { Label, LabelOptions } from "./label";
import { PathOptions, PathShape, ShapeOptions } from "./shape";
import { ParaComponent } from "../components";
import { fixed, logging } from "../common";
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';
import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { GridLayout } from "./layout";
import { DataSymbol, DataSymbolType } from "./symbol";
import { LegendItem } from "./legend";

export interface PopupLabelOptions extends LabelOptions {
    color?: number;
    margin?: number;
    type?: string;


    items?: LegendItem[]
}

export type ShapeTypes = "box" | "boxWithArrow";

export interface PopupShapeOptions extends ShapeOptions {
    shape?: ShapeTypes
}

const BOX_ARROW_HEIGHT = 10

export class Popup extends View {
    protected _label: Label;
    protected _box: PathShape;
    protected _grid: GridLayout;
    protected leftPadding = this.paraview.store.settings.popup.leftPadding;
    protected rightPadding = this.paraview.store.settings.popup.rightPadding;
    protected downPadding = this.paraview.store.settings.popup.downPadding;
    protected upPadding = this.paraview.store.settings.popup.upPadding;
    protected horizShift = 0;
    protected arrowPosition: "up" | "bottom" | "left" | "right" = "bottom";

    get label() {
        return this._label;
    }

    get box() {
        return this._box;
    }

    get margin() {
        return this.popupLabelOptions.margin ?? this.paraview.store.settings.popup.margin
    }

    constructor(paraview: ParaView, private popupLabelOptions: PopupLabelOptions, private popupShapeOptions: PopupShapeOptions) {
        super(paraview);
        this.applyDefaults()
        this._label = new Label(this.paraview, this.popupLabelOptions)
        if (this.paraview.store.settings.popup.backgroundColor === "dark") {
            this._label.styleInfo = {
                stroke: 'none',
                fill: this.popupLabelOptions.type == "chord" ? "black" : this.paraview.store.colors.contrastValueAt(this.popupLabelOptions.color!)
            };
        }
        if (this.paraview.store.settings.ui.isLowVisionModeEnabled) {
            this._label.styleInfo = {
                stroke: 'none',
                fill: "black"
            };
        }

        let views = []
        if (popupLabelOptions.type === "chord") {
            this.arrowPosition = "left"
            this._label.x += this._label.width / 2 + BOX_ARROW_HEIGHT + this.leftPadding
            //this._label.y = this.paraview.documentView?.chartLayers.dataLayer.height! / 2
            let rowGaps = []
            for (let i = 0; i < this.popupLabelOptions.items!.length - 1; i++) {
                rowGaps.push(6)
            }
            this._grid = new GridLayout(this.paraview, {
                numCols: 2,
                colGaps: [15],
                rowGaps: rowGaps,
                colAligns: ['center', "start"],
                isAutoWidth: true,
                isAutoHeight: true
            }, 'popup-grid');
            this.popupLabelOptions.items!.forEach((item, i) => {
                views.push(DataSymbol.fromType(
                    this.paraview,
                    this.paraview.store.settings.chart.isDrawSymbols
                        ? (item.symbol ?? 'square.solid')
                        : 'square.solid',
                    {
                        color: item.color
                    }
                ));
                const text = popupLabelOptions.text;
                const lines = text.split(/\r?\n|\r/);
                views.push(new Label(this.paraview, {
                    text: lines[i],
                    x: 0,
                    y: 0,
                    wrapWidth: this.popupLabelOptions.wrapWidth,
                    textAnchor: 'start'
                }));
            });
            //console.log(this.popupLabelOptions.items)
            //console.log(this.paraview.documentView?.chartLayers.dataLayer.chartInfo.navMap!.cursor)
            
        }
        else {
            this._grid = new GridLayout(this.paraview, {
                numCols: 1,
                colAligns: ['start'],
                isAutoWidth: true,
                isAutoHeight: true
            }, 'popup-grid');
            views.push(this._label)
        }
        this.shiftLabel()
        //I'm not totally sure why, but you have to subtract the height of a single line of text at default font size
        //instead of any multiple lines that the label text may have
        this._grid.y = this._label.y - new Label(this.paraview, { text: "text" }).height
        this._grid.x = this._label.x - this._label.width / 2
        views.forEach(v => this._grid.append(v));
        this.append(this._grid)
        this._box = this.generateBox(popupShapeOptions)
        this.append(this._box)

        //The box generation relies on the grid having set dimensions, which happens during append()
        //but we also need the box to render behind the grid
        this._children.unshift(this._box);
        this._children.pop();

        if (popupLabelOptions.id) {
            this.id = popupLabelOptions.id;
        }
    }

    applyDefaults() {
        if (!this.popupLabelOptions.color) {
            this.popupLabelOptions.color = 0
        }
        if (this.popupLabelOptions.y) {
            this.popupLabelOptions.y -= this.margin
        }
        if (!this.popupLabelOptions.wrapWidth) {
            this.popupLabelOptions.wrapWidth = this.paraview.store.settings.popup.maxWidth
        }
        if (!this.popupShapeOptions.fill) {
            this.popupShapeOptions.fill = this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color), 6)
                    : this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color)
        }
        if (!this.popupShapeOptions.stroke) {
            this.popupShapeOptions.stroke = this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color)
                    : "black"
        }
        if (!this.paraview.store.settings.ui.isLowVisionModeEnabled) {
            this.popupShapeOptions.fill = `${this.popupShapeOptions.fill.slice(0, -1)}, ${this.paraview.store.settings.popup.opacity})`
        }
        if (!this.popupShapeOptions.shape) {
            this.popupShapeOptions.shape = this.paraview.store.settings.popup.shape
        }
    }

    shiftLabel() {
        if (this.label.right + this.rightPadding > this.paraview.documentView!.chartLayers.width) {
            if (this.popupLabelOptions.type === "chord") {
                this.arrowPosition = "right"
                //this.popupLabelOptions.x = this.label.x - (this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5)
                //console.log(JSON.parse(JSON.stringify(this._label.width)))
                //this.popupLabelOptions.x = this.popupLabelOptions.x! - this._label.width - BOX_ARROW_HEIGHT - this.leftPadding + this.rightPadding + 50
                this.popupLabelOptions.x = this.label.x - BOX_ARROW_HEIGHT - this.leftPadding - this.label.width / 2 - 112
                this.horizShift = Math.min((this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5), this.label.width / 2 - 5)
                this._label = new Label(this.paraview, this.popupLabelOptions)
            }
            else {
                this.popupLabelOptions.x = this.label.x - (this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5)
                this.horizShift = Math.min((this.label.right + this.rightPadding - this.paraview.documentView!.chartLayers.width + 5), this.label.width / 2 - 5)
                this._label = new Label(this.paraview, this.popupLabelOptions)
            }
        }
        if (this.label.left - this.leftPadding < 0) {
            this.popupLabelOptions.x = this.label.x + (this.leftPadding - this.label.left + 5)
            this.horizShift = - Math.min((this.leftPadding - this.label.left + 5), this.label.width / 2 - 5)
            this._label = new Label(this.paraview, this.popupLabelOptions)
        }
        //Note shifting the label up away from the datapoint in the event of text wrap
        //has lower priority than shifting it down from the top of the screen
        if (this.label.y - this.label.bottom < 0) {
            this.label.y += (this.label.y - this.label.bottom)
        }
        if (this.label.top < 0) {
            this.label.y += (2 * this.margin + this.label.height)
            if (this.popupLabelOptions.type !== "chord") {
                this.arrowPosition = "up"
            }

        }
    }

    generateBox(options: PopupShapeOptions) {
        let boxType = options.shape ?? "box"
        let grid = this._grid
        let y = grid.bottom
        let x = grid.x
        let width = grid.width
        let height = grid.height
        if (boxType === "boxWithArrow") {
            if (this.arrowPosition == "bottom") {
                let shape = new PopupPathShape(this.paraview, {
                    points: [new Vec2(x - this.leftPadding, y - height - this.upPadding),
                    new Vec2(x - this.leftPadding, y + this.downPadding),

                    new Vec2(x + width / 2 - Math.min(width / 4, 15) + this.horizShift, y + this.downPadding),
                    new Vec2(x + width / 2 + this.horizShift, y + this.downPadding + BOX_ARROW_HEIGHT),
                    new Vec2(x + width / 2 + Math.min(width / 4, 15) + this.horizShift, y + this.downPadding),

                    new Vec2(x + width + this.rightPadding, y + this.downPadding),
                    new Vec2(x + width + this.rightPadding, y - height - this.upPadding),
                    new Vec2(x - this.leftPadding, y - height - this.upPadding)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "down"
                })
                return shape
            }
            else if (this.arrowPosition == "right") {
                let shape = new PopupPathShape(this.paraview, {
                    points:
                        [new Vec2(x - this.leftPadding, y - height - this.upPadding),
                        new Vec2(x - this.leftPadding, y + this.downPadding),
                        new Vec2(x + width + this.rightPadding, y + this.downPadding),

                        new Vec2(x + width + this.rightPadding, y - height / 2 + Math.min(height / 4, 15)),
                        new Vec2(x + width + this.rightPadding + BOX_ARROW_HEIGHT, y - height / 2),
                        new Vec2(x + width + this.rightPadding, y - height / 2 - Math.min(height / 4, 15)),


                        new Vec2(x + width + this.rightPadding, y - height - this.upPadding),
                        new Vec2(x - this.leftPadding, y - height - this.upPadding)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "right"
                })
                return shape
            }
            else if (this.arrowPosition == "left") {
                let shape = new PopupPathShape(this.paraview, {
                    points:
                        [new Vec2(x - this.leftPadding, y - height - this.upPadding),


                        new Vec2(x - this.leftPadding, y - height / 2 - Math.min(height / 4, 15)),
                        new Vec2(x - this.leftPadding - BOX_ARROW_HEIGHT, y - height / 2),
                        new Vec2(x - this.leftPadding, y - height / 2 + Math.min(height / 4, 15)),

                        new Vec2(x - this.leftPadding, y + this.downPadding),
                        new Vec2(x + width + this.rightPadding, y + this.downPadding),
                        new Vec2(x + width + this.rightPadding, y - height - this.upPadding),
                        new Vec2(x - this.leftPadding, y - height - this.upPadding)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "left"
                })
                return shape
            }
            else {
                let shape = new PopupPathShape(this.paraview, {
                    points: [new Vec2(x - this.leftPadding, y - height - this.upPadding),
                    new Vec2(x - this.leftPadding, y + this.downPadding),
                    new Vec2(x + width + this.rightPadding, y + this.downPadding),
                    new Vec2(x + width + this.rightPadding, y - height - this.upPadding),

                    new Vec2(x + width / 2 + Math.min(width / 4, 15) + this.horizShift, y - height - this.upPadding),
                    new Vec2(x + width / 2 + this.horizShift, y - height - this.upPadding - BOX_ARROW_HEIGHT),
                    new Vec2(x + width / 2 + - Math.min(width / 4, 15) + this.horizShift, y - height - this.upPadding),

                    new Vec2(x - this.leftPadding, y - height - this.upPadding)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "up"
                })
                return shape
            }
        }
        else {
            let shape = new PopupPathShape(this.paraview, {
                points: [new Vec2(x - this.leftPadding, y - height - this.upPadding),
                new Vec2(x - this.leftPadding, y + this.downPadding),
                new Vec2(x + width + this.rightPadding, y + this.downPadding),
                new Vec2(x + width + this.rightPadding, y - height - this.upPadding),
                new Vec2(x - this.leftPadding, y - height - this.upPadding)],
                fill: options.fill,
                stroke: options.stroke,
                shape: "box"
            })
            return shape
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
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'textfield',
            key: 'popup.borderRadius',
            label: 'Border radius',
            options: {
                inputType: 'number',
                min: 0,
                max: 20
            },
            parentView: 'controlPanel.tabs.chart.dialog.popups',
        });
        this._store.settingControls.add({
            type: 'dropdown',
            key: 'popup.backgroundColor',
            label: 'Color mode',
            options: {
                options: ["dark", "light"]
            },
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

export interface PopupPathOptions extends PathOptions {
    shape: ShapeTypes
    arrowPosition?: "up" | "down" | "right" | "left"
}
export class PopupPathShape extends PathShape {
    shape: ShapeTypes
    constructor(paraview: ParaView, private options: PopupPathOptions) {
        super(paraview, options);
        this._points = options.points.map(p => p.clone());
        this.shape = this.options.shape
    }

    //This defines which points on shapes are curved/border-radiused
    //0 === hard corner, 1 === curve, the first and last numbers should match because they apply to the same point
    protected curvePoints: {
        "boxWithArrow": number[],
        "boxWithDownArrow": number[],
        "boxWithUpArrow": number[],
        "boxWithRightArrow": number[],
        "boxWithLeftArrow": number[],
        "box": number[]
    } = {
            "boxWithArrow": [1, 1, 0, 0, 0, 1, 1, 1],
            "boxWithDownArrow": [1, 1, 0, 0, 0, 1, 1, 1],
            "boxWithUpArrow": [1, 1, 1, 1, 0, 0, 0, 1],
            "boxWithRightArrow": [1, 1, 1, 0, 0, 0, 1, 1],
            "boxWithLeftArrow": [1, 0, 0, 0, 1, 1, 1, 1],
            "box": [1, 1, 1, 1, 1]
        }

    protected get _pathD() {
        const rad = this.paraview.store.settings.popup.borderRadius
        let addCurve;
        if (this.shape == "boxWithArrow" && this.options.arrowPosition === "up") {
            addCurve = this.curvePoints["boxWithUpArrow"]
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "down") {
            addCurve = this.curvePoints["boxWithDownArrow"]
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "right") {
            addCurve = this.curvePoints["boxWithRightArrow"]
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "left") {
            addCurve = this.curvePoints["boxWithLeftArrow"]
        }
        else {
            addCurve = this.curvePoints[this.shape]
        }
        const relPoints = this._points.map(p => p.add(this._loc));
        let d = fixed``
        if (!addCurve[0] || relPoints[0] == relPoints[1]) {
            d += fixed`M${relPoints[0].x},${relPoints[0].y}`;
        }
        else {
            let p = relPoints[0]
            let nextP = relPoints[(0 + 1) % relPoints.length]
            let diffX1 = Math.sign(p.x - nextP.x)
            let diffY1 = Math.sign(p.y - nextP.y)
            d += fixed`M${p.x - diffX1 * rad},${p.y - diffY1 * rad}`;
        }
        for (let i = 1; i < relPoints.length; i++) {
            let p = relPoints[i % relPoints.length]
            //console.log(((relPoints[i].x == relPoints[(i+1) % relPoints.length].x && relPoints[i].y == relPoints[(i+1) % relPoints.length].y) && i !== relPoints.length - 1))
            if (!addCurve[i % relPoints.length] || ((relPoints[i].x == relPoints[(i + 1) % relPoints.length].x && relPoints[i].y == relPoints[(i + 1) % relPoints.length].y) && i !== relPoints.length - 1)) {
                d += fixed`L${p.x},${p.y}`;
            }
            else {
                let prevP = relPoints[(i - 1 + relPoints.length) % relPoints.length]
                //This line looks like it does because ._points stores the same point twice
                //and this is the easiest way to correct for it
                let nextP = relPoints[(i + 1 + (i === relPoints.length - 1 ? 1 : 0)) % relPoints.length]
                let diffX1 = Math.sign(p.x - prevP.x)
                let diffY1 = Math.sign(p.y - prevP.y)
                let diffX2 = Math.sign(nextP.x - p.x)
                let diffY2 = Math.sign(nextP.y - p.y)
                d += fixed`L${p.x - diffX1 * rad},${p.y - diffY1 * rad}`;
                d += fixed`A ${rad}, ${rad}, 0, 0, 0, ${p.x + diffX2 * rad}, ${p.y + diffY2 * rad}`
            }
        }
        return d;
    }
}