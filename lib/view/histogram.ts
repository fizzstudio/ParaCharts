
import { AxisInfo } from "../common/axisinfo";
import { enumerate, fixed, strToId } from "../common/utils";
import { DeepReadonly, HistogramSettings, PointChartType } from "../store";
import { formatBox } from "./formatter";
import { XYChart, XYDatapointView, XYSeriesView } from "./xychart";
import { svg } from "lit";
import { DatapointView, DataView, SeriesView } from "./data";
import { DataCursor } from "../store";
import { ParaView } from "../paraview";
export class Histogram extends XYChart {
    protected _bins: number = 20;
    protected _data: Array<Array<number>> = [];
    protected _grid: Array<number> = [];
    protected _maxCount: number = 0;
    declare protected _settings: DeepReadonly<HistogramSettings>;
    constructor(
        paraview: ParaView,
        dataLayerIndex: number
    ) {
        super(paraview, dataLayerIndex);
        this._generateBins();
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
        if (this.settings.displayAxis == "x" || this.settings.displayAxis == undefined){
            this._axisInfo = new AxisInfo(this.paraview.store, {
                  xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
                  yValues: this.grid,
                });
        }
        else{
            this._axisInfo = new AxisInfo(this.paraview.store, {
                xValues: this.grid,
                yValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
              });
        }
        /*
        todo().controller.registerSettingManager(this);
        todo().controller.settingViews.add(this, {
            type: 'textfield',
            key: 'type.scatter.resolution',
            label: 'Bins',
            options: {
                inputType: 'number',
                min: 5,
                max: 100
            },
            parentView: 'chartDetails.tabs.chart.chart',
        });


        const variables = [...this.model.depVars]
        variables.unshift(this.model.indepVar)
        todo().controller.settingViews.add(this, {
            type: 'dropdown',
            key: 'type.scatter.groupingAxis',
            label: 'Axis to group:',
            options: {options: variables},
            parentView: 'chartDetails.tabs.chart.chart'
          });
        todo().controller.settingViews.add(this, {
            type: 'dropdown',
            key: 'type.scatter.displayAxis',
            label: 'Axis to display histogram:',
            options: { options: ["x", "y" ] },
            parentView: 'chartDetails.tabs.chart.chart'
        });
        todo().deets!.chartPanel.requestUpdate();
        */
    }

    settingDidChange(key: string, value: any) {
        if (!super.settingDidChange(key, value)) {
          this.paraview.requestUpdate();
          return true;
        }
        return false;
      }


    get datapointViews() {
        return super.datapointViews as HistogramDatapointView[];
    }

    get grid() {
        return this._grid;
    }

    get maxCount() {
        return this._maxCount;
    }

    protected _newDatapointView(seriesView: XYSeriesView) {
        return new HistogramDatapointView(seriesView);
    }

