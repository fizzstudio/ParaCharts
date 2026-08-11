import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histograms",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart51: Story = {
  name: "d3 (51)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "histogram",
  }
}
