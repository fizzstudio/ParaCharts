import { expect } from 'storybook/test';

async function exampleTestFn1({ canvas, userEvent }) {
    console.log('Test function 1');
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
}

async function exampleTestFn2({ canvas, userEvent }) {
    console.log('Test function 2');
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
}

const testFunctions = [
    exampleTestFn1,
    exampleTestFn2
];

export default testFunctions;