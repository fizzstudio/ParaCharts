
import { SignalManager } from './view_temp/signals';
import { Logger } from './common/logger';
import { ParaStore } from './store/parastore';
import { ParaLoader } from "./loader/paraloader";
import { DeepReadonly, Settings, SettingsInput } from "./store/settings_types";
import { AllSeriesData } from "./common/types";

import { Manifest } from "@fizz/paramanifest";

export class ParaController extends Logger {

  protected _signalManager = new SignalManager();
  protected _manifest?: Manifest;
  protected _store: ParaStore;
  protected _loader = new ParaLoader();
  protected _inputSettings: SettingsInput = {};
  protected _data?: AllSeriesData;
  protected _suppleteSettingsWith?: DeepReadonly<Settings>;  
  
  constructor() {
    super();
    this._store = new ParaStore(this._inputSettings, this._suppleteSettingsWith);
    this.flow();
  }

  get store() {
    return this._store;
  }

  get signalManager() {
    return this._signalManager;
  }

  logName() {
    return 'CONTROLLER';
  }

  async flow() {
    this.log('initializing flow');
    await this._signalManager.pending('connect');
    this.log('para-chart connected');
    await this._signalManager.pending('firstUpdate');
    this.log('para-chart first updated');
    await this._signalManager.pending('paraviewReady'); //, 'controlPanelReady', 'slotChange');
    this.log('dom ready');
    while (true) {
      const filename = await this._signalManager.pending('dataUpdate');
      this.runLoader(filename);
      //await this._signalManager.pending('canvasDataLoadComplete'); //, 'controlPanelDataLoadComplete');
      await this._signalManager.pending('dataLoadComplete');
      this.log('ParaCharts will now commence the raising of the roof and/or the dead');
    }
  }

  protected _setManifest(manifest: Manifest): void {
    this._manifest = manifest;
    this._store.setManifest(manifest);
  }

  async runLoader(filename: string): Promise<void> {
    this.log(`loading filename: '${filename}'`);
    this._store.dataState = 'pending';
    const loadresult = await this._loader.load('fizz-chart-data', filename);
    this.log('loaded manifest')
    if (loadresult.result === 'success') {
      this._setManifest(loadresult.manifest);
      this._store.dataState = 'complete';
      this._signalManager.signal('dataLoadComplete');
    } else {
      console.error(loadresult.error);
      this._store.dataState = 'error';
    }
  }
  
}