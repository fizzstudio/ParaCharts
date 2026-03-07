import { Logger, getLogger } from '@fizz/logger';
import { capitalize, join, interpolate } from '@fizz/templum';
import { DatapointView } from '../view/data';
import { type Model } from '@fizz/paramodel';
import Decimal from 'decimal.js';
import { formatXYDatapoint } from '@fizz/parasummary';

// TODO (@simonvarey): This is a redefined from the `ComparisonRelationship` in @fizz/dataframe. I should
//   check whether the one in @fizz/dataframe should be changed/removed.
type ComparisonRelationship = 'equal' | 'growing' | 'shrinking';

// TODO (@simonvarey): This is a redefined from the `ComparisonResult` in @fizz/dataframe. I should
//   check whether the one in @fizz/dataframe should be changed/removed.
interface ComparisonResult {
    relationship: ComparisonRelationship;
    diff: number;
    percentage: number;
}

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
        const result = compare(viewValue, targetValue);
        const comparatorMsg = comparisonMsgs[result.relationship].msg;
        const diff = result.diff! !== 0 ? interpolate('${diff:number} ', { diff: result.diff! }) : undefined;
        msgArray.push(capitalize(interpolate(
          '${diff:string?}${comparatorMsg:string} ${seriesLabel:string} ${datapointXY:string}',
          { diff, comparatorMsg, seriesLabel: view.series.getLabel(), datapointXY: formatXYDatapoint(view.datapoint, 'raw') }
        )));
      }
    };
  }
  return msgArray;
}

export function getDatapointMinMax(model: Model, value: number, seriesKey: string): string[] {
    let log: Logger = getLogger("getDatapointMinMax");    
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
    log.info(msgArray)
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
    self: DatapointView, 
    direction: 'prev' | 'next'
): string | null {
    let log: Logger = getLogger("describeAdjacentDatapointComparison");
	const other = self[direction];
    if (!other) {
        return null;
    }
    //const otherLabel = other.datapoint.formatX('statusBar');
    const otherLabel = `${other.series[other.index].facetBox("x")!.raw}, ${other.series[other.index].facetBox("y")!.raw}`;
    log.info(self.index)
    const selfSeries = model.series.filter(series => series.key == self.seriesKey)[0];
    const otherSeries = model.series.filter(series => series.key == other.seriesKey)[0];
    //log.info(selfSeries)
    //log.info(selfSeries[self.index].facetBox("y")!.raw)
    //log.info(otherSeries[other.index].facetBox("y")!.raw)

    //log.info(paraview.paraState.model!)
    //log.info(paraview.paraState.model!.allPoints[self.index].datapointIndex)
    //log.info(paraview.paraState.model!.allPoints[self.index].entries())
    //log.info(paraview.paraState.model!.allPoints[self.index].facetAsNumber("x"))
    //log.info(paraview.paraState.model!.allPoints[self.index].facetBox("x")!.raw)
    //Series key below
    //log.info(ParaView.paraState.model!.allPoints[self.index].seriesKey)
    const selfValue = selfSeries[self.index].facetValueNumericized('y')!;
    const otherValue = otherSeries[other.index].facetValueNumericized('y')!;
    const result = direction === 'prev' ? compare(otherValue, selfValue): compare(selfValue, otherValue);
    console.log('p', direction, otherValue, selfValue)
    log.info(result);
    console.log('r', result, result.relationship, direction)
    const comparator = comparisonMsgs[result.relationship][direction];
    if (result.diff === 0) {
        return interpolate('${comparator:string} ${otherLabel:string}', { comparator, otherLabel });
    }
    const preposition = direction === 'prev' ? 'from' : 'in';
    return interpolate('${comparator:string} ${diff:number} (${percent:number#.1}%) ${preposition:string} ${otherLabel:string}',
        { comparator, diff: result.diff!, percent: result.percentage, preposition, otherLabel });
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
    'firstDatapoint': 'First datapoint in ${seriesLabel:string}',
    'lastDatapoint': 'Last datapoint in ${seriesLabel:string}',
    'comparisonSelectedDatapoints': 'Comparison to${other:string?} selected datapoints',
    'other': ' other',
    'seriesMin': 'Series low',
    'seriesChartMin': 'Series low and chart low',
    'seriesMax': 'Series high',
    'seriesChartMax': 'Series high and chart high',
    'chordDataContext': '${datapointCount:number} datapoints at ${xLabel:string}',
    'chordHigh': 'High: ${yValue:number} in ${seriesLabels:string[]}.',
    'chordLow': 'Low: ${yValue:number} in ${seriesLabels:string[]}',
    'chordRange': 'Range: ${yRange:number#.2}.',
    'seriesSummary': '${seriesLabel:string} summary: ${seriesSummary:string}',
    'seriesLabelLength': '${seriesLabel:string}. ${datapointCount:number} datapoints',
    'datapointLabelLength': '${seriesLabel:string} ${datapointXY:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
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
    'percentageOfSeries': '${datapointX:string}% of total amount in series: ${seriesLabel:string}. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
    'percentageOfChart': '${datapointX:string}% of total amount in chart. Datapoint ${datapointIndex:number} of ${datapointCount:number}.',
} as const;

export interface ComparisonMsgs {
    msg: string,
    prev: string,
    next: string
}

export const comparisonMsgs: Record<ComparisonRelationship, ComparisonMsgs> = {
    equal: {
        msg: 'equal to',
        prev: 'stayed the same from',
        next: 'will stay the same in'
    },
    growing: {
        msg: 'more than',
        prev: 'grew by',
        next: 'will grow by'
    },
    shrinking: {
        msg: 'less than',
        prev: 'decreased by',
        next: 'will decrease by'
    }
}

export function compare(earlier: number, later: number): ComparisonResult {
  /*let log: Logger = getLogger("compare");
  log.info(later)*/
  if (earlier === later) {
    return {
      relationship: 'equal',
      diff: 0,
      percentage: 0
    }
  }

  const relationship = earlier > later ? 'shrinking' : 'growing';
  console.log(earlier > later, earlier, later, relationship)
  const min = new Decimal(Math.min(earlier, later));
  const max = new Decimal(Math.max(earlier, later));
  const diff = max.sub(min).toNumber();
  // calculate the percentage difference
  const startVal = new Decimal(earlier);
  const endVal = new Decimal(later);
  const percentage = endVal.sub(startVal).dividedBy(startVal).times(100).toNumber();
  return {
    relationship,
    diff,
    percentage
  };
}
