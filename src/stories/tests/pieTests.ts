import { Test, TestRunner, ExpectFunction } from './TestRunner';
import { waitFor } from 'storybook/test';

export default class PieTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
    }

    /*
    @Test
    async tabOrder() {
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.userEvent.tab();
        await this.userEvent.tab();
        console.log(document.activeElement?.children[2] + '');
        this.expect(document.activeElement).toHaveAttribute('role', 'application');
    }
    */

}
