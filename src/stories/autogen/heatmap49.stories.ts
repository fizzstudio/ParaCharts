import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Heat Maps",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart49: Story = {
  name: "d3 (49)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "heatmap",
  }
}
