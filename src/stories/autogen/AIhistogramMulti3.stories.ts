import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart3: Story = {
  name: "178: Global construction machinery market size by region: outlook 2019 (3)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-178.json",
    forcecharttype: "histogram",
  }
}
