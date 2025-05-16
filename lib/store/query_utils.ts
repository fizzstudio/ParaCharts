import { ParaView } from '../paraview';
import { capitalize, join, interpolate as replace } from '@fizz/templum';
import { ComparisonRelationship } from '@fizz/dataframe';
import { NumberBox } from './dataframe/box';
import { DatapointView } from '../view/data';

export function describeSelections(paraview: ParaView, targetView: DatapointView, selectedDatapoints: DatapointView[]): string[] {
    //console.log('queryData: DatapointView:', targetView);
    const msgArray: string[] = [];

    // if there are selected datapoints other than the focused datapoint (which may or may not be 
    // selected), compare the current datapoint against each of those
    //console.log(this.paraview.store.selectedDatapoints)
    //const selfSelected = targetView.isSelected;
    const visitedDatapoint = paraview.store.visitedDatapoints[0]
    const selfSelected = selectedDatapoints.filter(point => point.seriesKey === visitedDatapoint.seriesKey && point.index === visitedDatapoint.index).length > 0;
    const othersSelected = selectedDatapoints.length >= (selfSelected ? 2 : 1);
    if (othersSelected) {
        const other = selfSelected ? 'this.messages.other' : undefined;
        msgArray.push(replace(queryMessages.comparisonSelectedDatapoints, { other }));
        const sortedDatapoints = selectedDatapoints.toSorted((a, b) =>
            a.datapoint.y.value > b.datapoint.y.value ? -1 : 1);
        for (const view of sortedDatapoints) {
            if (view !== targetView) {
                const result = targetView.datapoint.y.compare(view.datapoint.y as NumberBox);
                const comparatorMsg = comparisonMsgs[result.relationship].msg;
                const diff = result.diff! !== 0 ? replace('${diff:number} ', { diff: result.diff! }) : undefined;
                msgArray.push(capitalize(replace(
                    '${diff:string?}${comparatorMsg:string} ${seriesName:string} ${datapointXY:string}',
                    {
                        diff, comparatorMsg, seriesName: view.seriesKey,
                        datapointXY: `${view.series[view.index].x.raw}, ${view.series[view.index].y.raw}`
                    }
                )));
            }
        };
    }
    return msgArray;
}

export function getDatapointMinMax(paraview: ParaView, value: number, seriesKey: string): string[] {
    const msgArray: string[] = [];

    //const metadata = await this.getMetadata();
    const targetSeries = paraview.store.model!.series.filter(series => series.key === seriesKey)[0];
    let seriesData = [];
    let chartData = [];
    for (let point of targetSeries.rawData) {
        seriesData.push(Number(point.y))
    }
    for (let series of paraview.store.model!.series) {
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

export function /*for tests*/ describeAdjacentDatapoints(paraview: ParaView, targetView: DatapointView): string {
    const comparisons: string[] = [];
    let comparisonPrev, comparisonNext;
    if (comparisonPrev = describeAdjacentDatapointComparison(targetView, 'prev')) {
        comparisons.push(comparisonPrev);
    }
    if (comparisonNext = describeAdjacentDatapointComparison(targetView, 'next')) {
        comparisons.push(comparisonNext);
    }
    return join(comparisons, true);
}

export function /*for tests*/ describeAdjacentDatapointComparison(
    self: DatapointView, direction: 'prev' | 'next'
): string | null {
    const other = self[direction];
    if (!other) {
        return null;
    }
    //const otherLabel = other.datapoint.formatX('statusBar');
    const otherLabel = `${other.series[other.index].x.raw}, ${other.series[other.index].y.raw}`
    const result = self.datapoint.y.compare(other.datapoint.y as NumberBox);
    const comparator = comparisonMsgs[result.relationship][direction];
    const percent = direction === 'prev' ? result.percentagePrev! : result.percentageNext!;
    if (result.diff! === 0) {
        return replace('${comparator:string} ${otherLabel:string}', { comparator, otherLabel });
    }
    const preposition = direction === 'prev' ? 'from' : 'in';
    return replace('${comparator:string} ${diff:number} (${percent:number#.1}%) ${preposition:string} ${otherLabel:string}',
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