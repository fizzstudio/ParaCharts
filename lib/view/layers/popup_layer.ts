import { formatBox } from "@fizz/parasummary";
import { ParaView } from "../../paraview";
import { datapointIdToCursor, PointAnnotation } from "../../store";
import { Container, View } from "../base_view";
import { Popup } from "../popup";
import { PlotLayer } from "./layer";
import { DatapointView } from "../data";

export type AnnotationType = 'foreground' | 'background';
export const trendTranslation = {
    /** A single rising sequence */
    "Rise": "Rising",
    /** A single falling sequence */
    "Fall": "Falling",
    /** A single stable sequence */
    "Stable": "Stable",
    /** A single sequence that shows a large, rapid increase in value */
    "BigJump": "Big Jump",
    /** A single sequence that shows a large, rapid decrease in value */
    "BigFall": "Big Fall",
    /** A falling sequence followed by a rising sequence */
    "ReversalToRise": "Reversal to Rising",
    /** A rising sequence followed by a falling sequence */
    "ReversalToFall": "Reversal to Falling",
    /** A stable sequence followed by a rising sequence */
    "EmergingRise": "Emerging Rising",
    /** A stable sequence followed by a falling sequence */
    "EmergingFall": "Emerging Falling",
    /** A rising sequence followed by a stable sequence */
    "RiseToStable": "Rising to Stable",
    /** A falling sequence followed by a stable sequence */
    "FallToStable": "Falling to Stable",
    /** A rising sequence followed by a falling sequence and another rising sequence */
    "Rebound": "Rebounding",
    /** A falling sequence followed by a rising sequence and another falling sequence */
    "TemporaryJump": "Temporary Jump",
    /** A falling sequence followed by a short rising sequence at the end of the chart */
    "PossibleReversalToRise": "Possible Reversal to Rising",
    /** A rising sequence followed by a short falling sequence at the end of the chart */
    "PossibleReversalToFall": "Possible Reversal to Falling",
    /** A stable sequence followed by a short rising sequence at the end of the chart */
    "PossibleEmergingRise": "Possible Emerging Rising",
    /** A stable sequence followed by a short falling sequence at the end of the chart */
    "PossibleEmergingFall": "Possible Emerging Falling",
    /** A rising sequence followed by a short stable sequence at the end of the chart */
    "PossibleRiseToStable": "Possible Rising to Stable",
    /** A falling sequence followed by a short stable sequence at the end of the chart */
    "PossibleFallToStable": "Possible Falling to Stable",
    /** A rising sequence followed by a falling sequence and another short rising sequence at the end of the chart */
    "PossibleRebound": "Possible Rebounding",
    /** A falling sequence followed by a rising sequence and another short falling sequence at the end of the chart */
    "PossibleTemporaryJump": "Possible Temporary Jump"
}


export class PopupLayer extends PlotLayer {
    protected _groups = new Map<string, DecorationGroup>();

    constructor(paraview: ParaView, width: number, height: number, public readonly type: AnnotationType) {
        super(paraview, width, height);
    }

    protected _createId() {
        return super._createId(`${this.type}-annotation`);
    }

    group(name: string) {
        return this._groups.get(name);
    }

    addGroup(name: string, okIfExist = false) {
        if (this._groups.has(name)) {
            if (okIfExist) {
                return;
            }
            throw new Error(`group '${name}' already exists`);
        }
        this._groups.set(name, new DecorationGroup(this.paraview, name));
        this.append(this._groups.get(name)!);
    }

    removeGroup(name: string, okIfNotExist = false) {
        if (this._groups.has(name)) {
            this._groups.delete(name);
        } else if (okIfNotExist) {
            return;
        }
        else {
            throw new Error(`group '${name}' does not exist`);
        }
    }

