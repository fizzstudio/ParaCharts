import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart51: Story = {
  name: "Pokemon dataset from CSV (51)",
  args: {
    filename: "manifests/pokemon-multi-facet-manifest.json",
    forcecharttype: "scatter",
  }
}
