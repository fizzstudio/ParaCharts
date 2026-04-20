import { describe, expect, it } from 'vitest';

import { SignalManager } from '../../../../lib/view/signals';

describe('SignalManager', () => {
  it('resolves a pending signal when fired', async () => {
    const manager = new SignalManager();
    const pending = manager.pending('ready');

    manager.signal('ready', { ok: true });

    await expect(pending).resolves.toEqual({ ok: true });
  });

  it('resolves multiple pending signals into a keyed object', async () => {
    const manager = new SignalManager();
    const pending = manager.pending('alpha', 'beta');

    manager.signal('alpha', 1);
    manager.signal('beta', 2);

    await expect(pending).resolves.toEqual({ alpha: 1, beta: 2 });
  });

  it('resolves pendingAny with the first signal result', async () => {
    const manager = new SignalManager();
    const pending = manager.pendingAny('slow', 'fast');

    manager.signal('fast', 'done');

    await expect(pending).resolves.toBe('done');
  });

  it('supports firing before awaiting', async () => {
    const manager = new SignalManager();

    manager.signal('prefired', 'value');

    await expect(manager.pending('prefired')).resolves.toBe('value');
  });

  it('drops cleared signals so a new pending waits for a fresh fire', async () => {
    const manager = new SignalManager();

    manager.signal('stale', 'old');
    manager.clear('stale');

    const pending = manager.pending('stale');
    manager.signal('stale', 'new');

    await expect(pending).resolves.toBe('new');
  });
});
