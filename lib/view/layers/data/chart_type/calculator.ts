import { StyleInfo } from "lit/directives/style-map.js";
import { DeepReadonly, GraphSettings, LineSettings, Setting } from "../../../../store";
import { LineChart, LineSection } from "./line_chart";
import { XYSeriesView } from "./xy_chart";
import { AxisInfo } from "../../../../common/axisinfo";
import { parse, simplify } from "mathjs";
import { html } from "lit";

export class GraphingCalculator extends LineChart {
  protected renderPts: number = 50;
  protected currEquations: string[] = [];
  protected _addedToParent() {
    super._addedToParent();
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.x.minValue',
      label: 'Min x-value',
      options: { inputType: 'number' },
      value: this.paraview.store.settings.axis.x.minValue === 'unset' ? -10 : this.paraview.store.settings.axis.x.minValue,
      validator: value => {
        const min = this.paraview.store.settings.axis.x.maxValue == "unset" 
          ? 10
          : this.paraview.store.settings.axis.x.maxValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values. 
        return value as number >= min ?
          { err: `Min x-value (${value}) must be less than (${min})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'axis.x.maxValue',
      label: 'Max x-value',
      options: { inputType: 'number' },
      value: this.paraview.store.settings.axis.x.maxValue === 'unset' ? 10 : this.paraview.store.settings.axis.x.maxValue,
      validator: value => {
        const max = this.paraview.store.settings.axis.x.minValue == "unset" 
          ? -10
          : this.paraview.store.settings.axis.x.minValue as number
        // NB: If the new value is successfully validated, the inner chart
        // gets recreated, and `max` may change, due to re-quantization of
        // the tick values. 
        return value as number <= max ?
          { err: `Min x-value (${value}) must be less than (${max})`} : {};
      },
      parentView: 'controlPanel.tabs.chart.general',
    });
    this.paraview.store.settingControls.add({
      type: 'button',
      key: 'type.graph.resetAxes',
      label: 'Reset Axes to default',
      parentView: 'controlPanel.tabs.chart.chart',
    });



    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'type.graph.lineWidth',
      label: 'Line width',
      options: {
        inputType: 'number',
        min: 1,
        max: this.paraview.store.settings.type.graph.lineWidthMax as number
      },
      parentView: 'controlPanel.tabs.chart.chart',
    });
    this.paraview.store.settingControls.add({
      type: 'checkbox',
      key: 'type.graph.isDrawSymbols',
      label: 'Show symbols',
      parentView: 'controlPanel.tabs.chart.chart',
    });

    this.paraview.store.settingControls.add({
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

    this.paraview.store.settingControls.add({
      type: 'textfield',
      key: 'type.graph.equation',
      label: 'Equation',
      options: {
        inputType: 'text'
      },
      parentView: 'controlPanel.tabs.graphing.general',
    });

    this.paraview.store.settingControls.add({
      type: 'dropdown',
      key: 'type.graph.preset',
      label: 'Example equations:',
      options: { options: ['', 'x', 'x^2', 'sin(x)', 'sqrt(x)','(x/2)^3-2x', '2(sin(x)+cos(2x/3))'] as string[] },
      parentView: 'controlPanel.tabs.graphing.general'
    });

    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: [this.paraview.store.settings.axis.x.minValue == "unset" ? -10 : this.paraview.store.settings.axis.x.minValue, 
        this.paraview.store.settings.axis.x.maxValue == "unset" ? 10 : this.paraview.store.settings.axis.x.maxValue],
      yValues: [-10, 10],
      yMin: -10,
      yMax: 10
    })
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.graph.equation'].includes(path)) {
      this.paraview.store.clearVisited();
      this.paraview.store.clearSelected();
      this.paraview.store.sparkBrailleInfo = null;
      this.addEquation(newValue as string);
    }
    else if (['type.graph.preset'].includes(path)) {
      this.paraview.store.updateSettings(draft => {
            draft.type.graph.equation = String(newValue);
          });
    }
    else if (['type.graph.renderPts'].includes(path)) {
      this.paraview.store.clearVisited();
      this.paraview.store.clearSelected();
      this.paraview.store.sparkBrailleInfo = null;
      this.renderPts = Number(newValue)
      this.addEquation(this.paraview.store.settings.type.graph.equation)
    }
    else if (['axis.x.maxValue', 'axis.x.minValue'].includes(path)){
      this.addEquation(this.paraview.store.settings.type.graph.equation)
    }
    else if (['type.graph.resetAxes'].includes(path)){
      this.paraview.store.clearVisited();
      this.paraview.store.clearSelected();
      this.paraview.store.sparkBrailleInfo = null;
      this.paraview.store.updateSettings(draft => {
        draft.axis.x.maxValue = 'unset';
        draft.axis.x.minValue = 'unset';
        draft.axis.y.maxValue = 'unset';
        draft.axis.y.minValue = 'unset';
      });
      this.addEquation(this.paraview.store.settings.type.graph.equation)
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  addEquation(eq: string) {
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: [this.paraview.store.settings.axis.x.minValue == "unset" ? -10 : this.paraview.store.settings.axis.x.minValue,
      this.paraview.store.settings.axis.x.maxValue == "unset" ? 10 : this.paraview.store.settings.axis.x.maxValue],
      yValues: [-10, 10],
      yMin: -10,
      yMax: 10
    })
    var container = this.paraview.paraChart.slotted[0]
    var table = document.createElement("table");
    var trVar = document.createElement("tr");
    var xVar = document.createElement("td");
    var yVar = document.createElement("td");
    xVar.innerHTML = "X values";
    yVar.innerHTML = "Y values";
    xVar.setAttribute("data-type", "number");
    yVar.setAttribute("data-type", "number");
    trVar.append(xVar);
    trVar.append(yVar);
    table.append(trVar);
    const input = eq
    const parsedInput = parse(input);
    //@ts-ignore
    if (parsedInput.args !== undefined || parsedInput.value !== undefined || parsedInput.name !== undefined) {
      var simplified = simplify(parsedInput);
      console.log(simplified.toString());
      var xVals = [];
      var yVals = [];
      const points = this.renderPts
      const xMax = this.axisInfo!.xLabelInfo!.max ?? 10
      const xMin = this.axisInfo!.xLabelInfo!.min ?? -10
      for (var i = 0; i < points + 1; i++) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var xVal = parseFloat((i / (points / ((xMax - xMin))) + (xMin)).toFixed(3))
        const simpEval = simplified.evaluate({ x: xVal })
        if (simpEval.im === undefined){
          var yVal = simpEval.toFixed(3);
        }
        if (yVal !== undefined && !Number.isNaN(yVal) && yVal !== Infinity && yVal !== "Infinity" && yVal !== -Infinity && yVal !== "-Infinity" && yVal.im === undefined) {
          td1.innerHTML = String(xVal);
          td2.innerHTML = yVal;
          tr.append(td1);
          tr.append(td2);
          table.append(tr);
          xVals.push(xVal);
          yVals.push(yVal);
        }
      }
      if (container){
        if(container.firstElementChild){
          container.removeChild(container.firstElementChild);
        }
        container.append(table);
        this.paraview.dispatchEvent(new CustomEvent('paraviewready', {bubbles: true, composed: true, cancelable: true}));
      }
    }
  }

  get datapointViews() {
    return super.datapointViews as LineSection[];
  }

  get settings() {
    return super.settings as DeepReadonly<GraphSettings>;
  }

  

  updateSeriesStyle(styleInfo: StyleInfo) {
    super.updateSeriesStyle(styleInfo);
    styleInfo.strokeWidth = this.effectiveLineWidth;
  }

  get effectiveLineWidth() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? this.paraview.store.settings.type.graph.lowVisionLineWidth
      : this.paraview.store.settings.type.graph.lineWidth;
  }

  get effectiveVisitedScale() {
    return this.paraview.store.settings.ui.isLowVisionModeEnabled
      ? 1
      : this.paraview.store.settings.type.graph.lineHighlightScale;

  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new GraphLine(seriesView);
  }

  protected _sparkBrailleInfo() {
    let data = this._navMap.cursor.datapointViews[0].series.datapoints.map(dp =>
      dp.facetValueAsNumber('y')!).join(' ')
    //Sparkbrailles with more than 50 points either get cut off by the edge of the panel, or push the panel outwards and make it look bad
    if (this._navMap.cursor.datapointViews[0].series.datapoints.length > 50) {
      const length = this._navMap.cursor.datapointViews[0].series.datapoints.length
      let indices = []
      for (let i = 0; i < 50; i++) {
        indices.push(Math.floor(i * length / 50))
      }
      data = this._navMap.cursor.datapointViews[0].series.datapoints.filter((e, index) => { return indices.includes(index); }).map(dp =>
        dp.facetValueAsNumber('y')!).join(' ');
    }
    return {
      data: data,
      isBar: this.paraview.store.type === 'bar' || this.paraview.store.type === 'column'
    };
  }
}

export class GraphLine extends LineSection{

  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.facetValueNumericized(this.datapoint.indepKey)! - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  protected _computePrev() {
      this._prevMidX = !this.prev ? undefined : (this.prev.x - this.x)/2 // - 0.1;
      this._prevMidY = (this._prev!.y - this.y)/2;
  }

  protected _computeNext() {
    this._nextMidX = !this.next ? undefined : (this.next.x - this.x) / 2; // + 0.1;
    this._nextMidY = (this._next!.y - this.y) / 2;
  }

  content(){
    if (this._shape) {
      this._shape.styleInfo = this.styleInfo;
      this._shape.classInfo = this.classInfo;  
      if (this._shape.y < 0 || this._shape.y > this.chart.parent.logicalHeight){
        this._shape.hidden = true;
      }
    }
    if (this._symbol) {
      this._symbol.scale = this._symbolScale;
      this._symbol.color = this._symbolColor;
      this._symbol.hidden = !this.paraview.store.settings.type.graph.isDrawSymbols;
      if (this._symbol.y < 0 || this._symbol.y > this.chart.parent.logicalHeight){
        this._symbol.hidden = true;
      }
    }
     return this.renderChildren();
  }

}