import { expect as _expect } from 'storybook/test';

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
  manifest?: Manifest;

  constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
    this.canvas = canvas;
    this.userEvent = userEvent;
    this.expect = expect;
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
