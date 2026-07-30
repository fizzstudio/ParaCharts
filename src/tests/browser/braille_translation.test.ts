import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  buildManifestFromCsv,
  ParaHeadless,
  type BrailleTranslationProvider,
} from '../../../lib';
import { liblouisBrailleProvider } from '../fixtures/liblouis/liblouis-provider';

const manifest = buildManifestFromCsv({
  csvText: 'Region,Population\nNorth,34\nSouth,52\nWest,41',
  chartType: 'vertical_bar',
  chartTitle: 'Population by year',
  xAxis: { variableType: 'string', title: 'Region' },
  yAxis: { title: 'Population' },
});

async function render(
  mode: 'Braille' | 'Latin' | 'Both' | 'None',
  provider?: BrailleTranslationProvider,
  grade: 1 | 2 = 2,
) {
  const headless = new ParaHeadless();
  await headless.ready();
  if (provider) await headless.api.registerBrailleTranslationProvider(provider);
  const result = await headless.loadManifest(JSON.stringify(manifest), 'content', {
    isTactileEnabled: true,
    pageSize: 'letter_landscape',
    tactileBrailleGrade: grade,
    tactileLabelMode: mode,
  });
  if (result.success) await headless.jimReady;
  return { headless, result };
}

function joinedLabelText(document: Document, selector: string): string {
  const label = document.querySelector(selector)!;
  const lines = [...label.querySelectorAll('tspan')]
    .map(line => line.textContent?.trim() ?? '')
    .filter(Boolean);
  return lines.length ? lines.join('⠀') : label.textContent?.trim() ?? '';
}

