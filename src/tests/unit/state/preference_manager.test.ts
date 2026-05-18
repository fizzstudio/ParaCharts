import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParaState } from '../../../../lib/state/parastate';
import { GlobalState } from '../../../../lib/state';
import { PreferenceManager, ColorPrefManager } from '../../../../lib/state/preference_manager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Record<string, unknown> = {}): ParaState {
  const globalState = new GlobalState({});
  return new ParaState(globalState, overrides);
}

/** Build a minimal matchMedia stub. All queries default to not-matching. */
function stubMatchMedia(matches: Partial<Record<string, boolean>> = {}) {
  const listeners = new Map<string, Set<() => void>>();
  const mqls = new Map<string, { matches: boolean }>();

  const impl = (query: string) => {
    const key = query;
    if (!mqls.has(key)) {
      mqls.set(key, { matches: matches[key] ?? false });
      listeners.set(key, new Set());
    }
    const mql = mqls.get(key)!;
    return {
      get matches() { return mql.matches; },
      addEventListener: (_event: string, fn: () => void) => { listeners.get(key)!.add(fn); },
      removeEventListener: (_event: string, fn: () => void) => { listeners.get(key)!.delete(fn); },
    };
  };

  const fire = (query: string, newMatches: boolean) => {
    const mql = mqls.get(query);
    if (mql) {
      mql.matches = newMatches;
      listeners.get(query)?.forEach(fn => fn());
    }
  };

  return { impl, fire };
}

// ---------------------------------------------------------------------------
// PreferenceManager
// ---------------------------------------------------------------------------

