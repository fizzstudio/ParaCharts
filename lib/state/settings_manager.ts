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

import { SettingsInput, DeepReadonly, ConfigGroup, Config, ConfigSetting } from '../config/config_types';
//import { defaults } from './defaults';

type SettingsStack = Array<{ group: Partial<ConfigGroup>; prefix: string }>;

/**
 * Helps set settings.
 * @internal
 */
export class SettingsManager {

  static hydrateInput(input: SettingsInput): Partial<Config> {
    const out: Partial<Config> = {};
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

  private diffGroup<T extends ConfigGroup>(group: Partial<T>, withGroup: T, path = '') {
    let diff: [string, Setting | undefined][] = [];
    const keys = Object.keys(withGroup) as (keyof T)[];
    for (const key of keys) {
      const pathPlusKey = `${path ? path + '.' : ''}${key as string}`;
      if (group.hasOwnProperty(key)) {
        if (typeof group[key] === 'object') {
          if (typeof withGroup[key] !== 'object') {
            throw new Error(`type of setting '${key as string}' must be ${typeof withGroup[key]}`);
          }
          diff = diff.concat(this.diffGroup(group[key] as ConfigGroup, withGroup[key] as ConfigGroup,
            pathPlusKey));
        } else if (group[key] !== withGroup[key]) {
          diff.push([pathPlusKey, withGroup[key] as Setting | undefined]);
        }
      } else {
        // withGroup is guaranteed to have the key
        if (typeof withGroup[key] === 'object') {
          diff = diff.concat(this.diffGroup({}, withGroup[key] as ConfigGroup,
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
  static getGroup(path: string, group: ConfigGroup, create = false) {
    const segs = path.split('.');
    let cursor: ConfigGroup = group;
    let prev: ConfigGroup | null = null;
    for (const seg of segs) {
      prev = cursor;
      cursor = cursor[seg] as ConfigGroup;
      if (typeof cursor !== 'object') {
        if (create && cursor === undefined) {
          cursor = {};
          prev[seg] = cursor;
        } else if (cursor === undefined) {
          throw new Error(`no such setting group '${path}'`);
        } else {
          throw new Error(`invalid setting group type '${typeof cursor}' in '${path}'`);
        }
      }
    }
    return cursor;
  }

  static getGroupLink<T extends ConfigGroup>(path: string, group: ConfigGroup) {
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
  static getGroupForSetting(path: string, group: ConfigGroup, create = false) {
    const segs = path.split('.');
    if (segs.length < 2) {
      throw new Error('setting path must have at least two elements');
    }
    return SettingsManager.getGroup(segs.slice(0, -1).join('.'), group, create);
  }

  static get(path: string, group: ConfigGroup) {
    const value = SettingsManager.getGroupForSetting(path, group)[path.split('.').at(-1)!];
    if (typeof value === 'object') {
      throw new Error('can only get settings, not groups');
    } else if (value === undefined) {
      throw new Error(`no such setting '${path}'`);
    }
    return value;
  }

  static getAllSettings(group: ConfigGroup, prefix = ''): SettingsInput {
    const out: SettingsInput = {};
    let path: string;
    const keys = Object.keys(group);
    for (const key of keys) {
      path = prefix ? (prefix + '.' + key) : key;
      if (typeof group[key] === 'object') {
        const settings = this.getAllSettings(group[key] as ConfigGroup, path);
        Object.entries(settings).forEach(([path, value]) => {
          out[path] = value;
        });
      } else {
        out[path] = group[key]!;
      }
    }
    return out;
  }

  static set(path: string, value: ConfigSetting | undefined, group: ConfigGroup, create = false) {
    const segs = path.split('.');
    // If caller passed a single segment, treat it as a key relative to the provided group.
    if (segs.length === 1) {
      group[segs[0]] = value;
      return;
    }
    const ConfigGroup = SettingsManager.getGroupForSetting(path, group, create);
    ConfigGroup[segs.at(-1)!] = value;
  }

  static cloneSettings<T extends ConfigGroup>(settings: T): T {
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
      dest[prop] = SettingsManager.cloneSettings(src[prop] as ConfigGroup) as T[keyof T];
    } else {
      dest[prop] = src[prop];
    }
  }

  /**
   * Apply all leaf values from a nested settings source object into a draft.
   * @param source - Nested settings object (or partial) to read values from.
   * @param draft - The settings object to write into.
   */
  static applySettings(source: Partial<ConfigGroup>, draft: ConfigGroup): void {
    const stack: SettingsStack = [{ group: source, prefix: '' }];
    while (stack.length > 0) {
      const { group, prefix } = stack.pop()!;
      for (const key of Object.keys(group)) {
        const value = group[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object') {
          stack.push({ group: value as Partial<ConfigGroup>, prefix: path });
        } else {
          SettingsManager.set(path, value as ConfigSetting | undefined, draft, true);
        }
      }
    }
  }

  static suppleteSettings<T extends ConfigGroup>(settings: Partial<T>, using: T) {
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
          this.suppleteSettings(settings[key] as ConfigGroup, using[key] as ConfigGroup);
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

  // new in SettingsManager (static members/methods)

  private static _instanceOverrides: Record<string, Partial<Config>> = {};
  private static _mergedCache: Map<string, ConfigGroup> = new Map();

  /** Register or replace overrides for an instance. */
  static setInstanceOverrides(instanceID: string, overrides: Partial<Config>) {
    SettingsManager._instanceOverrides[instanceID] = overrides;
    // invalidate cache entries for this instance
    for (const key of SettingsManager._mergedCache.keys()) {
      if (key.startsWith(instanceID + '::')) SettingsManager._mergedCache.delete(key);
    }
  }

  /** Clear overrides for an instance (or all if no id). */
  static clearInstanceOverrides(instanceID?: string) {
    if (instanceID) {
      delete SettingsManager._instanceOverrides[instanceID];
      for (const key of SettingsManager._mergedCache.keys()) {
        if (key.startsWith(instanceID + '::')) SettingsManager._mergedCache.delete(key);
      }
    } else {
      SettingsManager._instanceOverrides = {};
      SettingsManager._mergedCache.clear();
    }
  }

  /** Clear only the merged cache (keeps instance overrides if desired). */
  static clearMergedCache() {
    SettingsManager._mergedCache.clear();
  }

  /** Internal: get override subtree for an instance and group path (e.g., 'legend'). */
  private static _getOverrideGroup(path: string, instanceID?: string): Partial<ConfigGroup> | undefined {
    if (!instanceID) return undefined;
    const inst = SettingsManager._instanceOverrides[instanceID];
    if (!inst) return undefined;
    // path may be like 'legend' or 'axis.horiz'
    const segs = path.split('.');
    let cursor: any = inst;
    for (const s of segs) {
      if (cursor === undefined) return undefined;
      cursor = cursor[s];
    }
    return cursor as Partial<ConfigGroup> | undefined;
  }

  /**
   * Merge the canonical group at `path` with instance overrides (if any).
   * Returns a cloned, merged group suitable for read-only use.
   */
  static mergeGroupForInstance<T extends ConfigGroup>(path: string, rootGroup: ConfigGroup, instanceID?: string): T {
    const cacheKey = (instanceID ?? '__global__') + '::' + path;
    const cached = SettingsManager._mergedCache.get(cacheKey);
    if (cached) return cached as unknown as T;

    // get canonical group (clone to avoid mutation)
    const canonicalGroup = SettingsManager.getGroup(path, rootGroup, false);
    const clone = SettingsManager.cloneSettings(canonicalGroup) as ConfigGroup;

    // obtain override subtree for this path; if not present, try to build it
    // from flat (dotted) override keys stored at the instance top-level.
    let override = SettingsManager._getOverrideGroup(path, instanceID);

    if (!override && instanceID) {
      const instTop = SettingsManager._instanceOverrides[instanceID];
      if (instTop) {
        const prefix = path + '.';
        const temp: any = {};

        const setNested = (obj: any, dotted: string, val: any) => {
          const segs = dotted.split('.');
          let cur = obj;
          for (let i = 0; i < segs.length - 1; i++) {
            const s = segs[i];
            if (cur[s] === undefined) cur[s] = {};
            cur = cur[s];
          }
          cur[segs[segs.length - 1]] = val;
        };

        // If there's an exact top-level key equal to `path`, prefer it.
        if (Object.prototype.hasOwnProperty.call(instTop, path)) {
          const v = (instTop as any)[path];
          if (v !== undefined) {
            // If it's already an object, use it directly; otherwise wrap it.
            override = (typeof v === 'object' && v !== null) ? v as Partial<ConfigGroup> : { [path]: v } as Partial<ConfigGroup>;
          }
        }

        // Convert any flat keys that begin with `${path}.` into a nested object
        for (const k of Object.keys(instTop)) {
          if (k.startsWith(prefix)) {
            const sub = k.slice(prefix.length);
            setNested(temp, sub, (instTop as any)[k]);
          }
        }

        // If we built any entries, use them as the override
        if (Object.keys(temp).length > 0) {
          override = temp as Partial<ConfigGroup>;
        }
      }
    }

    if (override) {
      SettingsManager.applySettings(override as Partial<ConfigGroup>, clone);
    }

    SettingsManager._mergedCache.set(cacheKey, clone);
    return clone as unknown as T;
  }

  /** Convenience: give a readonly link for components to consume. */
  static getGroupLinkForInstance<T extends ConfigGroup>(path: string, rootGroup: ConfigGroup, instanceID?: string): DeepReadonly<T> {
    return SettingsManager.mergeGroupForInstance<T>(path, rootGroup, instanceID) as DeepReadonly<T>;
  }

  /** Get single setting value with instance override applied. */
  static getForInstance(path: string, rootGroup: ConfigGroup, instanceID?: string) {
    if (!instanceID) return SettingsManager.get(path, rootGroup);
    const group = SettingsManager.getGroupForSetting(path, rootGroup, false);
    // try override value first
    const segs = path.split('.');
    const key = segs.at(-1)!;
    const overrideGroup = SettingsManager._getOverrideGroup(segs.slice(0, -1).join('.'), instanceID);
    if (overrideGroup && Object.prototype.hasOwnProperty.call(overrideGroup, key)) {
      const val = (overrideGroup as any)[key];
      if (typeof val === 'object') {
        throw new Error('can only get settings, not groups');
      } else if (val === undefined) {
        throw new Error(`no such setting '${path}'`);
      }
      return val;
    }
    return SettingsManager.get(path, rootGroup);
  }

}