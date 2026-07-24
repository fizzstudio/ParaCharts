import { enumerate } from "@fizz/paramodel";
import { PointDatapointView, PointPlotView, PointSeriesView } from ".";
import { DataSymbol } from "../../../symbol";
import { ConfigSetting } from "../../../../config/config_types";
import { RectShape, Shape } from "../../../shape";
import { SELECTION_MARKER_SIZE } from "../../../data";

export class BubblePlotView extends PointPlotView {
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

    protected _completeDatapointLayout() {
        super._completeDatapointLayout();
        const allZ = this.paraview.paraState.model!.allPoints.map(dp => dp.facetValueAsNumber("z")!);
        const maxZ = Math.max(...allZ);
        const minZ = Math.min(...allZ);
        const zRange = maxZ - minZ;
        const maxSize = this.paraview.paraState.config.type.bubble.maxBubbleSize;
        const minSize = this.paraview.paraState.config.type.bubble.minBubbleSize;
        const sizeRange = maxSize - minSize;
        for (let i = 0; i < this.datapointViews.length; i++) {
            const scale = ((allZ[i] - minZ) * sizeRange / zRange) + minSize;
            this.datapointViews[i].baseSymbolScale = scale
        }
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

}

export class BubblePointView extends PointDatapointView {
    computeX() {
        const xInterval = this.chart.chartInfo.xInterval!;
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
        let symbolType = series.symbol;
        this._symbol = DataSymbol.fromType(this.paraview, symbolType, {
            strokeWidth: this.paraview.paraState.config.chart.symbolStrokeWidth,
            lighten: true,
            pointerEnter: (e) => {
                this.shouldAddHoverPopup() ? this.addDatapointPopup() : undefined
            },
            pointerLeave: (e) => {
                this.paraview.paraState.removePopup(this.id);
            },
            //scale: scale
        });
        //this._baseSymbolScale = scale;
        this._symbol.role = 'datapoint'
        this._symbol.id = `${this._id}-sym`;
        //this.symbolColor = color;
        this._children = this.children.filter(c => !(c instanceof DataSymbol))
        this.append(this._symbol);
    }

}