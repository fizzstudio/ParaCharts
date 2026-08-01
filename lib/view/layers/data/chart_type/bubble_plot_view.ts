import { Datapoint, enumerate } from "@fizz/paramodel";
import { PointDatapointView, PointPlotView, PointSeriesView } from ".";
import { DataSymbol, DataSymbols } from "../../../symbol";
import { ConfigSetting } from "../../../../config/config_types";
import { RectShape, Shape } from "../../../shape";
import { SELECTION_MARKER_SIZE } from "../../../data";

export class BubblePlotView extends PointPlotView {
    allZ: number[] = [];
    maxZ = 0;
    minZ = 0;
    zRange = 0;
    maxSize = 0;
    minSize = 0;
    sizeRange = 0;

    protected _createDatapoints(): void {
        for (const [series, i] of enumerate(this.paraview.paraState.model!.series)) {
            const seriesView = this._newSeriesView(series.key);
            this._chartLandingView.append(seriesView);
            for (const [value, j] of enumerate(series)) {
                const datapointView = this._newDatapointView(seriesView);
                seriesView.append(datapointView);
                // the `index` property of the datapoint view will equal j
            }
        }
    }

    protected _newDatapointView(seriesView: PointSeriesView) {
        return new BubblePointView(seriesView);
    }
    protected _layoutDatapoints(): void {
        this.allZ = this.paraview.paraState.model!.allPoints.map(dp => dp.facetValueAsNumber("z")!);
        this.maxZ = Math.max(...this.allZ);
        this.minZ = Math.min(...this.allZ);
        this.zRange = this.maxZ - this.minZ;
        this.maxSize = this.paraview.paraState.config.type.bubble.maxBubbleSize;
        this.minSize = this.paraview.paraState.config.type.bubble.minBubbleSize;
        this.sizeRange = this.maxSize - this.minSize;
        super._layoutDatapoints();
    }

    settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
        if (['type.bubble.bubbleFacet', 'type.bubble.labelFacet', 'type.bubble.xFacet', 'type.bubble.yFacet'].includes(path)) {
            this.paraview.paraState.setManifest(this.paraview.paraState.originalManifest!, undefined, false);
            this.paraview.paraState.setCaption();
            this.paraview.paraState.clearSelected();
        }
        if (['type.bubble.maxBubbleSize', 'type.bubble.minBubbleSize'].includes(path)) {
            this.paraview.createDocumentView();
        }
        super.settingDidChange(path, oldValue, newValue);
    }

    dimOtherSizes(size: string) {
        this._resetFrontedDatapoints();
        let backDatapoints: Datapoint[] = [];
        const lowerThirdLimit = (2 / 3) * this.minZ + (1 / 3) * this.maxZ;
        const upperThirdLimit = (1 / 3) * this.minZ + (2 / 3) * this.maxZ;
        const points = this.model!.allPoints;
        if (size == "small") {
            this.paraview.paraState.frontDatapoints = points.filter(dp => dp.facetValueAsNumber("z")! <= lowerThirdLimit);
            backDatapoints = this.model!.allPoints.filter(dp => dp.facetValueAsNumber("z")! > lowerThirdLimit);
        }
        else if (size == "medium") {
            this.paraview.paraState.frontDatapoints = points.filter(dp =>
                (dp.facetValueAsNumber("z")! > lowerThirdLimit) &&
                (dp.facetValueAsNumber("z")! <= upperThirdLimit));
            backDatapoints = points.filter(dp =>
                (dp.facetValueAsNumber("z")! <= lowerThirdLimit) ||
                (dp.facetValueAsNumber("z")! > upperThirdLimit));
        }
        else if (size == "large") {
            this.paraview.paraState.frontDatapoints = points.filter(dp =>
                dp.facetValueAsNumber("z")! > upperThirdLimit);
            backDatapoints = points.filter(dp =>
                dp.facetValueAsNumber("z")! <= upperThirdLimit);
        }
        backDatapoints.forEach(dp => this.paraview.paraState.lowlightDatapoint(dp.seriesKey, dp.datapointIndex));
        this.paraview.paraState.frontSeries = '';
        this.paraview.paraState.refreshParaView();
    }

    pinBubbleSize(size: string) {
        this.unpinBubbleSize();
        this.paraview.paraState.pinnedBubbleSize = size;
        this.dimOtherSizes(size);
    }

    unpinBubbleSize() {
        this.paraview.paraState.pinnedBubbleSize = null;
        this.paraview.paraState.clearAllDatapointLowlights();
    }
}

export class BubblePointView extends PointDatapointView {
    declare readonly chart: BubblePlotView;
    computeX() {
        const xInterval = this.chart.chartInfo.xRangeInfo!.interval!;
        // Scales points in proportion to the data range
        const xTemp = (this.datapoint.facetValueNumericized('x')! - xInterval.start)
            / (xInterval.end - xInterval.start);
        const parentWidth: number = this.chart.parent.width;
        return parentWidth * xTemp;
    }

    get width() {
        return Math.max(SELECTION_MARKER_SIZE * this.baseSymbolScale, SELECTION_MARKER_SIZE * .75);
    }

    get height() {
        return Math.max(SELECTION_MARKER_SIZE * this.baseSymbolScale, SELECTION_MARKER_SIZE * .75);
    }

    get selectedMarker(): Shape {
        const width = this.width;
        const height = this.height;
        return new RectShape(this.paraview, {
            width: width / 2,
            height: height / 2,
            x: this._x - width / 4,
            y: this._y - height / 4,
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2,
            isClip: this.shouldClip
        });
    }

    protected _createSymbol(): void {
        const series = this.seriesProps;
        const types = new DataSymbols().types;
        let symbolType = types[(this.parent.index + 8) % 16];
        let jimIndex = 0;
        for (let i = this._parent.modelIndex - 1; i >= 0; i--) {
            jimIndex += this.paraview.paraState.model!.series[i].datapoints.length;
        }
        jimIndex += this.index;
        const scale = ((((this.chart.allZ[jimIndex] - this.chart.minZ) * this.chart.sizeRange / this.chart.zRange) + this.chart.minSize) ** 2);
        this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
            strokeWidth: this.paraview.paraState.config.chart.symbolStrokeWidth,
            lighten: true,
            pointerEnter: (e) => {
                this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined
            },
            pointerLeave: (e) => {
                this.paraview.paraState.removePopup(this.id);
            },
            baseSize: scale,
            opacity: .75
        });
        //this._baseSymbolScale = scale;
        this._symbol.role = 'datapoint'
        this._symbol.id = `${this._id}-sym`;
        //this.symbolColor = color;
        this._children = this.children.filter(c => !(c instanceof DataSymbol))
        this.append(this._symbol);
    }

}