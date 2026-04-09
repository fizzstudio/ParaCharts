import { State, property } from '@lit-app/state';

import {
  DeepReadonly, FORMAT_CONTEXT_SETTINGS, Settings, SettingsInput, FormatContext,
  type Setting,
} from './settings_types';
import { Config } from '../config/config_types';
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
  @property() config!: Config;

  protected _settingObservers: { [path: string]: SettingObserver[] } = {};
  protected log: Logger = getLogger("ParaState");
  protected callbacks: ParaStateCallbacks = {};

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