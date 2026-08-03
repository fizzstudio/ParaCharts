import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart60: Story = {
  name: "s2 (60)",
  args: {
    filename: "manifests/scatter-manifest-s2.json",
    forcecharttype: "histogram",
  }
}
