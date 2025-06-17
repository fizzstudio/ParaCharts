import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Heatmap Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart42: Story = {
  name: "d3 (42)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "heatmap",
  }
}
