import { formatBox } from "@fizz/parasummary";
import { datapointIdToCursor } from "../state";
import { PointChartInfo } from "./point_chart";

export class BubbleChartInfo extends PointChartInfo {
    protected _addSettingControls(): void {
        super._addSettingControls();
        const numericVariables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).filter(f =>
            f[1].datatype == 'number').map(f => f[1].label);
        const stringVariables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).filter(f =>
            f[1].datatype == 'string').map(f => f[1].label);
        this._paraState.settingControls.insert('type.bubble.xFacet', {
            options: numericVariables
        });
        this._paraState.settingControls.insert('type.bubble.yFacet', {
            options: numericVariables
        });
        this._paraState.settingControls.insert('type.bubble.bubbleFacet', {
            options: numericVariables
        });
        this._paraState.settingControls.insert('type.bubble.labelFacet', {
            options: ['', ...stringVariables]
        });
        this._paraState.settingControls.insert('type.bubble.maxBubbleSize');
        this._paraState.settingControls.insert('type.bubble.minBubbleSize');
    }


    protected seriesAndVal = (datapointId: string) => {
        const { seriesKey, index } = datapointIdToCursor(datapointId);
        const series = this._paraState.model!.atKey(seriesKey)!;
        const dp = series[index];
        if (this._paraState.config.type.bubble.labelFacet !== '') {
            return `${formatBox(dp.facetBox('label')!, 'raw')} (${formatBox(dp.facetBox('x')!, 'raw')}, ${formatBox(dp.facetBox('y')!, 'raw')}, ${formatBox(dp.facetBox('z')!, 'raw')})`;
        }
        return `${series.label} (${formatBox(dp.facetBox('x')!, 'raw')}, ${formatBox(dp.facetBox('y')!, 'raw')}, ${formatBox(dp.facetBox('z')!, 'raw')})`;
    };

}