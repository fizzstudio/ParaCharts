import { ChartType, Manifest } from "@fizz/paramanifest";
import { exhaustive } from "../common/utils";

export type SourceKind = 'fizz-chart-data' | 'url';

type LoadSuccess = {
  result: 'success',
  manifest: Manifest
}

type LoadFailure = {
  result: 'failure',
  error: string
}

type LoadResult = LoadSuccess | LoadFailure;

const CHART_DATA_MODULE_PREFIX = './node_modules/@fizz/chart-data/data/';

export class ParaLoader {
  public async load(kind: SourceKind, filename: string, chartType?: ChartType): Promise<LoadResult> {
    let filePath = '';
    if (kind === 'fizz-chart-data') {
      filePath = CHART_DATA_MODULE_PREFIX;
    }
    filePath += filename;
    console.log(`loading manifest from ${filePath}`)
    const manifestRaw = await fetch(filePath);
    const manifest = await manifestRaw.json() as Manifest;
    console.log('manifest loaded');
    if (chartType) {
      manifest.datasets[0].type = chartType;
      console.log('manifest chart type changed')
    }
    return { result: 'success', manifest };
  }
}