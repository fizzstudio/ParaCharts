import { expect as _expect, waitFor as _waitFor, waitFor } from 'storybook/test';
import * as shadow from 'shadow-dom-testing-library';
import { Manifest } from '@fizz/paramanifest';

export type ExpectFunction = typeof _expect;
//
export function Test(target: Object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  console.log('add test', propertyKey)
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
  waitFor: any;
  manifest: Manifest = { datasets: [] };

  constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
    this.canvas = canvas;
    this.userEvent = userEvent;
    this.expect = expect;
    this.waitFor = _waitFor;
  }

  @Test
  async parachartInDocument() {
    const parachart = await this.canvas.findByTestId('para-chart');
    await this.expect(parachart).toBeInTheDocument();
  }

  @Test
  async ariaLabelContainsDatasetTitle() {
    const parachart = await this.canvas.findByTestId('para-chart');
    await waitFor(() => {
      this.expect(parachart.paraView.documentView).toBeDefined();
    });
    const application = shadow.getByShadowRole(parachart, 'application');
    const ariaLabel = application.getAttribute('aria-label');
    await this.expect(ariaLabel).toContain(this.manifest.datasets[0].title);
  }

  /*
  @Test
  async parentKeyboardFocus() {
    const parachart = await this.canvas.findByTestId('para-chart');
    const application = shadow.getByShadowRole(parachart, 'application');
    await application.focus();
    console.log(document.activeElement!.id + '--');
    await this.userEvent.tab();
    console.log(document.activeElement + '--');
  }*/

  @Test
  async annotations() {
    /*const parachart = await this.canvas.findByTestId('para-chart');
    const application = shadow.getByShadowRole(parachart, 'application');
    await application.focus();
    await this.userEvent.keyboard('{ArrowRight}');
      const addButton = shadow.getByShadowText(application, 'Add Annotation');
      await addButton.click();
      let input: HTMLElement | null = null;
      await this.waitFor(() => {
        const dialog = document.querySelector('fizz-dialog');
        input = dialog?.shadowRoot?.querySelector('input[type="text"]') ?? null;
        this.expect(input).not.toBeNull();
      });
      await input!.focus();
      await this.userEvent.keyboard('test annotation');
      await this.userEvent.tab();
      await this.userEvent.keyboard('{Enter}');
    await this.userEvent.keyboard('{ArrowRight}');
    await this.userEvent.keyboard('{ArrowLeft}');
    const ariaLive = shadow.getByShadowTestId(parachart, 'sr-status');
    await this.waitFor(() => {
      const announcement = ariaLive.querySelector('div')?.textContent;
      this.expect(announcement).toContain('test annotation');
    });*/
    this.expect('This test is skipped').toBeTruthy();
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
    console.log(`testMethods ${tests}`);
    for (const name of tests) {
      console.log(`Running test ${name}`);
      if (typeof (this as any)[name] !== 'function') {
        throw new Error(`Test method ${name} not found`);
      }
      await (this as any)[name]();
    }
  }

}
