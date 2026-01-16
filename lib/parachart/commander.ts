
import { type ParaView } from '../paraview';

export interface AvailableCommands {
  key(keyId: string): boolean;
  click(seriesKey: string, index: number, isAdd?: boolean): boolean;
}

type CommandMap = { [Property in keyof AvailableCommands]: ((...args: any[]) => any) };

/**
 * Singleton container for command functions to control ParaCharts.
 */
export class Commander {
  protected static _inst: Commander;

  protected _commands!: Partial<CommandMap>;

  protected constructor(paraView: ParaView) {
    const paraState = paraView.paraState;
    // Always return the current chart info object (i.e., don't let the
    // commands close over a value that might be removed)
    const chartInfo = () => paraView.documentView!.chartInfo;
    const chartView = () => paraView.documentView!.chartLayers.dataLayer;
    this._commands = {
      key(keyId: string): boolean {
        return paraState.keymapManager.onKeydown(keyId);
      },
      click(seriesKey: string, index: number, isAdd = false): boolean {
        const datapointView = chartView().datapointView(seriesKey, index);
        if (!datapointView) {
          return false;
        }
        chartInfo().navMap!.goTo(chartInfo().navDatapointType, {
          seriesKey: datapointView.seriesKey,
          index: datapointView.index
        });
        chartInfo().selectCurrent(isAdd);
        return true;
      }
    };
  }

  static getInst(paraView: ParaView): Commander {
    if (!Commander._inst) {
      Commander._inst = new Commander(paraView);
    }
    return Commander._inst;
  }

  get commands() {
    return this._commands;
  }
}