    addPopups() {
        console.log("addPopups")
        this.addGroup('datapoint-popups', true);
        this.group('datapoint-popups')!.clearChildren();
        if (this.paraview.store.settings.chart.isShowPopups && this.paraview.store.settings.popup.activation === "onFocus") {
            this.paraview.store.userLineBreaks.splice(0, this.paraview.store.userLineBreaks.length)
            this.paraview.store.popups.splice(0, this.paraview.store.popups.length)
            const cursor = this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.navMap!.cursor
            const datapoints = cursor.datapoints;
            const datapointViews = datapoints.map(datapoint =>
                this._parent.dataLayer.datapointView(datapoint.seriesKey, datapoint.datapointIndex)!);
            let popups: Popup[] = []
            if (cursor.type === 'chord') {
                popups.push(...this.addChordPopups(datapointViews));
            }
            else if (cursor.type === 'sequence') {
                popups.push(...this.addSequencePopups(datapointViews));
            }
            else if (cursor.type === 'series') {
                popups.push(...this.addSeriesPopups(datapointViews));
            }
            else {
                for (let dp of this.paraview.store.visitedDatapoints) {
                    const { seriesKey, index } = datapointIdToCursor(dp);
                    const datapointView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
                    datapointView.addPopup();
                }
            }

            for (let popup of popups) {
                this.paraview.store.popups.push(popup);
            }
        }
        else if (this.paraview.store.settings.chart.isShowPopups && this.paraview.store.settings.popup.activation === "onSelect") {
            this.paraview.store.popups.splice(0, this.paraview.store.popups.length)
            for (let dp of this.paraview.store.selectedDatapoints) {
                const { seriesKey, index } = datapointIdToCursor(dp);
                const datapointView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(seriesKey, index)!;
                datapointView.addPopup();
            }
        }

        for (const popup of this.paraview.store.popups) {
            console.log("popup", popup)
            popup.classInfo = { 'popup': true }
            if (this.type === 'foreground') {
                this.group('datapoint-popups')!.append(popup);
            }
            else {
                if (this._groups.has('datapoint-popups')) {
                    this.removeGroup('datapoint-popups', true);
                }
            }
        }
    }

    addChordPopups(datapointViews: DatapointView[]): Popup[] {
        let text = '';
        for (let dpView of datapointViews) {
            text = text.concat(`${dpView.seriesKey}: ${this.paraview.documentView!.chartLayers!.dataLayer.chartInfo.summarizer.getDatapointSummary(dpView.datapoint, 'statusBar')}\n`);
        }
        const dpView = datapointViews[0];
        const items = this.paraview.documentView?.chartLayers.dataLayer.chartInfo.popuplegend()!;
        this.paraview.store.addLineBreak(this.paraview.documentView?.chartLayers.dataLayer.chartInfo.navMap!.cursor.index! / (this.paraview.store.model!.series[0].datapoints.length - 1),
            dpView.index!, dpView.seriesKey, false);
        this.paraview.documentView?.chartLayers.backgroundAnnotationLayer.render()!;
        const popup = new Popup(this.paraview,
            {
                text,
                x: dpView!.x,
                y: dpView!.y,
                textAnchor: "middle",
                classList: ['annotationlabel'],
                id: this.id,
                color: dpView!.color,
                //margin: 60,
                type: "chord",
                items,
                points: datapointViews
            },
            {
                fill: "hsl(0, 0%, 100%)"
                ,
                stroke: "hsl(0, 0%, 0%)"
            });
        popup.classInfo = { 'popup': true };
        return [popup];
    }

