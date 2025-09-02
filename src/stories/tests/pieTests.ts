import { Test, TestRunner, ExpectFunction } from './TestRunner';
import * as shadow from 'shadow-dom-testing-library';
import { waitFor } from 'storybook/test';

export default class PieTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
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
    async tabOrder() {
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.userEvent.tab();
        await this.userEvent.tab();
        console.log(document.activeElement?.children[2] + '');
        this.expect(document.activeElement).toHaveAttribute('role', 'application');
    }


}
