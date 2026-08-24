import { formatBox } from "@fizz/parasummary";
import { datapointIdToCursor, SettingsManager } from "../state";
import { PointChartInfo } from "./point_chart";
import { LegendItem } from "../view/legend";
import { DataSymbols } from "../view/symbol";
import { CardinalDirection, LegendConfig } from "../config/config_types";

export class BubbleChartInfo extends PointChartInfo {

    minZ = 0;
    medZ = 0;
    maxZ = 0;
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

    legend(): Array<{ position: CardinalDirection, items: LegendItem[] }> {
        const model = this._paraState.model!;
        //let symbolType = series.symbol;
        const types = new DataSymbols().types;
        const allZ = this._paraState.model!.allPoints.map(dp => dp.facetValueAsNumber("z")!);
        const maxZ = Math.max(...allZ);
        const minZ = Math.min(...allZ);
        const zRange = maxZ - minZ;
        const medZ = Math.round((zRange / 2 + minZ) * 1000) / 1000;
        const maxSize = this._paraState.config.type.bubble.maxBubbleSize;
        const minSize = this._paraState.config.type.bubble.minBubbleSize;
        const sizeRange = maxSize - minSize;
        const minSymbolSize = minSize ** 2;
        this.minZ = minZ;
        this.medZ = medZ;
        this.maxZ = maxZ;
        const medSymbolSize = ((((zRange / 2) * sizeRange / zRange) + minSize) ** 2)
        const maxSymbolSize = (sizeRange + minSize) ** 2;
        const seriesItems: LegendItem[] = [];
        const sizeItems: LegendItem[] = [];
        for (let i = 0; i < model.seriesKeys.length; i++) {
            const key = model.seriesKeys[i];
            const seriesSymbolItem: LegendItem = {
                label: `${model.atKey(key)!.getLabel()}`,
                seriesKey: key,
                colorIndex: i,
                symbol: types[(i + 8) % 16],
                symbolOptions: { baseSize: 1, lighten: true }
            }
            seriesItems.push(seriesSymbolItem);
        }
        const key = model.seriesKeys[0];
        const minSizeSymbolItem: LegendItem = {
            label: `${minZ}`,
            seriesKey: key,
            colorIndex: 0,
            symbol: types[0],
            symbolOptions: { baseSize: minSymbolSize, lighten: true, dashed: true },
            bubbleSize: "small"
        }
        const medSizeSymbolItem: LegendItem = {
            label: `${medZ}`,
            seriesKey: key,
            colorIndex: 0,
            symbol: types[0],
            symbolOptions: { baseSize: medSymbolSize, lighten: true, dashed: true },
            bubbleSize: "medium"
        }
        const maxSizeSymbolItem: LegendItem = {
            label: `${maxZ}`,
            seriesKey: key,
            colorIndex: 0,
            symbol: types[0],
            symbolOptions: { baseSize: maxSymbolSize, lighten: true, dashed: true },
            bubbleSize: "large"
        }
        sizeItems.push(minSizeSymbolItem);
        sizeItems.push(medSizeSymbolItem);
        sizeItems.push(maxSizeSymbolItem);
        const sizeConfig = SettingsManager.getGroupLinkForInstance<LegendConfig>('legend', this._paraState.config, `legend-${0}`)
        const seriesConfig = SettingsManager.getGroupLinkForInstance<LegendConfig>('legend', this._paraState.config, `legend-${1}`)
        const seriesPosition = sizeConfig.position;
        const sizePosition = seriesConfig.position;
        const legendItems = [];
        if (seriesConfig.isAlwaysDrawLegend) {
            legendItems.push({ position: seriesPosition ?? "north", items: seriesItems })
        }
        if (sizeConfig.isAlwaysDrawLegend) {
            legendItems.push({ position: sizePosition ?? "north", items: sizeItems })
        }
        return legendItems;
    }

    protected _createVerticalNavLinks(): void {

    }
}