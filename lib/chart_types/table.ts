import { Datapoint } from '@fizz/paramodel';
import { BaseChartInfo, RiffOrder } from './base_chart';
import { HorizDirection, SparkBrailleInfo } from '../store';

export class TableInfo extends BaseChartInfo {
  protected _playRiff(order?: RiffOrder): void {

  }

  protected _playDatapoints(datapoints: Datapoint[]): void {

  }

  playDir(dir: HorizDirection): void {

  }

  protected _sparkBrailleInfo(): SparkBrailleInfo | null {
    return null;
  }
}