import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart32: Story = {
  name: "746: Inflation rate in Sri Lanka 2024 (32)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-746.json",
    forcecharttype: "line",
  }
}
