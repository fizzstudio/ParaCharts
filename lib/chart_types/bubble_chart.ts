import { formatBox } from "@fizz/parasummary";
import { datapointIdToCursor } from "../state";
import { PointChartInfo } from "./point_chart";

export class BubbleChartInfo extends PointChartInfo {
    protected _addSettingControls(): void {
        super._addSettingControls();
        const variables = Object.entries(this._paraState.originalManifest!.jim.datasets[0].facets).filter(f =>
            f[1].datatype == 'number').map(f => f[1].label);
        this._paraState.settingControls.insert('type.bubble.xFacet', {
            options: variables
        });
        this._paraState.settingControls.insert('type.bubble.yFacet', {
            options: variables
        });
        this._paraState.settingControls.insert('type.bubble.bubbleFacet', {
            options: variables
        });
        this._paraState.settingControls.insert('type.bubble.maxBubbleSize');
        this._paraState.settingControls.insert('type.bubble.minBubbleSize');
    }


    protected seriesAndVal = (datapointId: string) => {
        const { seriesKey, index } = datapointIdToCursor(datapointId);
        const series = this._paraState.model!.atKey(seriesKey)!;
        const dp = series[index];
        return `${series.label} (${formatBox(dp.facetBox('x')!, 'raw')}, ${formatBox(dp.facetBox('y')!, 'raw')}, ${formatBox(dp.facetBox('z')!, 'raw')})`;
    };

}