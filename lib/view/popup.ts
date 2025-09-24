import { Vec2 } from "../common/vector";
import { ParaView } from "../paraview";
import { View } from "./base_view";
import { Label, LabelOptions } from "./label";
import { PathShape, ShapeOptions } from "./shape";

export interface PopupLabelOptions extends LabelOptions {

}

export interface PopupShapeOptions extends ShapeOptions {
    shape?: "box" | "boxWithArrow"
}


const LEFT_PADDING = 10;
const RIGHT_PADDING = 10;
const DOWN_PADDING = 10;
const UP_PADDING = 10;

export class Popup extends View {
    protected label: Label;
    protected box: PathShape;
    constructor(paraview: ParaView, private popupLabelOptions: PopupLabelOptions, private popupShapeOptions: PopupShapeOptions) {
        super(paraview);
        this.label = new Label(this.paraview, this.popupLabelOptions)
        this.shiftLabel()
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
                points: [new Vec2(x - width / 2 - LEFT_PADDING, y - height - UP_PADDING),
                new Vec2(x - width / 2 - LEFT_PADDING, y + DOWN_PADDING),

                new Vec2(x - Math.min(width / 4, 15), y + DOWN_PADDING),
                new Vec2(x, y + DOWN_PADDING + 10),
                new Vec2(x + Math.min(width / 4, 15), y + DOWN_PADDING),

                new Vec2(x + width / 2 + RIGHT_PADDING, y + DOWN_PADDING),
                new Vec2(x + width / 2 + RIGHT_PADDING, y - height - UP_PADDING),
                new Vec2(x - width / 2 - LEFT_PADDING, y - height - UP_PADDING)],
                fill: options.fill,
                stroke: options.stroke,
            })
            return shape
        }
        else {
            let shape = new PathShape(this.paraview, {
                points: [new Vec2(x - width / 2 - LEFT_PADDING, y - height - UP_PADDING),
                new Vec2(x - width / 2 - LEFT_PADDING, y + DOWN_PADDING),
                new Vec2(x + width / 2 + RIGHT_PADDING, y + DOWN_PADDING),
                new Vec2(x + width / 2 + RIGHT_PADDING, y - height - UP_PADDING),
                new Vec2(x - width / 2 - LEFT_PADDING, y - height - UP_PADDING)],
                fill: options.fill,
                stroke: options.stroke,
            })
            return shape
        }
    }

    shiftLabel() {
        if (this.label.right + RIGHT_PADDING > this.paraview.documentView!.chartLayers.width) {
            this.popupLabelOptions.x = this.label.x - (this.label.right + RIGHT_PADDING - this.paraview.documentView!.chartLayers.width) - 5
            this.label = new Label(this.paraview, this.popupLabelOptions)
        }
        if (this.label.left - LEFT_PADDING < 0) {
            this.popupLabelOptions.x = this.label.x + (LEFT_PADDING - this.label.left) + 5
            this.label = new Label(this.paraview, this.popupLabelOptions)
        }
        //Note shifting the label up away from the datapoint in the event of text wrap
        //has lower priority than shifting it down from the top of the screen
        if (this.label.y - this.label.bottom < 0){
            this.label.y += (this.label.y - this.label.bottom)
        }
        if (this.label.top < 0){
            this.label.y -= (this.label.top)
        }
    }
}