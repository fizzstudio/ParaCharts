import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart53: Story = {
  name: "d3 (53)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "scatter",
  }
}
