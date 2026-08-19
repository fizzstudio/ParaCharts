import { PlaneChartInfo } from "../../../chart_types";
import { Vec2 } from "../../../common";
import { ParaView } from "../../../paraview";
import { View } from "../../base_view";
import { Label } from "../../label";
import { ArcShape, PathShape } from "../../shape";
import { ViewContext } from "../../view_context";
import { PlanePlotView } from "../data";

export class Threshold extends View {
    clipHeight = 0;
    clipWidth = 0;
    constructor(paraview: ViewContext, protected type: 'horiz' | 'vert', public align: number, public label?: string) {
        super(paraview);
        this._createShapes(type, align);
        this._createLabel();
    }

    get chartInfo() {
        return this.paraview.documentView!.chartLayers.dataLayer.chartInfo as PlaneChartInfo
    }

    get dataLayer() {
        return this.paraview.documentView!.chartLayers.dataLayer as PlanePlotView;
    }

    _createShapes(type: 'horiz' | 'vert', align: number) {
        let height = 0;
        let width = 0;
        if (type == 'horiz') {
            if (this.chartInfo.yRangeInfo) {
                let int = this.chartInfo.yRangeInfo.interval;
                height = (1 - ((align - int.start) / (int.end - int.start))) * this.dataLayer.height
            }
            let points = []
            points.push(new Vec2(0, height))
            points.push(new Vec2(this.dataLayer.width, height))
            let line = new PathShape(this.paraview, {
                points: points,
                stroke: 'black',
                strokeWidth: 3
            })
            this.append(line);
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

            let points = []
            points.push(new Vec2(width, 0))
            points.push(new Vec2(width, this.dataLayer.height))
            let line = new PathShape(this.paraview, {
                points: points,
                stroke: 'black',
                strokeWidth: 3
            })
            this.append(line);
            line.classInfo = { "threshold-line": true }
            this.clipWidth = width;
        }
    }

    _createLabel() {
        if (!this.label) {
            return;
        }
        if (this.type == 'horiz') {
            const label = new Label(this.paraview, {
                text: this.label,
                x: this.dataLayer.width,
                y: this.clipHeight - 5
            })
            this.append(label)
        }
        else if (this.type == 'vert') {
            const label = new Label(this.paraview, {
                text: this.label,
                x: this.clipWidth,
                y: 0 - 5
            })
            this.append(label)
        }
    }

    highlightPoints() {
        this.paraview.paraState.clearAllDatapointContrast();
        if (this.type == 'horiz') {
            let int = this.chartInfo.yRangeInfo!.interval;
            if (this.align < int.start || this.align > int.end) {
                return;
            }
            if (this.paraview.paraState.config.marker.highlightStyle == 'Highlight above') {
                const start = this.clipHeight / this.dataLayer.height;
                (this.paraview as ParaView).markerClipBox = [{ start: 0, end: 1 }, { start: start, end: 1 }]
                for (let datapoint of this.paraview.paraState.model!.allPoints) {
                    if (datapoint.facetValueAsNumber('y')! > this.align) {
                        this.paraview.paraState.contrastDatapoint(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                    else {
                        this.paraview.paraState.clearDatapointContrasted(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                }
            }
            else if (this.paraview.paraState.config.marker.highlightStyle == 'Highlight below') {
                (this.paraview as ParaView).markerClipBox = [{ start: 0, end: 1 }, { start: 0, end: this.clipHeight / this.dataLayer.height }]
                for (let datapoint of this.paraview.paraState.model!.allPoints) {
                    if (datapoint.facetValueAsNumber('y')! < this.align) {
                        this.paraview.paraState.contrastDatapoint(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                    else {
                        this.paraview.paraState.clearDatapointContrasted(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                }
            }
        }
        else if (this.type == 'vert') {
            (this.paraview as ParaView).clipWidth = this.clipWidth / this.dataLayer.width
            for (let datapoint of this.paraview.paraState.model!.allPoints) {
                if (!isNaN(Number(datapoint.facetBox('x')!.raw))) {
                    if (Number(datapoint.facetBox('x')!.raw) >= this.align) {
                        this.paraview.paraState.contrastDatapoint(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                    else {
                        this.paraview.paraState.clearDatapointContrasted(datapoint.seriesKey, datapoint.datapointIndex)
                    }
                }
            }
        }
    }

}