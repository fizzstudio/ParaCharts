import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Multi Bar Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart3: Story = {
  name: "178: Global construction machinery market size by region: outlook 2019 (3)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-178.json",
    forcecharttype: "bar",
  }
}
