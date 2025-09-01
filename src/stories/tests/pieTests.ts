import { Test, TestRunner } from './TestRunner';

export default class PieTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: any) {
        super(canvas, userEvent, expect);
    }
    
    @Test
    async exampleTestFn1() {
        console.log('Test function 1');
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.expect(parachart).toBeInTheDocument();
    }

    @Test
    async exampleTestFn2() {
        console.log('Test function 2');
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.expect(parachart).toBeInTheDocument();
    }

}
