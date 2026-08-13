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
    constructor(paraview: ViewContext, protected type: 'horiz' | 'vert', protected align: number, protected label?: string) {
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
        let width;
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
    }

    _createLabel() {
        if (!this.label) {
            return;
        }

        const label = new Label(this.paraview, {
            text: this.label,
            x: this.dataLayer.width,
            y: this.clipHeight - 5
        })
        //label.left = this.paraview.documentView!.chartLayers.dataLayer.right
        this.append(label)
    }

    highlightPoints() {
        if (this.type == 'horiz') {
            (this.paraview as ParaView).clipHeight = this.clipHeight / this.dataLayer.height
            for (let datapoint of this.paraview.paraState.model!.allPoints) {
                if (datapoint.facetValueAsNumber('y')! < this.align) {
                    this.paraview.paraState.contrastDatapoint(datapoint.seriesKey, datapoint.datapointIndex)
                    //this.paraview.documentView!.chartLayers.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!.colorIndex = 3
                }
                else {
                    this.paraview.paraState.clearDatapointContrasted(datapoint.seriesKey, datapoint.datapointIndex)
                }
            }
        }
    }

}