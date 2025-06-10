
import { AxisInfo } from "../common/axisinfo";
import {  fixed } from "../common/utils";
import { DeepReadonly, HistogramSettings, PointChartType } from "../store";

import { XYChart, XYDatapointView, XYSeriesView } from "./xychart";
import { svg } from "lit";
import { DatapointView, DataView, SeriesView } from "./data";
import { DataCursor } from "../store";
import { ParaView } from "../paraview";
import { enumerate, strToId } from "@fizz/paramodel";
import { formatBox } from "@fizz/parasummary";
import { Rect } from "./shape/rect";
import { Shape } from "./shape/shape";
export class Histogram extends XYChart {
    protected _bins: number;
    protected _data: Array<Array<number>> = [];
    protected _grid: Array<number> = [];
    protected _maxCount: number = 0;
    declare protected _settings: DeepReadonly<HistogramSettings>;
    constructor(
        paraview: ParaView,
        dataLayerIndex: number
    ) {
        super(paraview, dataLayerIndex);
        this._settings = this.paraview.store.settings.type.histogram;
        this._bins = this.paraview.store.settings.type.histogram.bins ?? 20
        this._generateBins();
        this.paraview.store.clearVisited();
        this.paraview.store.clearSelected();
        console.log('visited in constructor')
        console.log(this.paraview.store.visitedDatapoints)
    }


    protected _addedToParent() {
        super._addedToParent();
        /*
        if (this._model.depType !== 'number') {
            throw new Error('point chart dependent variables must be numbers');
        }
*/
/*
        const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined> ?? this.paraview.store.model!
        const yValues = this._model.data
            .dropCols([targetAxis])
            .mapCols(col => col.numberSeries.data)
            .flat();
        const xValues = this._model.data.col(targetAxis).toNumberSeries().data;
        */
       ///console.log("displayAxis")
       //console.log(this.paraview.store.settings.type.histogram.displayAxis)

        const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined> 
                            ?? this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)[0]
        let targetFacet;
        for (let facet of this.paraview.store.model!.facets){
            if (this.paraview.store.model!.getFacet(facet.key as string)!.label == targetAxis){
                targetFacet = facet.key
            }
        }
        //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
        let nonTargetFacet;
        if (targetFacet == "y"){
            nonTargetFacet = "x"
        }
        else{
            nonTargetFacet = "y"
        }   
        if (this.settings.displayAxis == "x" || this.settings.displayAxis == undefined){
            this._axisInfo = new AxisInfo(this.paraview.store, {
                  xValues: this.paraview.store.model!.allFacetValues(targetFacet!)!.map((x) => x.value as number),
                  yValues: this.grid,
                });
        }
        else{
            this._axisInfo = new AxisInfo(this.paraview.store, {
                xValues: this.grid,
                yValues: this.paraview.store.model!.allFacetValues(targetFacet!)!.map((x) => x.value as number),
              });
        }
        this.paraview.store.settingControls.add({
            type: 'textfield',
            key: 'type.histogram.bins',
            label: 'Bins',
            options: {
                inputType: 'number',
                min: 5,
                max: 100
            },
            parentView: 'controlPanel.tabs.chart.chart',
        });


