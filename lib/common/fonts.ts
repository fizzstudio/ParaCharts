/**
 * FONT UNIFICATION (Plan A): the single source of truth for the font families
 * ParaCharts offers, and the CSS font stack each one resolves to.
 *
 * Used for both chart text (chart.fontFamily → --chart-font-family, set in
 * parachart.ts) and caption text (controlPanel.caption.fontFamily →
 * --caption-font-family). Before this module, the chart used a separate
 * `fontFamilyClasses` table in ParaView._rootStyle(), which had no entry for
 * its own default (Atkinson Hyperlegible) and so produced
 * `font-family: Atkinson Hyperlegible,undefined`, while captions used
 * CAPTION_FONT_STACKS in caption.ts, with a different font list.
 *
 * The dropdown options in lib/config/chart/index.json (chart.fontFamily) and
 * lib/config/controlPanel/caption.json (controlPanel.caption.fontFamily) must
 * list exactly FONT_FAMILIES, in this order. The JSON can't import this file,
 * so src/tests/unit/fonts.test.ts checks that they match.
 */
export const FONT_STACKS = {
  'Atkinson Hyperlegible': '"Atkinson Hyperlegible", sans-serif',
  'Arial': 'Arial, Helvetica, sans-serif',
  'Helvetica': 'Helvetica, Arial, sans-serif',
  'Verdana': 'Verdana, sans-serif',
  'Tahoma': 'Tahoma, Verdana, sans-serif',
  'Calibri': 'Calibri, Carlito, sans-serif',
  'Times New Roman': '"Times New Roman", Times, serif',
  'Georgia': 'Georgia, serif',
  'Courier': '"Courier New", Courier, monospace',
  'Comic Sans': '"Comic Sans MS", "Comic Sans", "Comic Neue", cursive',
} as const satisfies Record<string, string>;

export type FontFamilyName = keyof typeof FONT_STACKS;

/** The offered families, in dropdown order. */
export const FONT_FAMILIES = Object.keys(FONT_STACKS) as FontFamilyName[];

/**
 * The CSS font stack for a family name. A name that isn't in the list (for
 * example one set directly in an author's config) is quoted and given a
 * generic sans-serif fallback, so the result is always a valid stack.
 */
export function fontStack(family: string): string {
  return (FONT_STACKS as Record<string, string>)[family]
    ?? `"${family.replace(/"/g, '')}", sans-serif`;
}

/**
 * The first (primary) family of a stack, unquoted, for document.fonts.load(),
 * e.g. '"Comic Sans MS", …' → 'Comic Sans MS'.
 */
export function primaryFamily(family: string): string {
  return fontStack(family).split(',')[0].trim().replace(/^"|"$/g, '');
}
