import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeymapManager, HotkeyEvent } from '../../../../lib/store/keymap_manager';
import type { ActionMap } from '../../../../lib/store/action_map';

describe('KeymapManager', () => {
  const createManager = (actionMap?: Partial<ActionMap>) => new KeymapManager((actionMap ?? {}) as ActionMap);
  
  const expectDispatched = (manager: KeymapManager, key: string) => {
    const listener = vi.fn();
    manager.addEventListener('hotkeypress', listener);
    manager.onKeydown(key);
    return listener.mock.calls[0][0] as HotkeyEvent;
  };

  describe('HotkeyEvent', () => {
    it('should create event with properties', () => {
      const event = new HotkeyEvent('Enter', 'select', { foo: 'bar' });
      expect(event.key).toBe('Enter');
      expect(event.action).toBe('select');
      expect(event.args).toEqual({ foo: 'bar' });
      expect(event.type).toBe('hotkeypress');
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe('constructor and bulk registration', () => {
    it('should register hotkeys from action map', () => {
      const manager = createManager({
        select: { label: 'Select', hotkeys: ['Enter', ' '] },
        move: { label: 'Move', hotkeys: [{ keyID: 'ArrowLeft', args: { direction: 'left' } }] }
      });
      
      expect(manager.onKeydown('Enter')).toBe(true);
      expect(manager.onKeydown(' ')).toBe(true);
      expect(manager.onKeydown('ArrowLeft')).toBe(true);
      expect(manager.onKeydown('unknown')).toBe(false);
    });
  });

  describe('registerHotkey', () => {
    let manager: KeymapManager;

    beforeEach(() => {
      manager = createManager();
    });

    it('should register various key types', () => {
      manager.registerHotkey('a', 'letter');
      manager.registerHotkey('Enter', 'special');
      manager.registerHotkey('ArrowLeft', 'arrow');
      manager.registerHotkey('Alt+q', 'altMod');
      manager.registerHotkey('Ctrl+Shift+Tab', 'multiMod');
      
      expect(manager.onKeydown('a')).toBe(true);
      expect(manager.onKeydown('Enter')).toBe(true);
      expect(manager.onKeydown('ArrowLeft')).toBe(true);
      expect(manager.onKeydown('Alt+q')).toBe(true);
      expect(manager.onKeydown('Ctrl+Shift+Tab')).toBe(true);
    });

    it('should pass through arguments', () => {
      manager.registerHotkey({ keyID: 'ArrowRight', args: { direction: 'right', steps: 2 } }, 'move');
      
      const event = expectDispatched(manager, 'ArrowRight');
      expect(event.args).toEqual({ direction: 'right', steps: 2 });
    });

    it('should auto-register Shift+ for lowercase letters only', () => {
      manager.registerHotkey('a', 'action');
      manager.registerHotkey('A', 'actionUpper');
      manager.registerHotkey('1', 'number');
      manager.registerHotkey('Enter', 'enter');
      
      expect(manager.onKeydown('Shift+a')).toBe(true);
      expect(manager.onKeydown('Shift+A')).toBe(false);
      expect(manager.onKeydown('Shift+1')).toBe(false);
      expect(manager.onKeydown('Shift+Enter')).toBe(false);
    });

    it('should override existing registrations', () => {
      manager.registerHotkey('a', 'first');
      manager.registerHotkey('a', 'second');
      
      const event = expectDispatched(manager, 'a');
      expect(event.action).toBe('second');
    });
  });


  describe('onKeydown and event dispatching', () => {
    let manager: KeymapManager;

    beforeEach(() => {
      manager = createManager({
        select: { label: 'Select', hotkeys: ['Enter'] },
        move: { label: 'Move', hotkeys: [{ keyID: 'ArrowLeft', args: { direction: 'left' } }] }
      });
    });

    it('should return true/false and dispatch events', () => {
      const listener = vi.fn();
      manager.addEventListener('hotkeypress', listener);
      
      expect(manager.onKeydown('Enter')).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      
      expect(manager.onKeydown('unknown')).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should dispatch correct event properties', () => {
      const event = expectDispatched(manager, 'ArrowLeft');
      expect(event.action).toBe('move');
      expect(event.key).toBe('ArrowLeft');
      expect(event.args).toEqual({ direction: 'left' });
    });

    it('should support multiple listeners and removeEventListener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      manager.addEventListener('hotkeypress', listener1);
      manager.addEventListener('hotkeypress', listener2);
      manager.onKeydown('Enter');
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      manager.removeEventListener('hotkeypress', listener1);
      listener1.mockClear();
      listener2.mockClear();
      manager.onKeydown('Enter');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle navigation sequence with mixed keys', () => {
      const manager = createManager({
        move: {
          label: 'Move',
          hotkeys: [
            { keyID: 'ArrowLeft', args: { direction: 'left' } },
            { keyID: 'ArrowRight', args: { direction: 'right' } }
          ]
        },
        select: { label: 'Select', hotkeys: ['Enter'] },
        goFirst: { label: 'Go First', hotkeys: ['Home'] }
      });
      
      const events: HotkeyEvent[] = [];
      manager.addEventListener('hotkeypress', (e) => events.push(e as HotkeyEvent));
      
      manager.onKeydown('Home');
      manager.onKeydown('ArrowRight');
      manager.onKeydown('Enter');
      
      expect(events).toHaveLength(3);
      expect(events[0].action).toBe('goFirst');
      expect(events[1].action).toBe('move');
      expect(events[1].args?.direction).toBe('right');
      expect(events[2].action).toBe('select');
    });
  });
});