    addSequencePopups(datapointViews: DatapointView[]): Popup[] {
        const firstDPView = datapointViews[0];
        const lastDPView = datapointViews[datapointViews.length - 1];
        let x = (lastDPView.x + firstDPView.x) / 2;
        let y = 0;
        if (datapointViews.length % 2 == 0) {
            const leftDPView = datapointViews[(datapointViews.length / 2) - 1];
            const rightDPView = datapointViews[(datapointViews.length / 2)];
            y = (leftDPView.y + rightDPView.y) / 2;
        }
        else {
            const leftDPView = datapointViews[(datapointViews.length - 1) / 2];
            y = leftDPView.y;
        }
        const seriesAnalysis = this.paraview.store.seriesAnalyses[firstDPView.seriesKey]!;
        const index = seriesAnalysis.sequences.findIndex(s => s.start === datapointViews[0].index && s.end - 1 === datapointViews[datapointViews.length - 1].index);
        const labels = this.paraview.store.model!.series[0].datapoints.map(
            (p) => formatBox(p.facetBox('x')!, this.paraview.store.getFormatType('horizTick'))
        );
        const points = this.paraview.store.model!.series.find(s => s.key === datapointViews[0].seriesKey)!.datapoints;
        let text = '';
        if (seriesAnalysis.sequences[index].message == null) {
            let sequence = seriesAnalysis.sequences[index]
            if (datapointViews[datapointViews.length - 1].y - datapointViews[0].y > 0 && Math.abs(sequence.slopeInfo.slope) > .2) {
                text = text.concat(`Falling trend`)
            }
            else if (datapointViews[datapointViews.length - 1].y - datapointViews[0].y <= 0 && Math.abs(sequence.slopeInfo.slope) > .2) {
                text = text.concat(`Rising trend`)
            }
            else {
                text = text.concat(`Stable trend`)
            }
        }
        else {
            text = text.concat(`${trendTranslation[seriesAnalysis.sequences[index].message!]} trend`)
        }
        const changeVal = parseFloat((points[seriesAnalysis.sequences[index].end - 1].facetValueAsNumber("y")!
            - points[seriesAnalysis.sequences[index].start].facetValueAsNumber("y")!).toFixed(4));
        text = text.concat(`\n${changeVal > 0 ? '+' : ''}${changeVal}`);
        text = text.concat(`\n${labels[seriesAnalysis.sequences[index].start]}-${labels[seriesAnalysis.sequences[index].end - 1]}`);
        text = text.concat(`\n${seriesAnalysis.sequences[index].end - seriesAnalysis.sequences[index].start} records`);

        const popup = new Popup(this.paraview,
            {
                text: text,
                x: x,
                y: y,
                textAnchor: "middle",
                classList: ['annotationlabel'],
                id: this.id,
                color: firstDPView.color,
                margin: 60,
                type: "sequence",
                points: datapointViews
            },
            {});
        popup.classInfo = { 'popup': true };
        return [popup];
    }

    addSeriesPopups(datapointViews: DatapointView[]): Popup[] {
        const firstDPView = datapointViews[0];
        const lastDPView = datapointViews[datapointViews.length - 1];
        let x = (lastDPView.x + firstDPView.x) / 2;
        let y = 0;
        if (datapointViews.length % 2 == 0) {
            const leftDPView = datapointViews[(datapointViews.length / 2) - 1];
            const rightDPView = datapointViews[(datapointViews.length / 2)];
            y = (leftDPView.y + rightDPView.y) / 2;
        }
        else {
            const leftDPView = datapointViews[(datapointViews.length - 1) / 2];
            y = leftDPView.y;
        }
        const seriesAnalysis = this.paraview.store.seriesAnalyses[firstDPView.seriesKey]!;
        const labels = this.paraview.store.model!.series[0].datapoints.map(
            (p) => formatBox(p.facetBox('x')!, this.paraview.store.getFormatType('horizTick'))
        );
        const points = this.paraview.store.model!.series.find(s => s.key === datapointViews[0].seriesKey)!.datapoints;
        let text = '';

        text = text.concat(`${(datapointViews[0].seriesKey)}`);
        if (seriesAnalysis?.message == null) {
            text = text.concat(`\nNo trend detected`);
        }
        else {
            text = text.concat(`\n${trendTranslation[seriesAnalysis?.message!]} trend`);
        }
        let changeVal = parseFloat((points[points.length - 1].facetValueAsNumber("y")!
            - points[0].facetValueAsNumber("y")!).toFixed(4));
        text = text.concat(`\n${changeVal > 0 ? '+' : ''}${changeVal}`);
        text = text.concat(`\n${labels[0]}-${labels[points.length - 1]}`);
        text = text.concat(`\n${points.length} records`);

        const popup = new Popup(this.paraview,
            {
                text: text,
                x: x,
                y: y,
                textAnchor: "middle",
                classList: ['annotationlabel'],
                id: this.id,
                color: firstDPView.color,
                margin: 60,
                points: datapointViews
            },
            {});
        popup.classInfo = { 'popup': true };
        return [popup];
    }

    renderChildren() {
        return super.renderChildren();
    }

}

class DecorationGroup extends Container(View) {

    constructor(paraview: ParaView, protected _name: string) {
        super(paraview);
    }

    get name() {
        return this._name;
    }

}