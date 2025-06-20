import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart2: Story = {
  name: "15: Facebook: annual revenue and net income 2007 to 2019 (2)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-15.json",
    forcecharttype: "histogram",
  }
}
