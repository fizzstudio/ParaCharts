import { expect as _expect } from 'storybook/test';
import * as shadow from 'shadow-dom-testing-library';
import { Manifest } from '@fizz/paramanifest';

export type ExpectFunction = typeof _expect;

export function Test(target: Object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  const ctor = target.constructor as any;

  if (!ctor.testMethods) {
    ctor.testMethods = [];
  }

  ctor.testMethods.push(propertyKey);
}

export class TestRunner {
  canvas: any;
  userEvent: any;
  expect: ExpectFunction;
  manifest: Manifest = { datasets: [] };

  constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
    this.canvas = canvas;
    this.userEvent = userEvent;
    this.expect = expect;
  }

  @Test
  async parachartInDocument() {
    const parachart = await this.canvas.findByTestId('para-chart');
    await this.expect(parachart).toBeInTheDocument();
  }

  @Test
  async ariaLabelContainsDatasetTitle() {
    const parachart = await this.canvas.findByTestId('para-chart');
    const application = shadow.getByShadowRole(parachart, 'application');
    const ariaLabel = application.getAttribute('aria-label');
    await this.expect(ariaLabel).toContain(this.manifest.datasets[0].title);
  }

  @Test
  async keyboardFocus() {
    const parachart = await this.canvas.findByTestId('para-chart');
    const application = shadow.getByShadowRole(parachart, 'application');
    application.focus();
    await this.userEvent.tab();
    await this.userEvent.tab();
  }

  async loadManifest(manifestPath: string) {
    const prefix = '/node_modules/@fizz/chart-data/data/';
    const response = await fetch(prefix + manifestPath);
    this.manifest = await response.json() as Manifest;
    console.log('[manifest loaded]');
    console.log(JSON.stringify(this.manifest, null, 2));
    return this;
  }

  async run() {
    const tests: string[] = (this.constructor as any).testMethods ?? [];
    for (const name of tests) {
      await (this as any)[name]();
    }
  }

}
