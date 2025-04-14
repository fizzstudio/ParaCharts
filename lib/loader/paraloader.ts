import { Manifest } from "@fizz/paramanifest";
import { exhaustive } from "../common/utils";

export type SourceKind = 'fizz-chart-data';

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
  public async load(kind: SourceKind, filename: string): Promise<LoadResult> {
    if (kind === 'fizz-chart-data') {
      const filePath = CHART_DATA_MODULE_PREFIX + filename;
      console.log(`loading manifest from ${filePath}`)
      const manifestRaw = await fetch(filePath);
      const manifest = await manifestRaw.json() as Manifest;
      console.log('manifest loaded');
      return { result: 'success', manifest };
    }
    return exhaustive();
  }
}