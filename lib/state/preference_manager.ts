import { type ParaState } from './parastate';
import { type Setting } from '.';
import { type ColorPrefSource } from '../config/config_types';
import { hexToOklch, formatOklch } from '../common/color_space';

// ---------------------------------------------------------------------------
// PreferenceManager — generic localStorage helper for any preference category
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around localStorage for a single versioned preference key.
 * T is the shape of the stored object. Only explicit user preferences should
 * be written here; derived/resolved state must never be persisted.
 */
export class PreferenceManager<T extends object> {
  constructor(private readonly _key: string) {}

  load(): Partial<T> {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? (JSON.parse(raw) as Partial<T>) : {};
    } catch {
      return {};
    }
  }

  save(partial: Partial<T>): void {
    try {
      const existing = this.load();
      localStorage.setItem(this._key, JSON.stringify({ ...existing, ...partial }));
    } catch {
      // localStorage unavailable (SSR, private browsing, storage full)
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this._key);
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// ColorPrefManager — color-specific preference logic
// ---------------------------------------------------------------------------

const COLOR_PREFS_KEY = 'paracharts:colorPreferences:v1';

/** Shape of what is persisted to localStorage. */
interface StoredColorPrefs {
  theme?: 'system' | 'light' | 'dark';
  contrast?: ContrastMode;
  /** Stored only when contrast === 'custom'. */
  contrastLevel?: number;
  forcedColors?: 'system' | 'respect';
  invertedColors?: 'system' | 'adapt';
  /** Per-mode explicit background colors. Stored independently so switching themes restores each mode's choice. */
  backgroundColorLight?: string;
  backgroundColorDark?: string;
}

/** Live system media-query state (never persisted). */
export interface SystemColorState {
  prefersDark: boolean;
  prefersMore: boolean;
  prefersLess: boolean;
  forcedColorsActive: boolean;
  invertedColorsActive: boolean;
}

type ContrastMode = 'system' | 'lower' | 'normal' | 'higher' | 'custom';
type ThemeMode = 'system' | 'light' | 'dark';

// Numeric contrastLevel values for each named mode.
const CONTRAST_VALUES: Record<'lower' | 'normal' | 'higher', number> = {
  lower:  0.3,
  normal: 0.6,
  higher: 1.0,
};

/**
 * Manages color accessibility preferences for a single chart instance.
 *
 * Responsibilities:
 *  - Own the five matchMedia listeners (color-scheme, contrast×2, forced-colors,
 *    inverted-colors) and tear them down when the chart disconnects.
 *  - Load stored user preferences from localStorage on init.
 *  - Resolve the final rendered values (isDarkModeEnabled, contrastLevel,
 *    backgroundColor) by walking the precedence chain and writing them into
 *    paraState via updateConfig.
 *  - Observe config changes to themeMode, contrastMode, and backgroundColor:
 *    persist user-initiated changes to localStorage and update source fields.
 *  - Expose setModeDefault / clearModeDefault for mode-driven changes (skipped
 *    when themeSource === 'user', so explicit user intent is never overwritten).
 *
 * Source tracking:
 *  - A _programmaticUpdate flag distinguishes internal manager updates (mode
 *    defaults, loading from localStorage) from user-initiated changes via the
 *    control panel or API. Only user-initiated changes are persisted.
 *  - _hasUserBackgroundColor tracks whether the user explicitly chose a
 *    background color; when false, _resolve() computes and stores the
 *    theme-appropriate default so the color picker always shows a real color.
 */
export class ColorPrefManager extends PreferenceManager<StoredColorPrefs> {
  private readonly _paraState: ParaState;
  private readonly _mql = new Map<string, MediaQueryList>();
  private readonly _mqlHandlers = new Map<string, (e: MediaQueryListEvent) => void>();
  private readonly _settingObservers: Array<{ path: string; fn: (o: Setting, n: Setting) => void }> = [];
  private _unregisterConfigReset?: () => void;

  /** True while the manager itself is updating config — suppresses localStorage writes in observers. */
  private _programmaticUpdate = false;


  constructor(paraState: ParaState) {
    super(COLOR_PREFS_KEY);
    this._paraState = paraState;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  init(): void {
    this._setupListeners();
    this._registerSettingObservers();
    this._unregisterConfigReset = this._paraState.onConfigReset(() => this._loadAndApply());
    this._loadAndApply();
  }

  destroy(): void {
    this._unregisterConfigReset?.();
    for (const [key, mql] of this._mql.entries()) {
      const handler = this._mqlHandlers.get(key)!;
      mql.removeEventListener('change', handler);
    }
    this._mql.clear();
    this._mqlHandlers.clear();

    for (const { path, fn } of this._settingObservers) {
      this._paraState.unobserveSetting(path, fn);
    }
    this._settingObservers.length = 0;
  }

  // -------------------------------------------------------------------------
  // Mode-driven default changes (no-op when user has explicitly chosen)
  // -------------------------------------------------------------------------

  /**
   * Apply a mode default (e.g. low-vision dark default).
   * No-op if the user has already made an explicit choice (source === 'user').
   */
  setModeDefault(field: 'themeMode', value: 'dark' | 'light'): void {
    if (this._paraState.config.color.themeSource === 'user') return;
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      if (field === 'themeMode') {
        draft.color.themeMode = value;
        draft.color.themeSource = 'modeDefault';
      }
    });
    this._programmaticUpdate = false;
    this._resolve();
  }

  /**
   * Clear a mode default, restoring to system/default behaviour.
   * No-op if the user has made an explicit choice, or no mode default is active.
   */
  clearModeDefault(field: 'themeMode'): void {
    if (this._paraState.config.color.themeSource === 'user') return;
    if (this._paraState.config.color.themeSource !== 'modeDefault') return;
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      if (field === 'themeMode') {
        draft.color.themeMode = 'system';
        draft.color.themeSource = 'default';
      }
    });
    this._programmaticUpdate = false;
    this._resolve();
  }

  // -------------------------------------------------------------------------
  // System state query (used by _rootClasses in paraview)
  // -------------------------------------------------------------------------

  getSystemState(): SystemColorState {
    return {
      prefersDark:          this._mql.get('dark')?.matches            ?? false,
      prefersMore:          this._mql.get('contrast-more')?.matches   ?? false,
      prefersLess:          this._mql.get('contrast-less')?.matches   ?? false,
      forcedColorsActive:   this._mql.get('forced-colors')?.matches   ?? false,
      invertedColorsActive: this._mql.get('inverted-colors')?.matches ?? false,
    };
  }

  // -------------------------------------------------------------------------
  // Private — matchMedia setup
  // -------------------------------------------------------------------------

  private _setupListeners(): void {
    const queries: [string, string][] = [
      ['dark',            '(prefers-color-scheme: dark)'],
      ['contrast-more',   '(prefers-contrast: more)'],
      ['contrast-less',   '(prefers-contrast: less)'],
      ['forced-colors',   '(forced-colors: active)'],
      ['inverted-colors', '(inverted-colors: inverted)'],
    ];
    for (const [key, query] of queries) {
      const mql = matchMedia(query);
      this._mql.set(key, mql);
      const handler = () => this._onSystemChange();
      this._mqlHandlers.set(key, handler);
      mql.addEventListener('change', handler);
    }
  }

  private _onSystemChange(): void {
    // Charts using 'system' settings update live.
    // Charts with explicit user preferences are unaffected because
    // _resolve reads themeMode/contrastMode from config, not system state directly.
    this._resolve();
  }

  // -------------------------------------------------------------------------
  // Private — setting observers (persist user changes, update source tracking)
  // -------------------------------------------------------------------------

  private _registerSettingObservers(): void {
    const themeFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) {
        this._resolve();
        return;
      }
      // User-initiated change (control panel or API) — persist and mark source.
      this.save({ theme: newVal as ThemeMode });
      this._programmaticUpdate = true;
      this._paraState.updateConfig(draft => {
        draft.color.themeSource = (newVal === 'system' ? 'system' : 'user') as ColorPrefSource;
      });
      this._programmaticUpdate = false;
      this._resolve();
    };

    const contrastFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) {
        this._resolve();
        return;
      }
      this.save({ contrast: newVal as ContrastMode });
      this._programmaticUpdate = true;
      this._paraState.updateConfig(draft => {
        draft.color.contrastSource = (newVal === 'system' ? 'system' : 'user') as ColorPrefSource;
      });
      this._programmaticUpdate = false;
      this._resolve();
    };

    const bgLightFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) return;
      this.save({ backgroundColorLight: newVal as string });
      this._resolve();
    };

    const bgDarkFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) return;
      this.save({ backgroundColorDark: newVal as string });
      this._resolve();
    };

    this._paraState.observeSetting('color.themeMode',            themeFn);
    this._paraState.observeSetting('color.contrastMode',         contrastFn);
    this._paraState.observeSetting('color.backgroundColorLight', bgLightFn);
    this._paraState.observeSetting('color.backgroundColorDark',  bgDarkFn);
    this._settingObservers.push(
      { path: 'color.themeMode',            fn: themeFn },
      { path: 'color.contrastMode',         fn: contrastFn },
      { path: 'color.backgroundColorLight', fn: bgLightFn },
      { path: 'color.backgroundColorDark',  fn: bgDarkFn },
    );
  }

  // -------------------------------------------------------------------------
  // Private — load prefs from localStorage and apply to config
  // -------------------------------------------------------------------------

  private _loadAndApply(): void {
    const prefs = this.load();
    const hasPrefs = prefs.theme !== undefined || prefs.contrast !== undefined
      || prefs.forcedColors !== undefined || prefs.invertedColors !== undefined
      || prefs.backgroundColorLight !== undefined || prefs.backgroundColorDark !== undefined;

    if (hasPrefs) {
      // ignoreObservers = true: loading is not a user action; observers must not persist again.
      this._paraState.updateConfig(draft => {
        if (prefs.theme !== undefined) {
          draft.color.themeMode   = prefs.theme;
          draft.color.themeSource = (prefs.theme === 'system' ? 'system' : 'user') as ColorPrefSource;
        }
        if (prefs.contrast !== undefined) {
          draft.color.contrastMode   = prefs.contrast;
          draft.color.contrastSource = (prefs.contrast === 'system' ? 'system' : 'user') as ColorPrefSource;
          if (prefs.contrast === 'custom' && prefs.contrastLevel !== undefined) {
            draft.color.contrastLevel = prefs.contrastLevel;
          }
        }
        if (prefs.forcedColors !== undefined)        draft.color.forcedColorsMode      = prefs.forcedColors;
        if (prefs.invertedColors !== undefined)      draft.color.invertedColorsMode    = prefs.invertedColors;
        if (prefs.backgroundColorLight !== undefined) draft.color.backgroundColorLight = prefs.backgroundColorLight;
        if (prefs.backgroundColorDark  !== undefined) draft.color.backgroundColorDark  = prefs.backgroundColorDark;
      }, true /* ignoreObservers */);
    }

    this._resolve();
  }

  // -------------------------------------------------------------------------
  // Private — resolve preference chain → rendered config values
  // -------------------------------------------------------------------------

  private _resolve(): void {
    const color = this._paraState.config.color;
    const sys   = this.getSystemState();

    // forced-colors takes absolute priority over theme and contrast choices.
    // When active and the user has not opted out, defer colour decisions to the OS.
    // Rendering changes are handled via the 'forced-colors' root class in
    // paraview._rootClasses(); we only set isDarkModeEnabled = false here so
    // the paraview does not additionally apply its own dark-mode colour overrides.
    if (sys.forcedColorsActive && color.forcedColorsMode === 'system') {
      this._programmaticUpdate = true;
      this._paraState.updateConfig(draft => { draft.color.isDarkModeEnabled = false; });
      this._programmaticUpdate = false;
      return;
    }

    // Theme resolution
    let resolvedDark: boolean;
    switch (color.themeMode) {
      case 'dark':   resolvedDark = true;            break;
      case 'light':  resolvedDark = false;           break;
      case 'system': resolvedDark = sys.prefersDark; break;
    }

    // Contrast resolution
    let resolvedLevel: number;
    switch (color.contrastMode) {
      case 'higher':
      case 'lower':
      case 'normal':
        resolvedLevel = CONTRAST_VALUES[color.contrastMode];
        break;
      case 'custom':
        resolvedLevel = color.contrastLevel; // slider-controlled; leave unchanged
        break;
      case 'system':
        if (sys.prefersMore)      resolvedLevel = CONTRAST_VALUES.higher;
        else if (sys.prefersLess) resolvedLevel = CONTRAST_VALUES.lower;
        else                      resolvedLevel = CONTRAST_VALUES.normal;
        break;
    }

    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      draft.color.isDarkModeEnabled = resolvedDark!;
      draft.color.contrastLevel     = resolvedLevel!;
      // Pick the user-chosen color for the active mode, falling back to the
      // theme-appropriate computed default. Reading from config lets the API
      // and manifest set these directly, with user prefs loaded on top.
      draft.color.backgroundColor = resolvedDark!
        ? (color.backgroundColorDark  || this._computeBackgroundOklch(true,  resolvedLevel!))
        : (color.backgroundColorLight || 'oklch(1 0 0)');
    });
    this._programmaticUpdate = false;
  }

  // Compute the theme-appropriate background as an oklch() CSS string.
  // The dark formula matches the HSL value used in paraview._rootStyle() before
  // backgroundColor was made configurable; converting via hexToOklch preserves
  // the exact shade while storing a perceptually uniform representation.
  private _computeBackgroundOklch(isDark: boolean, contrastLevel: number): string {
    if (!isDark) return 'oklch(1 0 0)';
    const L = Math.max(0, (100 - contrastLevel * 50) / 5 - 10);
    const v = Math.round(L / 100 * 255);
    const hexGray = v.toString(16).padStart(2, '0');
    return formatOklch(hexToOklch(`#${hexGray}${hexGray}${hexGray}`));
  }
}