        const variables = this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)

        this.paraview.store.settingControls.add({
            type: 'dropdown',
            key: 'type.histogram.groupingAxis',
            label: 'Axis to group:',
            options: {options: variables as string[]},
            parentView: 'controlPanel.tabs.chart.chart'
          });
        this.paraview.store.settingControls.add({
            type: 'dropdown',
            key: 'type.histogram.displayAxis',
            label: 'Axis to display histogram:',
            options: { options: ["x", "y" ] },
            parentView: 'controlPanel.tabs.chart.chart'
        });
    }

    /*
    settingDidChange(key: string, value: any) {
        if (!super.settingDidChange(key, value)) {
          this.paraview.requestUpdate();
          return true;
        }
        return false;
      }
*/

    get datapointViews() {
        return super.datapointViews;
    }

    get grid() {
        return this._grid;
    }

    get maxCount() {
        return this._maxCount;
    }
    get settings() {
        return this._settings;
    }

    protected _newDatapointView(seriesView: XYSeriesView) {
        return new HistogramBinView(this, seriesView);
    }

    protected _beginLayout() {
        this._createDatapoints();
        for (const datapointView of this.datapointViews) {
            datapointView.computeLocation();
        }
        for (const datapointView of this.datapointViews) {
            datapointView.completeLayout();
        }

    }

    completeLayout() {
        super._completeLayout();
    }

    protected _createDatapoints() {
        //this.parent.parent.parent!._vertAxis = new VertAxis(this.parent.parent.parent as DocumentView)
        const xs: string[] = [];
        for (const [x, i] of enumerate(this.paraview.store.model!.allFacetValues('x')!)) {
            xs.push(formatBox(x, this.paraview.store.getFormatType(`${this.parent.docView.type as PointChartType}Point`)));
            const xId = strToId(xs.at(-1)!);
            // if (this.selectors[i] === undefined) {
            //   this.selectors[i] = [];
            // }
            // this.selectors[i].push(`tick-x-${xId}`);
        }
        for (const [col, i] of enumerate(this.paraview.store.model!.series)) {
            const seriesView = new XYSeriesView(this, col.key);
            this._chartLandingView.append(seriesView);
            for (const [value, j] of enumerate(col)) {
                //const datapointView = this._newDatapointView(seriesView);
                //seriesView.append(datapointView);
                // the `index` property of the datapoint view will equal j
                //todo().canvas.jimerator.addSelector(col.name!, j, datapointView.id);
            }
            for (let i = 0; i < this._bins; i++) {
                const bin = new HistogramBinView(this, seriesView);
                seriesView.append(bin)
            }
        }
        // NB: This only works properly because we haven't added series direct labels
        // yet, which are also direct children of the chart.
        this._chartLandingView.sortChildren((a: XYSeriesView, b: XYSeriesView) => {
            return (b.children[0].datapoint.y.value as number) - (a.children[0].datapoint.y.value as number);
        });
    }

    protected _layoutComponents() {
        const values = this._grid.flat();
        this._maxCount = Math.max(...values);
        //super._layoutComponents();
    }
