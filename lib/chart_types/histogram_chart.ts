import { PlaneChartInfo } from '.';
import { type ParaStore, type DeepReadonly } from '../store';
import { type ChartType } from "@fizz/paramanifest";
import { AxisInfo, computeLabels } from '../common';

export class HistogramChartInfo extends PlaneChartInfo {
  protected _bins: number = 20;
  protected _data: Array<Array<number>> = [];
  protected _grid: Array<number> = [];
  protected _maxCount: number = 0;
  constructor(type: ChartType, store: ParaStore) {
    super(type, store);
  }

  protected _init() {
    super._init();
    this._bins = this._store.settings.type.histogram.bins ?? 20;
    this._generateBins();
    const values = this._grid.flat();
    this._maxCount = Math.max(...values);
    this._store.clearVisited();
    this._store.clearSelected();

    const targetAxis = this.settings.groupingAxis as DeepReadonly<string> == '' ?
      this._store.model?.facetSignatures.map((facet) => this._store.model?.getFacet(facet.key)?.label)[0]
      : this.settings.groupingAxis;
    let targetFacet;
    for (let facet of this._store.model!.facetSignatures) {
      if (this._store.model!.getFacet(facet.key as string)!.label == targetAxis) {
        targetFacet = facet.key;
      }
    }
    //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
    let nonTargetFacet;
    if (targetFacet == "y") {
      nonTargetFacet = "x";
    }
    else {
      nonTargetFacet = "y";
    }

    const targetFacetBoxes = this._store.model!.allFacetValues(targetFacet!)!;
    const targetFacetNumbers = targetFacetBoxes.map((b) => b.asNumber()!);
    if (this.settings.displayAxis == "x" || this.settings.displayAxis == undefined) {
      if (this.settings.relativeAxes == "Counts") {
        this._axisInfo = new AxisInfo(this._store, {
          xValues: targetFacetNumbers,
          yValues: this.grid,
        });
      }
      else {
        const sum = this.grid.reduce((a, c) => a + c)
        const pctGrid = this.grid.map(g => g / sum)
        this._axisInfo = new AxisInfo(this._store, {
          xValues: targetFacetNumbers,
          yValues: pctGrid
        });
      }
    }
    else {
      if (this.settings.relativeAxes == "Counts") {
        this._axisInfo = new AxisInfo(this._store, {
          xValues: this.grid,
          yValues: targetFacetNumbers,
        });
      }
      else {
        const sum = this.grid.reduce((a, c) => a + c)
        const pctGrid = this.grid.map(g => g / sum)
        this._axisInfo = new AxisInfo(this._store, {
          xValues: pctGrid,
          yValues: targetFacetNumbers,
        });
      }
    }
  }

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._store.settingControls.add({
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
    const variables = this._store.model?.facetSignatures.map((facet) => this._store.model?.getFacet(facet.key)?.label);
    this._store.settingControls.add({
      type: 'dropdown',
      key: 'type.histogram.groupingAxis',
      label: 'Axis to group:',
      options: { options: variables as string[] },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._store.settingControls.add({
      type: 'dropdown',
      key: 'type.histogram.displayAxis',
      label: 'Axis to display histogram:',
      options: { options: ["x", "y"] },
      parentView: 'controlPanel.tabs.chart.chart'
    });
    this._store.settingControls.add({
      type: 'dropdown',
      key: 'type.histogram.relativeAxes',
      label: 'Show counts vs percentages:',
      options: { options: ["Counts", "Percentage"] },
      parentView: 'controlPanel.tabs.chart.chart'
    });
  }

  get grid() {
    return this._grid;
  }

  get maxCount() {
    return this._maxCount;
  }

  protected _generateBins(): Array<number> {
    const targetAxis = this.settings.groupingAxis as DeepReadonly<string | undefined>
      ?? this._store.model?.facetSignatures.map((facet) => this._store.model?.getFacet(facet.key)?.label)[0];

    let targetFacet;
    for (let facet of this._store.model!.facetSignatures) {
      if (this._store.model!.getFacet(facet.key as string)!.label == targetAxis) {
        targetFacet = facet.key;
      }
    }
    //HACK: THIS WILL BREAK IF WE EVER ADD MORE FACETS THAN JUST X/Y
    let nonTargetFacet;
    if (targetFacet == "y") {
      nonTargetFacet = "x";
    }
    else {
      nonTargetFacet = "y";
    }
    let workingLabels;
    if (targetFacet) {
      const yValues = []
      const xValues = []
      for (let datapoint of this._store.model!.series[0]) {
        xValues.push(datapoint.facetValueNumericized(targetFacet)!)
      }
      for (let datapoint of this._store.model!.series[0]) {
        yValues.push(datapoint.facetValueNumericized(nonTargetFacet)!)
      }
      workingLabels = computeLabels(Math.min(...xValues), Math.max(...xValues), false)
    }
    else {
      const xBoxes = this._store.model!.allFacetValues('x')!;
      const xNumbers = xBoxes.map((x) => x.asNumber()!);
      workingLabels = computeLabels(Math.min(...xNumbers), Math.max(...xNumbers), false);
    }
    const seriesList = this._store.model!.series
    this._data = [];
    for (let series of seriesList) {
      for (let i = 0; i < series.length; i++) {
        this._data.push([series[i].facetValueNumericized(targetFacet ?? "x")!, series[i].facetValueNumericized(nonTargetFacet ?? "y")!]);
      }
    }

    const y: Array<number> = [];
    const x: Array<number> = [];

    for (let point of this._data) {
      x.push(point[0]);
      y.push(point[1]);
    }

    let xMax: number = workingLabels.max!
    let xMin: number = workingLabels.min!

    const grid: Array<number> = [];

    for (let i = 0; i < this.bins; i++) {
      grid.push(0);
    }

        for (let point of this._data) {
          // TODO: check that `- 1` is correct
          const xIndex: number = Math.floor((point[0] - xMin) * (this.bins - 1) / (xMax - xMin));
          grid[xIndex]++;
        }
        return this._grid = grid;
    }

  get bins() {
    return this._bins;
  }

  async moveRight() {
    // const leaf = this._chartLandingView.focusLeaf;
    // if (leaf instanceof HistogramBinView) {
    //   if (!leaf.next) {
    //     //leaf.blur(false)
    //     //this._eventActionManager!.dispatch('series_endpoint_reached');
    //   }
    //   else {
    //     await leaf.next!.focus();
    //   }
    // }
  }

  async moveLeft() {
    // const leaf = this._chartLandingView.focusLeaf;
    // if (leaf instanceof HistogramBinView) {
    //   if (!leaf.prev) {
    //     //leaf.blur(false)
    //     //this._eventActionManager!.dispatch('series_endpoint_reached');
    //   }
    //   else {
    //     await leaf.prev!.focus();
    //   }
    // }
  }

  async moveDown() {
    // const leaf = this._chartLandingView.focusLeaf;
    // if (leaf instanceof HistogramBinView) {
    //   if (!leaf.prev) {
    //     //leaf.blur(false)
    //     //this._eventActionManager!.dispatch('series_endpoint_reached');
    //   }
    //   else {
    //     await leaf.prev!.focus();
    //   }
    // } else if (leaf instanceof SeriesView) {
    //   if (!leaf.next) {
    //     await this._chartLandingView.children[0].children[0].focus();
    //     return;
    //   } else {
    //     await leaf.next!.focus();
    //     //this._sonifier.playNotification('series');
    //   }
    // } else {
    //   // At chart root, so move to the first series landing
    //   await this._chartLandingView.children[0].focus();
    // }
  }

  async moveUp() {
    // const leaf = this._chartLandingView.focusLeaf;
    // if (leaf instanceof HistogramBinView) {
    //   if (!leaf.next) {
    //     //leaf.blur(false)
    //     //this._eventActionManager!.dispatch('series_endpoint_reached');
    //   }
    //   else {
    //     await leaf.next!.focus();
    //   }
    // }
  }

}
