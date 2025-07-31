import { StyleInfo } from "lit/directives/style-map.js";
import { LineChartInfo } from '.';
import { DeepReadonly, Direction, GraphSettings, Setting } from "../../../../store";
import { LinePlotView, LineSection } from '.';
import { PlaneSeriesView } from ".";
import { AxisInfo } from "../../../../common/axisinfo";
import { parse, simplify } from "mathjs";
import { Box, PlaneDatapoint} from "@fizz/paramodel";
import { RiffOrder, SONI_RIFF_SPEEDS } from '../../../../chart_types';
import { NumberBox } from "@fizz/dataframe";
import { isUnplayable } from "../../../../audio/sonifier";
import { NavLayer, NavNode } from "../navigation";

export class GraphingCalculatorInfo extends LineChartInfo {
  protected _renderPts: number = 50;
  protected _currEquations: string[] = [];

  protected _addSettingControls(): void {
    super._addSettingControls();
    this._store.settingControls.add({
      type: 'textfield',
      key: 'axis.x.minValue',
      label: 'Min x-value',
      options: { inputType: 'number' },
      value: this._store.settings.axis.x.minValue === 'unset'
        ? -10
        : this._store.settings.axis.x.minValue,
      validator: value => {
        const min = this._store.settings.axis.x.maxValue == "unset"
          ? 10
          : this._store.settings.axis.x.maxValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number >= min ?
          { err: `Min x-value (${value}) must be less than (${min})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
    this._store.settingControls.add({
      type: 'textfield',
      key: 'axis.x.maxValue',
      label: 'Max x-value',
      options: { inputType: 'number' },
      value: this._store.settings.axis.x.maxValue === 'unset'
        ? 10
        : this._store.settings.axis.x.maxValue,
      validator: value => {
        const max = this._store.settings.axis.x.minValue == "unset"
          ? -10
          : this._store.settings.axis.x.minValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values.
        return value as number <= max ?
          { err: `Min x-value (${value}) must be less than (${max})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
    this._store.settingControls.add({
      type: 'button',
      key: 'type.graph.resetAxes',
      label: 'Reset Axes to default',
      parentView: 'controlPanel.tabs.chart.chart',
    });

    this._store.settingControls.add({
      type: 'textfield',
      key: 'type.graph.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number',
        min: 1,
        max: this._store.settings.type.graph.lineWidthMax as number,
        size: 2
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this._store.settingControls.add({
      type: 'checkbox',
      key: 'type.graph.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'controlPanel.tabs.chart.chart',
    });

    this._store.settingControls.add({
      type: 'textfield',
      key: 'type.graph.renderPts',
      label: '# of Rendering points',
      options: {
        inputType: 'number',
        min: 5,
        max: 200
      },
      parentView: 'controlPanel.tabs.graphing.general',
    });

    this._store.settingControls.add({
      type: 'textfield',
      key: 'type.graph.equation',
      label: 'Equation',
      options: {
        inputType: 'text'
      },
      parentView: 'controlPanel.tabs.graphing.general',
    });

    this._store.settingControls.add({
      type: 'dropdown',
      key: 'type.graph.preset',
      label: 'Example equations:',
      options: { options: ['', 'x', 'x^2', 'sin(x)', 'sqrt(x)','(x/2)^3-2x', '2(sin(x)+cos(2x/3))'] as string[] },
      parentView: 'controlPanel.tabs.graphing.general'
    });
  }

  protected _init(): void {
    super._init();
    this._axisInfo = new AxisInfo(this._store, {
      xValues: [
        this._store.settings.axis.x.minValue == "unset"
          ? -10
          : this._store.settings.axis.x.minValue,
        this._store.settings.axis.x.maxValue == "unset"
          ? 10
          : this._store.settings.axis.x.maxValue],
      yValues: [-10, 10],
      yMin: -10,
      yMax: 10
    })
  }

  get renderPts() {
    return this._renderPts;
  }

  set renderPts(renderPts: number) {
    this._renderPts = renderPts;
  }

  clearStore() {
    clearInterval(this._soniRiffInterval!);
    this._store.clearVisited();
    this._store.clearSelected();
    this._store.sparkBrailleInfo = null;
  }

  protected _sparkBrailleInfo() {
    let data = this._navMap!.cursor.datapointViews[0].series.datapoints.map(dp =>
      dp.facetValueAsNumber('y')!).join(' ')
    //Sparkbrailles with more than 50 points either get cut off by the edge of the panel, or push the panel outwards and make it look bad
    if (this._navMap!.cursor.datapointViews[0].series.datapoints.length > 50) {
      const length = this._navMap!.cursor.datapointViews[0].series.datapoints.length
      let indices = []
      for (let i = 0; i < 50; i++) {
        indices.push(Math.floor(i * length / 50))
      }
      data = this._navMap!.cursor.datapointViews[0].series.datapoints.filter((e, index) => { return indices.includes(index); }).map(dp =>
        dp.facetValueAsNumber('y')!).join(' ');
    }
    return {
      data: data,
      isBar: this.paraview.store.type === 'bar' || this.paraview.store.type === 'column'
    };
  }

  protected _playRiff(order?: RiffOrder) {
    if (this.paraview.store.settings.sonification.isSoniEnabled
      && this.paraview.store.settings.sonification.isRiffEnabled) {
      const datapoints = this._navMap!.cursor.datapointViews.map(view => view.datapoint) as PlaneDatapoint[];
      if (order === 'sorted') {
        datapoints.sort((a, b) => a.facetValueAsNumber('y')! - b.facetValueAsNumber('y')!);
      } else if (order === 'reversed') {
        datapoints.reverse();
      }
      const datapointsFilled: PlaneDatapoint[] = []
      const seriesKey = datapoints[0].seriesKey
      const INTERNAL_SEGMENTS = 10
      for (let i = 0; i < datapoints.length - 1; i++) {
        datapointsFilled.push(datapoints[i])
        for (let j = 1; j < INTERNAL_SEGMENTS; j++) {
          const y = ((datapoints[i + 1].facetValueAsNumber("y")! - datapoints[i].facetValueAsNumber("y")!) * j / INTERNAL_SEGMENTS) + datapoints[i].facetValueAsNumber("y")!
          const x = ((datapoints[i + 1].facetValueAsNumber("x")! - datapoints[i].facetValueAsNumber("x")!) * j / INTERNAL_SEGMENTS) + datapoints[i].facetValueAsNumber("x")!
          datapointsFilled.push(new PlaneDatapoint({x: new NumberBox(x) as unknown as Box<'number'>, y: new NumberBox(y) as unknown as Box<'number'>}, seriesKey, j + INTERNAL_SEGMENTS * i, "x", "y"))
        }
      }
      datapointsFilled.push(datapoints[datapoints.length - 1])
      //Trim unplayable notes from front and back, but not between playable notes
      while(datapointsFilled.length > 0 && isUnplayable(datapointsFilled[0].facetValueNumericized(datapointsFilled[0].depKey)!, this.parent.docView.yAxis!)){
        datapointsFilled.shift()
      }
      while(datapointsFilled.length > 0 && isUnplayable(datapointsFilled[datapointsFilled.length - 1].facetValueNumericized(datapointsFilled[datapointsFilled.length - 1].depKey)!, this.parent.docView.yAxis!)){
        datapointsFilled.pop()
      }
      const noteCount = datapointsFilled.length;
      if (noteCount) {
        if (this._soniRiffInterval!) {
          clearInterval(this._soniRiffInterval!);
        }
        this.soniSequenceIndex++;
        this._soniRiffInterval = setInterval(() => {
          const datapoint = datapointsFilled.shift();
          if (!datapoint) {
            clearInterval(this._soniRiffInterval!);
          } else {
            this._sonifier.playDatapoints(true, datapoint as PlaneDatapoint);
            this.soniNoteIndex++;
          }
        }, SONI_RIFF_SPEEDS.at(this.paraview.store.settings.sonification.riffSpeedIndex)! / INTERNAL_SEGMENTS);
      }
      else{
        console.log("No sonifiable notes detected, ensure some portion of the graph is visible on screen")
      }
    }
  }

  protected _createPrimaryNavNodes() {
    super._createPrimaryNavNodes();
    // Create vertical links between datapoints
    this._navMap!.root.query('series').forEach(seriesNode => {
      seriesNode.allNodes('right')
        .forEach((pointNode) => {
          pointNode.connect('out', seriesNode!);
        });
    });
  }

  async move(dir: Direction) {
    const cursor = this._navMap!.cursor!;
    const link = cursor.getLink(dir)
    if (this.checkHorizExpand(cursor, link, dir) || this.checkVertExpand(cursor, link, dir)) {
      return
    }
    await cursor.move(dir);
  }
}
