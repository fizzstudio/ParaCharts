import { expect as _expect } from 'storybook/test';

type ExpectFunction = typeof _expect;

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
    expect: any;

    constructor(canvas: any, userEvent: any, expect: any) {
        this.canvas = canvas;
        this.userEvent = userEvent;
        this.expect = expect;
    }

    async run() {
        const tests: string[] = (this.constructor as any).testMethods ?? [];
        for (const name of tests) {
            await (this as any)[name](); // calls method on instance
        }
    }
}
