/* ParaCharts: Settings
Copyright (C) 2025 Fizz Studio

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { 
  type Setting, type Settings, type SettingsInput, type SettingGroup,
  DeepReadonly
} from './settings_types';
//import { defaults } from './defaults';

/**
 * Helps set settings.
 * @internal
 */
export class SettingsManager {

  static hydrateInput(input: SettingsInput): Partial<Settings> {
    const out: Partial<Settings> = {};
    for (const [path, value] of Object.entries(input)) {
      SettingsManager.set(path, value, out, true);
    }
    return out;
  }

  /**
   * Generate a list of setting [key, value] pairs that would need to be applied
   * to `this` to turn it into `other`.
   * @param other - Another setting store object.
   * @returns List of [key, value] pairs. 
   */
  /*diff(other: SettingStore): [string, Setting | undefined][] {
    return this.diffGroup(this.settings, other.settings);
  }

  private diffGroup<T extends SettingGroup>(group: Partial<T>, withGroup: T, path = '') {
    let diff: [string, Setting | undefined][] = [];
    const keys = Object.keys(withGroup) as (keyof T)[];
    for (const key of keys) {
      const pathPlusKey = `${path ? path + '.' : ''}${key as string}`;
      if (group.hasOwnProperty(key)) {
        if (typeof group[key] === 'object') {
          if (typeof withGroup[key] !== 'object') {
            throw new Error(`type of setting '${key as string}' must be ${typeof withGroup[key]}`);
          }
          diff = diff.concat(this.diffGroup(group[key] as SettingGroup, withGroup[key] as SettingGroup, 
            pathPlusKey));
        } else if (group[key] !== withGroup[key]) {
          diff.push([pathPlusKey, withGroup[key] as Setting | undefined]);
        } 
      } else {
        // withGroup is guaranteed to have the key
        if (typeof withGroup[key] === 'object') {
          diff = diff.concat(this.diffGroup({}, withGroup[key] as SettingGroup, 
            `${path}.${key as string}`));
        } else {
          diff.push([pathPlusKey, withGroup[key] as Setting | undefined]);
        }
      }
    }
    return diff;
  }

  /**
   * Given a group path, return the object for it.
   * @param path - Dotted path to the group.
   * @param group - Optional group to start search from (default: root of the setting tree).
   * @param create - Optionally create groups that don't exist.
   * @returns Setting group object.
   */
  static getGroup(path: string, group: SettingGroup, create = false) {
    const segs = path.split('.');
    let cursor: SettingGroup = group;
    let prev: SettingGroup | null = null;
    for (const seg of segs) {
      prev = cursor;
      cursor = cursor[seg] as SettingGroup;
      if (typeof cursor !== 'object') {
        if (create && cursor === undefined) {
          cursor = {};
          prev[seg] = cursor;
        } else {
          throw new Error(`invalid setting group type '${typeof cursor}' in '${path}'`);          
        }  
      }
    }
    return cursor;
  }

  static getGroupLink<T extends SettingGroup>(path: string, group: SettingGroup) {
    return SettingsManager.getGroup(path, group) as DeepReadonly<T>;
  }

  /**
   * Given a full setting path, return the group that immediately
   * contains the setting.
   * @param path - Dotted path to the setting.
   * @param group - Optional group to start search from (default: root of the setting tree).
   * @param create - Optionally create groups that don't exist.
   * @returns Setting group.
   */
  static getGroupForSetting(path: string, group: SettingGroup, create = false) {
    const segs = path.split('.');
    if (segs.length < 2) {
      throw new Error('setting path must have at least two elements');
    }
    return SettingsManager.getGroup(segs.slice(0, -1).join('.'), group, create);
  }

  static get(path: string, group: SettingGroup) {
    const value = SettingsManager.getGroupForSetting(path, group)[path.split('.').at(-1)!];
    if (typeof value === 'object') {
      throw new Error('can only get settings, not groups');
    }
    return value;
  }

  static set(path: string, value: Setting | undefined, group: SettingGroup, create = false) {
    const segs = path.split('.');
    const settingGroup = SettingsManager.getGroupForSetting(path, group, create);
    settingGroup[segs.at(-1)!] = value;
  }

  static cloneSettings<T extends SettingGroup>(settings: T): T {
    const clone: T = {} as T;
    const keys = Object.keys(settings) as (keyof T)[];
    for (const key of keys) {
      SettingsManager.cloneProp(clone, settings, key);
    }
    return clone;
  }

  static cloneProp<T extends Object>(dest: Partial<T>, src: T, prop: keyof T) {
    /*if (Array.isArray(src[prop])) {
      // XXX should deep-copy the array
      dest[prop] = (src[prop] as any[]).map(item => item) as T[keyof T];
    } else if (src[prop] === null) { 
      dest[prop] = null as T[keyof T];
    } else*/ if (typeof src[prop] === 'object') {
      dest[prop] = SettingsManager.cloneSettings(src[prop] as SettingGroup) as T[keyof T];
    } else {
      dest[prop] = src[prop];
    }
  }

  static suppleteSettings<T extends SettingGroup>(settings: Partial<T>, using: T) {
    const keys = Object.keys(using) as (keyof T)[];
    for (const key of keys) {
      if (settings.hasOwnProperty(key)) {
        /*if (Array.isArray(opts[key])) {
          continue;
        } else if (opts[key] === null) { 
          continue;
        } else*/ if (typeof settings[key] === 'object') {
          if (typeof using[key] !== 'object') {
            throw new Error(`type of setting '${key as string}' must be ${typeof using[key]}`);
          }
          this.suppleteSettings(settings[key] as SettingGroup, using[key] as SettingGroup);
        } else if (settings[key] === undefined) { 
          //opts[key] = using[key];
          SettingsManager.cloneProp(settings, using, key);
        } else {
          continue;
        }  
      } else {
        SettingsManager.cloneProp(settings, using, key);
      }
    }
  }

}