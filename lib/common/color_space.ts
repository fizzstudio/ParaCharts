/**
 * Perceptual color space utilities — hex ↔ OKLCH.
 *
 * Uses Björn Ottosson's OKLab/OKLCH formulas (2020).
 * OKLCH is supported natively in CSS: oklch(L C H)
 *   L  — perceived lightness 0–1
 *   C  — chroma (colorfulness), typically 0–0.4
 *   H  — hue angle in degrees 0–360
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function gammaToLinear(x: number): number {
  return x <= 0.04045
    ? x / 12.92
    : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToGamma(x: number): number {
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * x ** (1 / 2.4) - 0.055;
}

function linearSrgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Convert a 6-digit hex color (#rrggbb) to OKLCH. */
export function hexToOklch(hex: string): Oklch {
  const h = hex.replace('#', '');
  const r = gammaToLinear(parseInt(h.slice(0, 2), 16) / 255);
  const g = gammaToLinear(parseInt(h.slice(2, 4), 16) / 255);
  const b = gammaToLinear(parseInt(h.slice(4, 6), 16) / 255);
  const [L, a, ob] = linearSrgbToOklab(r, g, b);
  const c = Math.sqrt(a * a + ob * ob);
  const hDeg = ((Math.atan2(ob, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h: hDeg };
}

/** Convert OKLCH to a 6-digit hex color string. Out-of-gamut sRGB values are clamped. */
export function oklchToHex({ l, c, h }: Oklch): string {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const [r, g, ob] = oklabToLinearSrgb(l, a, b);
  const channel = (x: number) =>
    Math.round(Math.max(0, Math.min(1, linearToGamma(x))) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(ob)}`;
}

/** Serialize an Oklch object to a CSS oklch() string. */
export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;
}

/**
 * Parse a CSS oklch() string back to an Oklch object.
 * Returns null if the string is not a recognizable oklch() value.
 */
export function parseOklch(css: string): Oklch | null {
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!m) return null;
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) };
}