/*
    protected _createDatapoints(): void {
    super._createDatapoints()
    }
    */
    protected _layoutDatapoints() {
        for (const datapointView of this.datapointViews) {
            datapointView.completeLayout();
        }
    }

    protected _generateBins(): Array<number> {
        //console.log("generateBins")
        const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined> 
                            ?? this.paraview.store.model?.facets.map((facet) => this.paraview.store.model?.getFacet(facet.key)?.label)[0]

        let targetFacet;
        for (let facet of this.paraview.store.model!.facets){
            if (this.paraview.store.model!.getFacet(facet.key as string)!.label == targetAxis){
                targetFacet = facet.key
            }
        }
        //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
        let nonTargetFacet;
        if (targetFacet == "y"){
            nonTargetFacet = "x"
        }
        else{
            nonTargetFacet = "y"
        }
        let workingAxisInfo
        if (targetFacet){
            const yValues = []
            const xValues = []
            for (let datapoint of this.paraview.store.model!.series[0]) {
                xValues.push(datapoint.facetAsNumber(targetFacet) as number)
            }
            for (let datapoint of this.paraview.store.model!.series[0]) {
                yValues.push(datapoint.facetAsNumber(nonTargetFacet) as number)
            }
            workingAxisInfo = new AxisInfo(this.paraview.store, {
            xValues: xValues,
            yValues: yValues,
          });
        }
        else{
            workingAxisInfo = new AxisInfo(this.paraview.store, {
            xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
            yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
          });
        }
        
        const seriesList = this.paraview.store.model!.series
        for (let series of seriesList) {
            for (let i = 0; i < series.length; i++) {
                this._data.push([series[i].facetAsNumber(targetFacet ?? "x")! , series[i].facetAsNumber(nonTargetFacet ?? "y")!]);
            } 
        }
        const y: Array<number> = [];
        const x: Array<number> = [];

        for (let point of this._data) {
            x.push(point[0]);
            y.push(point[1]);
        }


        let xMax: number = workingAxisInfo?.xLabelInfo.max!;
        let xMin: number = workingAxisInfo?.xLabelInfo.min!;

        const grid: Array<number> = [];

        for (let i = 0; i < this.bins; i++) {
            grid.push(0);
        }

        for (let point of this._data) {
            const xIndex: number = Math.floor((point[0] - xMin) * this.bins / (xMax - xMin));
            grid[xIndex]++;
        }
        
        return this._grid = grid;
    }
    seriesRef(series: string) {
        return this.paraview.ref<SVGGElement>(`series.${series}`);
    }

    raiseSeries(series: string) {
        const seriesG = this.seriesRef(series).value!;
        this.dataset.append(seriesG);
    }

    /* 
    getDatapointGroupBbox(labelText: string) {
        const xSeries = this._model.indepSeries();
        // XXX Could take these directly from the DOM
        const labels = xSeries.mapBoxed(box => this._model.format(box, 'xTick'));
        const idx = labels.findIndex(label => label === labelText);
        if (idx === -1) {
            throw new Error(`no such datapoint with label '${labelText}'`);
        }
        const g = todo().canvas.ref<SVGGElement>('dataset').value!.children[idx] as SVGGElement;
        return g.getBBox();
    }
*/

    getTickX(idx: number) {
        return this.datapointViews[idx].x; // this.points[idx][0].x;
    }

    get bins() {
        return this._bins;
    }

    moveRight() {
        const leaf = this._chartLandingView.focusLeaf;
        if (leaf instanceof HistogramBinView) {
            if (!leaf.next) {
                //leaf.blur(false)
                //this._eventActionManager!.dispatch('series_endpoint_reached');
            }
            else {
                leaf.next!.focus();
            }
        }
    }

    moveLeft() {
        const leaf = this._chartLandingView.focusLeaf;
        if (leaf instanceof HistogramBinView) {
            if (!leaf.prev) {
                //leaf.blur(false)
                //this._eventActionManager!.dispatch('series_endpoint_reached');
            }
            else {
                leaf.prev!.focus();
            }
        }
    }
    
    moveDown() {
        const leaf = this._chartLandingView.focusLeaf;
        //console.log("leaf")
        //console.log(leaf)
        if (leaf instanceof HistogramBinView) {
            /*
            const nsi = leaf.nextSameIndexer;
            console.log(nsi)
            if (nsi) {
                console.log("test1")
                //leaf.blur(false);
                nsi.focus();
                //this._sonifier.playNotification('series');
            } else {
                console.log("test2")
                leaf.prev!.focus();
                //this._eventActionManager!.dispatch('final_series_reached');
                return;
            }
                */
            if (!leaf.prev) {
                //leaf.blur(false)
                //this._eventActionManager!.dispatch('series_endpoint_reached');
            }
            else {
                //console.log(leaf.next)
                leaf.prev!.focus();
            }
        } else if (leaf instanceof SeriesView) {
            if (!leaf.next) {
                this._chartLandingView.children[0].children[0].focus();
                return;
            } else {
                leaf.next!.focus();
                //this._sonifier.playNotification('series');
            }
        } else {
            // At chart root, so move to the first series landing 
            //console.log("going to series focus")
            this._chartLandingView.children[0].focus(); 
        }
    }

    moveUp() {
        const leaf = this._chartLandingView.focusLeaf;
        if (leaf instanceof HistogramBinView) {
            if (!leaf.next) {
                //leaf.blur(false)
                //this._eventActionManager!.dispatch('series_endpoint_reached');
            }
            else {
                leaf.next!.focus();
            }
        }
    }

}