describe('Braille translation providers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders overlaid source and translated runs in Both mode', async () => {
    const translate = vi.fn(() => '⠿');
    const provider: BrailleTranslationProvider = { ready: async () => {}, translate };
    const { headless, result } = await render('Both', provider);

    expect(result).toEqual({ success: true });
    const document = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    const title = document.querySelector('#chart-title')!;
    const runs = title.querySelectorAll('tspan');
    expect(title.getAttribute('aria-label')).toBe('Population by year');
    expect(runs).toHaveLength(2);
    expect(runs[0].classList.contains('tactile-braille-run')).toBe(true);
    expect(runs[0].textContent).toBe('⠿');
    expect(runs[1].classList.contains('tactile-latin-run')).toBe(true);
    expect(runs[1].textContent).toBe('Population by year');
    expect(runs[0].getAttribute('x')).toBe(runs[1].getAttribute('x'));
    expect(runs[0].getAttribute('dy')).toBe(runs[1].getAttribute('dy'));
    expect(translate.mock.calls.filter(([text]) => text === 'Population by year')).toHaveLength(1);
  });

  test('wraps long Both-mode labels as paired Braille and Latin lines', async () => {
    const longManifest = structuredClone(manifest);
    longManifest.jim.datasets[0].title = 'Population by year across every region and reporting period in the dataset';
    const headless = new ParaHeadless();
    await headless.ready();
    const result = await headless.loadManifest(JSON.stringify(longManifest), 'content', {
      isTactileEnabled: true,
      pageSize: 'letter_portrait',
      tactileLabelMode: 'Both',
    });

    expect(result).toEqual({ success: true });
    const document = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    const title = document.querySelector('#chart-title')!;
    const brailleLines = title.querySelectorAll('.tactile-braille-run');
    const latinLines = title.querySelectorAll('.tactile-latin-run');
    expect(brailleLines.length).toBeGreaterThan(1);
    expect(brailleLines).toHaveLength(latinLines.length);
  });

  test('wraps long Braille-only labels at source-word boundaries', async () => {
    const longManifest = structuredClone(manifest);
    longManifest.jim.datasets[0].title = 'Population by year across every region and reporting period in the dataset';
    const headless = new ParaHeadless();
    await headless.ready();
    const result = await headless.loadManifest(JSON.stringify(longManifest), 'content', {
      isTactileEnabled: true,
      pageSize: 'letter_portrait',
      tactileLabelMode: 'Braille',
    });

    expect(result).toEqual({ success: true });
    const document = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    expect(document.querySelectorAll('#chart-title tspan').length).toBeGreaterThan(1);
  });

  test('does not require a provider for Latin or None modes', async () => {
    const latin = await render('Latin');
    expect(latin.result).toEqual({ success: true });
    expect(latin.headless.api.serializeChart()).toContain('Population by year');
    document.body.innerHTML = '';

    const none = await render('None');
    expect(none.result).toEqual({ success: true });
    const output = new DOMParser().parseFromString(none.headless.api.serializeChart(), 'image/svg+xml');
    expect(output.querySelector('#chart-title')).toBeNull();
  });

  test('defaults to simple Braille cells and Latin text without a provider', async () => {
    const headless = new ParaHeadless();
    await headless.ready();
    const result = await headless.loadManifest(JSON.stringify(manifest), 'content', {
      isTactileEnabled: true,
    });

    expect(result).toEqual({ success: true });
    expect(headless.api.getConfigSetting('chart.tactileLabelMode')).toBe('Both');
    const output = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    const brailleLines = output.querySelectorAll('#chart-title .tactile-braille-run');
    const latinLines = output.querySelectorAll('#chart-title .tactile-latin-run');
    expect(brailleLines).toHaveLength(latinLines.length);
    expect([...brailleLines].map(line => line.textContent).join('⠀'))
      .toBe('⠏⠕⠏⠥⠇⠁⠞⠊⠕⠝⠀⠃⠽⠀⠽⠑⠁⠗');
    expect([...latinLines].map(line => line.textContent).join(' ')).toBe('Population by year');
  });

  test('validates the effective settings supplied by the manifest', async () => {
    const brailleManifest = structuredClone(manifest) as typeof manifest & {
      extensions: {
        paracharts: {
          settings: {
            chart: {
              isTactileEnabled: boolean;
              tactileLabelMode: 'Braille' | 'Latin';
            };
          };
        };
      };
    };
    brailleManifest.extensions = {
      paracharts: {
        settings: {
          chart: {
            isTactileEnabled: true,
            tactileLabelMode: 'Braille',
          },
        },
      },
    };
    const headless = new ParaHeadless();
    await headless.ready();
    expect(await headless.loadManifest(JSON.stringify(brailleManifest), 'content'))
      .toEqual({ success: true });
    await headless.jimReady;
    expect(headless.api.getConfigSetting('chart.tactileLabelMode')).toBe('Braille');
    const output = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    expect(joinedLabelText(output, '#chart-title'))
      .toBe('⠏⠕⠏⠥⠇⠁⠞⠊⠕⠝⠀⠃⠽⠀⠽⠑⠁⠗');
  });

  test('keeps the chart renderable when a provider rejects one label', async () => {
    const provider: BrailleTranslationProvider = {
      ready: async () => {},
      translate: () => { throw new Error('unsupported label'); },
    };
    const { headless, result } = await render('Braille', provider);

    expect(result).toEqual({ success: true });
    const output = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    expect(joinedLabelText(output, '#chart-title'))
      .toBe('⠏⠕⠏⠥⠇⠁⠞⠊⠕⠝⠀⠃⠽⠀⠽⠑⠁⠗');
  });

  test('does not block fallback rendering while a provider initializes', async () => {
    let finishInitialization!: () => void;
    const provider: BrailleTranslationProvider = {
      ready: () => new Promise<void>(resolve => { finishInitialization = resolve; }),
      translate: () => '⠿',
    };
    const headless = new ParaHeadless();
    await headless.ready();
    const registration = headless.api.registerBrailleTranslationProvider(provider);
    const result = await headless.loadManifest(JSON.stringify(manifest), 'content', {
      isTactileEnabled: true,
      tactileBrailleGrade: 2,
      tactileLabelMode: 'Braille',
    });

    expect(result).toEqual({ success: true });
    const output = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    expect(joinedLabelText(output, '#chart-title'))
      .toBe('⠏⠕⠏⠥⠇⠁⠞⠊⠕⠝⠀⠃⠽⠀⠽⠑⠁⠗');
    finishInitialization();
    await registration;
    await new Promise(requestAnimationFrame);
    const upgraded = new DOMParser().parseFromString(headless.api.serializeChart(), 'image/svg+xml');
    expect(upgraded.querySelector('#chart-title')?.textContent?.trim()).toBe('⠿');
  });

  test('uses real Liblouis Grade 2 output in SVG', async () => {
    await liblouisBrailleProvider.ready();
    expect(liblouisBrailleProvider.translate('Population by year'))
      .toBe('⠠⠏⠕⠏⠥⠇⠁⠰⠝⠀⠃⠽⠀⠽⠑⠜');

    const { headless, result } = await render('Braille', liblouisBrailleProvider);
    expect(result).toEqual({ success: true });
    const svg = headless.api.serializeChart();
    const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const title = svgDocument.querySelector('#chart-title')!;
    expect(svgDocument.querySelector('parsererror')).toBeNull();
    expect(title.textContent?.trim()).toBe('⠠⠏⠕⠏⠥⠇⠁⠰⠝⠀⠃⠽⠀⠽⠑⠜');
    expect(title.getAttribute('aria-label')).toBe('Population by year');
    expect(svg).not.toContain('Braille36 US');
    expect(svg).not.toContain('data:font/woff2;base64,');
  });
});
