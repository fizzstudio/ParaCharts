import { formatBox } from "@fizz/parasummary";
import { datapointIdToCursor } from "../state";
import { PointChartInfo } from "./point_chart";
import { LegendItem } from "../view/legend";

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

    legend() {
        const model = this._paraState.model!;
        //let symbolType = series.symbol;
        const allZ = this._paraState.model!.allPoints.map(dp => dp.facetValueAsNumber("z")!);
        const maxZ = Math.max(...allZ);
        const minZ = Math.min(...allZ);
        const zRange = maxZ - minZ;
        const medZ = zRange / 2 + minZ
        const maxSize = this._paraState.config.type.bubble.maxBubbleSize;
        const minSize = this._paraState.config.type.bubble.minBubbleSize;
        const sizeRange = maxSize - minSize;
        //const scale = ((((allZ[this.index] - minZ) * sizeRange / zRange) + minSize)**2) * AREA;
        const minSymbolSize = minSize ** 2;
        const medSymbolSize = ((((zRange / 2) * sizeRange / zRange) + minSize)**2)
        const maxSymbolSize = (sizeRange + minSize) ** 2;
        const items: LegendItem[] = [];
        for (let key of model.seriesKeys) {
            const minSymbolItem: LegendItem = {
                label: `${minZ}`,
                seriesKey: key,
                color: 0,
                symbol: 'circle.empty',
                symbolOptions: { baseSize: minSymbolSize }
            }
            const medSymbolItem: LegendItem = {
                label: `${medZ}`,
                seriesKey: key,
                color: 0,
                symbol: 'circle.empty',
                symbolOptions: { baseSize: medSymbolSize }
            }
            const maxSymbolItem: LegendItem = {
                label: `${maxZ}`,
                seriesKey: key,
                color: 0,
                symbol: 'circle.empty',
                symbolOptions: { baseSize: maxSymbolSize }
            }
            items.push(minSymbolItem)
             items.push(medSymbolItem)
            items.push(maxSymbolItem)
        }
        return items;
    }
}