export class HistogramBinView extends DatapointView {

    declare readonly chart: Histogram;
    declare protected _parent: XYSeriesView;

    protected _height!: number;
    protected _width!: number;
    protected _count: number = 0;
    protected isVisited: boolean = false;
    constructor(
        chart: Histogram,
        series: SeriesView
    ) {

        super(series);
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get count() {
        return this._count
    }

    get _selectedMarkerX() {
        return this._x;
    }

    get _selectedMarkerY() {
        return this._y;
    }

    get selectedMarker(): Shape {
        return new Rect(this.paraview, {
          width: this._width,
          height: this._height,
          x: this._x,
          y: this._y - this._height,
          fill: 'none',
          stroke: 'black',
          strokeWidth: 4
        });
      }

    // protected get visitedTransform() {
    //   return 'scaleX(1.15)';
    // }

    computeLocation(){
    }
    layoutSymbol(){
    }
    /*
     completeLayout() {
    //super.completeLayout();
  }
    */
    completeLayout() {
        if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined){
            //const targetAxis = this.chart.settings.groupingAxis as DeepReadonly<string | undefined> ?? this.chart.model.indepVar
            const id = this.index;
            this._y = this.chart.parent.height;
            this._width = this.chart.parent.width / this.chart.bins;
            this._x = (this.index) % this.chart.bins * this._width
            this._height = (((this.chart.grid[id] - this.chart.axisInfo!.yLabelInfo!.min!) / this.chart.axisInfo!.yLabelInfo!.max!) * this._y)
            this._count = this.chart.grid[id];
            this._id = [
                'datapoint-tile',
                strToId(this.seriesKey),
                `${this._x}`,
                `${this._y}`
            ].join('-');
        }
        else {
            //const targetAxis = this.chart.settings.groupingAxis as DeepReadonly<string | undefined> ?? this.chart.model.indepVar
            const id = this.index - length;
            this._x = 0;
            this._height = this.chart.parent.height / this.chart.bins;
            this._y = (this.chart.grid.length - id - 1) % this.chart.bins * this._height + (this._height) 
            this._width = (((this.chart.grid[id] - this.chart.axisInfo!.xLabelInfo!.min!) / this.chart.axisInfo!.xLabelInfo!.max!) * this.chart.parent.width)
            this._count = this.chart.grid[id];
            
            this._id = [
                'datapoint-tile',
                strToId(this.seriesKey),
                `${this._x}`,
                `${this._y}`
            ].join('-');
            
        }
    }

    summary() {
        const length = this.paraview.store.model!.series.flat()[0].length
        //const yInfo = this.chart.axisInfo!.yLabelInfo!
        //const ySpan = yInfo.range! / this.chart.bins
        //const up = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins))).toFixed(2)
        //const down = (yInfo.max! - ySpan * (Math.floor((this.index - length) / this.chart.bins) + 1)).toFixed(2)
        const xInfo = this.chart.axisInfo!.xLabelInfo!
        const xSpan = xInfo.range! / this.chart.bins;
        const left = (xInfo.min! + xSpan * ((this.index) % this.chart.bins)).toFixed(2)
        const right = (xInfo.min! + xSpan * ((this.index) % this.chart.bins + 1)).toFixed(2)
        return `This bin contains ${this.count} datapoints, which is ${(100 * this.count / length).toFixed(2)}% of the overall data. 
        It spans x values from ${left} to ${right}}`
        
    }

    onFocus() {
        super.onFocus()
        this.isVisited = !this.isVisited
        this._visit();
        this.paraview.store.announce(this.summary());
    }

    protected _visit() {
        this.paraview.store.visit([{seriesKey: this.seriesKey, index: this.index}]);
    }


