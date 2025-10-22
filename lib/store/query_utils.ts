import { ParaView } from '../paraview';
import { capitalize, join, interpolate} from '@fizz/templum';
import { ComparisonRelationship, ComparisonResult } from '@fizz/dataframe';
import { DatapointView } from '../view/data';
import { type Model } from '@fizz/paramodel';
import Decimal from 'decimal.js';
import { formatXYDatapoint } from '@fizz/parasummary';

export function describeSelections(
  visitedDatapoint: DatapointView,
  selectedDatapoints: DatapointView[]
): string[] {
  const msgArray: string[] = [];

  // if there are selected datapoints other than the focused datapoint (which may or may not be
  // selected), compare the current datapoint against each of those
  const selfSelected = selectedDatapoints.some((point) => point.equals(visitedDatapoint));
  const othersSelected = selectedDatapoints.length >= (selfSelected ? 2 : 1);
  if (othersSelected) {
    const other = selfSelected ? queryMessages.other : undefined;
    msgArray.push(interpolate(queryMessages.comparisonSelectedDatapoints, { other }));
    const sortedDatapoints = selectedDatapoints.toSorted((a, b) =>
      a.datapoint.facetValueNumericized('y')! > b.datapoint.facetValueNumericized('y')! ? -1 : 1);
    for (const view of sortedDatapoints) {
      if (!view.equals(visitedDatapoint)) {
        const viewValue = view.datapoint.facetValueNumericized('y')!;
        const targetValue = visitedDatapoint.datapoint.facetValueNumericized('y')!;
        const result = compare(targetValue, viewValue);
        const comparatorMsg = comparisonMsgs[result.relationship].msg;
        const diff = result.diff! !== 0 ? interpolate('${diff:number} ', { diff: result.diff! }) : undefined;
        msgArray.push(capitalize(interpolate(
          '${diff:string?}${comparatorMsg:string} ${seriesName:string} ${datapointXY:string}',
          { diff, comparatorMsg, seriesName: view.seriesKey, datapointXY: formatXYDatapoint(view.datapoint, 'raw') }
        )));
      }
    };
  }
  return msgArray;
}

export function getDatapointMinMax(model: Model, value: number, seriesKey: string): string[] {
    const msgArray: string[] = [];

    //const metadata = await this.getMetadata();
    const targetSeries = model.series.filter(series => series.key === seriesKey)[0];
    let seriesData = [];
    let chartData = [];
    for (let point of targetSeries.rawData) {
        seriesData.push(Number(point.y))
    }
    for (let series of model.series) {
        for (let point of series.rawData) {
            chartData.push(Number(point.y))
        }
    }
    const seriesMin = Math.min(...seriesData);
    const chartMin = Math.min(...chartData);
    const seriesMax = Math.max(...seriesData);
    const chartMax = Math.max(...chartData);
    if (value == chartMin) {
        msgArray.push(queryMessages.seriesChartMin);
    } else if (value == seriesMin) {
        msgArray.push(queryMessages.seriesMin);
    }

    if (value == chartMax) {
        msgArray.push(queryMessages.seriesChartMax);
    } else if (value == seriesMax) {
        msgArray.push(queryMessages.seriesMax);
    }
    console.log(msgArray)
    return msgArray;
}

export function /*for tests*/ describeAdjacentDatapoints(model: Model, targetView: DatapointView): string {
    const comparisons: string[] = [];
    let comparisonPrev, comparisonNext;
    if (comparisonPrev = describeAdjacentDatapointComparison(model, targetView, 'prev')) {
        comparisons.push(comparisonPrev);
    }
    if (comparisonNext = describeAdjacentDatapointComparison(model, targetView, 'next')) {
        comparisons.push(comparisonNext);
    }
    return join(comparisons, true);
}

export function /*for tests*/ describeAdjacentDatapointComparison(
    model: Model,
    self: DatapointView, direction: 'prev' | 'next'
): string | null {
    const other = self[direction];
    if (!other) {
        return null;
    }
    //const otherLabel = other.datapoint.formatX('statusBar');
    const otherLabel = `${other.series[other.index].facetBox("x")!.raw}, ${other.series[other.index].facetBox("y")!.raw}`;
    //console.log(self.index)
    const selfSeries = model.series.filter(series => series.key == self.seriesKey)[0];
    const otherSeries = model.series.filter(series => series.key == other.seriesKey)[0];
    //console.log(selfSeries)
    //console.log(selfSeries[self.index].facetBox("y")!.raw)
    //console.log(otherSeries[other.index].facetBox("y")!.raw)

    //console.log(paraview.store.model!)
    //console.log(paraview.store.model!.allPoints[self.index].datapointIndex)
    //console.log(paraview.store.model!.allPoints[self.index].entries())
    //console.log(paraview.store.model!.allPoints[self.index].facetAsNumber("x"))
    //console.log(paraview.store.model!.allPoints[self.index].facetBox("x")!.raw)
    //Series key below
    //console.log(paraview.store.model!.allPoints[self.index].seriesKey)
    const selfValue = selfSeries[self.index].facetBox("y")!.raw as unknown as number;
    const otherValue = otherSeries[other.index].facetBox("y")!.raw as unknown as number;
    const result = compare(selfValue, otherValue);
    console.log(result);
    const comparator = comparisonMsgs[result.relationship][direction];
    const percent = direction === 'prev' ? result.percentagePrev! : result.percentageNext!;
    if (result.diff! === 0) {
        return interpolate('${comparator:string} ${otherLabel:string}', { comparator, otherLabel });
    }
    const preposition = direction === 'prev' ? 'from' : 'in';
    return interpolate('${comparator:string} ${diff:number} (${percent:number#.1}%) ${preposition:string} ${otherLabel:string}',
        { comparator, diff: result.diff!, percent, preposition, otherLabel });
}

