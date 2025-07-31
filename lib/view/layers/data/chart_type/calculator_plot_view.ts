import { StyleInfo } from "lit/directives/style-map.js";
import { DeepReadonly, Direction, GraphSettings, Setting, datapointIdToCursor } from "../../../../store";
import { LinePlotView, LineSection } from "./line_plot_view";
import { PlaneSeriesView } from ".";
import { AxisInfo } from "../../../../common/axisinfo";
import { parse, simplify } from "mathjs";
import { NavLayer, NavNode } from "../navigation";
import { GraphingCalculatorInfo } from '../../../../chart_types/calculator';

export class GraphingCalculator extends LinePlotView {
  declare protected _chartInfo: GraphingCalculatorInfo;

  init() {
    super.init();
    if (this.paraview.store.prevVisitedDatapoints.size === 1) {
      for (const point of this.paraview.store.prevVisitedDatapoints) {
        const cursor = datapointIdToCursor(point);
        const datapoint = this.paraview.store.model!.atKeyAndIndex(cursor.seriesKey, cursor.index)!;
        const xVal = datapoint.facetValueAsNumber("x")!;
        const axisInfo = this.chartInfo.axisInfo!;
        const xPct = (xVal - axisInfo.xLabelInfo.min!) / axisInfo.xLabelInfo.range!;
        if (xPct < 0 || xPct > 1) {
          continue;
        }
        const datapointView = this.chartLandingView.datapointViews.sort((a, b) =>
          Math.abs(a.datapoint.facetValueAsNumber("x")! - xVal) - Math.abs(b.datapoint.facetValueAsNumber("x")! - xVal))[0];
        this.chartInfo.navToDatapoint(datapointView.seriesKey, datapointView.index);
      }
    } else if (this.paraview.store.settings.type.graph.visitedSeries > -1) {
      const visited = this.chartLandingView.datapointViews.filter(v =>
        v.seriesKey === this.paraview.store.model!.seriesKeys[this.paraview.store.settings.type.graph.visitedSeries]
      ).map((datapointView) => datapointView.datapoint);
      this.paraview.store.visit(visited);
    }
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting): void {
    if (['type.graph.equation'].includes(path)) {
      this._chartInfo.clearStore()
      if (newValue !== oldValue){
        this.chartInfo.navMap!.goTo('top', {});
      }
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.visitedSeries = -1;
      });
      this.addEquation(newValue as string);
    } else if (['type.graph.preset'].includes(path)) {
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.equation = String(newValue);
      });
    } else if (['type.graph.renderPts'].includes(path)) {
      const seriesFocused = this.isSeriesFocused();
      this._chartInfo.clearStore()
      this._chartInfo.renderPts = Number(newValue);
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.visitedSeries = seriesFocused;
      });
      this.addEquation(this.paraview.store.settings.type.graph.equation);
    } else if (['axis.x.maxValue', 'axis.x.minValue'].includes(path)) {
      const seriesFocused = this.isSeriesFocused();
      this._chartInfo.clearStore()
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.visitedSeries = seriesFocused;
      });
      this.addEquation(this.paraview.store.settings.type.graph.equation)
    } else if (['axis.y.maxValue', 'axis.y.minValue'].includes(path)) {
      this._chartInfo.clearStore()
    } else if (['type.graph.resetAxes'].includes(path)) {
      const seriesFocused = this.isSeriesFocused();
      this._chartInfo.clearStore()
      this.paraview.store.updateSettings(draft => {
        draft.axis.x.maxValue = 'unset';
        draft.axis.x.minValue = 'unset';
        draft.axis.y.maxValue = 'unset';
        draft.axis.y.minValue = 'unset';
      });
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.visitedSeries = seriesFocused;
      });
      this.addEquation(this.paraview.store.settings.type.graph.equation)
    }
    super.settingDidChange(path, oldValue, newValue);
  }

  isSeriesFocused(): number {
    const visited = this.paraview.store.visitedDatapoints;
    if (visited.size > 0) {
      const firstVisitedId = visited.values().toArray()[0];
      const cursor = datapointIdToCursor(firstVisitedId);
      if (visited.size === this.paraview.store.model!.atKey(cursor.seriesKey)!.datapoints.length) {
        return this.paraview.store.model?.seriesKeys.findIndex(s =>
          s === cursor.seriesKey)!;
      }
    }
    return -1;
  }

  addEquation(eq: string) {
    const axisInfo = new AxisInfo(this.paraview.store, {
      xValues: [
        this.paraview.store.settings.axis.x.minValue == "unset"
          ? -10
          : this.paraview.store.settings.axis.x.minValue,
        this.paraview.store.settings.axis.x.maxValue == "unset"
          ? 10
          : this.paraview.store.settings.axis.x.maxValue],
      yValues: [-10, 10],
      yMin: -10,
      yMax: 10
    })
    var container = this.paraview.paraChart;
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
      const points = this.settings.renderPts
      const xMax = axisInfo!.xLabelInfo!.max ?? 10
      const xMin = axisInfo!.xLabelInfo!.min ?? -10
      for (var i = 0; i < points; i++) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var xVal = parseFloat((i / ((points - 1) / ((xMax - xMin))) + (xMin)).toFixed(3))
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
        if(container.getElementsByTagName('table')[0]){
          container.removeChild(container.getElementsByTagName('table')[0]);
        }
        container.append(table);
        this.paraview.dispatchEvent(new CustomEvent('paraviewready', {bubbles: true, composed: true, cancelable: true}));
      }
    }
  }

  get datapointViews() {
    return super.datapointViews as GraphLine[];
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

  protected _newDatapointView(seriesView: PlaneSeriesView) {
    return new GraphLine(seriesView);
  }

  checkHorizExpand(cursor: NavNode, link: NavLayer | NavNode | undefined, dir: string): boolean {
    if (dir === 'left' && cursor.type === 'datapoint' && cursor.datapointViews[0].index === 0) {
      this.paraview.store.updateSettings(draft => {
        draft.axis.x.minValue = this.axisInfo!.xLabelInfo.min! - 1;
      });
      return true;
    }
    else if (dir === 'right' && cursor.type === 'datapoint') {
      if (cursor.datapointViews[0].index
        === this.paraview.store.model!.series[this.paraview.store.model?.seriesKeys.findIndex(s => s == cursor.datapointViews[0].seriesKey)!].length - 1) {
        this.paraview.store.updateSettings(draft => {
          draft.axis.x.maxValue = this.axisInfo!.xLabelInfo.max! + 1;
        });
        return true;
      }
    }
    return false;
  }

  checkVertExpand(cursor: NavNode, link: NavLayer | NavNode | undefined, dir: string): boolean {
    if (link instanceof NavNode && cursor.type === 'datapoint' && (link.type === "series" || link.type === "datapoint")) {
      const yTier = Math.abs(Number(this.axisInfo?.yLabelInfo.labelTiers[0][0]) - Number(this.axisInfo?.yLabelInfo.labelTiers[0][1]))
      const cursorYVal = cursor.datapointViews[0].datapoint.facetValueAsNumber("y")!
      const linkYVal = link.datapointViews[0].datapoint.facetValueAsNumber("y")!
      if ((dir === "left" || dir === "right") && cursorYVal <= this.axisInfo!.yLabelInfo.max!
        && linkYVal >= this.axisInfo!.yLabelInfo.max!) {
        const newYMax = Math.ceil((linkYVal + 1) / yTier) * yTier;
        this.paraview.store.updateSettings(draft => {
          draft.axis.y.maxValue = newYMax
        });
        return true;
      }
      else if ((dir === "left" || dir === "right") && cursorYVal >= this.axisInfo!.yLabelInfo.min!
        && linkYVal <= this.axisInfo!.yLabelInfo.min!) {
        const newYMin = Math.floor((linkYVal - 1) / yTier) * yTier;
        this.paraview.store.updateSettings(draft => {
          draft.axis.y.minValue = newYMin;
        });
        return true;
      }
    }
    return false;
  }

  handlePan(startX: number, startY: number, endX: number, endY: number) {
    const axisInfo = this._chartInfo.axisInfo!;
    const xRange = axisInfo.xLabelInfo.range!;
    const yRange = axisInfo.yLabelInfo.range!;
    const xTier = Math.abs(Number(axisInfo?.xLabelInfo.labelTiers[0][0]) - Number(axisInfo?.xLabelInfo.labelTiers[0][1]));
    const yTier = Math.abs(Number(axisInfo?.yLabelInfo.labelTiers[0][0]) - Number(axisInfo?.yLabelInfo.labelTiers[0][1]));
    const changeHorizRaw = (endX - startX) / this.width;
    const changeVertRaw = (endY - startY) / this.height;
    const changeHoriz = Math.round(changeHorizRaw * xRange / xTier) * xTier;
    const changeVert = Math.round(changeVertRaw * yRange / yTier) * yTier;
    if (changeHoriz !== 0 || changeVert !== 0) {
      const seriesFocused = this.isSeriesFocused();
      this._chartInfo.clearStore();
      this.paraview.store.updateSettings(draft => {
        draft.axis.x.maxValue = axisInfo.xLabelInfo.max! - (changeHoriz);
        draft.axis.x.minValue = axisInfo.xLabelInfo.min! - (changeHoriz);
        draft.axis.y.maxValue = axisInfo.yLabelInfo.max! + (changeVert);
        draft.axis.y.minValue = axisInfo.yLabelInfo.min! + (changeVert);
      });
      this.paraview.store.updateSettings(draft => {
        draft.type.graph.visitedSeries = seriesFocused;
      });
    }

  }

  handleZoom(x: number, y: number): void {
    const axisInfo = this._chartInfo.axisInfo!;
    const xTier = Math.abs(Number(axisInfo?.xLabelInfo.labelTiers[0][0]) - Number(axisInfo?.xLabelInfo.labelTiers[0][1]));
    const yTier = Math.abs(Number(axisInfo?.yLabelInfo.labelTiers[0][0]) - Number(axisInfo?.yLabelInfo.labelTiers[0][1]));
    const xConverted = (x / this.width) * axisInfo.xLabelInfo.range! + axisInfo.xLabelInfo.min!;
    const yConverted = ((this.height - y) / this.height) * axisInfo.yLabelInfo.range! + axisInfo.yLabelInfo.min!;
    const xRounded = Math.round( xConverted / xTier) * xTier;
    const yRounded = Math.round( yConverted / yTier) * yTier;
    const seriesFocused = this.isSeriesFocused();
    this._chartInfo.clearStore();
    this.paraview.store.updateSettings(draft => {
      draft.axis.x.maxValue = xRounded + xTier * 2;
      draft.axis.x.minValue = xRounded - xTier * 2;
      draft.axis.y.maxValue = yRounded + yTier * 2;
      draft.axis.y.minValue = yRounded - yTier * 2;
    });
    this.paraview.store.updateSettings(draft => {
      draft.type.graph.visitedSeries = seriesFocused;
    });
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

  protected _contentUpdateShapes() {
    super._contentUpdateShapes();
    this._shapes.forEach(shape => {
      if (shape.y < 0 || shape.y > this.chart.parent.logicalHeight) {
        shape.hidden = true;
      }
    });
  }

  protected _contentUpdateSymbol() {
    super._contentUpdateSymbol();
    if (this._symbol) {
      this._symbol.hidden = !this.paraview.store.settings.type.graph.isDrawSymbols;
      if (this._symbol.y < 0 || this._symbol.y > this.chart.parent.logicalHeight) {
        this._symbol.hidden = true;
      }
    }
  }

}