describe('PreferenceManager', () => {
  const KEY = 'test:prefs:v1';
  let manager: PreferenceManager<{ theme: string; level: number }>;

  beforeEach(() => {
    localStorage.clear();
    manager = new PreferenceManager(KEY);
  });

  it('returns empty object when nothing is stored', () => {
    expect(manager.load()).toEqual({});
  });

  it('saves and loads a partial preference', () => {
    manager.save({ theme: 'dark' });
    expect(manager.load()).toEqual({ theme: 'dark' });
  });

  it('merges subsequent saves', () => {
    manager.save({ theme: 'dark' });
    manager.save({ level: 2 });
    expect(manager.load()).toEqual({ theme: 'dark', level: 2 });
  });

  it('later save wins for the same key', () => {
    manager.save({ theme: 'dark' });
    manager.save({ theme: 'light' });
    expect(manager.load().theme).toBe('light');
  });

  it('clear removes all stored data', () => {
    manager.save({ theme: 'dark' });
    manager.clear();
    expect(manager.load()).toEqual({});
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    expect(() => manager.save({ theme: 'dark' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ColorPrefManager
// ---------------------------------------------------------------------------

describe('ColorPrefManager', () => {
  let state: ParaState;
  let manager: ColorPrefManager;
  let mqlStub: ReturnType<typeof stubMatchMedia>;

  beforeEach(() => {
    localStorage.clear();
    mqlStub = stubMatchMedia();
    vi.stubGlobal('matchMedia', mqlStub.impl);
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
  });

  afterEach(() => {
    manager.destroy();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Default resolution
  // -------------------------------------------------------------------------

  it('defaults to light theme when system prefers light', () => {
    expect(state.config.color.isDarkModeEnabled).toBe(false);
  });

  it('resolves dark when system prefers dark and themeMode is system', () => {
    manager.destroy();
    mqlStub = stubMatchMedia({ '(prefers-color-scheme: dark)': true });
    vi.stubGlobal('matchMedia', mqlStub.impl);
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
    expect(state.config.color.isDarkModeEnabled).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Theme resolution: explicit overrides system
  // -------------------------------------------------------------------------

  it('uses dark when themeMode is dark, regardless of system', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'dark'; });
    expect(state.config.color.isDarkModeEnabled).toBe(true);
  });

  it('uses light when themeMode is light, even if system is dark', () => {
    manager.destroy();
    mqlStub = stubMatchMedia({ '(prefers-color-scheme: dark)': true });
    vi.stubGlobal('matchMedia', mqlStub.impl);
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
    // User picks light
    state.updateConfig(draft => { draft.color.themeMode = 'light'; });
    expect(state.config.color.isDarkModeEnabled).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Source tracking via setting observer
  // -------------------------------------------------------------------------

  it('marks themeSource as user when themeMode changes to a non-system value', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'dark'; });
    expect(state.config.color.themeSource).toBe('user');
  });

  it('marks themeSource as system when themeMode is set to system', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'dark'; });
    state.updateConfig(draft => { draft.color.themeMode = 'system'; });
    expect(state.config.color.themeSource).toBe('system');
  });

  it('persists theme to localStorage when themeMode changes', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'dark'; });
    const stored = JSON.parse(localStorage.getItem('paracharts:colorPreferences:v1')!);
    expect(stored.theme).toBe('dark');
  });

  // -------------------------------------------------------------------------
  // Contrast resolution
  // -------------------------------------------------------------------------

  it('uses normal contrast (0.6) by default', () => {
    expect(state.config.color.contrastLevel).toBeCloseTo(0.6);
  });

  it('maps higher contrastMode to contrastLevel 1.0', () => {
    state.updateConfig(draft => { draft.color.contrastMode = 'higher'; });
    expect(state.config.color.contrastLevel).toBeCloseTo(1.0);
  });

  it('maps lower contrastMode to contrastLevel 0.3', () => {
    state.updateConfig(draft => { draft.color.contrastMode = 'lower'; });
    expect(state.config.color.contrastLevel).toBeCloseTo(0.3);
  });

  it('maps normal contrastMode to contrastLevel 0.6', () => {
    state.updateConfig(draft => { draft.color.contrastMode = 'normal'; });
    expect(state.config.color.contrastLevel).toBeCloseTo(0.6);
  });

  it('resolves contrast from system when contrastMode is system and system prefers more', () => {
    manager.destroy();
    mqlStub = stubMatchMedia({ '(prefers-contrast: more)': true });
    vi.stubGlobal('matchMedia', mqlStub.impl);
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
    expect(state.config.color.contrastLevel).toBeCloseTo(1.0);
  });

  it('resolves contrast from system when contrastMode is system and system prefers less', () => {
    manager.destroy();
    mqlStub = stubMatchMedia({ '(prefers-contrast: less)': true });
    vi.stubGlobal('matchMedia', mqlStub.impl);
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
    expect(state.config.color.contrastLevel).toBeCloseTo(0.3);
  });

  // -------------------------------------------------------------------------
  // setModeDefault / clearModeDefault
  // -------------------------------------------------------------------------

  it('setModeDefault applies dark theme when no user pref is set', () => {
    manager.setModeDefault('themeMode', 'dark');
    expect(state.config.color.isDarkModeEnabled).toBe(true);
    expect(state.config.color.themeSource).toBe('modeDefault');
  });

  it('setModeDefault does not override an explicit user preference', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'light'; });
    // themeSource becomes 'user' via observer
    manager.setModeDefault('themeMode', 'dark');
    expect(state.config.color.isDarkModeEnabled).toBe(false);
  });

  it('clearModeDefault restores system behavior after a mode default', () => {
    manager.setModeDefault('themeMode', 'dark');
    manager.clearModeDefault('themeMode');
    expect(state.config.color.themeMode).toBe('system');
    expect(state.config.color.themeSource).toBe('default');
  });

  it('clearModeDefault does not affect an explicit user preference', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'light'; });
    manager.clearModeDefault('themeMode');
    expect(state.config.color.themeMode).toBe('light');
    expect(state.config.color.themeSource).toBe('user');
  });

  it('setModeDefault does not persist to localStorage', () => {
    manager.setModeDefault('themeMode', 'dark');
    expect(localStorage.getItem('paracharts:colorPreferences:v1')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Live system preference updates
  // -------------------------------------------------------------------------

  it('updates isDarkModeEnabled when system color-scheme changes and themeMode is system', () => {
    expect(state.config.color.isDarkModeEnabled).toBe(false);
    mqlStub.fire('(prefers-color-scheme: dark)', true);
    expect(state.config.color.isDarkModeEnabled).toBe(true);
  });

  it('ignores system color-scheme change when themeMode is explicit', () => {
    state.updateConfig(draft => { draft.color.themeMode = 'light'; });
    mqlStub.fire('(prefers-color-scheme: dark)', true);
    expect(state.config.color.isDarkModeEnabled).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Persistence and reload
  // -------------------------------------------------------------------------

  it('restores stored user preferences on init', () => {
    // Simulate a stored preference from a previous session
    localStorage.setItem(
      'paracharts:colorPreferences:v1',
      JSON.stringify({ theme: 'dark', contrast: 'higher' })
    );
    manager.destroy();
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();

    expect(state.config.color.themeMode).toBe('dark');
    expect(state.config.color.themeSource).toBe('user');
    expect(state.config.color.isDarkModeEnabled).toBe(true);
    expect(state.config.color.contrastMode).toBe('higher');
    expect(state.config.color.contrastLevel).toBeCloseTo(1.0);
  });

  it('does not save resolved state to localStorage', () => {
    // isDarkModeEnabled resolves; it must not appear in localStorage
    mqlStub.fire('(prefers-color-scheme: dark)', true);
    const stored = localStorage.getItem('paracharts:colorPreferences:v1');
    expect(stored).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ColorPrefManager — contrast warnings
// ---------------------------------------------------------------------------

describe('ColorPrefManager contrast warnings', () => {
  let state: ReturnType<typeof makeState>;
  let manager: ColorPrefManager;
  let mqlStub: ReturnType<typeof stubMatchMedia>;

  beforeEach(() => {
    mqlStub = stubMatchMedia();
    vi.stubGlobal('matchMedia', mqlStub.impl);
    localStorage.clear();
    state = makeState();
    manager = new ColorPrefManager(state);
    manager.init();
  });

  afterEach(() => {
    manager.destroy();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('no label or axis warnings with default colors (white bg, light mode)', () => {
    // The default diva palette has one light series color that warns against white —
    // that is correct behaviour. What must NOT warn is text/axis (critical roles).
    const critical = state.colorContrastWarnings.filter(
      w => w.role === 'label' || w.role === 'axis',
    );
    expect(critical).toHaveLength(0);
  });

  it('warns about labels/axes when a very dark background is set in light mode', () => {
    // Near-black background in light mode: labels will be ~#333, low contrast
    state.updateConfig(draft => {
      draft.color.backgroundColorLight = 'oklch(0.1 0 0)';
    });
    mqlStub.fire('(prefers-color-scheme: dark)', false);

    const roles = state.colorContrastWarnings.map(w => w.role);
    expect(roles).toContain('label');
  });

  it('clears all warnings when forced-colors is active', () => {
    // Set a bad background first so we have warnings to clear
    state.updateConfig(draft => {
      draft.color.backgroundColorLight = 'oklch(0.1 0 0)';
    });
    mqlStub.fire('(prefers-color-scheme: dark)', false);
    expect(state.colorContrastWarnings.length).toBeGreaterThan(0);

    // Activate forced-colors — checker must clear all warnings
    mqlStub.fire('(forced-colors: active)', true);
    expect(state.colorContrastWarnings).toHaveLength(0);
  });

  it('clears label/axis warnings when background is reset to white', () => {
    // Set a bad background to generate label/axis warnings
    state.updateConfig(draft => {
      draft.color.backgroundColorLight = 'oklch(0.1 0 0)';
    });
    mqlStub.fire('(prefers-color-scheme: dark)', false);
    const criticalBefore = state.colorContrastWarnings.filter(
      w => w.role === 'label' || w.role === 'axis',
    );
    expect(criticalBefore.length).toBeGreaterThan(0);

    // Reset to white — label/axis warnings must clear
    state.updateConfig(draft => {
      draft.color.backgroundColorLight = 'oklch(1 0 0)';
    });
    mqlStub.fire('(prefers-color-scheme: dark)', false);
    const criticalAfter = state.colorContrastWarnings.filter(
      w => w.role === 'label' || w.role === 'axis',
    );
    expect(criticalAfter).toHaveLength(0);
  });
});
