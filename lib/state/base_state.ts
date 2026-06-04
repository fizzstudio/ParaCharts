import { State, property } from '@lit-app/state';

import { Settings, type Setting } from './settings_types';
import { Config } from '../config/config_types';
import { SettingsManager } from './settings_manager';

import { Logger, getLogger } from '@fizz/logger';

export type SettingObserver = (oldValue?: Setting, newValue?: Setting) => void;

export interface ParaStateCallbacks {
  onUpdate?: () => void;
  onRefreshParaView?: () => void;
  onNotice?: (type: string, data: any) => void;
  onSettingChange?: (path: string, oldValue?: Setting, newValue?: Setting) => void;
}

interface WaitSettingRecord {
  value: Setting;
  promise: Promise<void>;
  resolve: () => void;
}

/**
 *
 */
export abstract class BaseState extends State {
  @property() settings!: Settings;
  @property() config!: Config;

  protected _settingObservers: { [path: string]: SettingObserver[] } = {};
  protected log: Logger = getLogger("ParaState");
  protected callbacks: ParaStateCallbacks = {};
  protected _waitedSettings: { [path: string]: WaitSettingRecord } = {};

  registerCallbacks(callbacks: ParaStateCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this.callbacks.onSettingChange?.(path, oldValue, newValue);
    if (this._waitedSettings[path] && this._waitedSettings[path].value === newValue) {
      this._waitedSettings[path].resolve();
      delete this._waitedSettings[path];
    }
  }

  requestUpdate() {
    this.callbacks.onUpdate?.();
  }

  refreshParaView() {
    this.callbacks.onRefreshParaView?.();
  }

  postNotice(key: string, value: any) {
    this.callbacks.onNotice?.(key, value);
  }

  waitForSetting(path: string, value: Setting): Promise<void> {
    if (SettingsManager.get(path, this.config) === value) Promise.resolve();
    if (this._waitedSettings[path]) {
      return this._waitedSettings[path].promise;
    }
    const prom = new Promise<void>((resolve, reject) => {
      this._waitedSettings[path] = {value, resolve} as WaitSettingRecord;
    });
    (this._waitedSettings[path] as WaitSettingRecord).promise = prom;
    return prom;
  }
}