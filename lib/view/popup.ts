import { Vec2 } from "../common/vector";
import { ParaView } from "../paraview";
import { View } from "./base_view";
import { Label, LabelOptions } from "./label";
import { PathOptions, PathShape, ShapeOptions } from "./shape";
import { ParaComponent } from "../components";
import { fixed } from "../common";
import { Logger, getLogger } from '../common/logger';
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';
import { html, css, svg } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { GridLayout } from "./layout";
import { DataSymbol, DataSymbolType } from "./symbol";
import { LegendItem } from "./legend";
import { DatapointView } from "./data";

export interface PopupLabelOptions extends LabelOptions {
    color?: number;
    margin?: number;
    type?: string;
    items?: LegendItem[];
    points?: DatapointView[];
    inbounds?: boolean;
    fill?: string;
    rotationExempt?: boolean
}

export type ShapeTypes = "box" | "boxWithArrow";

export interface PopupShapeOptions extends ShapeOptions {
    shape?: ShapeTypes
}

//NB: this refers to how far the arrow sticks out of the box
//even when it's on the side and width might be a more accurate word
const BOX_ARROW_HEIGHT = 10
//Similarly, this always refers to the distance between the point of the arrow and where it 
//meets the box along whatever primary axis is being used
const BOX_ARROW_WIDTH = 15
const DEFAULT_CHORD_POPUP_LINE_WIDTH = 6

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
    protected _wrapWidth: number = this.paraview.store.settings.popup.maxWidth;

    get grid() {
        return this._grid;
    }

    get label() {
        return this._label;
    }

    get box() {
        return this._box;
    }

    get margin() {
        return this.popupLabelOptions.margin ?? this.paraview.store.settings.popup.margin;
    }

    get wrapWidth() {
        return this._wrapWidth
    }

    set wrapWidth(num: number) {
        this._wrapWidth = num;
    }

    get text() {
        return this.popupLabelOptions.text;
    }


    constructor(paraview: ParaView, private popupLabelOptions: PopupLabelOptions, private popupShapeOptions: PopupShapeOptions) {
        super(paraview);
        this.applyDefaults();
        this._label = new Label(this.paraview, this.popupLabelOptions)
        if (this.paraview.store.settings.popup.backgroundColor === "dark") {
            this._label.styleInfo = {
                stroke: 'none',
                fill: this.popupLabelOptions.fill ? this.popupLabelOptions.fill
                    : this.popupLabelOptions.type == "chord" ? "black"
                        : this.paraview.store.colors.contrastValueAt(this.popupLabelOptions.color!)
            };
        }
        if (this.paraview.store.settings.ui.isLowVisionModeEnabled) {
            this._label.styleInfo = {
                stroke: 'none',
                fill: "black"
            };
        }

        this._grid = this.generateGrid();
        if (this.popupLabelOptions.inbounds) {
            this.shiftGrid();
        }

        this.append(this._grid);
        this._box = this.generateBox(popupShapeOptions);
        this.append(this._box);


        const chartWidth = parseFloat(this.paraview.documentView!.chartLayers.width.toFixed(5));
        if (this.popupLabelOptions.type === "sequence") {
            const points = this.popupLabelOptions.points!
            if (points.map(p => p.shapes.map(c => c.intersects(this.box))).flat().some(Boolean)) {
                if (chartWidth - points[points.length - 1].x > this.grid.width) {
                    this.arrowPosition = "left";
                    this.grid.x = points[points.length - 1].x + this.leftPadding + BOX_ARROW_HEIGHT
                }
                else if (points[0].x > this.grid.width) {
                    this.arrowPosition = "right";
                    this.grid.x = points[0].x - this.grid.width - this.leftPadding - BOX_ARROW_HEIGHT
                }
                this._children.pop();
                this._box = this.generateBox(popupShapeOptions);
                this.append(this._box);
            }
        }




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
            this.popupLabelOptions.color = 0;
        }
        if (!this.popupLabelOptions.wrapWidth) {
            this.popupLabelOptions.wrapWidth = this.wrapWidth;
        }
        if (this.popupLabelOptions.y) {
            this.popupLabelOptions.y -= this.margin;
        }
        if (this.popupLabelOptions.inbounds == undefined) {
            this.popupLabelOptions.inbounds = true;
        }
        if (this.popupLabelOptions.rotationExempt == undefined) {
            this.popupLabelOptions.rotationExempt = true;
        }
        if (!this.popupShapeOptions.fill) {
            this.popupShapeOptions.fill = this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color), 6)
                    : this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color);
        }
        if (!this.popupShapeOptions.stroke) {
            this.popupShapeOptions.stroke = this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.store.settings.popup.backgroundColor === "light" ?
                    this.paraview.store.colors.colorValueAt(this.popupLabelOptions.color)
                    : "black";
        }
        if (!this.paraview.store.settings.ui.isLowVisionModeEnabled) {
            this.popupShapeOptions.fill = `${this.popupShapeOptions.fill.slice(0, -1)}, ${this.paraview.store.settings.popup.opacity})`;
        }
        if (!this.popupShapeOptions.shape) {
            this.popupShapeOptions.shape = this.paraview.store.settings.popup.shape;
        }
    }

    shiftGrid() {
        const chartWidth = parseFloat(this.paraview.documentView!.chartLayers.width.toFixed(5));
        if (this.grid.right + this.rightPadding > chartWidth) {
            if (this.popupLabelOptions.type === "chord") {
                this.arrowPosition = "right";
                //this.horizShift = this.grid.width + 2 * BOX_ARROW_HEIGHT + this.rightPadding + this.leftPadding;
                this.grid.x += -(this.grid.width + 2 * BOX_ARROW_HEIGHT + this.rightPadding + this.leftPadding);
            }
            else {
                this.horizShift = this.grid.right + this.rightPadding - chartWidth
                this.grid.x -= this.horizShift;
            }
        }
        const leftBorder = this.popupLabelOptions.type === 'vertAxis' ? 0 - this.paraview.documentView!.vertAxis!.layout.vRules[1] : 0;
        if (this.grid.left - this.leftPadding < leftBorder) {
            this.horizShift = - (this.leftPadding - this.grid.left + leftBorder);
            this.grid.x -= this.horizShift;
        }
        //Note shifting the label up away from the datapoint in the event of text wrap
        //has lower priority than shifting it down from the top of the screen
        if (this.grid.y - this.grid.bottom < 0 && this.popupLabelOptions.type !== "chord") {
            this.grid.y += (this.grid.y - this.grid.bottom);
        }
        if (this.grid.top - this.upPadding < 0) {
            if (this.popupLabelOptions.type !== "chord") {
                this.arrowPosition = "up";
                this.grid.y += (2 * this.margin + this.grid.height);
            }
            else {
                if (this.grid.height > this.paraview.documentView?.chartLayers.dataLayer.height!
                    && this.wrapWidth! + 50 < this.paraview.documentView?.chartLayers.dataLayer.width!) {
                    this.wrapWidth! += 50;
                    this.generateGrid();
                    this.shiftGrid();
                }
            }
        }

    }

    generateGrid() {
        if (this.popupLabelOptions.type === "chord") {
            let views: (DataSymbol | Label)[] = [];
            this.leftPadding += 10;
            this.arrowPosition = "left";
            let rowGaps = [];
            for (let i = 0; i < this.popupLabelOptions.items!.length - 1; i++) {
                rowGaps.push(DEFAULT_CHORD_POPUP_LINE_WIDTH);
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
                const text = this.popupLabelOptions.text;
                const lines = text.split(/\r?\n|\r/);
                views.push(new Label(this.paraview, {
                    text: lines[i],
                    x: 0,
                    y: 0,
                    wrapWidth: this.wrapWidth,
                    textAnchor: 'start'
                }));
            });
            views.forEach(v => this._grid.append(v));
            this._grid.y = this.paraview.documentView!.chartLayers.height / 2 - this._grid.height / 2;
            this._grid.x = this.popupLabelOptions.x! + BOX_ARROW_HEIGHT + this.leftPadding + this.horizShift;
        }
        else {
            let views: (DataSymbol | Label)[] = [];
            this._grid = new GridLayout(this.paraview, {
                numCols: 1,
                colAligns: ['start'],
                isAutoWidth: true,
                isAutoHeight: true
            }, 'popup-grid');
            views.push(this._label);
            views.forEach(v => this._grid.append(v));
            this._grid.y = this.popupLabelOptions.y!;
            this._grid.x = this.popupLabelOptions.x! - this._grid.width / 2;
        }
        return this._grid;
    }

    generateBox(options: PopupShapeOptions) {
        const boxType = options.shape ?? "box";
        const grid = this._grid;
        const y = grid.bottom;
        const x = grid.x;
        const width = grid.width, height = grid.height;
        const lPad = this.leftPadding, rPad = this.rightPadding, uPad = this.upPadding, dPad = this.downPadding;
        const hShift = this.horizShift;
        if (boxType === "boxWithArrow") {
            if (this.arrowPosition == "bottom") {
                const shape = new PopupPathShape(this.paraview, {
                    points: [new Vec2(x - lPad, y - height - uPad),
                    new Vec2(x - lPad, y + dPad),

                    new Vec2(Math.max(x + width / 2 - Math.min(width / 2, BOX_ARROW_WIDTH) + hShift, x - lPad), y + dPad),
                    //This is manually correcting for what I'm pretty sure are floating-point errors
                    new Vec2(Math.abs(x + width / 2 + hShift - (x + width + rPad)) < .5
                        ? x + width + rPad :
                        Math.abs(x + width / 2 + hShift - (x - lPad)) < .5 ? x - lPad
                            : x + width / 2 + hShift, y + dPad + BOX_ARROW_HEIGHT),
                    new Vec2(Math.min(x + width / 2 + Math.min(width / 2, BOX_ARROW_WIDTH) + hShift, x + width + rPad), y + dPad),

                    new Vec2(x + width + rPad, y + dPad),
                    new Vec2(x + width + rPad, y - height - uPad),
                    new Vec2(x - lPad, y - height - uPad)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "down"
                });
                return shape;
            }
            else if (this.arrowPosition == "right") {
                let shape = new PopupPathShape(this.paraview, {
                    points:
                        [new Vec2(x - lPad, y - height - uPad),
                        new Vec2(x - lPad, y + dPad),
                        new Vec2(x + width + rPad, y + dPad),

                        new Vec2(x + width + rPad, y - height / 2 + Math.min(height / 4, 15)),
                        new Vec2(x + width + rPad + BOX_ARROW_HEIGHT, y - height / 2),
                        new Vec2(x + width + rPad, y - height / 2 - Math.min(height / 4, 15)),

                        new Vec2(x + width + rPad, y - height - uPad),
                        new Vec2(x - lPad, y - height - uPad)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "right"
                });
                return shape;
            }
            else if (this.arrowPosition == "left") {
                let shape = new PopupPathShape(this.paraview, {
                    points:
                        [new Vec2(x - lPad, y - height - uPad),

                        new Vec2(x - lPad, y - height / 2 - Math.min(height / 4, 15)),
                        new Vec2(x - lPad - BOX_ARROW_HEIGHT, y - height / 2),
                        new Vec2(x - lPad, y - height / 2 + Math.min(height / 4, 15)),

                        new Vec2(x - lPad, y + dPad),
                        new Vec2(x + width + rPad, y + dPad),
                        new Vec2(x + width + rPad, y - height - uPad),
                        new Vec2(x - lPad, y - height - uPad)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "left"
                });
                return shape;
            }
            else {
                let shape = new PopupPathShape(this.paraview, {
                    points: [new Vec2(x - lPad, y - height - uPad),
                    new Vec2(x - lPad, y + dPad),
                    new Vec2(x + width + rPad, y + dPad),
                    new Vec2(x + width + rPad, y - height - uPad),

                    new Vec2(Math.min(x + width / 2 + Math.min(width / 4, 15) + hShift, x + width + rPad), y - height - uPad),
                    //This is manually correcting for what I'm pretty sure are floating-point errors
                    new Vec2(Math.abs(x + width / 2 + hShift - (x + width + rPad)) < .5
                        ? x + width + rPad :
                        Math.abs(x + width / 2 + hShift - (x - lPad)) < .5 ? x - lPad
                            : x + width / 2 + hShift, y - height - uPad - BOX_ARROW_HEIGHT),
                    new Vec2(Math.max(x + width / 2 + - Math.min(width / 4, 15) + hShift, x - lPad), y - height - uPad),

                    new Vec2(x - lPad, y - height - uPad)],
                    fill: options.fill,
                    stroke: options.stroke,
                    shape: "boxWithArrow",
                    arrowPosition: "up"
                });
                return shape;
            }
        }
        else {
            let shape = new PopupPathShape(this.paraview, {
                points: [new Vec2(x - lPad, y - height - uPad),
                new Vec2(x - lPad, y + dPad),
                new Vec2(x + width + rPad, y + dPad),
                new Vec2(x + width + rPad, y - height - uPad),
                new Vec2(x - lPad, y - height - uPad)],
                fill: options.fill,
                stroke: options.stroke,
                shape: "box"
            });
            return shape;
        }
    }

    content() {
        let transform = fixed``;
        if (this.popupLabelOptions.rotationExempt) {
            if (this.paraview.documentView?.chartLayers.orientation === 'east') {
                transform += fixed`
                 rotate(-90)
                translate(${-this.paraview.documentView?.chartLayers.logicalHeight},${0})
            `;
            } else if (this.paraview.documentView?.chartLayers.orientation === 'west') {
                transform += fixed`
                rotate(90)
              translate(0,${-this.paraview.documentView?.chartLayers.logicalHeight})
            `;
            } else if (this.paraview.documentView?.chartLayers.orientation === 'south') {
                //NB: not entirely sure this works
                transform += fixed`
                scale(1,-1)
              translate(0,${-this.paraview.documentView?.chartLayers.logicalHeight})
            `;
            }
        }
        return svg`
              <g
                id="popups"
                transform=${transform}
              >
                ${super.content()}
              </g>
            `;
    }

}

/**
 * @public
 */
@customElement('para-popup-settings-dialog')
export class PopupSettingsDialog extends ParaComponent {
    protected log: Logger = getLogger("PopupSettingsDialog");
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
    shape: ShapeTypes;
    arrowPosition?: "up" | "down" | "right" | "left";
}
export class PopupPathShape extends PathShape {
    shape: ShapeTypes;
    constructor(paraview: ParaView, private options: PopupPathOptions) {
        super(paraview, options);
        this._points = options.points.map(p => p.clone());
        this.shape = this.options.shape;
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
        const rad = this.paraview.store.settings.popup.borderRadius;
        let addCurve;
        if (this.shape == "boxWithArrow" && this.options.arrowPosition === "up") {
            addCurve = this.curvePoints["boxWithUpArrow"];
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "down") {
            addCurve = this.curvePoints["boxWithDownArrow"];
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "right") {
            addCurve = this.curvePoints["boxWithRightArrow"];
        }
        else if (this.shape == "boxWithArrow" && this.options.arrowPosition === "left") {
            addCurve = this.curvePoints["boxWithLeftArrow"];
        }
        else {
            addCurve = this.curvePoints[this.shape];
        }
        const relPoints = this._points.map(p => p.add(this._loc));
        let d = fixed``;
        let length = relPoints.length;
        if (!addCurve[0]
            || ((Math.abs(relPoints[0].x - relPoints[length - 2].x) < rad / 2 && Math.abs(relPoints[0].y - relPoints[length - 2].y) < rad / 2))) {
            d += fixed`M${relPoints[0].x},${relPoints[0].y}`;
        }
        else {
            let p = relPoints[0];
            let nextP = relPoints[(0 + 1) % length];
            const diffX1 = Math.sign(p.x - nextP.x);
            const diffY1 = Math.sign(p.y - nextP.y);
            d += fixed`M${p.x - diffX1 * rad},${p.y - diffY1 * rad}`;
        }
        for (let i = 1; i < length; i++) {
            let p = relPoints[i % length];
            let prevP = relPoints[(i - 1 + length) % length];
            //NB: This line looks like it does because the first and last point of _points are the same
            //and this is the easiest way to correct for it
            let nextP = relPoints[(i + 1 + (i === length - 1 ? 1 : 0)) % length];
            if (!addCurve[i % length]
                || ((Math.abs(p.x - prevP.x) < rad / 2 && Math.abs(p.y - prevP.y) < rad / 2))
                || ((Math.abs(p.x - nextP.x) < rad / 2 && Math.abs(p.y - nextP.y) < rad / 2) && i !== length - 1)) {
                d += fixed`L${p.x},${p.y}`;
            }
            else {
                const diffX1 = Math.sign(p.x - prevP.x);
                const diffY1 = Math.sign(p.y - prevP.y);
                const diffX2 = Math.sign(nextP.x - p.x);
                const diffY2 = Math.sign(nextP.y - p.y);
                d += fixed`L${p.x - diffX1 * rad},${p.y - diffY1 * rad}`;
                d += fixed`A ${rad}, ${rad}, 0, 0, 0, ${p.x + diffX2 * rad}, ${p.y + diffY2 * rad}`
            }
        }
        return d;
    }
}