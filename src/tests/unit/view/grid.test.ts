import { describe, expect, it } from 'vitest';

import { roundHundredths } from '../../../../lib/view/layout/grid';

describe('roundHundredths', () => {
  it('rounds binary floating-point noise to two decimal places', () => {
    expect(roundHundredths(1.005)).toBe(1);
    expect(roundHundredths(2.675)).toBe(2.68);
  });

  it('rounds values above and below the hundredth threshold', () => {
    expect(roundHundredths(3.14159)).toBe(3.14);
    expect(roundHundredths(3.145)).toBe(3.15);
  });

  it('preserves sign for negative numbers', () => {
    expect(roundHundredths(-7.894)).toBe(-7.89);
    expect(roundHundredths(-7.895)).toBe(-7.89);
  });
});
