import { describe, expect, it } from 'vitest';

import { Collision } from '../../../../lib/view/base_view';

describe('Collision', () => {
  it('reports the shortest positive-x escape when horizontal overlap is smallest', () => {
    const collision = new Collision(3, 1, 5, 10);

    expect(collision.escape()).toEqual({
      dists: [2.001, -8.001, 9.001, -11.001],
      shortest: 0,
    });
    expect(collision.escapeVector()).toEqual({ x: 2.001, y: 0 });
  });

  it('reports the shortest negative-x escape when centers are reversed', () => {
    const collision = new Collision(-4, 1, 6, 12);

    expect(collision.escape()).toEqual({
      dists: [10.001, -2.001, 11.001, -13.001],
      shortest: 1,
    });
    expect(collision.escapeVector()).toEqual({ x: -2.001, y: 0 });
  });

  it('reports a vertical escape when vertical overlap is smaller', () => {
    const collision = new Collision(2, -4, 10, 6);

    expect(collision.escape()).toEqual({
      dists: [8.001, -12.001, 10.001, -2.001],
      shortest: 3,
    });
    expect(collision.escapeVector()).toEqual({ x: 0, y: -2.001 });
  });

  it('prefers vertical escape on ties', () => {
    const collision = new Collision(2, 3, 5, 6);

    expect(collision.escapeVector()).toEqual({ x: 0, y: 3.001 });
  });
});