    protected _createComponents() {
        //this.parent.parent.parent!._vertAxis = new VertAxis(this.parent.parent.parent as DocumentView)
        const xs: string[] = [];
        for (const [x, i] of enumerate(this.paraview.store.model!.allFacetValues('x')!)) {
            xs.push(formatBox(x, `${this.parent.docView.type as PointChartType}Point`, this.paraview.store));
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
                const datapointView = this._newDatapointView(seriesView);
                seriesView.append(datapointView);
                // the `index` property of the datapoint view will equal j
                //todo().canvas.jimerator.addSelector(col.name!, j, datapointView.id);
            }
            for (let i = 0; i < this._bins; i++) {
                const bin = new HistogramBinView(this, seriesView.seriesKey);
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
        super._layoutComponents();
    }

    protected _layoutDatapoints() {
        for (const datapointView of this.datapointViews) {
            datapointView.computeLayout();
        }
    }

    protected _generateBins(): Array<number> {
        /*
        const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined> ?? this._model.indepVar
        const yValues = this._model.data
            .dropCols([targetAxis])
            .mapCols(col => col.numberSeries.data)
            .flat();
        const xValues = this._model.data.col(targetAxis).toNumberSeries().data;

        const workingAxisInfo = new AxisInfo(this._model, {
            xValues: xValues,
            yValues: yValues
        });
        */
        const workingAxisInfo = new AxisInfo(this.paraview.store, {
            xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
            yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
          });
        const seriesList = this.paraview.store.model!.series
        for (let series of seriesList) {
            for (let i = 0; i < series.length; i++) {
                this._data.push([series[i].x.value as number, series[i].y.value as number]);
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
            if (!leaf.prev || leaf.prev instanceof HistogramDatapointView) {
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
        if (leaf instanceof DatapointView) {
            const nsi = leaf.nextSameIndexer;
            if (nsi) {
                leaf.blur(false);
                nsi.focus();
                //this._sonifier.playNotification('series');
            } else {
                //this._eventActionManager!.dispatch('final_series_reached');
                return;
            }
        } else if (leaf instanceof SeriesView) {
            if (!leaf.next) {
                //this._eventActionManager!.dispatch('final_series_reached');
                return;
            } else {
                leaf.next!.focus();
                //this._sonifier.playNotification('series');
            }
        } else {
            // At chart root, so move to the first series landing 
            this._chartLandingView.children[0].children[this.paraview.store.model!.series[0].length].focus();
        }
        /*
        const leaf = this._chartLandingView.focusLeaf;
        if (leaf instanceof HistogramBinView) {
            if (!leaf.prev || leaf.prev instanceof HistogramDatapointView) {
                //leaf.blur(false)
                //this._eventActionManager!.dispatch('series_endpoint_reached');
            }
            else {
                leaf.prev!.focus();
            }
        }
            */
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
        /*
        const orderIdx = Object.keys(this.stack.bars).indexOf(this.series.name!);
        const distFromXAxis = Object.values(this.stack.bars).slice(0, orderIdx)
          .map(bar => bar._height)
          .reduce((a, b) => a + b, 0);
        const pxPerYUnit = this.chart.height/this.chart.axisInfo!.yLabelInfo.range!;
        this._height = this.datapoint.y.number*pxPerYUnit;
        this._x = this.stack.x + this.stack.cluster.x;
        this._y = this.chart.height - this._height - distFromXAxis;
        */
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

export class HistogramBinView extends DataView {

    declare readonly chart: Histogram;
    declare protected _parent: XYSeriesView;

    protected _height!: number;
    protected _width!: number;
    protected _count: number = 0;
    protected isVisited: boolean = false;
    constructor(
        chart: Histogram,
        seriesKey: string
    ) {

        super(chart, seriesKey);
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

    // protected get visitedTransform() {
    //   return 'scaleX(1.15)';
    // }

    protected computeLocation(){
    }
    protected layoutSymbol(){
    }
    computeLayout() {
        if (this.chart.settings.displayAxis == "x" || this.chart.settings.displayAxis == undefined){
            //const targetAxis = this.chart.settings.groupingAxis as DeepReadonly<string | undefined> ?? this.chart.model.indepVar
            const length = this.chart.paraview.store!.model!.series[0].length
            const id = this.index - length;
            this._y = this.chart.parent.height;
            this._width = this.chart.parent.width / this.chart.bins;
            this._x = (this.index - length) % this.chart.bins * this._width
            this._height = ((this.chart.grid[id] / this.chart.maxCount) * this._y * .9)
            this._count = this.chart.grid[id];
            /*
            this._id = [
                'datapoint',
                utils.strToId(this.series.name!),
                `${this._x}`,
                `${this._y}`
            ].join('-');
            */
        }
        else {
            //const targetAxis = this.chart.settings.groupingAxis as DeepReadonly<string | undefined> ?? this.chart.model.indepVar
            const length = this.chart.paraview.store!.model!.series[0].length
            const id = this.index - length;
            this._x = 0;
            this._height = this.chart.parent.height / this.chart.bins;
            this._y = (this.chart.grid.length - id - 1) % this.chart.bins * this._height + (this._height) 
            this._width = ((this.chart.grid[id] / this.chart.maxCount) * this.chart.parent.width * .9)
            this._count = this.chart.grid[id];
            
            this._id = [
                'datapoint',
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
        const left = (xInfo.min! + xSpan * ((this.index - length) % this.chart.bins)).toFixed(2)
        const right = (xInfo.min! + xSpan * ((this.index - length) % this.chart.bins + 1)).toFixed(2)
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