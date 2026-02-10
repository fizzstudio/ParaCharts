import { State, property } from '@lit-app/state';
import { produceWithPatches, enablePatches } from 'immer';
enablePatches();

import {
  DeepReadonly, FORMAT_CONTEXT_SETTINGS, Settings, SettingsInput, FormatContext,
  type Setting,
} from './settings_types';
import { SettingsManager } from './settings_manager';
import { defaults, chartTypeDefaults } from './settings_defaults';

import { Logger, getLogger } from '@fizz/logger';

export type SettingObserver = (oldValue?: Setting, newValue?: Setting) => void;

export interface ParaStateCallbacks {
  onUpdate?: () => void;
  onNotice?: (type: string, data: any) => void;
  onSettingChange?: (path: string, oldValue?: Setting, newValue?: Setting) => void;
}

/**
 *
 */
export abstract class BaseState extends State {
  @property() settings!: Settings;

  protected _settingObservers: { [path: string]: SettingObserver[] } = {};
  protected log: Logger = getLogger("ParaState");
  protected callbacks: ParaStateCallbacks = {};

  protected _createSettings(inputSettings: SettingsInput) {
    const hydratedSettings = SettingsManager.hydrateInput(inputSettings);
    SettingsManager.suppleteSettings(hydratedSettings, defaults);
    this.settings = hydratedSettings as Settings;
  }

  updateSettings(updater: (draft: Settings) => void, ignoreObservers = false) {
    const [newSettings, patches, inversePatches] = produceWithPatches(this.settings, updater);
    this.settings = newSettings;
    if (ignoreObservers) {
      return;
    }
    const observed: { [path: string]: Partial<{ oldValue: Setting, newValue: Setting }> } = {};
    for (const patch of patches) {
      if (patch.op !== 'replace') {
        this.log.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')] = { newValue: patch.value };
    }
    for (const patch of inversePatches) {
      if (patch.op !== 'replace') {
        this.log.error(`unexpected patch op '${patch.op}' (${patch.path})`);
        continue;
      }
      observed[patch.path.join('.')].oldValue = patch.value;
    }
    for (const [path, values] of Object.entries(observed)) {
      this._settingObservers[path]?.forEach(observer =>
        observer(values.oldValue, values.newValue)
      );
      this.settingDidChange(path, values.oldValue, values.newValue);
    }
  }

  observeSetting(path: string, observer: (oldValue: Setting, newValue: Setting) => void) {
    if (!this._settingObservers[path]) {
      this._settingObservers[path] = [];
    }
    if (this._settingObservers[path].includes(observer)) {
      throw new Error(`observer already registered for setting '${path}'`);
    }
    this._settingObservers[path].push(observer);
  }

  observeSettings(paths: string[], observer: (oldValue: Setting, newValue: Setting) => void) {
    for (let path of paths) {
      this.observeSetting(path, observer);
    }
  }

  unobserveSetting(path: string, observer: (oldValue: Setting, newValue: Setting) => void) {
    if (!this._settingObservers[path]) {
      throw new Error(`no observers for setting '${path}'`);
    }
    const idx = this._settingObservers[path].indexOf(observer);
    if (idx === -1) {
      throw new Error(`observer not registered for setting '${path}'`);
    }
    this._settingObservers[path].splice(idx, 1);
    if (this._settingObservers[path].length === 0) {
      delete this._settingObservers[path];
    }
  }

  registerCallbacks(callbacks: ParaStateCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  settingDidChange(path: string, oldValue?: Setting, newValue?: Setting) {
    this.callbacks.onSettingChange?.(path, oldValue, newValue);
  }

  requestUpdate() {
    this.callbacks.onUpdate?.();
  }

  postNotice(key: string, value: any) {
    this.callbacks.onNotice?.(key, value);
  }
}