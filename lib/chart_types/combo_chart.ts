import { ChartType, Facet } from '@fizz/chartsignal-internal';
import { BarChartInfo } from './bar_chart';
import { PlaneModel } from '@fizz/paramodel';
import { NavMap } from '../view/layers';
import { ParaState } from '../state';
import { ConfigSetting, Direction } from '../config/config_types';

export class ComboChartInfo extends BarChartInfo {
  protected _otherNavMap!: NavMap;

  constructor(type: ChartType, paraState: ParaState) {
    super(type, paraState);
  }

  protected _init() {
    super._init();
  }

  get secondaryHorizFacet(): Facet | null {
    return (this._paraState.comboModel as PlaneModel).getAxisFacet(this._isXVertical
      ? 'vert'
      : 'horiz'
    );
  }

  get secondaryVertFacet(): Facet | null {
    return (this._paraState.comboModel as PlaneModel).getAxisFacet(this._isXVertical
      ? 'horiz'
      : 'vert'
    );
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting) {
    this._paraState.comboChartInfo?.settingDidChange(path, oldValue, newValue);
    if (path === 'sonification.isSonificationEnabled') {
      // comboChartInfo.navMap has been recreated
      if (this._paraState.currentDataset) {
        this._navMap = this._paraState.comboChartInfo!.navMap!;
      } else {
        this._otherNavMap = this._paraState.comboChartInfo!.navMap!;
      }
    }
  }

  switchToOtherData() {
    if (!this._otherNavMap) {
      this._otherNavMap = this._paraState.comboChartInfo!.navMap!;
    }
    const index = this._navMap!.cursor.index;
    const type = this._navMap!.cursor.type;
    [this._navMap, this._otherNavMap] = [this._otherNavMap, this._navMap!];
    this._paraState.currentDataset = 1 - this._paraState.currentDataset;
    // go to corresponding data point in new mode nav map
    this._navMap!.cursor.layer.goTo(type, index);
  }

  move(dir: Direction): Promise<void> {
    if (this._paraState.currentDataset) {
      return this._paraState.comboChartInfo!.move(dir);
    } else {
      return super.move(dir);
    }
  }

  pointerClick(datasetIndex: number, seriesKey: string, datapointIndex: number, isShift: boolean) {
    if ((!this._paraState.currentDataset && datasetIndex) || (this._paraState.currentDataset && !datasetIndex)) {
      this.switchToOtherData();
    }
    if (this._paraState.currentDataset) {
      this._paraState.comboChartInfo!.pointerClick(datasetIndex, seriesKey, datapointIndex, isShift);
    } else {
      super.pointerClick(datasetIndex, seriesKey, datapointIndex, isShift);
    }
  }

  goSeriesMinMax(isMin: boolean) {
    if (this._paraState.currentDataset) {
      this._paraState.comboChartInfo!.goSeriesMinMax(isMin);
    } else {
      super.goSeriesMinMax(isMin);
    }
  }

  goChartMinMax(isMin: boolean) {
    if (this._paraState.currentDataset) {
      this._paraState.comboChartInfo!.goChartMinMax(isMin);
    } else {
      super.goChartMinMax(isMin);
    }
  }

  composePointSelectionAnnouncement(isExtend: boolean) {
    if (this._paraState.currentDataset) {
      return this._paraState.comboChartInfo!.composePointSelectionAnnouncement(isExtend);
    } else {
      return super.composePointSelectionAnnouncement(isExtend);
    }
  }

  queryData() {
    if (this._paraState.currentDataset) {
      this._paraState.comboChartInfo!.queryData();
    } else {
      super.queryData();
    }
  }

  legend() {
    return [...super.legend(), ...this._paraState.comboChartInfo!.legend()];
  }
}