export const queryMessages = {
    'compare': {
        'prev': {
            'verb': {
                'less': 'shrank from',
                'greater': 'grew from',
                'equal': 'remained the same',
            },
            'than': {
                'less': 'less than',
                'greater': 'more than',
                'equal': 'equal to',
            }
        },
        'next': {
            'verb': {
                'less': 'will grow to',
                'greater': 'will shrink to',
                'equal': 'will remain the same',
            }
        }
    },
    'instructions': {
        'intro': 'Explore the chart with the arrow keys. Press "h" for help',
        'firstNav': 'Press the right arrow to explore this line',
        'firstNavBar': 'Press the right arrow to explore this category',
        'firstNavMultiseries': 'Press the down arrow to change lines',
        'firstNavMultiseriesBar': 'Press the down arrow to change categories',
        'firstSoni': 'Press "s" to toggle sonification off or on',
    },

    'datapoint': 'Datapoint', //Not currently used
    'firstDatapoint': 'First datapoint in ${seriesKey:string}',
    'lastDatapoint': 'Last datapoint in ${seriesKey:string}',
    'comparisonSelectedDatapoints': 'Comparison to${other:string?} selected datapoints',
    'other': ' other',
    'seriesMin': 'Series low',
    'seriesChartMin': 'Series low and chart low',
    'seriesMax': 'Series high',
    'seriesChartMax': 'Series high and chart high',
    'chordDataContext': '${datapointCount:number} datapoints at ${xLabel:string}',
    'chordHigh': 'High: ${yValue:number} in ${seriesKeys:string[]}.',
    'chordLow': 'Low: ${yValue:number} in ${seriesKeys:string[]}',
    'chordRange': 'Range: ${yRange:number#.2}.',
    'seriesSummary': '${seriesKey:string} summary: ${seriesSummary:string}',
    'seriesKeyLength': '${seriesKey:string}. ${datapointCount:number} datapoints',
    'datapointKeyLength': '${seriesKey:string} ${datapointXY:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
    'greaterThan': 'more than', //Not currently used
    'lessThan': 'less than', //Not currently used
    'equalTo': 'equal to', //Not currently used
    'compareGreater': 'more than',
    'compareLess': 'less than',
    'compareEqual': 'equal to',
    'compareGreaterPrev': 'grew by',
    'compareLessPrev': 'decreased by',
    'compareEqualPrev': 'stayed the same from',
    'compareGreaterNext': 'will decrease by',
    'compareLessNext': 'will grow by',
    'compareEqualNext': 'will stay the same in',
    'percentageOfSeries': '${datapointXY:string}% of total amount in series: ${seriesKey:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
    'percentageOfChart': '${datapointXY:string}% of total amount in chart: ${chartKey:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
} as const;

export const comparisonMsgs: Record<ComparisonRelationship, ComparisonMsgs> = {
    equal: {
        msg: 'equal to',
        prev: 'stayed the same from',
        next: 'will stay the same in'
    },
    greater: {
        msg: 'more than',
        prev: 'grew by',
        next: 'will decrease by'
    },
    less: {
        msg: 'less than',
        prev: 'decreased by',
        next: 'will grow by'
    }
}

export interface ComparisonMsgs {
    msg: string,
    prev: string,
    next: string
}

export function compare(value1: number, value2: number): ComparisonResult {
    console.log(value2)
    /*
    if (!value2.isNumber()) {
      throw new Error('must compare number with number');
    }
      */
    const result: Partial<ComparisonResult> = {
      diff: 0
    };
    if (value1 === value2) {
      result.relationship = 'equal';
    } else {
      result.relationship = value1 > value2 ? 'greater' : 'less';
      const min = new Decimal(Math.min(value1, value2));
      const max = new Decimal(Math.max(value1, value2));
      result.diff = max.sub(min).toNumber();
      // calculate the percentage difference
      const startVal = new Decimal(value1);
      const endVal = new Decimal(value2);
      if (startVal) {
        result.percentageNext = endVal.sub(startVal).dividedBy(startVal).times(100).toNumber();
      }
      if (endVal) {
        result.percentagePrev = startVal.sub(endVal).dividedBy(endVal).times(100).toNumber();
      }
    }
    return result as ComparisonResult;
  }