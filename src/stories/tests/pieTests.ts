import { Test, TestRunner, ExpectFunction } from './TestRunner';

export default class PieTestRunner extends TestRunner {

    constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
        super(canvas, userEvent, expect);
    }
    
    @Test
    async exampleTestFn1() {
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.expect(parachart).toBeInTheDocument();
        const heading = await this.canvas.getByRole('heading', { level: 2 });
        this.expect(heading).toHaveTextContent('foo');
    }

    @Test
    async exampleTestFn2() {
        console.log('Test function 2');
        const parachart = await this.canvas.findByTestId('para-chart');
        await this.expect(parachart).toBeInTheDocument();
    }

}
