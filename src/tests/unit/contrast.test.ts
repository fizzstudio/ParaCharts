import { describe, it, expect } from 'vitest';
import {
  cssColorToHex,
  relativeLuminance,
  wcagContrastRatio,
  wcagPassFail,
  apcaContrast,
  apcaPassFail,
  checkContrast,
} from '../../../lib/common/contrast';

// ---------------------------------------------------------------------------
// cssColorToHex
// ---------------------------------------------------------------------------

describe('cssColorToHex', () => {
  it('passes through #rrggbb unchanged', () => {
    expect(cssColorToHex('#1a2b3c')).toBe('#1a2b3c');
  });

  it('converts named colors', () => {
    expect(cssColorToHex('black')).toBe('#000000');
    expect(cssColorToHex('white')).toBe('#ffffff');
    expect(cssColorToHex('red')).toBe('#ff0000');
  });

  it('converts hsl with commas', () => {
    expect(cssColorToHex('hsl(0, 0%, 0%)')).toBe('#000000');
    expect(cssColorToHex('hsl(0, 0%, 100%)')).toBe('#ffffff');
  });

  it('converts hsl with spaces', () => {
    expect(cssColorToHex('hsl(0 0% 0%)')).toBe('#000000');
    expect(cssColorToHex('hsl(0 0% 100%)')).toBe('#ffffff');
  });

  it('converts oklch strings', () => {
    // oklch(1 0 0) is pure white
    const hex = cssColorToHex('oklch(1 0 0)');
    expect(hex).not.toBeNull();
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('returns null for unrecognised formats', () => {
    expect(cssColorToHex('rgb(0,0,0)')).toBeNull();
    expect(cssColorToHex('not-a-color')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// WCAG relative luminance
// ---------------------------------------------------------------------------

describe('relativeLuminance', () => {
  it('black has luminance 0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('white has luminance 1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('mid-gray has luminance ~0.216', () => {
    // #808080 linearizes to ~0.2159 per WCAG spec
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2159, 2);
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast ratio
// ---------------------------------------------------------------------------

describe('wcagContrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(wcagContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('white on black is 21:1 (symmetric)', () => {
    expect(wcagContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
  });

  it('#595959 on white is ~7:1 (AAA pass)', () => {
    // Published WCAG check: #595959/#ffffff ≈ 7.0
    expect(wcagContrastRatio('#595959', '#ffffff')).toBeGreaterThanOrEqual(7.0);
  });

  it('light gray on white fails AA for normal text (<4.5)', () => {
    // #aaaaaa on white ≈ 2.32:1 — clearly below the 4.5:1 AA threshold
    expect(wcagContrastRatio('#aaaaaa', '#ffffff')).toBeLessThan(4.5);
  });
});

// ---------------------------------------------------------------------------
// WCAG pass/fail thresholds
// ---------------------------------------------------------------------------

describe('wcagPassFail', () => {
  it('text: 4.5 passes AA, fails AAA', () => {
    const r = wcagPassFail(4.5, 'text');
    expect(r.AA).toBe(true);
    expect(r.AAA).toBe(false);
  });

  it('text: 7.0 passes both AA and AAA', () => {
    const r = wcagPassFail(7.0, 'text');
    expect(r.AA).toBe(true);
    expect(r.AAA).toBe(true);
  });

  it('large-text: 3.0 passes AA', () => {
    expect(wcagPassFail(3.0, 'large-text').AA).toBe(true);
  });

  it('non-text: 3.0 passes', () => {
    expect(wcagPassFail(3.0, 'non-text').AA).toBe(true);
  });

  it('non-text: 2.9 fails', () => {
    expect(wcagPassFail(2.9, 'non-text').AA).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// APCA contrast
// ---------------------------------------------------------------------------

describe('apcaContrast', () => {
  it('black on white gives high positive Lc (~106)', () => {
    const lc = apcaContrast('#000000', '#ffffff');
    expect(lc).toBeGreaterThan(100);
  });

  it('white on black gives high negative Lc (~-108)', () => {
    const lc = apcaContrast('#ffffff', '#000000');
    expect(lc).toBeLessThan(-100);
  });

  it('identical colors return 0', () => {
    expect(apcaContrast('#888888', '#888888')).toBe(0);
  });

  it('#777 on white gives Lc > 45 (large text pass)', () => {
    const lc = apcaContrast('#777777', '#ffffff');
    expect(Math.abs(lc)).toBeGreaterThan(45);
  });

  it('#aaaaaa on white gives low Lc (body text fail)', () => {
    const lc = apcaContrast('#aaaaaa', '#ffffff');
    expect(Math.abs(lc)).toBeLessThan(60);
  });
});

// ---------------------------------------------------------------------------
// APCA pass/fail thresholds
// ---------------------------------------------------------------------------

describe('apcaPassFail', () => {
  it('body: |Lc| 60 passes', () => {
    expect(apcaPassFail(60, 'body')).toBe(true);
    expect(apcaPassFail(-60, 'body')).toBe(true);
  });

  it('body: |Lc| 59 fails', () => {
    expect(apcaPassFail(59, 'body')).toBe(false);
  });

  it('large: |Lc| 45 passes', () => {
    expect(apcaPassFail(45, 'large')).toBe(true);
  });

  it('spot: |Lc| 30 passes', () => {
    expect(apcaPassFail(30, 'spot')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Combined checkContrast
// ---------------------------------------------------------------------------

describe('checkContrast', () => {
  it('black/white passes both WCAG AA and APCA body', () => {
    const r = checkContrast('#000000', '#ffffff');
    expect(r.wcag.AA).toBe(true);
    expect(r.wcag.AAA).toBe(true);
    expect(r.apca.pass).toBe(true);
  });

  it('very-low contrast pair fails both', () => {
    // light gray on white
    const r = checkContrast('#dddddd', '#ffffff', 'text', 'body');
    expect(r.wcag.AA).toBe(false);
    expect(r.apca.pass).toBe(false);
  });

  it('returns ratio and Lc values', () => {
    const r = checkContrast('#000000', '#ffffff');
    expect(r.wcag.ratio).toBeGreaterThan(20);
    expect(Math.abs(r.apca.lc)).toBeGreaterThan(100);
  });
});
