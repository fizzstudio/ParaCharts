
import { PointChart, ChartPoint } from './pointchart';
import { type ScatterSettings, Setting, type DeepReadonly } from '../store/settings_types';
import { type XYSeriesView } from './xychart';
import { ParaView } from '../paraview';
import { AxisInfo } from '../common/axisinfo';
import { queryMessages, describeSelections, describeAdjacentDatapoints, getDatapointMinMax } from '../store/queryutils';
import { ChartLandingView, SeriesView, DatapointView } from './data';
import { capitalize, join, interpolate as replace } from '@fizz/templum';

export class ScatterPlot extends PointChart {

  declare protected _settings: DeepReadonly<ScatterSettings>;
  
  constructor(paraview: ParaView, index: number) {
    super(paraview, index);
    this._isClustering = true;
  }

  get settings() {
    return this._settings;
  }

  settingDidChange(key: string, value: Setting | undefined) {
    return false;
  }

  protected _addedToParent(): void {
    super._addedToParent();
    this._axisInfo = new AxisInfo(this.paraview.store, {
      xValues: this.paraview.store.model!.allFacetValues('x')!.map((x) => x.value as number),
      yValues: this.paraview.store.model!.allFacetValues('y')!.map((x) => x.value as number),
    });
  }

  protected _newDatapointView(seriesView: XYSeriesView) {
    return new ScatterPoint(seriesView);
  }
queryData(): void {
  super.queryData()
}
  /*
    queryData(): void {
        const targetView = this.chartLandingView.focusLeaf
        // TODO: localize this text output
        // focused view: e.options!.focus
        // all visited datapoint views: e.options!.visited
        // const focusedDatapoint = e.targetView;
        let msgArray: string[] = [];
        let seriesLengths = [];
        for (let series of this.paraview.store.model!.series) {
          seriesLengths.push(series.rawData.length)
        }
        if (targetView instanceof ChartLandingView) {
          this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
          return
        }
        else if (targetView instanceof SeriesView) {
          msgArray.push(replace(
            queryMessages.seriesKeyLength,
            { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
          ));
          //console.log('queryData: SeriesView:', targetView);
        }
        else if (targetView instanceof DatapointView) {
          const selectedDatapoints = this.paraview.store.selectedDatapoints;
          const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
          msgArray.push(replace(
            queryMessages.datapointKeyLength,
            {
              seriesKey: targetView.seriesKey,
              datapointXY: `${targetView.series[visitedDatapoint.index].x.raw}, ${targetView.series[visitedDatapoint.index].y.raw}`,
              datapointIndex: targetView.index + 1,
              datapointCount: targetView.series.length
            }
          ));
          if (selectedDatapoints.length) {
            const selectedDatapointViews = []
            for (let datapoint of selectedDatapoints) {
              const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
              selectedDatapointViews.push(selectedDatapointView)
            }
            // if there are selected datapoints, compare the current datapoint against each of those
            //console.log(targetView.series.rawData)
            const selectionMsgArray = describeSelections(this.paraview, targetView, selectedDatapointViews as DatapointView[]);
            msgArray = msgArray.concat(selectionMsgArray);
          } else {
            console.log(targetView)
            //const clusterMsg = $
            if (this.clustering){
              console.log(this.clustering!)
            }
            
            msgArray = msgArray.concat();
          }
          // also add the high or low indicators
          const minMaxMsgArray = getDatapointMinMax(this.paraview,
            targetView.series[visitedDatapoint.index].y.raw as unknown as number, targetView.seriesKey);
          //console.log('minMaxMsgArray', minMaxMsgArray)z
          msgArray = msgArray.concat(minMaxMsgArray)
        }
        this.paraview.store.announce(msgArray);
      }
  */
}

class ScatterPoint extends ChartPoint {
  protected _computeX() {
    // Scales points in proportion to the data range
    const xTemp = (this.datapoint.x.value as number - this.chart.axisInfo!.xLabelInfo.min!) / this.chart.axisInfo!.xLabelInfo.range!;
    const parentWidth: number = this.chart.parent.width;
    return parentWidth * xTemp;
  }

  protected _createShape() {
  }
}

