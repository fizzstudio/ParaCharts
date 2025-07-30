import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Charts/Single Lollipop Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart7: Story = {
  name: "13: Real GDP growth in the United States, by quarter 2011 to 2019 (7)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-13.json",
    forcecharttype: "lollipop",
  },
  play: async ({ canvas, userEvent }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}
