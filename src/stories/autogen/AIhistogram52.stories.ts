import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart52: Story = {
  name: "Old Faithful Geyser Eruptions (52)",
  args: {
    filename: "manifests/scatter-manifest-geyser.json",
    forcecharttype: "histogram",
  }
}
