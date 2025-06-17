import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Scatter Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart51: Story = {
  name: "s2 (51)",
  args: {
    filename: "manifests/scatter-manifest-s2.json",
    forcecharttype: "scatter",
  }
}
