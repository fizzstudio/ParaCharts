import * as shadow from 'shadow-dom-testing-library';
import { waitFor } from '@testing-library/dom';
import '../../../lib/index';

export function getParachart(): HTMLElement {
  const chart = document.querySelector('[data-testid="para-chart"]');
  if (!chart) throw new Error('Parachart not found');
  return chart as HTMLElement;
}

export async function getChartApplication(): Promise<HTMLElement> {
  const parachart = getParachart();

  return await waitFor(() => {
    return shadow.getByShadowRole(parachart, 'application');
  }, { timeout: 5000 });
}

export async function getAriaLive(): Promise<HTMLElement> {
  const parachart = getParachart();
  
  return await waitFor(() => {
    return shadow.getByShadowTestId(parachart, 'sr-status');
  }, { timeout: 5000 });
}
