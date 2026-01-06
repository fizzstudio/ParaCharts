import { describe, it, expect } from 'vitest';
import { SettingsManager } from '../../../../lib/store/settings_manager';
import type { SettingGroup, SettingsInput } from '../../../../lib/store/settings_types';

describe('SettingsManager', () => {

  describe('hydrate and supplement flow', () => {
    it('should convert flat paths to nested structure', () => {
      const input: SettingsInput = {
        'color.palette': 'viridis',
        'display.width': 1024
      };

      const result = SettingsManager.hydrateInput(input);

      expect((result.color as SettingGroup).palette).toBe('viridis');
      expect((result.display as SettingGroup).width).toBe(1024);
    });

    it('should supplement missing values from defaults', () => {
      const partial = SettingsManager.hydrateInput({ 'display.width': 800 });
      const defaults: SettingGroup = {
        display: { width: 1024, height: 600 },
        color: { palette: 'default' }
      };

      SettingsManager.suppleteSettings(partial, defaults);

      expect((partial.display as SettingGroup).width).toBe(800);
      expect((partial.display as SettingGroup).height).toBe(600);
      expect((partial.color as SettingGroup).palette).toBe('default');
    });

    it('should handle deep nesting', () => {
      const input: SettingsInput = { 'a.b.c': 42 };
      const result = SettingsManager.hydrateInput(input);

      expect(((result.a as SettingGroup).b as SettingGroup).c).toBe(42);
    });

    it('should fill undefined values from defaults', () => {
      const partial: Partial<SettingGroup> = { x: { val: undefined } };
      const defaults: SettingGroup = { x: { val: 100 } };

      SettingsManager.suppleteSettings(partial, defaults);

      expect((partial.x as SettingGroup).val).toBe(100);
    });
  });

  describe('get and set', () => {
    const settings: SettingGroup = {
      display: { width: 800, height: 600 },
      color: { palette: 'plasma', opacity: 0.8 }
    };

    it('should get nested values', () => {
      expect(SettingsManager.get('display.width', settings)).toBe(800);
      expect(SettingsManager.get('color.palette', settings)).toBe('plasma');
    });

    it('should set nested values', () => {
      SettingsManager.set('display.width', 1024, settings);
      expect(settings.display?.width).toBe(1024);
    });

    it('should create paths when create=true', () => {
      const empty: SettingGroup = {};
      SettingsManager.set('new.path.value', 42, empty, true);

      expect(((empty.new as SettingGroup).path as SettingGroup).value).toBe(42);
    });

    it('should throw on invalid path', () => {
      expect(() => SettingsManager.get('single', settings)).toThrow('setting path must have at least two elements');
      expect(() => SettingsManager.get('x.y', {})).toThrow();
    });
  });

  describe('getGroup and getGroupLink', () => {
    const settings: SettingGroup = {
      legend: { position: 'right', visible: true },
      axis: { showGrid: false }
    };

    it('should retrieve nested groups', () => {
      const group = SettingsManager.getGroup('legend', settings);
      expect(group).toEqual({ position: 'right', visible: true });
    });

    it('should get readonly link', () => {
      const link = SettingsManager.getGroupLink('legend', settings);
      expect(link.position).toBe('right');
    });

    it('should create groups when needed', () => {
      const empty: SettingGroup = {};
      const group = SettingsManager.getGroup('new.nested', empty, true);

      expect(group).toBeDefined();
      expect((empty.new as SettingGroup).nested).toBe(group);
    });

    it('should throw on non-existent path', () => {
      expect(() => SettingsManager.getGroup('missing', {})).toThrow(`invalid setting group type 'undefined'`);
    });
  });

  describe('cloneSettings', () => {
    it('should deep clone settings', () => {
      const original: SettingGroup = {
        a: { b: 1, c: 2 },
        d: 3
      };

      const clone = SettingsManager.cloneSettings(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.a).not.toBe(original.a);

      (original.a as SettingGroup).b = 999;
      expect((clone.a as SettingGroup).b).toBe(1);
    });

    it('should handle primitives and nested objects', () => {
      const original: SettingGroup = {
        str: 'text',
        num: 42,
        bool: true,
        nested: { deep: { value: 'x' } }
      };

      const clone = SettingsManager.cloneSettings(original);

      expect(clone.str).toBe('text');
      expect(clone.num).toBe(42);
      expect(clone.bool).toBe(true);
      expect(((clone.nested as SettingGroup).deep as SettingGroup).value).toBe('x');
    });
  });

  describe('edge cases', () => {
    it('should handle single-segment paths in getGroupForSetting', () => {
      expect(() => SettingsManager.getGroupForSetting('single', {})).toThrow('setting path must have at least two elements');
    });

    it('should handle type mismatches when value is object', () => {
      const partial: Partial<SettingGroup> = { x: { nested: 'val' } };
      const defaults: SettingGroup = { x: 'string' };

      expect(() => SettingsManager.suppleteSettings(partial, defaults)).toThrow(`type of setting 'x' must be string`);
    });

    it('should handle empty inputs', () => {
      const result = SettingsManager.hydrateInput({});
      expect(Object.keys(result)).toHaveLength(0);

      const clone = SettingsManager.cloneSettings({});
      expect(Object.keys(clone)).toHaveLength(0);
    });

    it('should set undefined values', () => {
      const group: SettingGroup = { x: { val: 42 } };
      SettingsManager.set('x.val', undefined, group);

      expect((group.x as SettingGroup).val).toBeUndefined();
    });
  });
});
