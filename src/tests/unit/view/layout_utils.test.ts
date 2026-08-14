import { describe, it, expect } from 'vitest';
import { computeRowSize, computeColumnSize, type SizeChild } from '../../../../lib/view/layout/layout_utils';

function kids(...dims: [number, number][]): SizeChild[] {
  return dims.map(([paddedWidth, paddedHeight]) => ({ paddedWidth, paddedHeight }));
}

describe('computeRowSize', () => {
  it('sums widths and takes max height for multiple children', () => {
    const [w, h] = computeRowSize(kids([30, 20], [50, 40], [20, 10]), 5);
    // width = 30+50+20 + 5*2 = 110
    // height = max(20,40,10) = 40
    expect(w).toBe(110);
    expect(h).toBe(40);
  });

  it('returns exact dimensions for a single child (no gap applied)', () => {
    const [w, h] = computeRowSize(kids([80, 60]), 10);
    // width = 80 + 10*(1-1) = 80
    // height = 60
    expect(w).toBe(80);
    expect(h).toBe(60);
  });

  it('returns zero size for empty children', () => {
    const [w, h] = computeRowSize([], 8);
    expect(w).toBe(0);
    expect(h).toBe(0);
  });

  it('respects zero gap', () => {
    const [w, h] = computeRowSize(kids([10, 5], [20, 15]), 0);
    expect(w).toBe(30);
    expect(h).toBe(15);
  });
});

describe('computeColumnSize', () => {
  it('takes max width and sums heights for multiple children', () => {
    const [w, h] = computeColumnSize(kids([30, 20], [50, 40], [20, 10]), 5);
    // width = max(30,50,20) = 50
    // height = 20+40+10 + 5*2 = 80
    expect(w).toBe(50);
    expect(h).toBe(80);
  });

  it('returns exact dimensions for a single child (no gap applied)', () => {
    const [w, h] = computeColumnSize(kids([80, 60]), 10);
    // width = 80
    // height = 60 + 10*(1-1) = 60
    expect(w).toBe(80);
    expect(h).toBe(60);
  });

  it('returns zero size for empty children', () => {
    const [w, h] = computeColumnSize([], 8);
    expect(w).toBe(0);
    expect(h).toBe(0);
  });

  it('respects zero gap', () => {
    const [w, h] = computeColumnSize(kids([10, 5], [20, 15]), 0);
    expect(w).toBe(20);
    expect(h).toBe(20);
  });
});
