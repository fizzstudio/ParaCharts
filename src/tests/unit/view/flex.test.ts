import { describe, expect, it, vi } from 'vitest';

import { RowLayout, ColumnLayout } from '../../../../lib/view/layout/flex';
import type { ViewContext } from '../../../../lib/view/view_context';

function makeCtx(): ViewContext {
  return {
    paraState: {} as any,
    documentView: undefined,
    root: undefined,
    defs: {},
    requestUpdate: vi.fn(),
    ref: vi.fn().mockReturnValue({ value: undefined }),
    createDocumentView: vi.fn(),
    computeViewBox: vi.fn(),
    addDef: vi.fn(),
  };
}

describe('RowLayout', () => {
  it('constructs without error', () => {
    const ctx = makeCtx();
    const row = new RowLayout(ctx, 8, 'start');
    expect(row).toBeDefined();
  });

  it('reports zero size when empty', () => {
    const ctx = makeCtx();
    const row = new RowLayout(ctx, 8, 'start');
    const [w, h] = row.computeSize();
    expect(w).toBe(0);
    expect(h).toBe(0);
  });
});

describe('ColumnLayout', () => {
  it('constructs without error', () => {
    const ctx = makeCtx();
    const col = new ColumnLayout(ctx, 4, 'center');
    expect(col).toBeDefined();
  });

  it('reports zero size when empty', () => {
    const ctx = makeCtx();
    const col = new ColumnLayout(ctx, 4, 'center');
    const [w, h] = col.computeSize();
    expect(w).toBe(0);
    expect(h).toBe(0);
  });
});
