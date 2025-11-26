import { test, expect, describe, afterEach } from 'vitest';
import { getParachart, getChartApplication, getAriaLive } from './helpers';
import { userEvent } from '@vitest/browser/context';
import { waitFor } from '@testing-library/dom';

const testFileUrl = new URL(import.meta.url);
const projectRoot = testFileUrl.pathname.split('/src/tests/')[0];
const manifestBase = `${projectRoot}/node_modules/@fizz/chart-data/data/manifests`;

const chartTypes = [
  { type: 'bar', manifest: `${manifestBase}/autogen/bar-multi/bar-multi-manifest-149.json` },
  { type: 'line', manifest: `${manifestBase}/autogen/line-multi/line-multi-manifest-16.json` },
  { type: 'scatter', manifest: `${manifestBase}/scatter-manifest-iris-petal.json` },
  { type: 'pie', manifest: `${manifestBase}/pie-manifest-dark-matter.json` },
  { type: 'column', manifest: `${manifestBase}/autogen/bar-multi/bar-multi-manifest-14.json` },
  { type: 'lollipop', manifest: `${manifestBase}/autogen/bar-multi/bar-multi-manifest-14.json` },
  { type: 'stepline', manifest: `${manifestBase}/autogen/line-multi/line-multi-manifest-16.json` },
];

describe('Chart Rendering', () => {

  chartTypes.forEach(({ type, manifest }) => {
    const testFn = (type === 'histogram' || type === 'pie') ? test.skip : test;
    testFn(`${type} chart loads successfully`, async () => {
      document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${manifest}" forcecharttype="${type}"></para-chart>`;
      
      const parachart = getParachart() as any;
      parachart.config = { 'chart.isShowPopups': false };
      
      expect(parachart).toBeTruthy();
      expect(parachart.getAttribute('manifest')).toBe(manifest);
      expect(parachart.getAttribute('forcecharttype')).toBe(type);
      
      const application = await getChartApplication();
      expect(application).toBeTruthy();
      expect(application.getAttribute('role')).toBe('application');
      // HACK: wait for async popup-related functions to finish running
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });
});


describe('ARIA Label', () => {

  test('aria-label contains dataset title', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}"></para-chart>`;
  
    const parachart = getParachart() as any;
    parachart.config = { 'chart.isShowPopups': false };
    
    const application = await getChartApplication();
  
    await waitFor(() => {
      const label = application.getAttribute('aria-label') || '';
      expect(label).not.toBe('loading...');
      expect(label.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  }, { timeout: 15000 });
});

describe('Keyboard Navigation for Bar Chart', () => {
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    document.body.innerHTML = '';
  });

  test('navigates data points with arrow keys and announces values', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}" forcecharttype="bar"></para-chart>`;
    
    const parachart = getParachart() as any;
    parachart.config = { 'chart.isShowPopups': false };
    
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
  afterEach(async () => {
    document.body.innerHTML = '';
  });

  test('handles parent keyboard focus and tab navigation', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}"></para-chart>`;
    
    const parachart = getParachart() as any;
    parachart.config = { 'chart.isShowPopups': false };
    const application = await getChartApplication();

    await waitFor(() => {
      expect((parachart as any).paraView?.documentView).toBeDefined();
    }, { timeout: 5000 });

    expect(application).toBeTruthy();
    expect(application.getAttribute('role')).toBe('application');
    expect(application.hasAttribute('tabindex')).toBe(true);
  }, { timeout: 15000 });

  test.skip('supports adding and navigating annotations', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[0].manifest}" forcecharttype="bar"></para-chart>`;
    
    const parachart = getParachart() as any;
    parachart.config = { 'chart.isShowPopups': false };
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
    
    // HACK: wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }, { timeout: 15000 });

  test.skip('handles tab order correctly for pie charts', async () => {
    document.body.innerHTML = `<para-chart data-testid="para-chart" manifest="${chartTypes[3].manifest}" forcecharttype="pie"></para-chart>`;
    
    const parachart = getParachart() as any;
    parachart.config = { 'chart.isShowPopups': false };
    const application = await getChartApplication();
    
    await waitFor(() => {
      expect((parachart as any).paraView?.documentView).toBeDefined();
    }, { timeout: 5000 });
    
    expect(application).toBeTruthy();
    expect(application.getAttribute('role')).toBe('application');
    expect(application.hasAttribute('tabindex')).toBe(true);
    
    // HACK: wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }, { timeout: 15000 });
});