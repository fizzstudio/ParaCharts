import { html, css, svg } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { Logger, getLogger } from '@fizz/logger';
import { Dialog } from '@fizz/ui-components';
import '@fizz/ui-components';
import { Vec2 } from "../common/vector";
import { type ViewContext } from './view_context';
import { View } from "./base_view";
import { Label, LabelOptions } from "./label";
import { type PathOptions, PathShape, ShapeOptions } from "./shape";
import { ParaComponent } from "../components/paracomponent";
import { fixed } from "../common";
import { GridLayout } from "./layout";
import { DataSymbol} from "./symbol";
import { type LegendItem } from "./legend";
import { type DatapointView } from "./data/datapoint";
import { type WaterfallBarView } from "./layers";

export interface PopupLabelOptions extends LabelOptions {
    color?: number;
    margin?: number;
    type?: string;
    items?: LegendItem[];
    points?: DatapointView[];
    inbounds?: boolean;
    fill?: string;
    rotationExempt?: boolean
    pointerControlled?: boolean
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
    protected _box!: PathShape;
    protected _grid: GridLayout;
    protected leftPadding = this.paraview.paraState.config.popup.leftPadding;
    protected rightPadding = this.paraview.paraState.config.popup.rightPadding;
    protected downPadding = this.paraview.paraState.config.popup.downPadding;
    protected upPadding = this.paraview.paraState.config.popup.upPadding;
    protected _horizShift = 0;
    protected arrowPosition: "up" | "bottom" | "left" | "right" = "bottom";
    protected _wrapWidth: number = this.paraview.paraState.config.popup.maxWidth;
    protected pointerControlled = false;

    get grid() {
        return this._grid;
    }

    get label() {
        return this._label;
    }

    get box() {
        return this._box;
    }

    set box(box: PathShape) {
        this._box = box;
    }

    get margin() {
        return this.popupLabelOptions.margin ?? this.paraview.paraState.config.popup.margin;
    }

    get wrapWidth() {
        return this._wrapWidth;
    }

    set wrapWidth(num: number) {
        this._wrapWidth = num;
    }

    get text() {
        return this.popupLabelOptions.text;
    }

    get horizShift() {
        return this._horizShift;
    }

    set horizShift(n: number) {
        this._horizShift = n;
    }

    get _popupShapeOptions() {
        return this.popupShapeOptions;
    }

