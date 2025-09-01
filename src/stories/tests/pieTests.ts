import { Test, TestRunner, ExpectFunction } from './TestRunner';
import * as shadow from 'shadow-dom-testing-library';

export default class PieTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
    }
    
    @Test
    async exampleTestFn1() {
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.expect(parachart).toBeInTheDocument();
        const application = shadow.getByShadowRole(parachart, 'application');
        const ariaLabel = application.getAttribute('aria-label');
        await this.expect(ariaLabel).toContain(this.manifest.datasets[0].title);
    }

}
