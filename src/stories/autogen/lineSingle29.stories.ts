import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart29: Story = {
  name: "595: Number of births in Canada 2000 to 2019 (29)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-595.json",
    forcecharttype: "line",
  },
  play: async ({ canvas, userEvent }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}
