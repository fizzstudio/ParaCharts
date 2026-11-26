// FONT UNIFICATION (Plan A): the chart and caption font dropdowns are defined
// in JSON config, which can't import lib/common/fonts.ts. These tests keep
// both lists identical to FONT_FAMILIES, so every offered family has a stack
// and chart and caption text offer the same choices.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FONT_FAMILIES, fontStack, primaryFamily } from '../../../lib/common/fonts';

const CONFIG_DIR = resolve(__dirname, '../../../lib/config');

function fontFamilySetting(file: string) {
  const json = JSON.parse(readFileSync(resolve(CONFIG_DIR, file), 'utf-8'));
  return json.settings.fontFamily;
}

describe('font family options', () => {
  for (const file of ['chart/index.json', 'controlPanel/caption.json']) {
    it(`${file} offers exactly FONT_FAMILIES, in order`, () => {
      expect(fontFamilySetting(file).controlOptions.options).toEqual(FONT_FAMILIES);
    });
    it(`${file} default is one of FONT_FAMILIES`, () => {
      expect(FONT_FAMILIES).toContain(fontFamilySetting(file).default);
    });
  }
});

describe('fontStack', () => {
  it('ends every known stack with a generic family', () => {
    for (const family of FONT_FAMILIES) {
      expect(fontStack(family)).toMatch(/, (sans-serif|serif|monospace|cursive)$/);
    }
  });
  it('gives the default its own fallback (was "Atkinson Hyperlegible,undefined")', () => {
    expect(fontStack('Atkinson Hyperlegible')).toBe('"Atkinson Hyperlegible", sans-serif');
  });
  it('quotes an unknown family and adds a fallback', () => {
    expect(fontStack('Fira Sans')).toBe('"Fira Sans", sans-serif');
  });
});

describe('primaryFamily', () => {
  it('returns the first family of the stack, unquoted', () => {
    expect(primaryFamily('Comic Sans')).toBe('Comic Sans MS');
    expect(primaryFamily('Atkinson Hyperlegible')).toBe('Atkinson Hyperlegible');
    expect(primaryFamily('Fira Sans')).toBe('Fira Sans');
  });
});