    protected get _d() {
        return fixed`
          M${this._x},${this._y}
          v${-1 * this._height}
          h${this._width}
          v${this._height}
          Z`;
    }

    render() {
        let stroke = `hsl(0, 0%, 0%)`
        //let fill = todo().controller.colors.colorValueAt(this.seriesProps.color);
        let fill = 0;
        if (this.paraview.store.visitedDatapoints.some(item => item.index === this.index)){
            if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined){
                return svg`
                    <g>
                        <path
                            d='${this._d}'
                            role="datapoint"
                            stroke-width= '2'
                            fill= '${'hsl(0, 100.00%, 50.00%)'}'
                            stroke= '${stroke}'
                            id= '${this.id}'
                        ></path>
                        <line x1=${this._x} y1=${this._y} x2=${this._x + this._width} y2=${this._y} stroke="hsl(0, 100.00%, 50.00%)" stroke-width= 2 />
                    </g>
                `;
            }
            else {
                return svg`
                    <g>
                        <path
                            d='${this._d}'
                            role="datapoint"
                            stroke-width= '2'
                            fill= '${'hsl(0, 100.00%, 50.00%)'}'
                            stroke= '${stroke}'
                            id= '${this.id}'
                        ></path>
                        <line x1=${this._x} y1=${this._y} x2=${this._x} y2=${this._y - this._height} stroke="hsl(0, 100.00%, 50.00%)" stroke-width= 2 />
                    </g>
                `;
            }
        }
        else{
            return svg`
                    <path
                        d='${this._d}'
                        role="datapoint"
                        stroke-width= '2'
                        fill= '${fill}'
                        stroke= '${stroke}'
                        id= '${this.id}'
                    ></path>
            `;
        }
    }

}


/*
export class HistogramDatapointView extends XYDatapointView {

    declare readonly chart: Histogram;
    declare protected _parent: XYSeriesView;

    protected _height!: number;
    protected _width!: number;
    protected _color: number = 0;

    constructor(
        seriesView: XYSeriesView,
    ) {
        super(seriesView);
        this._id = [
                'datapoint-unused',
                strToId(this.seriesKey),
                `${this._x}`,
                `${this._y}`
            ].join('-');
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get color() {
        return this._color
    }

    get _selectedMarkerX() {
        return this._x;
    }

    get _selectedMarkerY() {
        return this._y;
    }

    // protected get visitedTransform() {
    //   return 'scaleX(1.15)';
    // }

    computeLayout() {
        
        const orderIdx = Object.keys(this.stack.bars).indexOf(this.series.name!);
        const distFromXAxis = Object.values(this.stack.bars).slice(0, orderIdx)
          .map(bar => bar._height)
          .reduce((a, b) => a + b, 0);
        const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
        this._height = this.datapoint.y.number*pxPerYUnit;
        this._x = this.stack.x + this.stack.cluster.x;
        this._y = this.chart.height - this._height - distFromXAxis;
        
        if (this.chart.settings.displayAxis == "x" || undefined){
            this._height = this.chart.height / this.chart.bins;
            this._width = this.chart.width / this.chart.bins;
            this._x = this.index % this.chart.bins * this._width
            this._y = Math.floor(this.index / this.chart.bins) * this._height
        }
        
    }

    protected get _d() {

        return fixed`
      M${this._x},${this._y}
      v${this._height}
      h${this._width}
      v${-1 * this._height}
      Z`;
    }

    render() {
        // 'stacked' === this.paraChart.multiseries && this.params.yInfo.stackOffset ?
        // aria-labelledby="${this.params.labelId}"
        //const visitedScale = this._isVisited ? this.chart.settings.highlightScale : 1;
        const visitedScale = 1.5
        const styles = {
            strokeWidth: 2 * visitedScale,
            fill: this.color,
            stroke: "white"
        };
        return svg``;
    }

}
*/