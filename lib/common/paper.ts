
export const MM_PER_INCH = 25.4;
export const CSS_DPI = 96;
export const BANA_MARGIN_PX = (3 / MM_PER_INCH) * CSS_DPI;   // ≈ 11.34 px (3 mm)

export const PAPER_INFO = {
  auto: {
    label: 'Auto',
    widthMm: 0,
    heightMm: 0
  },
  letter_portrait: {
    label: 'Letter Portrait (8.5×11 in)',
    widthMm: 215.9,
    heightMm: 279.4
  },
  letter_landscape: {
    label: 'Letter Landscape (11×8.5 in)',
    widthMm: 279.4,
    heightMm: 215.9
  },
  tractor_us_standard: {
    label: 'Braille Paper US Portrait (11.5×11 in)',
    widthMm: 292.1,
    heightMm: 279.4
  },
  tractor_us_rotated: {
    label: 'Braille Paper US Landscape (11×11.5 in)',
    widthMm: 279.4,
    heightMm: 292.1
  },
  tractor_de_standard: {
    label: 'Tractor DE Portrait (8.5×12 in)',
    widthMm: 215.9,
    heightMm: 304.8
  },
  tractor_de_rotated: {
    label: 'Tractor DE Landscape (12×8.5 in)',
    widthMm: 304.8,
    heightMm: 215.9
  },
  a4_portrait: {
    label: 'A4',
    widthMm: 210,
    heightMm: 297
  },
  a4_landscape: {
    label: 'A4',
    widthMm: 297,
    heightMm: 210
  },
  tabloid_portrait: {
    label: 'Tabloid (11×17 in)',
    widthMm: 279.4,
    heightMm: 431.8
  },
  tabloid_landscape: {
    label: 'Tabloid (11×17 in)',
    widthMm: 431.8,
    heightMm: 279.4
  },
  monarch_portrait: {
    label: 'Monarch (10×32 cells)',
    widthMm: 100,
    heightMm: 198.4
  },
  monarch_landscape: {
    label: 'Monarch (10×32 cells)',
    widthMm: 198.4,
    heightMm: 100
  }
};