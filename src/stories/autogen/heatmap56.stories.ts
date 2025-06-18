import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Heatmap Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart56: Story = {
  name: "s1 (56)",
  args: {
    filename: "manifests/scatter-manifest-s1.json",
    forcecharttype: "heatmap",
  }
}
