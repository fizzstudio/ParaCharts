
import { Logger } from './common/logger';
import { ParaStore } from './store/parastore';
import { ParaLoader } from "./loader/paraloader";
import { DeepReadonly, Settings, SettingsInput } from "./store/settings_types";
import { AllSeriesData } from "@fizz/paramanifest";
import { type ParaChart } from './parachart/parachart';

import { Manifest } from "@fizz/paramanifest";

export class ParaController extends Logger {

  protected _manifest?: Manifest;
  protected _store: ParaStore;
  protected _loader = new ParaLoader();
  protected _inputSettings: SettingsInput = {};
  protected _data?: AllSeriesData;
  protected _suppleteSettingsWith?: DeepReadonly<Settings>;  
  
  constructor(parachart: ParaChart) {
    super();
    this._store = new ParaStore(this._inputSettings, this._suppleteSettingsWith);
    parachart.addEventListener('paraviewready', async () => {
      if (parachart.filename) {
        await this.runLoader(parachart.filename);
        this.log('ParaCharts will now commence the raising of the roof and/or the dead');
      }
      parachart.addEventListener('filenamechange', () =>
        this.runLoader(parachart.filename));
    });
  }

  get store() {
    return this._store;
  }

  logName() {
    return 'CONTROLLER';
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
    } else {
      console.error(loadresult.error);
      this._store.dataState = 'error';
    }
  }
  
}