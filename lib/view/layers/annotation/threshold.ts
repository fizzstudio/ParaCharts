import { PlaneChartInfo } from "../../../chart_types";
import { Vec2 } from "../../../common";
import { View } from "../../base_view";
import { Label } from "../../label";
import { CircleShape, PathShape } from "../../shape";
import { ViewContext } from "../../view_context";
import { PlanePlotView } from "../data";

export class Threshold extends View {
    clipHeight = -1;
    clipWidth = -1;
    protected label?: Label;
    protected line?: PathShape;
    protected slider?: CircleShape;
    constructor(paraview: ViewContext, public orientation: 'horiz' | 'vert', public align: number, public text?: string) {
        super(paraview);
        this.id = `threshold-${this.paraview.paraState.nextMarkerID()}`;
        this._createShapes(orientation, align);
        this._createLabel();
    }

    get chartInfo() {
        return this.paraview.documentView!.chartLayers.dataLayer.chartInfo as PlaneChartInfo
    }

    get dataLayer() {
        return this.paraview.documentView!.chartLayers.dataLayer as PlanePlotView;
    }

    pointerMove(): void {
        const coords = this.paraview.paraState.pointerCoords
        if (!this.slider?.isHeld) {
            this.slider?.remove();
            this.slider = undefined;
        }
        if (this.orientation == 'horiz') {
            if (coords.y > (this.clipHeight - 10) && coords.y < (this.clipHeight + 10)) {
                if (this.slider?.isHeld) {
                    const interval = (this.chartInfo as PlaneChartInfo).yRangeInfo?.interval;
                    if (!interval) {
                        return;
                    }
                    let newPos = (1 - (this.slider.centerY / this.dataLayer.height)) * (interval.end - interval.start) + interval.start;
                    newPos = Math.floor(newPos * 100) / 100
                    this.align = newPos;
                    this._createShapes(this.orientation, this.align);
                    this._createLabel()
                    return;
                }
                const sliderShape = new CircleShape(this.paraview, {
                    r: 10,
                    x: this.dataLayer.width + 15,
                    y: this.clipHeight,
                    stroke: 'blue',
                    fill: 'white',
                    strokeWidth: 3,
                })
                sliderShape.isDraggable = true;
                sliderShape.dragSettings = { lockX: true, yBounds: { start: 0, end: this.dataLayer.height } }
                this.slider = sliderShape
                this.append(this.slider)
            }
            else {
                if (this.slider) {
                    this.slider?.remove();
                    this.slider = undefined
                }
                this.paraview.requestUpdate();
            }
        }
        else if (this.orientation == 'vert') {
            if (coords.x > (this.clipWidth - 10) && coords.x < (this.clipWidth + 10)) {
                if (this.slider?.isHeld) {
                    const interval = (this.chartInfo as PlaneChartInfo).xRangeInfo?.interval;
                    if (!interval) {
                        return;
                    }
                    let newPos = ((this.slider.centerX / this.dataLayer.width)) * (interval.end - interval.start) + interval.start;
                    newPos = Math.floor(newPos * 100) / 100
                    this.align = newPos;
                    this._createShapes(this.orientation, this.align);
                    this._createLabel()
                    return;
                }
                const sliderShape = new CircleShape(this.paraview, {
                    r: 10,
                    x: this.clipWidth,
                    y: 10,
                    stroke: 'blue',
                    fill: 'white',
                    strokeWidth: 3,
                })
                sliderShape.isDraggable = true;
                sliderShape.dragSettings = { lockY: true, xBounds: { start: 0, end: this.dataLayer.width } }
                this.slider = sliderShape
                this.append(this.slider)
            }
            else {
                if (this.slider) {
                    this.slider?.remove();
                    this.slider = undefined
                }
                this.paraview.requestUpdate();
            }
        }
    }

