import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Heat Maps",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart59: Story = {
  name: "s2 (59)",
  args: {
    filename: "manifests/scatter-manifest-s2.json",
    forcecharttype: "heatmap",
  }
}
