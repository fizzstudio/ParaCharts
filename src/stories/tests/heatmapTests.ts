import { Test, TestRunner, ExpectFunction } from './TestRunner';
import { waitFor } from 'storybook/test';

export default class HeatmapTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
    }

    override async run() {
        console.log('[HeatmapTestRunner] Heatmaps are not working yet - skip.');
    }

}