    _createShapes(type: 'horiz' | 'vert', align: number) {
        let height = 0;
        let width = 0;
        if (this.line) {
            this.line.remove();
            this.line = undefined;
        }
        if (type == 'horiz') {
            if (this.chartInfo.yRangeInfo) {
                let int = this.chartInfo.yRangeInfo.interval;
                height = (1 - ((align - int.start) / (int.end - int.start))) * this.dataLayer.height
            }
            else{
                return;
            }
            let points = []
            points.push(new Vec2(0, height))
            points.push(new Vec2(this.dataLayer.width, height))
            let line = new PathShape(this.paraview, {
                points: points,
                stroke: 'black',
                strokeWidth: 3
            })
            this.line = line;
            this.prepend(line);
            line.classInfo = { "threshold-line": true }
            this.clipHeight = height
        }
        else if (type == 'vert') {
            const xValues = this.paraview.paraState.model!.allFacetValues("x")!.map(box => box.raw);
            if (this.chartInfo.xRangeInfo) {
                const int = this.chartInfo.xRangeInfo.interval;
                if (!isNaN(Number(this.align))) {
                    width = ((Number(this.align) - int.start) / (int.end - int.start)) * this.dataLayer.width
                }
            }
            else if (xValues.includes(String(align))) {
                const index = xValues.indexOf(String(align))
                const tier = this.paraview.documentView?.xAxis?.tickLabelTiers[0]!
                const regFactor = (tier.options.content.labels.length % tier.children.length == 0)
                    ? tier.children.length / tier.options.content.labels.length
                    : (tier.children.length) / (tier.options.content.labels.length + 1)
                width = tier._tickLabelX(index) * regFactor
            }
            else {
                return;
            }
            let points = []
            points.push(new Vec2(width, 0))
            points.push(new Vec2(width, this.dataLayer.height))
            let line = new PathShape(this.paraview, {
                points: points,
                stroke: 'black',
                strokeWidth: 3
            })
            this.line = line;
            this.prepend(line);
            line.classInfo = { "threshold-line": true }
            this.clipWidth = width;
        }
    }

    _createLabel() {
        const text = this.text ?? String(this.align)
        this.label?.remove();
        const checkIntersect = (label: Label) => {
            const dpViews = this.paraview.documentView!.chartLayers.dataLayer.datapointViews;
            if (dpViews.map(dp => dp.shapes.map(s => s.intersects(label))).flat().some(a => a !== null)) {
                return true;
            }
            else if (dpViews.map(dp => dp.symbol?.intersects(label)).some(a => a !== null)) {
                return true;
            }
            else return false;
        }
        if (this.orientation == 'horiz') {
            if (this.clipHeight < 0) {
                return;
            }
            const label = new Label(this.paraview, {
                text: text,
                x: this.dataLayer.width,
                y: this.clipHeight - 7,
            })
            label.classInfo = { "popup-text": true };
            label.x -= (label.width / 2);
            this.append(label);
            this.label = label;
            if (checkIntersect(label)) {
                label.x = 5 + (label.width / 2);
            }
            if (checkIntersect(label)) {
                label.y += (label.height + 14);
            }
            if (checkIntersect(label)) {
                label.x = this.dataLayer.width - (label.width / 2);
            }
        }
        else if (this.orientation == 'vert') {
            if (this.clipWidth < 0) {
                return;
            }
            const label = new Label(this.paraview, {
                text: text,
                x: this.clipWidth,
                y: 0 - 5
            })
            label.classInfo = { "popup-text": true };
            this.append(label)
            this.label = label;
        }
    }

    highlightPoints() {
        if (this.orientation == 'horiz') {
            if (!this.chartInfo.yRangeInfo){
                return [{ start: 0, end: 1 }, { start: 0, end: 1 }];
            }
            let int = this.chartInfo.yRangeInfo!.interval;
            if (this.align < int.start || this.align > int.end) {
                return [{ start: 0, end: 1 }, { start: 0, end: 1 }];
            }
            const start = this.clipHeight / this.dataLayer.height;
            return [{ start: 0, end: 1 }, { start: start, end: 1 }]
        }
        else if (this.orientation == 'vert') {
            const xValues = this.paraview.paraState.model!.allFacetValues("x")!.map(box => box.raw);
            if (!this.chartInfo.xRangeInfo && !xValues.includes(String(this.align))) {
                return [{ start: 0, end: 1 }, { start: 0, end: 1 }];
            }
            const start = this.clipWidth / this.dataLayer.width;
            return [{ start: start, end: 1 }, { start: 0, end: 1 }]
        }
        return [{ start: 0, end: 1 }, { start: 0, end: 1 }]
    }

}