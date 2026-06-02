import { Logger, getLogger } from '@fizz/logger';
import { type ParaState } from './parastate';
import { type Setting } from '.';
import { type ColorPrefSource } from '../config/config_types';
import { hexToOklch, formatOklch } from '../common/color_space';
import {
  cssColorToHex, checkContrast,
  type ContrastWarning, type ContrastRole,
} from '../common/contrast';

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
  /** Low-vision mode default preferences (what gets applied when low-vision mode is enabled). */
  lowVisionThemeDefault?: 'system' | 'light' | 'dark';
  lowVisionContrastDefault?: ContrastMode;
  lowVisionContrastLevel?: number;
  lowVisionColorPalette?: boolean;
  lowVisionFontScale?: number;
  lowVisionIsVertGridlines?: boolean;
  lowVisionDisableAnimations?: boolean;
  lowVisionIsFullscreen?: boolean;
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
  private readonly _log: Logger = getLogger('ColorPrefManager');

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
   * No-op if the user has already made an explicit choice (source === 'user'),
   * unless force=true (used by low-vision mode, which has its own user-configured default).
   */
  setModeDefault(field: 'themeMode', value: 'dark' | 'light', force = false): void {
    if (!force && this._paraState.config.color.themeSource === 'user') return;
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

  /** Restore theme to a previously-saved mode+source pair (used by low-vision mode on disable). */
  restoreTheme(mode: ThemeMode, source: ColorPrefSource): void {
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      draft.color.themeMode   = mode;
      draft.color.themeSource = source;
    });
    this._programmaticUpdate = false;
    this._resolve();
  }

  /**
   * Apply a contrast mode default (e.g. low-vision higher-contrast default).
   * No-op if the user has already made an explicit contrast choice (source === 'user'),
   * unless force=true (used by low-vision mode, which has its own user-configured default).
   */
  setContrastModeDefault(mode: ContrastMode, level?: number, force = false): void {
    if (!force && this._paraState.config.color.contrastSource === 'user') return;
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      draft.color.contrastMode = mode;
      draft.color.contrastSource = 'modeDefault' as ColorPrefSource;
      if (mode === 'custom' && level !== undefined) {
        draft.color.contrastLevel = level;
      }
    });
    this._programmaticUpdate = false;
    this._resolve();
  }

  /**
   * Clear the contrast mode default, restoring to system/default behaviour.
   * No-op if the user has an explicit choice, or no mode default is active.
   */
  clearContrastModeDefault(): void {
    if (this._paraState.config.color.contrastSource === 'user') return;
    if (this._paraState.config.color.contrastSource !== 'modeDefault') return;
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      draft.color.contrastMode = 'system';
      draft.color.contrastSource = 'default' as ColorPrefSource;
    });
    this._programmaticUpdate = false;
    this._resolve();
  }

  /** Restore contrast to a previously-saved mode+source pair (used by low-vision mode on disable). */
  restoreContrast(mode: ContrastMode, level: number, source: ColorPrefSource): void {
    this._programmaticUpdate = true;
    this._paraState.updateConfig(draft => {
      draft.color.contrastMode   = mode;
      draft.color.contrastLevel  = level;
      draft.color.contrastSource = source;
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

    const lvThemeFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) return;
      this.save({ lowVisionThemeDefault: newVal as ThemeMode });
      if (this._paraState.config.ui.isLowVisionModeEnabled) {
        if (newVal !== 'system') {
          this.setModeDefault('themeMode', newVal as 'dark' | 'light', true);
        } else {
          this.clearModeDefault('themeMode');
        }
      }
    };

    const lvContrastFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) return;
      this.save({ lowVisionContrastDefault: newVal as ContrastMode });
      if (this._paraState.config.ui.isLowVisionModeEnabled) {
        this.setContrastModeDefault(
          newVal as ContrastMode,
          this._paraState.config.color.lowVisionContrastLevel as number,
          true,
        );
      }
    };

    const lvContrastLevelFn = (_old: Setting, newVal: Setting) => {
      if (this._programmaticUpdate) return;
      this.save({ lowVisionContrastLevel: newVal as number });
      if (this._paraState.config.ui.isLowVisionModeEnabled
        && this._paraState.config.color.lowVisionContrastDefault === 'custom') {
        this.setContrastModeDefault('custom', newVal as number);
      }
    };

    const lvColorPaletteFn = (_old: Setting, newVal: Setting) => { if (!this._programmaticUpdate) this.save({ lowVisionColorPalette:    newVal as boolean }); };
    const lvFontScaleFn    = (_old: Setting, newVal: Setting) => { if (!this._programmaticUpdate) this.save({ lowVisionFontScale:        newVal as number  }); };
    const lvVertGridFn     = (_old: Setting, newVal: Setting) => { if (!this._programmaticUpdate) this.save({ lowVisionIsVertGridlines:  newVal as boolean }); };
    const lvAnimFn         = (_old: Setting, newVal: Setting) => { if (!this._programmaticUpdate) this.save({ lowVisionDisableAnimations: newVal as boolean }); };
    const lvFullscreenFn   = (_old: Setting, newVal: Setting) => { if (!this._programmaticUpdate) this.save({ lowVisionIsFullscreen:     newVal as boolean }); };

    this._paraState.observeSetting('color.themeMode',                themeFn);
    this._paraState.observeSetting('color.contrastMode',             contrastFn);
    this._paraState.observeSetting('color.backgroundColorLight',     bgLightFn);
    this._paraState.observeSetting('color.backgroundColorDark',      bgDarkFn);
    this._paraState.observeSetting('color.lowVisionThemeDefault',    lvThemeFn);
    this._paraState.observeSetting('color.lowVisionContrastDefault', lvContrastFn);
    this._paraState.observeSetting('color.lowVisionContrastLevel',   lvContrastLevelFn);
    this._paraState.observeSetting('color.lowVisionColorPalette',    lvColorPaletteFn);
    this._paraState.observeSetting('ui.lowVisionFontScale',          lvFontScaleFn);
    this._paraState.observeSetting('ui.lowVisionIsVertGridlines',    lvVertGridFn);
    this._paraState.observeSetting('ui.lowVisionDisableAnimations',  lvAnimFn);
    this._paraState.observeSetting('ui.lowVisionIsFullscreen',       lvFullscreenFn);
    this._settingObservers.push(
      { path: 'color.themeMode',                fn: themeFn },
      { path: 'color.contrastMode',             fn: contrastFn },
      { path: 'color.backgroundColorLight',     fn: bgLightFn },
      { path: 'color.backgroundColorDark',      fn: bgDarkFn },
      { path: 'color.lowVisionThemeDefault',    fn: lvThemeFn },
      { path: 'color.lowVisionContrastDefault', fn: lvContrastFn },
      { path: 'color.lowVisionContrastLevel',   fn: lvContrastLevelFn },
      { path: 'color.lowVisionColorPalette',    fn: lvColorPaletteFn },
      { path: 'ui.lowVisionFontScale',          fn: lvFontScaleFn },
      { path: 'ui.lowVisionIsVertGridlines',    fn: lvVertGridFn },
      { path: 'ui.lowVisionDisableAnimations',  fn: lvAnimFn },
      { path: 'ui.lowVisionIsFullscreen',       fn: lvFullscreenFn },
    );
  }

  // -------------------------------------------------------------------------
  // Private — load prefs from localStorage and apply to config
  // -------------------------------------------------------------------------

  private _loadAndApply(): void {
    const prefs = this.load();
    const hasPrefs = prefs.theme !== undefined || prefs.contrast !== undefined
      || prefs.forcedColors !== undefined || prefs.invertedColors !== undefined
      || prefs.backgroundColorLight !== undefined || prefs.backgroundColorDark !== undefined
      || prefs.lowVisionThemeDefault !== undefined || prefs.lowVisionContrastDefault !== undefined
      || prefs.lowVisionContrastLevel !== undefined || prefs.lowVisionColorPalette !== undefined
      || prefs.lowVisionFontScale !== undefined || prefs.lowVisionIsVertGridlines !== undefined
      || prefs.lowVisionDisableAnimations !== undefined || prefs.lowVisionIsFullscreen !== undefined;

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
        if (prefs.forcedColors !== undefined)         draft.color.forcedColorsMode         = prefs.forcedColors;
        if (prefs.invertedColors !== undefined)       draft.color.invertedColorsMode       = prefs.invertedColors;
        if (prefs.backgroundColorLight !== undefined) draft.color.backgroundColorLight      = prefs.backgroundColorLight;
        if (prefs.backgroundColorDark  !== undefined) draft.color.backgroundColorDark       = prefs.backgroundColorDark;
        if (prefs.lowVisionThemeDefault !== undefined)    draft.color.lowVisionThemeDefault    = prefs.lowVisionThemeDefault;
        if (prefs.lowVisionContrastDefault !== undefined) draft.color.lowVisionContrastDefault = prefs.lowVisionContrastDefault;
        if (prefs.lowVisionContrastLevel !== undefined)   draft.color.lowVisionContrastLevel   = prefs.lowVisionContrastLevel;
        if (prefs.lowVisionColorPalette !== undefined)    draft.color.lowVisionColorPalette    = prefs.lowVisionColorPalette;
        if (prefs.lowVisionFontScale !== undefined)       draft.ui.lowVisionFontScale          = prefs.lowVisionFontScale;
        if (prefs.lowVisionIsVertGridlines !== undefined) draft.ui.lowVisionIsVertGridlines    = prefs.lowVisionIsVertGridlines;
        if (prefs.lowVisionDisableAnimations !== undefined) draft.ui.lowVisionDisableAnimations = prefs.lowVisionDisableAnimations;
        if (prefs.lowVisionIsFullscreen !== undefined)    draft.ui.lowVisionIsFullscreen       = prefs.lowVisionIsFullscreen;
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
      this._paraState.updateContrastWarnings([]);
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

    this._paraState.updateContrastWarnings(this._checkContrast());
  }

  // -------------------------------------------------------------------------
  // Private — contrast checking
  // -------------------------------------------------------------------------

  /**
   * Check WCAG and APCA contrast for key foreground colors against the resolved
   * background. Returns one ContrastWarning per failing pair.
   *
   * Skips the check when forced-colors is active — the OS manages contrast.
   */
  private _checkContrast(): ContrastWarning[] {
    const color = this._paraState.config.color;

    // Skip entirely under forced-colors (OS controls rendering).
    const sys = this.getSystemState();
    if (sys.forcedColorsActive && color.forcedColorsMode === 'system') return [];

    const bgRaw = color.backgroundColor;
    if (!bgRaw) return [];

    const bgHex = cssColorToHex(bgRaw);
    if (!bgHex) return [];

    // Compute the label/axis color using the same formula as paraview._rootStyle().
    const pct = color.contrastLevel * 50;
    const labelLightness = color.isDarkModeEnabled ? 50 + pct : 50 - pct;
    const labelHsl = `hsl(0,0%,${labelLightness}%)`;

    // Static foreground colors: gridline and visited default.
    const GRIDLINE_COLOR = 'hsl(270,50%,50%)';
    const VISITED_COLOR  = '#ff0000';  // CSS default for --visited-color

    // Collect checks: [role, fg CSS string, wcagTarget, apcaRole]
    const checks: Array<[ContrastRole, string, 'text' | 'non-text', 'body' | 'spot']> = [
      ['label',    labelHsl,        'text',     'body'],
      ['axis',     labelHsl,        'text',     'body'],
      ['gridline', GRIDLINE_COLOR,  'non-text', 'spot'],
      ['visited',  VISITED_COLOR,   'non-text', 'spot'],
    ];

    const warnings: ContrastWarning[] = [];

    for (const [role, fgCss, wcagTarget, apcaRole] of checks) {
      const fgHex = cssColorToHex(fgCss);
      if (!fgHex) continue;

      const result = checkContrast(fgHex, bgHex, wcagTarget, apcaRole);
      if (!result.wcag.AA || !result.apca.pass) {
        warnings.push({ role, fg: fgHex, bg: bgHex, result });
        this._log.warn(
          `Contrast warning [${role}]: fg=${fgCss} bg=${bgRaw} ` +
          `WCAG ${result.wcag.ratio.toFixed(2)}:1 (AA ${result.wcag.AA ? 'pass' : 'FAIL'}) ` +
          `APCA Lc${result.apca.lc.toFixed(1)} (${result.apca.pass ? 'pass' : 'FAIL'})`
        );
      }
    }

    // Check first 6 series palette colors separately to capture index + name.
    const paletteColors = this._paraState.colors;
    if (paletteColors) {
      const paletteSize = Math.min(6, paletteColors.palette?.colors?.length ?? 0);
      for (let i = 0; i < paletteSize; i++) {
        const fgCss = paletteColors.colorValueAt(i);
        const fgHex = cssColorToHex(fgCss);
        if (!fgHex) continue;

        const result = checkContrast(fgHex, bgHex, 'non-text', 'spot');
        if (!result.wcag.AA || !result.apca.pass) {
          const seriesName = paletteColors.palette.colors[i]?.name;
          warnings.push({ role: 'series', fg: fgHex, bg: bgHex, result, seriesIndex: i, seriesName });
          this._log.warn(
            `Contrast warning [series]: fg=${fgCss} bg=${bgRaw} ` +
            `WCAG ${result.wcag.ratio.toFixed(2)}:1 (AA ${result.wcag.AA ? 'pass' : 'FAIL'}) ` +
            `APCA Lc${result.apca.lc.toFixed(1)} (${result.apca.pass ? 'pass' : 'FAIL'})`
          );
        }
      }
    }

    return warnings;
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
