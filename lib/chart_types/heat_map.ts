import { AxisInfo, computeLabels } from '../common/axisinfo';

import { ChartType } from "@fizz/paramanifest";
import { PlaneChartInfo } from './plane_chart';
import { ParaStore } from '../store';
import { type NavNode } from '../view/layers';
import { DocumentView } from '../view/document_view';

export class HeatMapInfo extends PlaneChartInfo {
  protected _resolution!: number;
  protected _data!: Array<Array<number>>;
  protected _grid!: Array<Array<number>>;
  protected _maxCount!: number;

  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _init() {
    this._resolution = this._store.settings.type.heatmap.resolution ?? 20;
    this._generateHeatmap();
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    //this._store.clearVisited();
    //this._store.clearSelected();
    this._axisInfo = new AxisInfo(this._store, {
      xValues: this._store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this._store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
    // Generate the heat map before creating the nav nodes
    super._init();
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._store.settingControls.add({
      type: 'textfield',
      key: 'type.heatmap.resolution',
      label: 'Resolution',
      options: {
        inputType: 'number',
        min: 5,
        max: 100
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
  }

  get grid() {
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }

  protected _createPrimaryNavNodes() {
    super._createPrimaryNavNodes();
    // Create vertical links between datapoints
    this._navMap!.root.query('series').forEach(seriesNode => {
      seriesNode.allNodes('right')
        // skip bottom row
        .slice(0, -this._resolution).forEach((pointNode, i) => {
        pointNode.connect('down', pointNode.layer.get('datapoint', i + this._resolution)!);
      });
    });
  }

  protected _createNavLinksBetweenSeries() {
    // Don't do anything here, since we create vertical links between rows
    // XXX For the case of a multi-series heatmap, we need to do ... something
  }

  protected _createChordNavNodes() {

  }

  protected _datapointSummary(index: number) {
    const count = this._grid[index % this._resolution][Math.floor(index/this._resolution)];
    const xInfo = this._axisInfo!.xLabelInfo!
    const yInfo = this._axisInfo!.yLabelInfo!
    const xSpan = xInfo.range! / this._resolution;
    const ySpan = yInfo.range! / this._resolution;
    const up = (yInfo.max! - ySpan * (Math.floor((index) / this._resolution))).toFixed(2);
    const down = (yInfo.max! - ySpan * (Math.floor((index) / this._resolution) + 1)).toFixed(2);
    const left = (xInfo.min! + xSpan * ((index) % this._resolution)).toFixed(2);
    const right = (xInfo.min! + xSpan * ((index) % this._resolution + 1)).toFixed(2);
    return `This block contains ${count} datapoints. It spans x values from ${left} to ${right}, and y values from ${down} to ${up}`
  }

  async navRunDidEnd(cursor: NavNode) {
    if (cursor.isNodeType('datapoint')) {
      this._store.announce(this._datapointSummary(cursor.options.index));
    }
    //Sam: Most stuff here (summaries, sparkbraille, sonification) is not implemented yet for heatmaps,
    // I'm overriding to prevent errors, uncomment this as they get added
    /*
      const seriesKey = cursor.at(0)?.seriesKey ?? '';
      if (cursor.type === 'top') {
        await this.paraview.store.asyncAnnounce(this.paraview.summarizer.getChartSummary());
      } else if (cursor.type === 'series') {
        this.paraview.store.announce(
          await this.paraview.summarizer.getSeriesSummary(seriesKey));
        this._playRiff();
        this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'datapoint') {
        // NOTE: this needs to be done before the datapoint is visited, to check whether the series has
        //   ever been visited before this point
        const seriesPreviouslyVisited = this.paraview.store.everVisitedSeries(seriesKey);
        const announcements = [this.paraview.summarizer.getDatapointSummary(cursor.at(0)!.datapoint, 'statusBar')];
        const isSeriesChange = !this.paraview.store.wasVisitedSeries(seriesKey);
        if (isSeriesChange) {
          announcements[0] = `${seriesKey}: ${announcements[0]}`;
          if (!seriesPreviouslyVisited) {
            const seriesSummary = await this.paraview.summarizer.getSeriesSummary(seriesKey);
            announcements.push(seriesSummary);
          }
        }
        this.paraview.store.announce(announcements);
        if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          this._playDatapoints([cursor.at(0)!.datapoint]);
        }
        this.paraview.store.sparkBrailleInfo = this._sparkBrailleInfo();
      } else if (cursor.type === 'chord') {
        if (this.paraview.store.settings.sonification.isSoniEnabled) { // && !isNewComponentFocus) {
          if (this.paraview.store.settings.sonification.isArpeggiateChords) {
            this._playRiff(this._chordRiffOrder());
          } else {
            this._playDatapoints(cursor.datapointViews.map(view => view.datapoint));
          }
        }
      } else if (cursor.type === 'sequence') {
        this.paraview.store.announce(await this.paraview.summarizer.getSequenceSummary(cursor.options as SequenceNavNodeOptions));
        this._playRiff();
      }
        */
  }

  protected _generateHeatmap(): Array<Array<number>> {
    const seriesList = this._store.model!.series;
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetValueNumericized("x")!, series[i].facetValueNumericized("y")!]);
      }
    }

    const y: Array<number> = [];
    const x: Array<number> = [];

    for (const point of this._data) {
      x.push(point[0]);
      y.push(point[1]);
    }
    const xLabels = computeLabels(Math.min(...this._store.model!.allFacetValues('x')!.map((x) => x.value as number)),
      Math.max(...this._store.model!.allFacetValues('x')!.map((x) => x.value as number)), false);
    const yLabels = computeLabels(Math.min(...this._store.model!.allFacetValues('y')!.map((x) => x.value as number)),
      Math.max(...this._store.model!.allFacetValues('y')!.map((x) => x.value as number)), false);

    let yMax: number = yLabels.max!;
    let xMax: number = xLabels.max!;
    let yMin: number = yLabels.min!;
    let xMin: number = xLabels.min!;

    xMax += (xMax - xMin) / 10;
    xMin -= (xMax - xMin) / 10;

    const grid: Array<Array<number>> = [];

    for (let i = 0; i < this.resolution; i++) {
      grid.push([]);
      for (let j = 0; j < this.resolution; j++) {
        grid[i].push(0);
      }
    }
    for (const point of this._data) {
      const xIndex: number = Math.floor((point[0] - xMin) * this.resolution / (xMax - xMin));
      const yIndex: number = Math.floor((point[1] - yMin) * this.resolution / (yMax - yMin));
      grid[xIndex][this.resolution - yIndex - 1]++;
    }
    this._grid = grid;
    return grid;
  }

  get resolution() {
    return this._resolution
  }

  goSeriesMinMax(isMin: boolean): void {

  }

  goChartMinMax(isMin: boolean): void {

  }
}
