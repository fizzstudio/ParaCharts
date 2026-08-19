import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../lib/index';

const manifest = '/node_modules/@fizz/chart-data/data/manifests/autogen/line-multi/line-multi-manifest-16.json';

describe('ParaChart polling lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('starts after loading and stops when disconnected', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(101 as never);
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
    const chart = document.createElement('para-chart');
    chart.manifest = manifest;
    chart.pollInterval = 5;

    document.body.append(chart);
    await chart.loaded;
    await chart.paraView.jimReady();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    chart.remove();
    expect(clearIntervalSpy).toHaveBeenCalledWith(101);
  });

  it('restarts once on reconnect and when the interval changes', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
      .mockReturnValueOnce(101 as never)
      .mockReturnValueOnce(102 as never)
      .mockReturnValueOnce(103 as never);
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
    const chart = document.createElement('para-chart');
    chart.manifest = manifest;
    chart.pollInterval = 5;

    document.body.append(chart);
    await chart.loaded;
    await chart.paraView.jimReady();
    chart.remove();
    document.body.append(chart);

    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(clearIntervalSpy).toHaveBeenCalledWith(101);

    chart.pollInterval = 10;
    await chart.updateComplete;
    expect(clearIntervalSpy).toHaveBeenCalledWith(102);
    expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 10000);

    chart.pollInterval = 0;
    await chart.updateComplete;
    expect(clearIntervalSpy).toHaveBeenCalledWith(103);
    expect(setIntervalSpy).toHaveBeenCalledTimes(3);
  });
});
