import { Test, TestRunner, ExpectFunction } from './TestRunner';
import { waitFor } from 'storybook/test';

export default class LineTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
    }

}
