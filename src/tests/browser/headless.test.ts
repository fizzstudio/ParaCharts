import { afterEach, describe, expect, test } from 'vitest';
import { buildManifestFromCsv, ParaHeadless } from '../../../lib';

const manifest = buildManifestFromCsv({
  csvText: 'Category,Value\nA,1\nB,2',
  chartType: 'vertical_bar',
  chartTitle: 'Headless tactile chart',
  xAxis: {
    variableType: 'string',
    title: 'Category',
  },
  yAxis: {
    title: 'Value',
  },
});

describe('ParaHeadless render options', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('applies tactile mode and paper size before serialization', async () => {
    const headless = new ParaHeadless();
    await headless.ready();

    const result = await headless.loadManifest(
      JSON.stringify(manifest),
      'content',
      {
        isTactileEnabled: true,
        pageSize: 'letter_landscape',
      },
    );

    expect(result).toEqual({ success: true });
    await headless.jimReady;
    expect(headless.api.getConfigSettings([
      'chart.isTactileEnabled',
      'chart.pageSize',
    ])).toEqual({
      'chart.isTactileEnabled': true,
      'chart.pageSize': 'letter_landscape',
    });

    const svg = headless.api.serializeChart();
    expect(svg).toContain('viewBox="0 0 1056 816"');
    expect(svg).toContain('font-family: &quot;Braille36 US&quot;');
  });
});
