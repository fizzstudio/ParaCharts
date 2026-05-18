/**
 * Color contrast utilities — WCAG 2.x and APCA (SA98G).
 *
 * All public functions accept #rrggbb hex strings. Use cssColorToHex() to
 * normalise hsl(), oklch(), or named-color strings before calling them.
 *
 * WCAG 2.x: contrast ratio formula from WCAG 2.1 §1.4.3 / §1.4.6 / §1.4.11.
 *   Reuses gammaToLinear() from color_space.ts (identical sRGB linearization).
 *
 * APCA: SA98G 0.0.98G4g formula by Andrew Somers. Uses a simpler power-only
 *   linearization (x^2.4, not WCAG's piecewise) and polarity-aware exponents.
 *   Returns a signed Lc value; positive = dark-on-light, negative = light-on-dark.
 */

import { gammaToLinear, oklchToHex, parseOklch } from './color_space';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContrastResult {
  wcag: { ratio: number; AA: boolean; AAA: boolean };
  apca: { lc: number; pass: boolean };
}

export type ContrastRole = 'label' | 'axis' | 'gridline' | 'series' | 'visited';

export interface ContrastWarning {
  role: ContrastRole;
  fg: string;         // #rrggbb
  bg: string;         // #rrggbb
  result: ContrastResult;
  seriesIndex?: number;  // set when role === 'series'
  seriesName?: string;   // set when role === 'series' (palette color name)
}

// ---------------------------------------------------------------------------
// CSS color → hex
// ---------------------------------------------------------------------------

const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red:   '#ff0000',
  gray:  '#808080',
};

/** Parse hsl(H, S%, L%) or hsl(H S% L%) → #rrggbb. */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
      .toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Convert a CSS color string to #rrggbb hex.
 * Handles: #rrggbb, hsl(...) with commas or spaces, oklch(...), and a small
 * named-color table. Returns null for unrecognised formats.
 */
export function cssColorToHex(color: string): string | null {
  const s = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (s in NAMED) return NAMED[s];

  // hsl(H, S%, L%) or hsl(H S% L%)
  const hslM = s.match(/^hsl\(\s*([\d.]+)[,\s]\s*([\d.]+)%[,\s]\s*([\d.]+)%\s*\)$/);
  if (hslM) return hslToHex(+hslM[1], +hslM[2], +hslM[3]);

  // oklch(L C H)
  const oklch = parseOklch(s);
  if (oklch) return oklchToHex(oklch);

  return null;
}

// ---------------------------------------------------------------------------
// WCAG 2.x — relative luminance and contrast ratio
// ---------------------------------------------------------------------------

/**
 * WCAG 2.x relative luminance (0–1).
 * Uses the standard sRGB piecewise linearization via gammaToLinear().
 */
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = gammaToLinear(parseInt(h.slice(0, 2), 16) / 255);
  const g = gammaToLinear(parseInt(h.slice(2, 4), 16) / 255);
  const b = gammaToLinear(parseInt(h.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio (1–21). fg and bg are #rrggbb hex strings. */
export function wcagContrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.x pass/fail thresholds.
 *   'text'      — SC 1.4.3: AA 4.5:1, AAA 7:1
 *   'large-text'— SC 1.4.3: AA 3:1,   AAA 4.5:1  (18pt / 14pt bold)
 *   'non-text'  — SC 1.4.11: AA 3:1   (no AAA threshold defined)
 */
export function wcagPassFail(
  ratio: number,
  target: 'text' | 'large-text' | 'non-text' = 'text',
): { AA: boolean; AAA: boolean } {
  switch (target) {
    case 'text':       return { AA: ratio >= 4.5, AAA: ratio >= 7.0 };
    case 'large-text': return { AA: ratio >= 3.0, AAA: ratio >= 4.5 };
    case 'non-text':   return { AA: ratio >= 3.0, AAA: ratio >= 3.0 };
  }
}

// ---------------------------------------------------------------------------
// APCA (SA98G 0.0.98G4g) — perceptual contrast
// ---------------------------------------------------------------------------

// Linearization uses a simple power curve (x^2.4), not WCAG's piecewise.
function _apcaY(hex: string): number {
  const h = hex.replace('#', '');
  const r = (parseInt(h.slice(0, 2), 16) / 255) ** 2.4;
  const g = (parseInt(h.slice(2, 4), 16) / 255) ** 2.4;
  const b = (parseInt(h.slice(4, 6), 16) / 255) ** 2.4;
  return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
}

/**
 * APCA SA98G contrast value (Lc).
 * Positive Lc: dark text on light background (BoW).
 * Negative Lc: light text on dark background (WoB).
 * Returns 0 when the pair is below the minimum perceptible threshold.
 */
export function apcaContrast(fg: string, bg: string): number {
  const BLK_THRESH = 0.022;
  const BLK_CLAMP  = 1.414;
  const DELTA_MIN  = 0.0005;
  const LO_CLIP    = 0.1;    // applied before ×100 scale

  let Yfg = _apcaY(fg);
  let Ybg = _apcaY(bg);

  // Soft clamp near-black to avoid infinite contrast from pure black.
  if (Yfg < BLK_THRESH) Yfg = Yfg + (BLK_THRESH - Yfg) ** BLK_CLAMP;
  if (Ybg < BLK_THRESH) Ybg = Ybg + (BLK_THRESH - Ybg) ** BLK_CLAMP;

  if (Math.abs(Ybg - Yfg) < DELTA_MIN) return 0;

  let sapc: number;
  if (Ybg >= Yfg) {
    // Normal polarity (BoW): dark text, light background.
    sapc = (Ybg ** 0.56 - Yfg ** 0.57) * 1.14;
  } else {
    // Reverse polarity (WoB): light text, dark background.
    sapc = (Ybg ** 0.65 - Yfg ** 0.62) * 1.14;
  }

  if (Math.abs(sapc) < LO_CLIP) return 0;
  return sapc * 100;
}

/**
 * APCA minimum |Lc| thresholds for readability levels.
 *   'body'  — sustained reading (Lc 60)
 *   'large' — large text / headings (Lc 45)
 *   'spot'  — non-text / decorative elements (Lc 30)
 */
export function apcaPassFail(lc: number, role: 'body' | 'large' | 'spot' = 'body'): boolean {
  const thresholds = { body: 60, large: 45, spot: 30 } as const;
  return Math.abs(lc) >= thresholds[role];
}

// ---------------------------------------------------------------------------
// Combined check
// ---------------------------------------------------------------------------

/**
 * Run WCAG and APCA checks for a foreground/background pair.
 * Both fg and bg must be #rrggbb hex. Use cssColorToHex() to convert first.
 */
export function checkContrast(
  fg: string,
  bg: string,
  wcagTarget: 'text' | 'large-text' | 'non-text' = 'text',
  apcaRole:  'body' | 'large' | 'spot' = 'body',
): ContrastResult {
  const ratio = wcagContrastRatio(fg, bg);
  const lc    = apcaContrast(fg, bg);
  return {
    wcag: { ratio, ...wcagPassFail(ratio, wcagTarget) },
    apca: { lc,    pass: apcaPassFail(lc, apcaRole)  },
  };
}
