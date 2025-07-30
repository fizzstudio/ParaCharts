import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Charts/Multi Column Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart2: Story = {
  name: "15: Facebook: annual revenue and net income 2007 to 2019 (2)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-15.json",
    forcecharttype: "column",
  },
  play: async ({ canvas, userEvent }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}
