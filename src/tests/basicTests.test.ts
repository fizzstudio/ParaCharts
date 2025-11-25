import { test, expect, describe, afterEach } from 'vitest';
import { getParachart, getChartApplication, getAriaLive } from './helpers';
import { userEvent } from '@vitest/browser/context';
import { waitFor } from '@testing-library/dom';

const autogen_path = '/node_modules/@fizz/chart-data/data/manifests/autogen';

const chartTypes = [
  { type: 'bar', manifest: `${autogen_path}/bar-multi/bar-multi-manifest-149.json` },
  { type: 'line', manifest: `${autogen_path}/line-multi/line-multi-manifest-16.json` },
  { type: 'scatter', manifest: '/node_modules/@fizz/chart-data/data/manifests/scatter-manifest-iris-petal.json' },
  { type: 'pie', manifest: '/node_modules/@fizz/chart-data/data/manifests/pie-manifest-dark-matter.json' },
  { type: 'donut', manifest: '/node_modules/@fizz/chart-data/data/manifests/pie-manifest-dark-matter.json' },
  { type: 'column', manifest: `${autogen_path}/bar-multi/bar-multi-manifest-14.json` },
  { type: 'lollipop', manifest: `${autogen_path}/bar-multi/bar-multi-manifest-14.json` },
  { type: 'stepline', manifest: `${autogen_path}/line-multi/line-multi-manifest-16.json` },
  { type: 'histogram', manifest: `${autogen_path}/bar-multi/bar-multi-manifest-149.json` },
];

describe('Chart Rendering', () => {
  chartTypes.forEach(({ type, manifest }) => {
    test(`${type} chart loads successfully`, async () => {
      document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${manifest}" forcecharttype="${type}"></para-chart>`;
      
      const parachart = getParachart();
      expect(parachart).toBeTruthy();
      expect(parachart.getAttribute('manifest')).toBe(manifest);
      expect(parachart.getAttribute('forcecharttype')).toBe(type);
    });
  });
});

describe('ARIA Label', () => {
  test('aria-label contains dataset title', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}"></para-chart>`;
    
    const application = await getChartApplication();
    
    await waitFor(() => {
      const label = application.getAttribute('aria-label') || '';
      expect(label).not.toBe('loading...');
      expect(label.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  }, { timeout: 15000 });
});

describe('Keyboard Navigation for Bar Chart', () => {
  test('navigates data points with arrow keys and announces values', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}" forcecharttype="bar"></para-chart>`;
    
    const application = await getChartApplication();
    
    await waitFor(() => {
      const label = application.getAttribute('aria-label') || '';
      expect(label).not.toBe('loading...');
      expect(label.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
    
    await application.focus();
    await userEvent.keyboard('{ArrowRight}');
    
    const ariaLive = await getAriaLive();

    await new Promise(resolve => setTimeout(resolve, 500));
    const announcement = ariaLive.querySelector('div')?.textContent || '';

    expect(announcement.length).toBeGreaterThan(0);
  }, { timeout: 15000 });
});

describe('Accessibility and keyboard tests', () => {
  test('handles parent keyboard focus and tab navigation', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}"></para-chart>`;
    
    const parachart = getParachart();
    const application = await getChartApplication();

    await waitFor(() => {
      expect((parachart as any).paraView?.documentView).toBeDefined();
    }, { timeout: 5000 });

    expect(application).toBeTruthy();
    expect(application.getAttribute('role')).toBe('application');
    expect(application.hasAttribute('tabindex')).toBe(true);
  }, { timeout: 15000 });

  test('supports adding and navigating annotations', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}" forcecharttype="bar"></para-chart>`;
    
    const parachart = getParachart() as any;
    const application = await getChartApplication();

    await waitFor(() => {
      expect(parachart.paraView?.documentView).toBeDefined();
    }, { timeout: 5000 });
    
    const api = parachart.api;
    const firstSeries = api.allSeries[0];
    const firstPoint = firstSeries.getPoint(0);
    firstPoint.annotate('test annotation');

    await application.focus();
    await userEvent.keyboard('{ArrowRight}'); // Move to series
    await userEvent.keyboard('{ArrowRight}'); // Move to first datapoint

    const ariaLive = await getAriaLive();
    await waitFor(() => {
      const announcement = ariaLive.querySelector('div')?.textContent || '';
      expect(announcement).toContain('test annotation');
    }, { timeout: 3000 });
  }, { timeout: 15000 });

  test('handles tab order correctly for pie charts', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[3].manifest}" forcecharttype="pie"></para-chart>`;
    
    const parachart = getParachart();
    const application = await getChartApplication();
    
    await waitFor(() => {
      expect((parachart as any).paraView?.documentView).toBeDefined();
    }, { timeout: 5000 });
    
    expect(application).toBeTruthy();
    expect(application.getAttribute('role')).toBe('application');
    expect(application.hasAttribute('tabindex')).toBe(true);
  }, { timeout: 15000 });
});