    constructor(paraview: ViewContext, private popupLabelOptions: PopupLabelOptions, private popupShapeOptions: PopupShapeOptions) {
        super(paraview);
        this.applyDefaults();
        this._label = new Label(this.paraview, this.popupLabelOptions)
        if (this.paraview.paraState.config.popup.backgroundColor === "dark") {
            this._label.styleInfo = {
                stroke: 'none',
                fill: this.popupLabelOptions.fill ? this.popupLabelOptions.fill
                    : this.popupLabelOptions.type == "chord" ? "black"
                        : this.paraview.paraState.colors.contrastValueAt(this.popupLabelOptions.color!)
            };
        }
        if (this.paraview.paraState.config.ui.isLowVisionModeEnabled) {
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
        if (this.popupLabelOptions.type == 'vertTick' || this.popupLabelOptions.type == 'vertAxis') {
            this.arrowPosition = "left";
        }
        this.generateBox(popupShapeOptions);

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
                this.generateBox(popupShapeOptions)
            }
        }
        if (this.paraview.paraState.type == "waterfall") {
            if (this.popupLabelOptions.points!) {
                const dpView = this.popupLabelOptions.points![0] as WaterfallBarView;
                if (dpView.datapoint.facetValueAsNumber('y')! >= 0 && this.box.intersects(dpView.label!)) {
                    this.grid.y -= 10;
                    this.box.y -= 10;
                }
                else if (dpView.datapoint.facetValueAsNumber('y')! <= 0 && this.box.intersects(dpView.label!)) {
                    this.grid.y += dpView.height + 10;
                    this.box.y += dpView.height + 10;
                }
            }

        }
        this.label.addClass('popup-text');
        //The box generation relies on the grid having set dimensions, which happens during append()
        //but we also need the box to render behind the grid
        this._children[0] = this.box;
        this._children[1] = this.grid;
    }

    applyDefaults() {
        if (this.popupLabelOptions.color == undefined) {
            this.popupLabelOptions.color = 0;
        }
        // if (this.popupLabelOptions.textAnchor == undefined) {
        //     this.popupLabelOptions.textAnchor == "middle"
        // }
        if (this.popupLabelOptions.wrapWidth == undefined) {
            this.popupLabelOptions.wrapWidth = this.wrapWidth;
        }
        if (this.popupLabelOptions.y !== undefined) {
            this.popupLabelOptions.y -= this.margin;
        }
        if (this.popupLabelOptions.inbounds == undefined) {
            this.popupLabelOptions.inbounds = true;
        }
        if (this.popupLabelOptions.rotationExempt == undefined) {
            this.popupLabelOptions.rotationExempt = true;
        }
        if (this.popupLabelOptions.id) {
            this.id = this.popupLabelOptions.id;
        }
        if (this.popupLabelOptions.pointerControlled) {
            this.pointerControlled = this.popupLabelOptions.pointerControlled;
        }
        if (!this.popupShapeOptions.fill) {
            this.popupShapeOptions.fill = this.paraview.paraState.config.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.paraState.config.popup.backgroundColor === "light" ?
                    this.paraview.paraState.colors.lighten(this.paraview.paraState.colors.colorValueAt(this.popupLabelOptions.color), 6)
                    : this.paraview.paraState.colors.colorValueAt(this.popupLabelOptions.color);
        }
        if (!this.popupShapeOptions.stroke) {
            this.popupShapeOptions.stroke = this.paraview.paraState.config.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.paraState.config.popup.backgroundColor === "light" ?
                    this.paraview.paraState.colors.colorValueAt(this.popupLabelOptions.color)
                    : "black";
        }
        if (!this.paraview.paraState.config.ui.isLowVisionModeEnabled) {
            this.popupShapeOptions.fill = `${this.popupShapeOptions.fill.slice(0, -1)}, ${this.paraview.paraState.config.popup.opacity})`;
        }
        if (!this.popupShapeOptions.shape) {
            this.popupShapeOptions.shape = this.paraview.paraState.config.popup.shape;
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
                this._horizShift = this.grid.right + this.rightPadding - chartWidth;
                this.grid.x -= this._horizShift;
            }
        }
        let leftBorder = 0
        if (this.popupLabelOptions.type === 'vertAxis') {
//            leftBorder = 0 - this.paraview.documentView!.vertAxis!.layout.vRules[1]
           leftBorder = 0 - this.paraview.documentView!.vertAxis!.layout.width/2;
        }
        else if (this.popupLabelOptions.type === 'controlPanelIcon') {
            leftBorder = 0 - this.paraview.documentView!.chartLayers.x
        }
        if (this.grid.left - this.leftPadding < leftBorder) {
            this._horizShift = - (this.leftPadding - this.grid.left + leftBorder);
            this.grid.x -= this._horizShift;
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
        else {
            if (this.popupLabelOptions.type !== "chord") {
                this.arrowPosition = "bottom";
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
                    this.paraview.paraState.config.chart.isDrawSymbols
                        ? (item.symbol ?? 'square.solid')
                        : 'square.solid',
                    {
                        color: item.colorIndex
                    }
                ));
                const text = this.popupLabelOptions.text;
                const lines = text.split(/\r?\n|\r/);
                views.push(new Label(this.paraview, {
                    text: lines[i],
                    x: 0,
                    y: 0,
                    wrapWidth: this.wrapWidth,
                    // textAnchor: 'start'
                }));
            });
            views.forEach(v => this._grid.append(v));
            this._grid.y = this.paraview.documentView!.chartLayers.height / 2 - this._grid.height / 2;
            this._grid.x = this.popupLabelOptions.x! + BOX_ARROW_HEIGHT + this.leftPadding + this._horizShift;
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
        const y = 0;
        const x = 0;
        const width = grid.width, height = grid.height;
        const lPad = this.leftPadding, rPad = this.rightPadding, uPad = this.upPadding, dPad = this.downPadding;
        const rightBorder = x + width + rPad, leftBorder = x - lPad, upBorder = y - height - uPad, downBorder = y + dPad;
        const topLeft = new Vec2(leftBorder, upBorder), bottomLeft = new Vec2(leftBorder, downBorder), bottomRight = new Vec2(rightBorder, downBorder), topRight = new Vec2(rightBorder, upBorder);
        const horizMidpoint = x + width / 2;
        const vertMidpoint = y - height / 2;
        const hShift = this._horizShift;
        let box;
        let points;
        let shapeType: ShapeTypes;
        let arrowPosition: "up" | "down" | "right" | "left" = "down";

        if (boxType === "boxWithArrow") {
            shapeType = "boxWithArrow";
            if (this.arrowPosition == "bottom") {
                points = [topLeft,
                    bottomLeft,
                    new Vec2(Math.max(horizMidpoint - Math.min(width / 2, BOX_ARROW_WIDTH) + hShift, leftBorder), downBorder),
                    //This is manually correcting for what I'm pretty sure are floating-point errors
                    new Vec2(Math.abs(horizMidpoint + hShift - (rightBorder)) < .5
                        ? rightBorder :
                        Math.abs(horizMidpoint + hShift - (leftBorder)) < .5 ? leftBorder
                            : horizMidpoint + hShift, downBorder + BOX_ARROW_HEIGHT),
                    new Vec2(Math.min(horizMidpoint + Math.min(width / 2, BOX_ARROW_WIDTH) + hShift, rightBorder), downBorder),
                    bottomRight,
                    topRight,
                    topLeft];
                arrowPosition = "down";
            }
            else if (this.arrowPosition == "up") {
                points = [topLeft,
                    bottomLeft,
                    bottomRight,
                    topRight,
                    new Vec2(Math.min(horizMidpoint + Math.min(width / 4, 15) + hShift, rightBorder), upBorder),
                    //This is manually correcting for what I'm pretty sure are floating-point errors
                    new Vec2(Math.abs(horizMidpoint + hShift - (rightBorder)) < .5
                        ? rightBorder :
                        Math.abs(horizMidpoint + hShift - (leftBorder)) < .5 ? leftBorder
                            : horizMidpoint + hShift, upBorder - BOX_ARROW_HEIGHT),
                    new Vec2(Math.max(horizMidpoint + - Math.min(width / 4, 15) + hShift, leftBorder), upBorder),
                    topLeft];
                arrowPosition = "up";
            }
            else if (this.arrowPosition == "left") {
                points = [topLeft,
                    new Vec2(leftBorder, vertMidpoint - Math.min(height / 4, 15)),
                    new Vec2(leftBorder - BOX_ARROW_HEIGHT, vertMidpoint),
                    new Vec2(leftBorder, vertMidpoint + Math.min(height / 4, 15)),
                    bottomLeft,
                    bottomRight,
                    topRight,
                    topLeft];
                arrowPosition = "left";
            }
            else {
                points = [topLeft,
                    bottomLeft,
                    bottomRight,
                    new Vec2(rightBorder, vertMidpoint + Math.min(height / 4, 15)),
                    new Vec2(rightBorder + BOX_ARROW_HEIGHT, vertMidpoint),
                    new Vec2(rightBorder, vertMidpoint - Math.min(height / 4, 15)),
                    topRight,
                    topLeft];
                arrowPosition = "right";
            }
        }
        else {
            points = [topLeft,
                bottomLeft,
                bottomRight,
                topRight,
                topLeft];
            shapeType = "box";
        }
        box = new PopupPathShape(this.paraview, {
            points: points,
            fill: options.fill,
            stroke: options.stroke,
            shape: shapeType,
            arrowPosition: arrowPosition
        });
        this._box = box;
        this.prepend(this._box);
        this.box.classInfo = { 'popup-box': true };
        this._box.x = this._grid.x
        this._box.y = this._grid.bottom
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
                id=${this.id ?? "popup"}
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
    fizz-dialog {
        --item-gap: 1rem;
    }
    #controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

    connectedCallback() {
        super.connectedCallback();
        this._paraState.settingControls.insert('popup.shape');
        this._paraState.settingControls.insert('popup.activation');
        this._paraState.settingControls.insert('popup.opacity');
        this._paraState.settingControls.insert('popup.maxWidth');
        this._paraState.settingControls.insert('popup.leftPadding');
        this._paraState.settingControls.insert('popup.rightPadding');
        this._paraState.settingControls.insert('popup.upPadding');
        this._paraState.settingControls.insert('popup.downPadding');
        this._paraState.settingControls.insert('popup.margin');
        this._paraState.settingControls.insert('popup.borderRadius');
        this._paraState.settingControls.insert('popup.backgroundColor');

        document.addEventListener('paranotice', (e: CustomEvent<any>) => {
            if (e.detail.value?.key == 'manifestSet') {
                if (['bar', 'column', 'line', 'waterfall', 'scatter', 'histogram', 'heatmap'].includes(this._paraState.type)) {
                    this._paraState.settingControls.insert('popup.isShowCrosshair');
                    this._paraState.settingControls.insert('popup.isCrosshairFollowPointer');
                }
            }
        });
    }

    render() {
        return html`
      <fizz-dialog
        ${ref(this._dialogRef)}
        title="Popup Settings"
        .buttons=${[{ tag: 'cancel', text: this.btnText }]}
      >
        ${this._paraState.settingControls.getContent('controlPanel.tabs.chart.dialog.popups')}
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
    constructor(paraview: ViewContext, private options: PopupPathOptions) {
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
        const rad = this.paraview.paraState.config.popup.borderRadius;
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
